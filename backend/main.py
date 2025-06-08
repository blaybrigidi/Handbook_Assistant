from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import shutil
import os
import tempfile
from typing import Dict, Optional
import asyncio
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables - try multiple paths
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if not load_dotenv(env_path):
    # Fallback to current directory
    load_dotenv('.env')
    # Also try parent of parent directory
    load_dotenv('../.env')

from handbook_processor import HandbookProcessor, process_handbook_file
from rag_service import RAGService

app = FastAPI(title="Multi-School Handbook Bot API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you might want to be more restrictive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React build files
frontend_build_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
if os.path.exists(frontend_build_path):
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_build_path, "static")), name="static")

# Global variables for processing status
processing_status = {}
rag_service = RAGService()

def update_processing_status(job_id: str, progress: float, message: str):
    """Update processing status for frontend polling."""
    processing_status[job_id] = {
        "progress": progress,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "status": "processing" if progress >= 0 else "error"
    }

@app.get("/")
async def root():
    return {"message": "Multi-School Handbook Bot API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/process-handbook")
async def process_handbook_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    school_id: str = Form(...),
    handbook_title: str = Form(...),
    academic_year: str = Form(...)
):
    """
    Upload and process a handbook PDF.
    This endpoint can be triggered by a frontend button.
    """
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Generate job ID for tracking
    job_id = f"{school_id}_{academic_year}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Initialize processing status
    processing_status[job_id] = {
        "progress": 0,
        "message": "Starting upload...",
        "timestamp": datetime.now().isoformat(),
        "status": "processing"
    }
    
    try:
        # Save uploaded file temporarily
        temp_dir = tempfile.mkdtemp()
        temp_file_path = os.path.join(temp_dir, file.filename)
        
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Start background processing
        background_tasks.add_task(
            process_handbook_background,
            job_id,
            temp_file_path,
            school_id,
            handbook_title,
            academic_year,
            temp_dir
        )
        
        return {
            "job_id": job_id,
            "message": "Handbook upload successful. Processing started.",
            "status": "processing"
        }
        
    except Exception as e:
        processing_status[job_id] = {
            "progress": -1,
            "message": f"Upload failed: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "status": "error"
        }
        raise HTTPException(status_code=500, detail=str(e))

async def process_handbook_background(
    job_id: str,
    pdf_path: str,
    school_id: str,
    handbook_title: str,
    academic_year: str,
    temp_dir: str
):
    """Background task to process the handbook."""
    
    def progress_callback(progress: float, message: str):
        update_processing_status(job_id, progress, message)
    
    try:
        # Process the handbook
        result = process_handbook_file(
            pdf_path=pdf_path,
            school_id=school_id,
            handbook_title=handbook_title,
            academic_year=academic_year,
            progress_callback=progress_callback
        )
        
        # Update final status
        if result["status"] == "success":
            processing_status[job_id] = {
                "progress": 100,
                "message": result["message"],
                "timestamp": datetime.now().isoformat(),
                "status": "completed",
                "result": result
            }
        else:
            processing_status[job_id] = {
                "progress": -1,
                "message": result["message"],
                "timestamp": datetime.now().isoformat(),
                "status": "error",
                "error": result.get("error")
            }
            
    except Exception as e:
        processing_status[job_id] = {
            "progress": -1,
            "message": f"Processing failed: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "status": "error",
            "error": str(e)
        }
    
    finally:
        # Cleanup temporary files
        try:
            shutil.rmtree(temp_dir)
        except:
            pass

@app.get("/api/processing-status/{job_id}")
async def get_processing_status(job_id: str):
    """Get the current processing status for a job."""
    
    if job_id not in processing_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return processing_status[job_id]

@app.post("/api/search-schools")
async def search_schools(query: dict):
    """Search for schools in the database."""
    search_term = query.get("query", "").strip()
    
    if not search_term:
        return {"schools": []}
    
    try:
        processor = HandbookProcessor()
        if not processor.connect_to_snowflake():
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = processor.connection.cursor()
        
        # Search schools by name or abbreviation
        search_query = """
        SELECT school_id, school_name, school_abbreviation, created_at
        FROM schools 
        WHERE LOWER(school_name) LIKE LOWER(%(search)s) 
           OR LOWER(school_abbreviation) LIKE LOWER(%(search)s)
        ORDER BY school_name
        LIMIT 10
        """
        
        cursor.execute(search_query, {"search": f"%{search_term}%"})
        results = cursor.fetchall()
        
        schools = []
        for row in results:
            schools.append({
                "school_id": row[0],
                "school_name": row[1],
                "school_abbreviation": row[2],
                "created_at": row[3].isoformat() if row[3] else None
            })
        
        processor.close_connection()
        
        return {"schools": schools}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/add-school")
async def add_school(school_data: dict):
    """Add a new school to the database."""
    
    school_name = school_data.get("school_name", "").strip()
    school_abbreviation = school_data.get("school_abbreviation", "").strip()
    
    if not school_name:
        raise HTTPException(status_code=400, detail="School name is required")
    
    try:
        processor = HandbookProcessor()
        if not processor.connect_to_snowflake():
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        # Generate school ID
        school_id = school_abbreviation.lower().replace(" ", "_") if school_abbreviation else school_name.lower().replace(" ", "_")
        
        cursor = processor.connection.cursor()
        
        # Insert new school
        insert_query = """
        INSERT INTO schools (school_id, school_name, school_abbreviation, created_at)
        VALUES (%(school_id)s, %(school_name)s, %(school_abbreviation)s, CURRENT_TIMESTAMP)
        """
        
        cursor.execute(insert_query, {
            "school_id": school_id,
            "school_name": school_name,
            "school_abbreviation": school_abbreviation or None
        })
        
        processor.close_connection()
        
        return {
            "school_id": school_id,
            "school_name": school_name,
            "school_abbreviation": school_abbreviation,
            "message": "School added successfully"
        }
        
    except Exception as e:
        if "already exists" in str(e).lower():
            raise HTTPException(status_code=409, detail="School already exists")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_endpoint(request: dict):
    """Chat endpoint for asking questions about handbooks."""
    
    message = request.get("message", "")
    school_id = request.get("school_id")
    
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")
    
    try:
        # Use RAG service to get response
        response = await rag_service.get_response(message, school_id)
        
        return {
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/handbooks/{school_id}")
async def get_school_handbooks(school_id: str):
    """Get all handbooks for a specific school."""
    
    try:
        processor = HandbookProcessor()
        if not processor.connect_to_snowflake():
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = processor.connection.cursor()
        
        query = """
        SELECT handbook_id, handbook_title, academic_year, created_at
        FROM handbooks 
        WHERE school_id = %(school_id)s
        ORDER BY created_at DESC
        """
        
        cursor.execute(query, {"school_id": school_id})
        results = cursor.fetchall()
        
        handbooks = []
        for row in results:
            handbooks.append({
                "handbook_id": row[0],
                "handbook_title": row[1],
                "academic_year": row[2],
                "created_at": row[3].isoformat() if row[3] else None
            })
        
        processor.close_connection()
        
        return {"handbooks": handbooks}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

# Serve React app for all other routes (SPA routing)
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    """Serve React app for all non-API routes"""
    frontend_build_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
    index_file = os.path.join(frontend_build_path, "index.html")
    
    if os.path.exists(index_file):
        return FileResponse(index_file)
    else:
        # Fallback if no build exists
        return {"message": "Frontend build not found. Please build the React app first."}
