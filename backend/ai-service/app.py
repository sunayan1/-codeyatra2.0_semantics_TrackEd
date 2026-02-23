import os
import json
import logging
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from PyPDF2 import PdfReader
from dotenv import load_dotenv

# Flask setup
app = Flask(__name__)
CORS(app)

load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai-quiz-generator")

# API client
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.warning("GEMINI_API_KEY not set")
client = genai.Client(api_key=API_KEY) if API_KEY else None

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    if not client:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    text, num_questions = "", 5
    try:
        if "pdf" in request.files:
            pdf = PdfReader(io.BytesIO(request.files["pdf"].read()))
            text = "".join(page.extract_text() or "" for page in pdf.pages)
            num_questions = int(request.form.get("num_questions", 5))
        elif request.is_json:
            body = request.get_json()
            text = body.get("text", "")
            num_questions = body.get("num_questions", 5)
        else:
            return jsonify({"error": "Provide PDF or JSON with 'text'"}), 400

        if not text.strip():
            return jsonify({"error": "No text found"}), 400

        text = text[:15000]  # truncate if too long

        prompt = f"""Generate {num_questions} multiple-choice questions from this text. Return ONLY JSON array in format:
[{{"question": "...", "options": ["A)...","B)...","C)...","D)..."], "answer": "A)..."}}]
Text: {text}"""

        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        questions = json.loads(raw)

        if not all(all(k in q for k in ("question","options","answer")) for q in questions):
            return jsonify({"error": "AI returned invalid format"}), 500

        return jsonify({"success": True, "questions": questions})

    except Exception as e:
        logger.exception("AI generation failed")
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 5001))
    logger.info(f"AI Quiz Service running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)