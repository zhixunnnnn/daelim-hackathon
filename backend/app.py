import io
import os

import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
print("Initializing OpenAI client...")
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    print(f"API Key found: {api_key[:20]}...")
    client = OpenAI(api_key=api_key)
else:
    print("ERROR: No API key found in environment!")
    client = None


# Token pricing for gpt-4o-mini (as of 2024)
# https://openai.com/api/pricing/
INPUT_TOKEN_PRICE = 0.150 / 1_000_000  # $0.150 per 1M input tokens
OUTPUT_TOKEN_PRICE = 0.600 / 1_000_000  # $0.600 per 1M output tokens


@app.route("/api/hello", methods=["GET"])
def hello():
    print("Endpoint /api/hello called")
    return jsonify({"message": "Hello from Python backend!", "status": "success"})


@app.route("/api/data", methods=["GET"])
def get_data():
    print("Endpoint /api/data called")
    return jsonify(
        {
            "items": [
                {"id": 1, "name": "Item 1", "description": "First item"},
                {"id": 2, "name": "Item 2", "description": "Second item"},
                {"id": 3, "name": "Item 3", "description": "Third item"},
            ]
        }
    )


@app.route("/api/analyze-csv", methods=["POST"])
def analyze_csv():
    print("\n" + "=" * 60)
    print("CSV ANALYSIS REQUEST RECEIVED")
    print("=" * 60)

    try:
        # Log request details
        print(f"Request method: {request.method}")
        print(f"Request files: {list(request.files.keys())}")
        print(f"Request form: {dict(request.form)}")

        if "file" not in request.files:
            print("ERROR: No file in request.files")
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        print(f"File received: {file.filename}")

        if file.filename == "":
            print("ERROR: Empty filename")
            return jsonify({"error": "No file selected"}), 400

        if not file.filename.endswith(".csv"):
            print(f"ERROR: Invalid file type: {file.filename}")
            return jsonify({"error": "File must be a CSV"}), 400

        # Get language from request
        language = request.form.get("language", "en")
        print(f"Language selected: {language}")

        # Read CSV file
        print("Reading CSV content...")
        csv_content = file.read().decode("utf-8")
        print(f"CSV content length: {len(csv_content)} bytes")

        print("Parsing CSV with pandas...")
        df = pd.read_csv(io.StringIO(csv_content))
        print(f"CSV parsed successfully!")
        print(f"   Rows: {len(df)}")
        print(f"   Columns: {len(df.columns)}")
        print(f"   Column names: {df.columns.tolist()}")

        # Convert DataFrame to string representation
        csv_preview = df.head(20).to_string(index=False)
        csv_stats = f"Total rows: {len(df)}, Total columns: {len(df.columns)}\nColumns: {', '.join(df.columns.tolist())}"

        # Create prompt for OpenAI based on language
        print(f"Creating prompt in {language}...")
        if language == "ko":
            prompt = f"""당신은 AstraSemi Corporation 직원들이 운영 데이터를 이해하도록 돕는 AI 어시스턴트입니다.

다음 반도체 운영 파일의 CSV 데이터를 분석하세요:

{csv_stats}

CSV 데이터:
{csv_preview}

다음 형식으로 정확하게 응답하세요:

### 요약
[이 데이터가 무엇을 나타내는지 간략하고 명확한 요약을 2-3문장으로 작성]

### 주요 인사이트
- [첫 번째 중요한 인사이트]
- [두 번째 중요한 인사이트]
- [세 번째 중요한 인사이트]
- [네 번째 중요한 인사이트]
- [다섯 번째 중요한 인사이트]

### 상위 3개 조치사항
1. [첫 번째 조치사항 - 구체적이고 실행 가능해야 함]
2. [두 번째 조치사항 - 구체적이고 실행 가능해야 함]
3. [세 번째 조치사항 - 구체적이고 실행 가능해야 함]

위 형식을 정확히 따라 응답하세요. 마크다운 형식을 사용하고 깔끔하게 구조화하세요."""
        else:
            prompt = f"""You are an AI assistant helping AstraSemi Corporation employees understand operational data.

Analyze the following CSV data from a semiconductor operations file:

{csv_stats}

CSV Data:
{csv_preview}

Please provide your analysis in EXACTLY this format:

### Summary
[Write a brief, clear summary of what this data represents in 2-3 sentences]

### Key Insights
- [First important insight or pattern you notice]
- [Second important insight or pattern]
- [Third important insight or pattern]
- [Fourth important insight or pattern]
- [Fifth important insight or pattern]

### Top 3 Action Items
1. [First action item - be specific and actionable]
2. [Second action item - be specific and actionable]
3. [Third action item - be specific and actionable]

Follow this format exactly. Use markdown formatting and keep it clean and well-structured."""

        # Call OpenAI API
        print("Calling OpenAI API...")
        if not client:
            print("ERROR: OpenAI client not initialized!")
            return jsonify({"error": "OpenAI API not configured"}), 500

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant specializing in semiconductor operations analysis.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        print("OpenAI API call successful!")

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

        input_cost = input_tokens * INPUT_TOKEN_PRICE
        output_cost = output_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost

        print("\n" + "-" * 60)
        print("TOKEN USAGE & COST")
        print("-" * 60)
        print(f"Input tokens:  {input_tokens:,}")
        print(f"Output tokens: {output_tokens:,}")
        print(f"Total tokens:  {total_tokens:,}")
        print(f"\nInput cost:  ${input_cost:.6f}")
        print(f"Output cost: ${output_cost:.6f}")
        print(f"Total cost:  ${total_cost:.6f}")
        print("-" * 60 + "\n")

        analysis = response.choices[0].message.content
        print(f"Analysis received: {len(analysis)} characters")

        # Parse the CSV data for display
        # Replace NaN values with None (null in JSON) to avoid JSON parsing errors
        df_preview = df.head(10).fillna("")
        data_preview = df_preview.to_dict("records")
        print(f"Data preview created: {len(data_preview)} rows")

        result = {
            "success": True,
            "analysis": analysis,
            "data_preview": data_preview,
            "total_rows": len(df),
            "columns": df.columns.tolist(),
        }

        print("SUCCESS! Sending response to frontend")
        print("=" * 60 + "\n")
        return jsonify(result)

    except Exception as e:
        print("\n" + "!" * 60)
        print("EXCEPTION OCCURRED")
        print("!" * 60)
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback

        print("Traceback:")
        traceback.print_exc()
        print("!" * 60 + "\n")
        return jsonify({"error": str(e)}), 500


