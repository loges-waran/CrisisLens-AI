import os
import base64
from openai import OpenAI


client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=os.environ["HF_TOKEN"]
)


def analyze_image(image_path):

    with open(image_path, "rb") as image_file:
        image_base64 = base64.b64encode(
            image_file.read()
        ).decode("utf-8")

    response = client.chat.completions.create(
        model="Qwen/Qwen3-VL-30B-A3B-Instruct:novita",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "Analyze this image for disaster response. "
                            "Identify the likely disaster type, "
                            "visible damage, "
                            "severity (Low/Medium/High), "
                            "and give a short reason."
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": (
                                "data:image/jpeg;base64,"
                                + image_base64
                            )
                        }
                    }
                ]
            }
        ]
    )

    return response.choices[0].message.content