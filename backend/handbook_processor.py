import fitz  # PyMuPDF
import uuid
import pandas as pd
import json
import re
import logging
from typing import Dict, List, Optional, Callable
from datetime import datetime
import snowflake.connector
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HandbookProcessor:
    def __init__(self):
        """Initialize the handbook processor with Snowflake connection."""
        self.snowflake_config = {
            'user': os.getenv('SNOWFLAKE_USER'),
            'password': os.getenv('SNOWFLAKE_PASSWORD'),
            'account': os.getenv('SNOWFLAKE_ACCOUNT'),
            'warehouse': os.getenv('SNOWFLAKE_WAREHOUSE'),
            'database': os.getenv('SNOWFLAKE_DATABASE'),
            'schema': os.getenv('SNOWFLAKE_SCHEMA')
        }
        self.connection = None
        
    def connect_to_snowflake(self):
        """Establish connection to Snowflake."""
        try:
            self.connection = snowflake.connector.connect(**self.snowflake_config)
            logger.info("Successfully connected to Snowflake")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Snowflake: {str(e)}")
            return False
    
    def close_connection(self):
        """Close Snowflake connection."""
        if self.connection:
            self.connection.close()
            logger.info("Snowflake connection closed")
    
    def clean_text(self, text: str) -> str:
        """Enhanced text cleaning."""
        if not text:
            return ""
        
        # Remove excessive whitespace and newlines
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers and headers/footers
        text = re.sub(r'Page \d+', '', text)
        text = re.sub(r'\d+\s*$', '', text)  # Remove trailing page numbers
        
        return text.strip()
    
    def detect_section_title(self, text: str) -> Optional[str]:
        """Detect if text contains a section title."""
        lines = text.split('\n')
        for line in lines[:3]:  # Check first 3 lines
            line = line.strip()
            if len(line) > 0 and len(line) < 100:
                # Check for common title patterns
                if (line.isupper() or 
                    re.match(r'^[A-Z][^.]*$', line) or
                    re.match(r'^\d+\.?\s+[A-Z]', line) or
                    re.match(r'^Chapter \d+', line, re.IGNORECASE) or
                    re.match(r'^Section \d+', line, re.IGNORECASE)):
                    return line
        return None
    
    def extract_enhanced_tags(self, text: str) -> List[str]:
        """Enhanced tag extraction with more comprehensive categories."""
        tags = []
        text_lower = text.lower()
        
        # Academic tags
        academic_keywords = {
            'academic_integrity': ['integrity', 'plagiarism', 'cheating', 'honor code'],
            'examination': ['exam', 'test', 'quiz', 'assessment', 'midterm', 'final'],
            'grading': ['grade', 'gpa', 'transcript', 'credit', 'pass', 'fail'],
            'registration': ['registration', 'enrollment', 'course selection', 'add/drop'],
            'graduation': ['graduation', 'commencement', 'degree', 'diploma'],
        }
        
        # Student life tags
        student_life_keywords = {
            'conduct': ['conduct', 'behavior', 'discipline', 'violation'],
            'housing': ['housing', 'dormitory', 'residence', 'accommodation'],
            'dining': ['dining', 'meal', 'cafeteria', 'food service'],
            'health': ['health', 'medical', 'counseling', 'wellness'],
            'activities': ['club', 'organization', 'event', 'activity'],
        }
        
        # Administrative tags
        admin_keywords = {
            'financial': ['tuition', 'fee', 'scholarship', 'financial aid', 'payment'],
            'policy': ['policy', 'procedure', 'rule', 'regulation'],
            'appeals': ['appeal', 'grievance', 'complaint', 'petition'],
            'calendar': ['calendar', 'semester', 'session', 'holiday', 'break'],
        }
        
        all_keywords = {**academic_keywords, **student_life_keywords, **admin_keywords}
        
        for tag, keywords in all_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                tags.append(tag)
        
        # Always add general tags
        if 'student' in text_lower:
            tags.append('student_focused')
        
        return list(set(tags))
    
    def categorize_content(self, text: str, section_title: str = None) -> str:
        """Categorize content based on text analysis."""
        text_lower = text.lower()
        title_lower = (section_title or "").lower()
        
        categories = {
            'Academic Policies': ['academic', 'course', 'grade', 'exam', 'credit'],
            'Student Conduct': ['conduct', 'behavior', 'discipline', 'violation'],
            'Administrative': ['registration', 'fee', 'tuition', 'administrative'],
            'Student Services': ['health', 'counseling', 'support', 'service'],
            'Campus Life': ['housing', 'dining', 'activity', 'club', 'event'],
            'General Information': ['welcome', 'introduction', 'overview', 'general']
        }
        
        for category, keywords in categories.items():
            if any(keyword in text_lower or keyword in title_lower for keyword in keywords):
                return category
        
        return 'Miscellaneous'
    
    def extract_table_of_contents(self, doc) -> Dict[str, int]:
        """Extract table of contents if available."""
        toc = {}
        try:
            outline = doc.get_toc()
            for item in outline:
                level, title, page = item
                if level <= 2:  # Only main sections and subsections
                    toc[title.strip()] = page
        except:
            logger.info("No table of contents found or error extracting TOC")
        
        return toc
    
    def process_handbook(self, 
                        pdf_path: str, 
                        school_id: str, 
                        handbook_title: str, 
                        academic_year: str,
                        progress_callback: Optional[Callable] = None) -> Dict:
        """
        Process a handbook PDF and insert data into Snowflake.
        
        Args:
            pdf_path: Path to the PDF file
            school_id: ID of the school
            handbook_title: Title of the handbook
            academic_year: Academic year (e.g., "2024-2025")
            progress_callback: Optional callback function for progress updates
        
        Returns:
            Dict with processing results
        """
        
        try:
            # Generate handbook ID
            handbook_id = f"{school_id}_{academic_year.replace('-', '_')}"
            
            if progress_callback:
                progress_callback(0, "Starting PDF processing...")
            
            # Open PDF
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            
            if progress_callback:
                progress_callback(10, f"Opened PDF with {total_pages} pages")
            
            # Extract table of contents
            toc = self.extract_table_of_contents(doc)
            
            # Connect to Snowflake
            if not self.connect_to_snowflake():
                raise Exception("Failed to connect to Snowflake")
            
            # Start transaction
            self.connection.execute_string("BEGIN")
            
            try:
                # Insert handbook record
                self.insert_handbook_record(handbook_id, school_id, handbook_title, academic_year)
                
                if progress_callback:
                    progress_callback(20, "Inserted handbook record")
                
                # Process pages
                sections = []
                current_section_title = None
                current_section_group = "introduction"
                
                for page_num, page in enumerate(doc, start=1):
                    if progress_callback:
                        progress = 20 + (page_num / total_pages) * 60
                        progress_callback(progress, f"Processing page {page_num}/{total_pages}")
                    
                    raw_text = page.get_text()
                    cleaned_text = self.clean_text(raw_text)
                    
                    if not cleaned_text.strip():
                        continue
                    
                    # Try to detect section title
                    detected_title = self.detect_section_title(raw_text)
                    if detected_title:
                        current_section_title = detected_title
                        # Update section group based on TOC or title
                        current_section_group = self.determine_section_group(detected_title, toc)
                    
                    # Create section record
                    section_id = str(uuid.uuid4())
                    section_title = current_section_title or f"Page {page_num}"
                    category = self.categorize_content(cleaned_text, section_title)
                    tags = self.extract_enhanced_tags(cleaned_text)
                    topics = [tag for tag in tags if not tag.endswith('_focused')]
                    
                    section_data = {
                        "section_id": section_id,
                        "handbook_id": handbook_id,
                        "section_group": current_section_group,
                        "section_key": f"sec_{page_num:03d}",
                        "page": f"Page {page_num}",
                        "section_title": section_title,
                        "category": category,
                        "type": "reference",
                        "content": cleaned_text,
                        "raw_text": raw_text,
                        "excerpt": self.generate_excerpt(cleaned_text),
                        "topics": topics,
                        "tags": tags
                    }
                    
                    sections.append(section_data)
                
                # Insert sections into Snowflake
                if progress_callback:
                    progress_callback(85, f"Inserting {len(sections)} sections into database...")
                
                self.insert_sections_batch(sections)
                
                # Commit transaction
                self.connection.execute_string("COMMIT")
                
                if progress_callback:
                    progress_callback(100, "Processing completed successfully!")
                
                doc.close()
                
                return {
                    "status": "success",
                    "handbook_id": handbook_id,
                    "sections_processed": len(sections),
                    "total_pages": total_pages,
                    "message": f"Successfully processed {len(sections)} sections from {total_pages} pages"
                }
                
            except Exception as e:
                # Rollback transaction on error
                self.connection.execute_string("ROLLBACK")
                logger.error(f"Transaction rolled back due to error: {str(e)}")
                raise e
            
        except Exception as e:
            logger.error(f"Error processing handbook: {str(e)}")
            if progress_callback:
                progress_callback(-1, f"Error: {str(e)}")
            
            return {
                "status": "error",
                "error": str(e),
                "message": f"Failed to process handbook: {str(e)}"
            }
        
        finally:
            self.close_connection()
    
    def determine_section_group(self, title: str, toc: Dict[str, int]) -> str:
        """Determine section group based on title and TOC."""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['introduction', 'welcome', 'overview']):
            return 'introduction'
        elif any(word in title_lower for word in ['academic', 'course', 'curriculum']):
            return 'academics'
        elif any(word in title_lower for word in ['student', 'conduct', 'behavior']):
            return 'student_life'
        elif any(word in title_lower for word in ['administrative', 'registration', 'fee']):
            return 'administration'
        elif any(word in title_lower for word in ['policy', 'procedure', 'rule']):
            return 'policies'
        else:
            return 'general'
    
    def generate_excerpt(self, text: str, max_length: int = 200) -> str:
        """Generate excerpt from text."""
        if len(text) <= max_length:
            return text
        
        # Try to cut at sentence boundary
        excerpt = text[:max_length]
        last_period = excerpt.rfind('.')
        if last_period > max_length * 0.7:  # If period is reasonably close to end
            excerpt = excerpt[:last_period + 1]
        else:
            excerpt = excerpt + "..."
        
        return excerpt
    
    def insert_handbook_record(self, handbook_id: str, school_id: str, handbook_title: str, academic_year: str):
        """Insert handbook record into Snowflake."""
        cursor = self.connection.cursor()
        
        query = """
        INSERT INTO handbooks (handbook_id, school_id, handbook_title, academic_year, created_at)
        VALUES (%(handbook_id)s, %(school_id)s, %(handbook_title)s, %(academic_year)s, CURRENT_TIMESTAMP)
        """
        
        cursor.execute(query, {
            'handbook_id': handbook_id,
            'school_id': school_id,
            'handbook_title': handbook_title,
            'academic_year': academic_year
        })
        
        cursor.close()
        logger.info(f"Inserted handbook record: {handbook_id}")
    
    def insert_sections_batch(self, sections: List[Dict]):
        """Insert sections in batch to Snowflake."""
        cursor = self.connection.cursor()
        
        # Insert sections one by one using SELECT statement to handle PARSE_JSON
        for section in sections:
            query = """
            INSERT INTO handbook_sections 
            (section_id, handbook_id, section_group, section_key, page, section_title, 
             category, type, content, raw_text, excerpt, topics, tags, created_at)
            SELECT 
                %(section_id)s, %(handbook_id)s, %(section_group)s, %(section_key)s, 
                %(page)s, %(section_title)s, %(category)s, %(type)s, %(content)s, 
                %(raw_text)s, %(excerpt)s, PARSE_JSON(%(topics)s), PARSE_JSON(%(tags)s), CURRENT_TIMESTAMP
            """
            
            # Convert arrays to JSON strings for PARSE_JSON function
            section_data = section.copy()
            section_data['topics'] = json.dumps(section['topics'])
            section_data['tags'] = json.dumps(section['tags'])
            
            cursor.execute(query, section_data)
        
        cursor.close()
        logger.info(f"Inserted {len(sections)} sections")

# Convenience function for direct usage
def process_handbook_file(pdf_path: str, school_id: str, handbook_title: str, 
                         academic_year: str, progress_callback: Optional[Callable] = None) -> Dict:
    """
    Convenience function to process a handbook file.
    """
    processor = HandbookProcessor()
    return processor.process_handbook(pdf_path, school_id, handbook_title, academic_year, progress_callback) 