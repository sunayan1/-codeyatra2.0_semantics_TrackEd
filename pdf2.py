import streamlit as st
from google import genai
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import os

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
                prompt = f"Based on this text, generate 3 multiple-choice questions:\n\n{text}"
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                st.subheader("Quiz for Students:")
                st.write(response.text)

    st.divider()
    answer = st.text_input("Student: Answer Question 1 here")
    if answer:
        st.success("Response recorded!")
    return True

generate_ques()