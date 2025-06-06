import snowflake.connector
import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
import os
from dotenv import load_dotenv
from typing import List, Dict, Tuple

load_dotenv()

class AshesiRAGService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.data = None
        self.embeddings = None
        self.initialized = False
        
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
            
            return True
        except Exception as e:
            print(f"Failed to load data: {e}")
            return False
    
    def create_embeddings(self):
        if self.data is None:
            return False
            
        texts = self.data['searchable_text'].tolist()
        self.embeddings = self.model.encode(texts)
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
    
    def generate_response(self, question: str, results: List[Dict]) -> str:
        if not results:
            return "I couldn't find relevant information in the handbook for your question."
        
        response = f"Based on the Ashesi Student Handbook:\n\n"
        
        for i, result in enumerate(results[:2]):
            response += f"**{result['title']}** ({result['category']}):\n"
            content = result['summary'] if result['summary'] else result['content'][:300]
            response += f"{content}\n\n"
        
        response += "For more detailed information, please refer to the complete handbook sections."
        return response
    
    def chat(self, question: str) -> Tuple[str, List[Dict]]:
        relevant_sections = self.search(question, top_k=3)
        response = self.generate_response(question, relevant_sections)
        return response, relevant_sections
