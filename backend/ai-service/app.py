import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import io

load_dotenv()

app = Flask(__name__)
CORS(app)

api_key = os.getenv("AIzaSyAK4AqyJx4oB6ty3rBCW4OfyKv0cSNPLD0")
if not api_key:
    print("WARNING: GEMINI_API_KEY not set in .env")

client = genai.Client(api_key=api_key) if api_key else None


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "ai-quiz-generator"})


@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    """
    Accepts either:
      - A PDF file upload (multipart/form-data with key 'pdf')
      - Raw text in JSON body ({"text": "...", "num_questions": 5})
    Returns a JSON array of quiz questions.
    """
    if not client:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 500

    text = ""
    num_questions = 5

    # Handle PDF file upload
    if "pdf" in request.files:
        pdf_file = request.files["pdf"]
        reader = PdfReader(io.BytesIO(pdf_file.read()))
        text = "".join([page.extract_text() or "" for page in reader.pages])
        num_questions = int(request.form.get("num_questions", 5))
    # Handle JSON body with raw text
    elif request.is_json:
        body = request.get_json()
        text = body.get("text", "")
        num_questions = body.get("num_questions", 5)
    else:
        return jsonify({"error": "Send a PDF file or JSON with 'text' field"}), 400

    if not text.strip():
        return jsonify({"error": "No text content found in the provided input"}), 400

    # Truncate very long texts to avoid token limits
    max_chars = 15000
    if len(text) > max_chars:
        text = text[:max_chars]

    prompt = f"""Based on this text, generate {num_questions} multiple-choice questions.
Return ONLY a JSON array in this exact format, no extra text:
[
  {{
    "question": "Question text here?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "answer": "A) option1"
  }}
]

Text: {text}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        raw = (
            response.text.strip()
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )
        questions = json.loads(raw)

        # Validate structure
        if not isinstance(questions, list):
            return jsonify({"error": "AI returned invalid format"}), 500

        for q in questions:
            if not all(k in q for k in ("question", "options", "answer")):
                return jsonify({"error": "AI returned incomplete question format"}), 500

        return jsonify({"success": True, "questions": questions})

    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response as JSON"}), 500
    except Exception as e:
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 5001))
    print(f"AI Quiz Service running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
