import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()


class GroqService:

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError("GROQ_API_KEY is missing from .env")

        self.client = Groq(api_key=api_key)

        # Cost-conscious model choice
        self.model = "openai/gpt-oss-20b"

    def generate_content(
        self,
        content: str,
        language: str = "English",
        tone: str = "engaging",
        platform: str = "General"
    ) -> str:

        prompt = f"""
You are CreatorPilot AI, a multilingual content creation assistant.

Generate high-quality content using these requirements:

Input:
{content}

Language: {language}
Tone: {tone}
Platform: {platform}

Return the result in this format:

TITLE:
A short, catchy post title for the post.

CONTENT:
Well-written, engaging content.

HASHTAGS:
5 relevant hashtags.

Important:
- Follow the requested language.
- Match the requested tone.
- Keep the content relevant to the platform.
- Do not invent facts.
- Avoid unnecessary explanations.
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are CreatorPilot AI. Generate useful, original content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_completion_tokens=1500
            )

            return response.choices[0].message.content.strip()

        except Exception as e:
            print(f"Groq API Error: {e}")
            raise RuntimeError("Content generation failed. Please try again.")