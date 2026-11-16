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
    def generate_thumbnail_ideas(
        self,
        content: str,
        platform: str = "YouTube",
        language: str = "English"
    ):
        prompt = f"""
        You are CreatorPilot AI Thumbnail Strategist.

        Create exactly 3 thumbnail concepts based on the input.

        Input: {content}
        Platform: {platform}
        Language: {language}

        Return ONLY valid JSON in this format:
        {{
            "thumbnails": [
                {{
                    "headline": "Short catchy headline",
                    "subheadline": "Supporting text",
                    "style": "bold_contrast",
                    "visual_concept": "Describe the visual design"
                }},
                {{
                    "headline": "Another headline",
                    "subheadline": "Supporting text",
                    "style": "minimal_split",
                    "visual_concept": "Describe the visual design"
                }},
                {{
                    "headline": "Third headline",
                    "subheadline": "Supporting text",
                    "style": "cinematic",
                    "visual_concept": "Describe the visual design"
                }}
            ]
        }}

        Headlines must be short, engaging and relevant.
        Do not invent facts or misleading claims.
        """

        response = self.client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        import json
        import re

        result = response.text or ""

        result = re.sub(r"```(?:json)?|```", "", result).strip()

        return json.loads(result)