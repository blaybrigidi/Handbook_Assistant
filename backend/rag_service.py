import snowflake.connector
import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
import os
from dotenv import load_dotenv
from typing import List, Dict, Tuple
from anthropic import Anthropic

load_dotenv()

class AshesiRAGService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.data = None
        self.embeddings = None
        self.initialized = False
        
        # Initialize Claude
        self.claude_client = None
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if api_key:
            try:
                self.claude_client = Anthropic(api_key=api_key)
            except Exception as e:
                print(f"Failed to initialize Claude: {e}")
        
    def connect_snowflake(self):
        try:
            conn = snowflake.connector.connect(
                user=os.getenv('SNOWFLAKE_USER'),
                password=os.getenv('SNOWFLAKE_PASSWORD'),
                account=os.getenv('SNOWFLAKE_ACCOUNT'),
                warehouse='COMPUTE_WH',
                database='ASHESI_HANDBOOK',
                schema='PUBLIC'
            )
            return conn
        except Exception as e:
            print(f"Connection failed: {e}")
            return None
    
    def load_data(self):
        conn = self.connect_snowflake()
        if not conn:
            return False
            
        query = """
        SELECT 
            SECTION_ID,
            TITLE,
            CATEGORY,
            SUBCATEGORY,
            CONTENT,
            CONTENT_SUMMARY,
            WORD_COUNT
        FROM ASHESI_HANDBOOK_SECTIONS
        WHERE WORD_COUNT > 50
        ORDER BY WORD_COUNT DESC
        """
        
        try:
            self.data = pd.read_sql(query, conn)
            conn.close()
            
            self.data['searchable_text'] = (
                self.data['TITLE'].fillna('') + ' ' + 
                self.data['CONTENT'].fillna('')
            )
            
            print(f"Loaded {len(self.data)} handbook sections!")
            return True
        except Exception as e:
            print(f"Failed to load data: {e}")
            return False
    
    def create_embeddings(self):
        if self.data is None:
            return False
            
        texts = self.data['searchable_text'].tolist()
        print("Creating embeddings...")
        self.embeddings = self.model.encode(texts)
        print("Embeddings created successfully!")
        return True
    
    def cosine_similarity(self, a, b):
        """Calculate cosine similarity between vectors"""
        # Normalize vectors
        a_norm = a / np.linalg.norm(a, axis=1, keepdims=True)
        b_norm = b / np.linalg.norm(b, axis=1, keepdims=True)
        
        # Calculate cosine similarity
        return np.dot(a_norm, b_norm.T)
    
    def initialize(self):
        if self.initialized:
            return True
            
        if not self.load_data():
            return False
            
        if not self.create_embeddings():
            return False
            
        self.initialized = True
        print("RAG service initialized successfully!")
        return True
    
    def search(self, question: str, top_k: int = 3) -> List[Dict]:
        if not self.initialized:
            self.initialize()
            
        if self.embeddings is None:
            return []
            
        question_embedding = self.model.encode([question])
        similarities = self.cosine_similarity(question_embedding, self.embeddings)[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            section = self.data.iloc[idx]
            results.append({
                'title': section['TITLE'],
                'category': section['CATEGORY'],
                'content': section['CONTENT'],
                'summary': section['CONTENT_SUMMARY'],
                'similarity': float(similarities[idx]),
                'section_id': section['SECTION_ID']
            })
        
        return results
    
    def generate_claude_response(self, question: str, results: List[Dict]) -> str:
        """Generate response using Claude AI"""
        if not self.claude_client:
            return self.generate_fallback_response(question, results)
        
        if not results:
            return "I couldn't find relevant information in the student handbook for your question. You might want to:\n\n1. Contact the Student Affairs office directly\n2. Check the complete handbook on the university website\n3. Reach out to your academic advisor\n\nCould you try rephrasing your question with different keywords?"
        
        # Build context from relevant sections
        context_parts = []
        for i, result in enumerate(results[:3], 1):
            context_parts.append(f"""
Section {i}: "{result['title']}" (Category: {result['category']})
Content: {result['content'][:800]}...
""")
        
        context = "\n".join(context_parts)
        
        # Enhanced prompt for policy-specific responses
        prompt = f"""You are HandBookBot, an AI assistant specifically designed to help Ashesi University students understand their student handbook and prevent Academic Judicial Committee (AJC) cases.

IMPORTANT INSTRUCTIONS:
1. Always cite exact sections when referencing policies
2. Use the format: "According to the '[EXACT SECTION TITLE]' in the [CATEGORY] section..."
3. If information isn't in the provided context, clearly state this limitation
4. Focus on practical guidance to help students avoid policy violations
5. Be encouraging but emphasize the importance of following university policies

STUDENT QUESTION: {question}

RELEVANT HANDBOOK SECTIONS:
{context}

Please provide a helpful, accurate response that:
- Directly answers the student's question
- Includes exact citations from the handbook sections provided
- Offers practical advice to help the student comply with university policies
- Maintains a supportive, educational tone

Response:"""

        try:
            message = self.claude_client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=1000,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )
            return message.content[0].text
        except Exception as e:
            print(f"Claude API error: {e}")
            return self.generate_fallback_response(question, results)
    
    def generate_fallback_response(self, question: str, results: List[Dict]) -> str:
        """Fallback response when Claude is not available"""
        if not results:
            return "I couldn't find relevant information in the handbook for your question."
        
        response = f"Based on the Ashesi Student Handbook:\n\n"
        
        for i, result in enumerate(results[:2]):
            response += f"**{result['title']}** ({result['category']}):\n\n"
            response += f"📋 **Official Policy**: "
            
            # Include the actual policy text
            content = result['summary'] if result['summary'] else result['content'][:400]
            response += f"{content}\n\n"
            
            response += f"💡 **What this means**: This policy is designed to maintain academic standards and ensure fairness for all students.\n\n"
        
        response += "For specific questions about how this applies to your situation, please contact the Dean of Students office for official guidance."
        return response
    
    def chat(self, question: str) -> Tuple[str, List[Dict]]:
        relevant_sections = self.search(question, top_k=3)
        
        # Use Claude for response generation if available, otherwise fallback
        if self.claude_client:
            response = self.generate_claude_response(question, relevant_sections)
        else:
            response = self.generate_fallback_response(question, relevant_sections)
            
        return response, relevant_sections
