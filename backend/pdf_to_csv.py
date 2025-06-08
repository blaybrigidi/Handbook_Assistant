import fitz  # PyMuPDF
import uuid
import pandas as pd
import json
import re

# === CONFIG ===
PDF_PATH = "student_handbook.pdf"
OUTPUT_CSV = "ashesi_handbook_snowflake.csv"
HANDBOOK_ID = "ashesi_2022"

# === HELPER ===
def clean_text(text):
    return ' '.join(text.replace('\n', ' ').split())

def generate_excerpt(text, max_length=200):
    return clean_text(text)[:max_length]

def extract_tags(text):
    tags = []
    if "integrity" in text.lower(): tags.append("academic_integrity")
    if "policy" in text.lower(): tags.append("policy")
    if "student" in text.lower(): tags.append("student_focused")
    if "conduct" in text.lower(): tags.append("conduct_policy")
    if "registration" in text.lower(): tags.append("registration")
    if "exam" in text.lower(): tags.append("examination")
    return list(set(tags))

# === PROCESS PDF ===
doc = fitz.open(PDF_PATH)
sections = []

for page_num, page in enumerate(doc, start=1):
    raw_text = page.get_text()
    text = clean_text(raw_text)
    if not text.strip():
        continue

    section_id = str(uuid.uuid4())
    section_group = "unknown"
    section_key = f"sec_{page_num}"
    section_title = f"Page {page_num}"
    category = "Miscellaneous"
    section_type = "reference"
    excerpt = generate_excerpt(text)
    topics = extract_tags(text)
    tags = topics + ["student_focused"]

    sections.append({
        "section_id": section_id,
        "handbook_id": HANDBOOK_ID,
        "section_group": section_group,
        "section_key": section_key,
        "page": f"Page {page_num}",
        "section_title": section_title,
        "category": category,
        "type": section_type,
        "content": text,
        "raw_text": raw_text,
        "excerpt": excerpt,
        "topics": json.dumps(topics),
        "tags": json.dumps(tags)
    })

# === EXPORT TO CSV ===
df = pd.DataFrame(sections)
df.to_csv(OUTPUT_CSV, index=False)
print(f"✅ Saved {len(df)} sections to {OUTPUT_CSV}")
