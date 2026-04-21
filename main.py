from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import docx
import io
import os
import re
import time
import random
import json
from dotenv import load_dotenv
import google.generativeai as genai

# ----------------- LOAD ENV -----------------
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env file")

genai.configure(api_key=API_KEY)

# ----------------- FASTAPI APP -----------------

app = FastAPI(title="SaarthX Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "🚀 SaarthiX Backend Running"}

# ----------------- TEXT EXTRACTION -----------------

def extract_text(file: UploadFile):
    file.file.seek(0)

    if file.filename.endswith(".pdf"):
        text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()

    elif file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(file.file.read()))
        return "\n".join([p.text for p in doc.paragraphs]).strip()

    elif file.filename.endswith(".txt"):
        return file.file.read().decode("utf-8").strip()

    return None

# ----------------- SAFE JSON EXTRACTOR -----------------

def extract_json(text):
    try:
        # Remove ```json or ``` blocks
        text = re.sub(r"```json|```", "", text).strip()

        # Extract JSON array
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            return json.loads(match.group())

        return []
    except Exception as e:
        print("❌ JSON parse error:", e)
        return []

# ----------------- RETRY HELPER -----------------

def generate_with_retry(model, prompt, retries=3, initial_delay=2):
    for attempt in range(retries):
        try:
            return model.generate_content(prompt)

        except Exception as e:
            if "429" in str(e) or "Resource exhausted" in str(e):
                if attempt < retries - 1:
                    sleep_time = initial_delay * (2 ** attempt) + random.uniform(0, 1)
                    print(f"⚠️ Retrying in {sleep_time:.2f}s...")
                    time.sleep(sleep_time)
                    continue
            raise e

# ----------------- UPLOAD ENDPOINT -----------------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = extract_text(file)

        if not content:
            raise HTTPException(status_code=400, detail="Unsupported or empty file")

        model = genai.GenerativeModel("gemini-2.5-flash")

        # ----------------- NOTES -----------------

        notes_prompt = f"""
        Create clean structured Markdown notes.

        RULES:
        - Use # title
        - Use ## headings
        - Use bullet points
        - Use **bold** for key terms
        - Add spacing between sections

        TEXT:
        {content}
        """

        notes_resp = generate_with_retry(model, notes_prompt)
        short_notes = (getattr(notes_resp, "text", "") or "").strip()

        # ----------------- QUIZ (MCQ JSON) -----------------

        quiz_prompt = f"""
        Generate 5 multiple choice questions from the text.

        STRICT RULES:
        - Return ONLY valid JSON
        - No explanation outside JSON
        - No markdown
        - No extra text

        FORMAT:
        [
          {{
            "question": "string",
            "options": ["option1", "option2", "option3", "option4"],
            "correct_answer": "one of the options",
            "rationale": "short explanation"
          }}
        ]

        TEXT:
        {content}
        """

        quiz_resp = generate_with_retry(model, quiz_prompt)
        quiz_text = (getattr(quiz_resp, "text", "") or "").strip()

        quiz = extract_json(quiz_text)

        if not quiz:
            print("⚠️ AI returned invalid JSON")
            quiz = []

        return {
            "filename": file.filename,
            "short_notes": short_notes,
            "quiz": quiz
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("❌ Upload error:", e)

        if "API_KEY" in str(e) or "invalid" in str(e):
            raise HTTPException(status_code=401, detail="Invalid or expired API key")

        if "429" in str(e):
            raise HTTPException(status_code=429, detail="Server busy. Try again later")

        raise HTTPException(status_code=500, detail=str(e))

# ----------------- OPTIONAL GET -----------------

@app.get("/upload")
def upload_get():
    return {"message": "Use POST to upload a file"}
