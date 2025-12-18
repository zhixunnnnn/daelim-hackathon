import os
import base64
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import openai

# .env 파일에서 환경 변수 로드
load_dotenv()

# Flask 앱 초기화
app = Flask(__name__)
CORS(app)

# OpenAI API 키 설정
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")

client = openai.OpenAI(api_key=api_key)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """
    이미지를 분석하여 반도체 관련 객체를 식별하고 설명합니다.
    """
    try:
        data = request.json
        image_base64 = data.get('image')

        if not image_base64:
            return jsonify({'error': '이미지가 없습니다.'}), 400

        # Base64 데이터 URL에서 실제 이미지 데이터 추출
        if image_base64.startswith('data:image'):
            image_base64 = image_base64.split(',')[1]

        # OpenAI Vision API를 사용하여 이미지 분석
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}",
                            },
                        },
                        {
                            "type": "text",
                            "text": """당신은 반도체 산업 전문가입니다. 주어진 이미지를 분석하고 다음 정보를 한국어로 제공해주세요:

1. 이미지에 보이는 반도체 관련 객체가 무엇인지 (예: 웨이퍼, 웨이퍼 맵, 패키지된 칩, 포토마스크, FOUP, 프로브 카드 등)
2. 그것이 무엇에 사용되는지
3. 반도체 제조 과정에서의 역할

답변은 쉽고 이해하기 쉬운 언어로 작성해주세요. 기술적 깊이는 필요하지 않습니다.
마지막에는 반드시 다음 문구를 포함해주세요:
"이 설명은 일반적인 정보이며 기술적 평가가 아닙니다."
"""
                        }
                    ],
                }
            ],
        )

        analysis = response.choices[0].message.content

        return jsonify({'analysis': analysis}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
