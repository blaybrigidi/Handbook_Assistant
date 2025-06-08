import snowflake.connector
import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
import os
from dotenv import load_dotenv
from typing import List, Dict, Tuple, Optional
from anthropic import Anthropic
import logging

# Load environment variables - try multiple paths
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if not load_dotenv(env_path):
    # Fallback to current directory
    load_dotenv('.env')
    # Also try parent of parent directory
    load_dotenv('../.env')

class RAGService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.data = {}  # Store data per school
        self.embeddings = {}  # Store embeddings per school
        self.initialized_schools = set()
        
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
                warehouse=os.getenv('SNOWFLAKE_WAREHOUSE'),
                database=os.getenv('SNOWFLAKE_DATABASE'),
                schema=os.getenv('SNOWFLAKE_SCHEMA')
            )
            return conn
        except Exception as e:
            print(f"Connection failed: {e}")
            return None
    
    def load_school_data(self, school_id: str):
        """Load data for a specific school"""
        conn = self.connect_snowflake()
        if not conn:
            return False
            
        query = """
        SELECT 
            hs.section_id,
            hs.section_title,
            hs.category,
            hs.section_group,
            hs.content,
            hs.excerpt,
            hs.topics,
            hs.tags,
            h.handbook_title,
            h.academic_year,
            s.school_name
        FROM handbook_sections hs
        JOIN handbooks h ON hs.handbook_id = h.handbook_id
        JOIN schools s ON h.school_id = s.school_id
        WHERE s.school_id = %(school_id)s
        AND LENGTH(hs.content) > 50
        ORDER BY LENGTH(hs.content) DESC
        """
        
        try:
            school_data = pd.read_sql(query, conn, params={"school_id": school_id})
            conn.close()
            
            if len(school_data) == 0:
                print(f"No data found for school: {school_id}")
                return False
            
            school_data['searchable_text'] = (
                school_data['SECTION_TITLE'].fillna('') + ' ' + 
                school_data['CONTENT'].fillna('') + ' ' +
                school_data['CATEGORY'].fillna('')
            )
            
            self.data[school_id] = school_data
            print(f"Loaded {len(school_data)} handbook sections for {school_id}!")
            return True
        except Exception as e:
            print(f"Failed to load data for {school_id}: {e}")
            return False
    
    def create_school_embeddings(self, school_id: str):
        """Create embeddings for a specific school's data"""
        if school_id not in self.data:
            return False
            
        texts = self.data[school_id]['searchable_text'].tolist()
        print(f"Creating embeddings for {school_id}...")
        self.embeddings[school_id] = self.model.encode(texts)
        print(f"Embeddings created successfully for {school_id}!")
        return True
    
    def cosine_similarity(self, a, b):
        """Calculate cosine similarity between vectors"""
        # Normalize vectors
        a_norm = a / np.linalg.norm(a, axis=1, keepdims=True)
        b_norm = b / np.linalg.norm(b, axis=1, keepdims=True)
        
        # Calculate cosine similarity
        return np.dot(a_norm, b_norm.T)
    
    def initialize_school(self, school_id: str):
        """Initialize data and embeddings for a specific school"""
        if school_id in self.initialized_schools:
            return True
            
        if not self.load_school_data(school_id):
            return False
            
        if not self.create_school_embeddings(school_id):
            return False
            
        self.initialized_schools.add(school_id)
        print(f"RAG service initialized successfully for {school_id}!")
        return True
    
    def search(self, question: str, school_id: str, top_k: int = 3) -> List[Dict]:
        """Search for relevant sections in a specific school's handbook"""
        if not self.initialize_school(school_id):
            return []
            
        if school_id not in self.embeddings:
            return []
            
        question_embedding = self.model.encode([question])
        similarities = self.cosine_similarity(question_embedding, self.embeddings[school_id])[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        school_data = self.data[school_id]
        
        for idx in top_indices:
            section = school_data.iloc[idx]
            results.append({
                'title': section['SECTION_TITLE'],
                'category': section['CATEGORY'],
                'content': section['CONTENT'],
                'excerpt': section['EXCERPT'],
                'similarity': float(similarities[idx]),
                'section_id': section['SECTION_ID'],
                'school_name': section['SCHOOL_NAME'],
                'handbook_title': section['HANDBOOK_TITLE'],
                'academic_year': section['ACADEMIC_YEAR']
            })
        
        return results
    
    def generate_claude_response(self, question: str, results: List[Dict], school_name: str) -> str:
        """Generate response using Claude AI"""
        if not self.claude_client:
            return self.generate_fallback_response(question, results, school_name)
        
        if not results:
            return f"I couldn't find relevant information in the {school_name} handbook for your question. You might want to:\n\n1. Contact the Student Affairs office directly\n2. Check the complete handbook on the university website\n3. Reach out to your academic advisor\n\nCould you try rephrasing your question with different keywords?"
        
        # Build context from relevant sections
        context_parts = []
        for i, result in enumerate(results[:3], 1):
            context_parts.append(f"""
Section {i}: "{result['title']}" (Category: {result['category']})
From: {result['handbook_title']} ({result['academic_year']})
Content: {result['content'][:800]}...
""")
        
        context = "\n".join(context_parts)
        
        # Enhanced prompt for policy-specific responses
        prompt = f"""You are HandBookBot, an AI assistant specifically designed to help {school_name} students understand their student handbook and university policies.

IMPORTANT INSTRUCTIONS:
1. Always cite exact sections when referencing policies
2. Use the format: "According to the '[EXACT SECTION TITLE]' in the [CATEGORY] section..."
3. If information isn't in the provided context, clearly state this limitation
4. Focus on practical guidance to help students follow university policies
5. Be encouraging but emphasize the importance of following university policies
6. Remember this is for {school_name} - tailor your response appropriately

STUDENT QUESTION: {question}

RELEVANT HANDBOOK SECTIONS FROM {school_name.upper()}:
{context}

Please provide a helpful, accurate response that:
- Directly answers the student's question
- Includes exact citations from the handbook sections provided
- Offers practical advice to help the student comply with university policies
- Maintains a supportive, educational tone
- Is specific to {school_name}

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
            return self.generate_fallback_response(question, results, school_name)
    
    def generate_fallback_response(self, question: str, results: List[Dict], school_name: str) -> str:
        """Fallback response when Claude is not available"""
        if not results:
            return f"I couldn't find relevant information in the {school_name} handbook for your question."
        
        response = f"Based on the {school_name} Student Handbook:\n\n"
        
        for i, result in enumerate(results[:2]):
            response += f"**{result['title']}** ({result['category']}):\n\n"
            response += f"📋 **Official Policy**: "
            
            # Include the actual policy text
            content = result['excerpt'] if result['excerpt'] else result['content'][:400]
            response += f"{content}\n\n"
            
            response += f"💡 **What this means**: This policy is designed to maintain academic standards and ensure fairness for all students.\n\n"
        
        response += f"For specific questions about how this applies to your situation, please contact the {school_name} Student Affairs office for official guidance."
        return response
    
    async def get_response(self, question: str, school_id: str) -> str:
        """Main method to get a response for a question about a specific school's handbook"""
        if not school_id:
            return "Please specify which school you're asking about."
        
        relevant_sections = self.search(question, school_id, top_k=3)
        
        if not relevant_sections:
            return f"I couldn't find relevant information for your question. The handbook for this school might not be available in our database yet."
        
        school_name = relevant_sections[0]['school_name'] if relevant_sections else "your school"
        
        # Use Claude for response generation if available, otherwise fallback
        if self.claude_client:
            response = self.generate_claude_response(question, relevant_sections, school_name)
        else:
            response = self.generate_fallback_response(question, relevant_sections, school_name)
            
        return response
    
    def chat(self, question: str, school_id: str = None) -> Tuple[str, List[Dict]]:
        """Legacy method for backwards compatibility"""
        if not school_id:
            return "Please specify which school you're asking about.", []
            
        relevant_sections = self.search(question, school_id, top_k=3)
        school_name = relevant_sections[0]['school_name'] if relevant_sections else "your school"
        
        # Use Claude for response generation if available, otherwise fallback
        if self.claude_client:
            response = self.generate_claude_response(question, relevant_sections, school_name)
        else:
            response = self.generate_fallback_response(question, relevant_sections, school_name)
            
        return response, relevant_sections