@app.route("/api/interpret-text", methods=["POST"])
def interpret_text():
    """
    Module 2: Interpret semiconductor work-related text messages
    """
    print("\n" + "=" * 60)
    print("TEXT INTERPRETATION REQUEST RECEIVED")
    print("=" * 60)

    try:
        data = request.get_json()
        print(f"Request data: {data}")

        if not data or "text" not in data:
            print("ERROR: No text provided")
            return jsonify({"error": "No text provided"}), 400

        text = data["text"]
        language = data.get("language", "en")

        if not text.strip():
            print("ERROR: Text is empty")
            return jsonify({"error": "Text is empty"}), 400

        print(f"Text to interpret: {text[:100]}...")
        print(f"Language: {language}")

        # Prepare prompt for AI based on language
        if language == "ko":
            prompt = f"""다음 반도체 작업 관련 텍스트 메시지를 해석하세요. 다음을 제공하세요:

1. 명확하고 간단한 요약
2. 초보자 친화적인 언어로 설명된 주요 포인트
3. 유용한 경우 제안된 후속 조치

텍스트:
{text}

마크다운 형식으로 깔끔하게 구조화된 응답을 제공하세요."""
        else:
            prompt = f"""Interpret the following semiconductor work-related text message. Provide:

1. A clear and simple summary
2. Key points explained in beginner-friendly language
3. Suggested follow-up actions if useful

Text:
{text}

Provide a clean, well-structured response in markdown format."""

        # Call OpenAI API
        print("Calling OpenAI API...")
        if not client:
            print("ERROR: OpenAI client not initialized!")
            return jsonify({"error": "OpenAI API not configured"}), 500

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that interprets semiconductor work messages, focusing on clear communication.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=1000,
            temperature=0.5,
        )
        print("OpenAI API call successful!")

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

        input_cost = input_tokens * INPUT_TOKEN_PRICE
        output_cost = output_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost

        print("\n" + "-" * 60)
        print("TOKEN USAGE & COST")
        print("-" * 60)
        print(f"Input tokens:  {input_tokens:,}")
        print(f"Output tokens: {output_tokens:,}")
        print(f"Total tokens:  {total_tokens:,}")
        print(f"\nInput cost:  ${input_cost:.6f}")
        print(f"Output cost: ${output_cost:.6f}")
        print(f"Total cost:  ${total_cost:.6f}")
        print("-" * 60 + "\n")

        interpretation = response.choices[0].message.content.strip()
        print(f"Interpretation received: {len(interpretation)} characters")

        result = {"success": True, "interpretation": interpretation}

        print("SUCCESS! Sending response to frontend")
        print("=" * 60 + "\n")
        return jsonify(result)

    except Exception as e:
        print("\n" + "!" * 60)
        print("EXCEPTION OCCURRED")
        print("!" * 60)
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback

        print("Traceback:")
        traceback.print_exc()
        print("!" * 60 + "\n")
        return jsonify({"error": str(e)}), 500


