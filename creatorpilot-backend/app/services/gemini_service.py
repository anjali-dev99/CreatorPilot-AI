import os
from dotenv import load_dotenv
from google import genai

load_dotenv()


class GeminiService:

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing")

        self.client = genai.Client(api_key=api_key)

    def generate_content(
        self,
        content: str,
        language: str = "English",
        tone: str = "engaging",
        platform: str = "General"
    ):

        prompt = f"""
        You are CreatorPilot AI.

        Create engaging, original content.

        Input: {content}
        Language: {language}
        Tone: {tone}
        Platform: {platform}

        Include:
        1. Title
        2. Main content
        3. Relevant hashtags
        """

        response = self.client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        return response.text