from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import docx
import io
import os
import re
import time
import random
import google.generativeai as genai

# ----------------- Configure Gemini API -----------------

# NOTE: In production, use os.environ.get("GOOGLE_API_KEY") and set it in your system
os.environ["GOOGLE_API_KEY"] = "AIzaSyCJoYtD2Vo1mqaEpmsUpIUm0UYdNQDxCr0"
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# ----------------- FastAPI App -----------------

app = FastAPI(title="SaarthX Backend")

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "🚀 SaarthiX Backend Running"}

# ----------------- Utility function to extract text -----------------

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
    else:
        return None

# ----------------- Helper functions -----------------

def clean_quiz(text):
    lines = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        # Improved Regex: Removes "1.", "Q1:", "Question 1:", "**1.**"
        # This prevents "uestion 1" errors and handles spacing properly
        line = re.sub(r"^(\d+[\.\)\-]|Q\d+[:\.]?|Question\s*\d+[:\.]?|\*\*Question\s*\d+\*\*:?)\s+", "", line, flags=re.IGNORECASE)
        line = line.lstrip("-*•").strip()
        
        if line:
            lines.append(line)
    return lines

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        content = extract_text(file)
        if not content:
            return {"error": "Unsupported file type or empty file"}

        model = genai.GenerativeModel("gemini-2.5-flash")
        print("\nAvailable Models:\n")
        for m in genai.list_models():
            print(m.name)

        # ----------------- RETRY LOGIC HELPER -----------------
        def generate_with_retry(prompt, retries=3, initial_delay=2):
            """
            Tries to generate content. If a 429 (Rate Limit) error occurs,
            it waits and retries with exponential backoff.
            """
            for attempt in range(retries):
                try:
                    return model.generate_content(prompt)
                except Exception as e:
                    # Check if error string contains 429 or Resource Exhausted
                    if "429" in str(e) or "Resource exhausted" in str(e):
                        if attempt < retries - 1:
                            # Wait: 2s, 4s, 8s... + random jitter
                            sleep_time = initial_delay * (2 ** attempt) + random.uniform(0, 1)
                            print(f"⚠️ Rate limit hit. Retrying in {sleep_time:.2f}s...")
                            time.sleep(sleep_time)
                            continue
                    # If it's not a 429 or we ran out of retries, raise the error
                    raise e

        # ----------------- UPDATED PROMPT FOR PERFECT MARKDOWN -----------------
        # FIXES: Added explicit instructions for newlines and table spacing.
        notes_prompt = f"""
        You are SaarthX, an expert AI study assistant. 
        Analyze the following text and create high-quality, visually distinct short notes using STRICT Markdown.

        STRICT FORMATTING RULES:
        1.  **Main Title:** Start with `# Topic Name`.
        2.  **Subheadings:** Use `## Section Name`.
        3.  **Emojis:** Add relevant emojis (🌿, ⚛️, 🧠) to every heading.
        4.  **Lists:** ALWAYS put each list item on a NEW LINE. Never group them in one paragraph.
            * Correct: 
                1. Item A
                2. Item B
            * Incorrect: 1. Item A 2. Item B
        5.  **Tables:** If comparing items, use a Markdown table. ALWAYS add a blank line before and after the table.
        6.  **Spacing:** Add a blank line between every section.
        7.  **Key Concepts:** Use `**bold text**` for definitions.
        8.  **Important:** Use `> quote` for key takeaways.
        
        Text to summarize:
        {content}
        """
        
        # Use retry logic for notes
        notes_resp = generate_with_retry(notes_prompt)
        short_notes = notes_resp.text.strip()

        # ----------------- QUIZ GENERATION -----------------
        # Explicitly telling it NOT to give answers or numbers
        quiz_prompt = f"""
        Create 5 short quiz questions based on this text.
        
        OUTPUT RULES:
        - Return ONLY the questions.
        - Do NOT include answers.
        - Do NOT include "Question 1", "Q1", etc.
        - One question per line.
        - Ensure questions are distinct.
        
        Text:
        {content}
        """
        
        # Use retry logic for quiz
        quiz_resp = generate_with_retry(quiz_prompt)
        quiz = clean_quiz(quiz_resp.text.strip())

        return {
            "filename": file.filename,
            "short_notes": short_notes,
            "quiz": quiz
        }

    except Exception as e:
        print("Upload error:", e)
        # Return a friendly error to the frontend if it fails after retries
        if "429" in str(e):
            return {"error": "Server is busy (Rate Limit). Please try again in a minute."}
        return {"error": str(e)}

# ----------------- Optional GET /upload -----------------

@app.get("/upload")
def upload_get():
    return {"message": "Please use POST method to upload a file."}
