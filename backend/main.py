from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn

from rag_service import AshesiRAGService

app = FastAPI(title="Ashesi Handbook Chatbot API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RAG service
rag_service = AshesiRAGService()

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict]
    confidence: float

@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    try:
        response, sources = rag_service.chat(message.message)
        return ChatResponse(
            response=response,
            sources=sources,
            confidence=0.85  # You can calculate this based on similarity scores
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Ashesi Handbook Chatbot"}

@app.post("/api/initialize")
async def initialize_service():
    try:
        success = rag_service.initialize()
        if success:
            return {"status": "initialized", "sections_loaded": len(rag_service.data)}
        else:
            raise HTTPException(status_code=500, detail="Failed to initialize")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
