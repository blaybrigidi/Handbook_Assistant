import streamlit as st
import snowflake.connector
import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SimpleAshesiChatbot:
    def __init__(self):
        # Load embedding model (downloads first time - about 90MB)
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.data = None
        self.embeddings = None
        
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
            st.error(f"Connection failed: {e}")
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
            
            # Create searchable text
            self.data['searchable_text'] = (
                self.data['TITLE'].fillna('') + ' ' + 
                self.data['CONTENT'].fillna('')
            )
            
            st.success(f"Loaded {len(self.data)} handbook sections!")
            return True
            
        except Exception as e:
            st.error(f"Failed to load data: {e}")
            return False
    
    def create_embeddings(self):
        if self.data is None:
            return False
            
        texts = self.data['searchable_text'].tolist()
        with st.spinner("Creating embeddings... (this may take a minute)"):
            self.embeddings = self.model.encode(texts)
        
        st.success("Embeddings created!")
        return True
    
    def search(self, question, top_k=3):
        if self.embeddings is None:
            return []
            
        # Get question embedding
        question_embedding = self.model.encode([question])
        
        # Find similar sections
        similarities = cosine_similarity(question_embedding, self.embeddings)[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            section = self.data.iloc[idx]
            results.append({
                'title': section['TITLE'],
                'category': section['CATEGORY'],
                'content': section['CONTENT'],
                'summary': section['CONTENT_SUMMARY'],
                'similarity': similarities[idx],
                'section_id': section['SECTION_ID']
            })
        
        return results
    
    def generate_simple_answer(self, question, results):
        if not results:
            return "I couldn't find relevant information in the handbook for your question."
        
        # Simple response generation
        answer = f"Based on the Ashesi Student Handbook:\n\n"
        
        for i, result in enumerate(results[:2]):  # Use top 2 results
            answer += f"**{result['title']}** ({result['category']}):\n"
            
            # Use summary if available, otherwise first part of content
            content = result['summary'] if result['summary'] else result['content'][:300]
            answer += f"{content}\n\n"
        
        answer += "For more detailed information, please refer to the complete handbook sections."
        return answer

# Streamlit App
def main():
    st.set_page_config(
        page_title="Ashesi Handbook Chatbot",
        page_icon="��",
        layout="wide"
    )
    
    st.title("🎓 Ashesi Student Handbook Chatbot")
    st.markdown("Ask me anything about Ashesi University policies!")
    
    # Initialize chatbot
    if 'chatbot' not in st.session_state:
        st.session_state.chatbot = SimpleAshesiChatbot()
    
    # Sidebar setup
    with st.sidebar:
        st.header("Setup")
        
        if st.button("Load Handbook Data"):
            success = st.session_state.chatbot.load_data()
            if success:
                st.session_state.data_loaded = True
        
        if st.button("Create Embeddings") and st.session_state.get('data_loaded'):
            success = st.session_state.chatbot.create_embeddings()
            if success:
                st.session_state.ready = True
        
        if st.session_state.get('data_loaded'):
            st.success("✅ Data loaded")
        if st.session_state.get('ready'):
            st.success("✅ Ready to chat!")
    
    # Main chat interface
    if st.session_state.get('ready'):
        st.header("Ask Your Question")
        
        # Example questions
        st.markdown("**Try these examples:**")
        examples = [
            "What is the academic integrity policy?",
            "What are the rules about violence?",
            "Can I have guests in my room?",
            "What happens if I plagiarize?"
        ]
        
        cols = st.columns(2)
        for i, example in enumerate(examples):
            with cols[i % 2]:
                if st.button(example, key=f"ex_{i}"):
                    st.session_state.current_question = example
        
        # Question input
        question = st.text_input("Your question:", value=st.session_state.get('current_question', ''))
        
        if st.button("Ask") and question:
            with st.spinner("Searching handbook..."):
                results = st.session_state.chatbot.search(question)
                answer = st.session_state.chatbot.generate_simple_answer(question, results)
            
            # Display answer
            st.markdown("### Answer:")
            st.markdown(answer)
            
            # Display sources
            if results:
                st.markdown("### Sources:")
                for result in results[:3]:
                    with st.expander(f"{result['title']} (Similarity: {result['similarity']:.3f})"):
                        st.markdown(f"**Category:** {result['category']}")
                        st.markdown(f"**Section ID:** {result['section_id']}")
                        content = result['summary'] if result['summary'] else result['content'][:500]
                        st.markdown(f"**Content Preview:** {content}...")
    
    else:
        st.info("👆 Please load the data and create embeddings using the sidebar first!")

if __name__ == "__main__":
    main()