@app.route("/api/convert-text", methods=["POST"])
def convert_text():
    """
    Module 2: Convert text to professional email or management update
    """
    print("\n" + "=" * 60)
    print("TEXT CONVERSION REQUEST RECEIVED")
    print("=" * 60)

    try:
        data = request.get_json()
        print(f"Request data: {data}")

        if not data or "text" not in data or "type" not in data:
            print("ERROR: Text and type required")
            return jsonify({"error": "Text and type required"}), 400

        text = data["text"]
        convert_type = data["type"]
        language = data.get("language", "en")

        if convert_type not in ["email", "update"]:
            print(f"ERROR: Invalid conversion type: {convert_type}")
            return jsonify({"error": "Invalid conversion type"}), 400

        print(f"Text to convert: {text[:100]}...")
        print(f"Conversion type: {convert_type}")
        print(f"Language: {language}")

        # Prepare prompt for AI based on language and type
        if language == "ko":
            if convert_type == "email":
                prompt = f"""다음 반도체 작업 관련 텍스트를 전문적인 이메일로 변환하세요.

원본 텍스트:
{text}

전문적인 이메일 형식으로 작성하세요 (제목, 인사말, 본문, 맺음말 포함)."""
            else:  # update
                prompt = f"""다음 반도체 작업 관련 텍스트를 간결한 관리자 친화적인 업데이트로 변환하세요.

원본 텍스트:
{text}

핵심 정보에 초점을 맞춘 간결하고 명확한 업데이트를 작성하세요."""
        else:
            if convert_type == "email":
                prompt = f"""Convert the following semiconductor work-related text into a professional email.

Original text:
{text}

Write it in professional email format (with subject, greeting, body, and closing)."""
            else:  # update
                prompt = f"""Convert the following semiconductor work-related text into a concise manager-friendly update.

Original text:
{text}

Write a brief, clear update focused on key information."""

        # Call OpenAI API
        print("Calling OpenAI API...")
        if not client:
            print("ERROR: OpenAI client not initialized!")
            return jsonify({"error": "OpenAI API not configured"}), 500

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that converts semiconductor messages into professional formats.",
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=1000,
            temperature=0.5,
        )
        print("OpenAI API call successful!")

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

        input_cost = input_tokens * INPUT_TOKEN_PRICE
        output_cost = output_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost

        print("\n" + "-" * 60)
        print("TOKEN USAGE & COST")
        print("-" * 60)
        print(f"Input tokens:  {input_tokens:,}")
        print(f"Output tokens: {output_tokens:,}")
        print(f"Total tokens:  {total_tokens:,}")
        print(f"\nInput cost:  ${input_cost:.6f}")
        print(f"Output cost: ${output_cost:.6f}")
        print(f"Total cost:  ${total_cost:.6f}")
        print("-" * 60 + "\n")

        converted = response.choices[0].message.content.strip()
        print(f"Converted text received: {len(converted)} characters")

        result = {"success": True, "converted": converted}

        print("SUCCESS! Sending response to frontend")
        print("=" * 60 + "\n")
        return jsonify(result)

    except Exception as e:
        print("\n" + "!" * 60)
        print("EXCEPTION OCCURRED")
        print("!" * 60)
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback

        print("Traceback:")
        traceback.print_exc()
        print("!" * 60 + "\n")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("STARTING FLASK BACKEND SERVER")
    print("=" * 60)
    print(f"Running on: http://localhost:5001")
    print(f"Debug mode: True")
    print("=" * 60 + "\n")
    app.run(debug=True, port=5001)
