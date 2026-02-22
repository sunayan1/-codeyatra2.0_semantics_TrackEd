import streamlit as st
from google import genai
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import os
import json

load_dotenv()
api_key = os.getenv("api_key")
client = genai.Client(api_key=api_key)

def generate_ques():
    st.title("Hackathon: PDF to Quiz")
    uploaded_file = st.file_uploader("Upload Lesson PDF", type="pdf")

    if uploaded_file:
        reader = PdfReader(uploaded_file)
        text = "".join([page.extract_text() for page in reader.pages])

        if st.button("Generate Questions"):
            with st.spinner("Analyzing content..."):
                prompt = f"""Based on this text, generate 3 multiple-choice questions.
Return ONLY a JSON array in this exact format, no extra text:
[
  {{
    "question": "Question text here?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "answer": "A) option1"
  }}
]

Text: {text}"""
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                raw = response.text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                st.session_state.questions = json.loads(raw)
                st.session_state.submitted = False
                st.session_state.user_answers = [""] * len(st.session_state.questions)

    if "questions" in st.session_state and st.session_state.questions:
        st.subheader("Quiz:")

        for i, q in enumerate(st.session_state.questions):
            st.markdown(f"**Q{i+1}. {q['question']}**")
            st.session_state.user_answers[i] = st.radio(
                f"Select answer for Q{i+1}:",
                q["options"],
                key=f"q{i}",
                index=None
            )
            st.divider()

        if st.button("Submit Answers"):
            st.session_state.submitted = True

        if st.session_state.get("submitted"):
            st.subheader("Results:")
            score = 0
            for i, q in enumerate(st.session_state.questions):
                user_ans = st.session_state.user_answers[i]
                correct = q["answer"]
                if user_ans == correct:
                    st.success(f"Q{i+1}: Correct!")
                    score += 1
                else:
                    st.error(f"Q{i+1}: Wrong — Correct answer: {correct}")
            st.markdown(f"### Score: {score}/{len(st.session_state.questions)}")

    return True

generate_ques()