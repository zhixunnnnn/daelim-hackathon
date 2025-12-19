import io
import json
import logging
import os
import re
import sys
from difflib import SequenceMatcher

import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    logger.info("OpenAI API key loaded successfully")
    client = OpenAI(api_key=api_key)
else:
    logger.error("OpenAI API key not found in environment variables")
    client = None

# Token pricing for gpt-4o-mini (as of 2024)
# https://openai.com/api/pricing/
INPUT_TOKEN_PRICE = 0.150 / 1_000_000  # $0.150 per 1M input tokens
OUTPUT_TOKEN_PRICE = 0.600 / 1_000_000  # $0.600 per 1M output tokens


@app.route("/api/analyze", methods=["POST"])
def analyze_image():
    """
    Module 3: Analyze an image using OpenAI Vision API
    """
    logger.info("Image analysis request received")

    try:
        data = request.get_json()
        if not data or "image" not in data:
            logger.warning("No image provided in request")
            return jsonify({"error": "No image provided"}), 400

        image_base64 = data["image"]
        language = data.get("language", "en")
        logger.info(f"Processing image analysis request (language: {language})")

        # Prepare prompt based on language
        if language == "ko":
            prompt = """당신은 AstraSemi Corporation의 반도체 제조 및 운영을 위한 전문 AI 어시스턴트입니다.

다음 이미지를 선임 엔지니어 수준의 세부 사항과 전문성으로 분석하세요.
이미지가 반도체 제조, 장비, 웨이퍼, 칩 또는 공정 이상과 관련이 있는 경우 다음을 제공하세요:

### 요약
- 이미지에 표시된 내용에 대한 간결하고 명확한 요약 (2-3문장)

### 주요 관찰사항
- 이미지에서 주목할 만한 최대 5개의 중요한 관찰사항, 패턴 또는 이상 현상을 나열하세요

### 실행 가능한 권장사항
1. 관찰한 내용을 기반으로 구체적이고 실행 가능한 다음 단계 또는 확인 사항을 최대 3개 제안하세요

이미지가 반도체와 관련이 없는 경우 일반적인 설명을 제공하고 제조와 관련이 없다고 명시하세요.
깔끔하고 잘 구조화된 마크다운 형식으로 응답하세요."""
        else:
            prompt = """You are an expert AI assistant for semiconductor manufacturing and operations at AstraSemi Corporation.

Analyze the following image with the same level of detail and professionalism as a senior engineer.
If the image is related to semiconductor manufacturing, equipment, wafers, chips, or process anomalies, provide:

### Summary
- A concise, clear summary of what is shown in the image (2-3 sentences)

### Key Observations
- List up to 5 important observations, patterns, or anomalies you notice in the image

### Actionable Recommendations
1. Suggest up to 3 specific, actionable next steps or checks based on what you see

If the image is not related to semiconductors, provide a general description and note that it is not relevant to manufacturing.
Respond in clean, well-structured markdown format."""

        # Call OpenAI Vision API
        if not client:
            logger.error("OpenAI client not initialized")
            return jsonify({"error": "OpenAI API not configured"}), 500

        logger.info("Calling OpenAI Vision API")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert AI assistant specializing in semiconductor manufacturing and equipment analysis.",
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_base64}},
                    ],
                },
            ],
            max_tokens=1000,
            temperature=0.7,
        )

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

        input_cost = input_tokens * INPUT_TOKEN_PRICE
        output_cost = output_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost

        logger.info(
            f"Token usage - Input: {input_tokens:,}, Output: {output_tokens:,}, "
            f"Total: {total_tokens:,}, Cost: ${total_cost:.6f}"
        )

        analysis = response.choices[0].message.content.strip()
        logger.info(f"Image analysis completed successfully ({len(analysis)} characters)")

        return jsonify({"success": True, "analysis": analysis})

    except Exception as e:
        logger.error(f"Error in image analysis: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while analyzing the image"}), 500


@app.route("/api/hello", methods=["GET"])
def hello():
    logger.debug("Health check endpoint called")
    return jsonify({"message": "Hello from Python backend!", "status": "success"})


@app.route("/api/data", methods=["GET"])
def get_data():
    logger.debug("Data endpoint called")
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
    logger.info("CSV analysis request received")

    try:
        if "file" not in request.files:
            logger.warning("No file provided in request")
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            logger.warning("Empty filename provided")
            return jsonify({"error": "No file selected"}), 400

        if not file.filename.endswith(".csv"):
            logger.warning(f"Invalid file type: {file.filename}")
            return jsonify({"error": "File must be a CSV"}), 400

        # Get language from request
        language = request.form.get("language", "en")
        logger.info(f"Processing CSV file: {file.filename} (language: {language})")

        # Read CSV file
        csv_content = file.read().decode("utf-8")
        logger.debug(f"CSV content length: {len(csv_content)} bytes")

        # Parse CSV with pandas
        df = pd.read_csv(io.StringIO(csv_content))
        logger.info(f"CSV parsed successfully - Rows: {len(df)}, Columns: {len(df.columns)}")

        # Convert DataFrame to string representation
        csv_preview = df.head(20).to_string(index=False)
        csv_stats = f"Total rows: {len(df)}, Total columns: {len(df.columns)}\nColumns: {', '.join(df.columns.tolist())}"

        # Create prompt for OpenAI based on language
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
        if not client:
            logger.error("OpenAI client not initialized")
            return jsonify({"error": "OpenAI API not configured"}), 500

        logger.info("Calling OpenAI API for CSV analysis")
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

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

        input_cost = input_tokens * INPUT_TOKEN_PRICE
        output_cost = output_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost

        logger.info(
            f"Token usage - Input: {input_tokens:,}, Output: {output_tokens:,}, "
            f"Total: {total_tokens:,}, Cost: ${total_cost:.6f}"
        )

        analysis = response.choices[0].message.content

        # Parse the CSV data for display
        df_preview = df.head(10).fillna("")
        data_preview = df_preview.to_dict("records")

        logger.info(f"CSV analysis completed successfully ({len(analysis)} characters)")

        return jsonify({
            "success": True,
            "analysis": analysis,
            "data_preview": data_preview,
            "total_rows": len(df),
            "columns": df.columns.tolist(),
        })

    except Exception as e:
        logger.error(f"Error in CSV analysis: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while analyzing the CSV file"}), 500


@app.route("/api/interpret-text", methods=["POST"])
def interpret_text():
    """
    Module 2: Interpret semiconductor work-related text messages
    """
    logger.info("Text interpretation request received")

    try:
        data = request.get_json()
        if not data or "text" not in data:
            logger.warning("No text provided in request")
            return jsonify({"error": "No text provided"}), 400

        text = data["text"]
        language = data.get("language", "en")

        if not text.strip():
            logger.warning("Empty text provided")
            return jsonify({"error": "Text is empty"}), 400

        logger.info(f"Processing text interpretation (language: {language}, length: {len(text)})")

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
        if not client:
            logger.error("OpenAI client not initialized")
            return jsonify({"error": "OpenAI API not configured"}), 500

        logger.info("Calling OpenAI API for text interpretation")
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

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

        input_cost = input_tokens * INPUT_TOKEN_PRICE
        output_cost = output_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost

        logger.info(
            f"Token usage - Input: {input_tokens:,}, Output: {output_tokens:,}, "
            f"Total: {total_tokens:,}, Cost: ${total_cost:.6f}"
        )

        interpretation = response.choices[0].message.content.strip()
        logger.info(f"Text interpretation completed successfully ({len(interpretation)} characters)")

        return jsonify({"success": True, "interpretation": interpretation})

    except Exception as e:
        logger.error(f"Error in text interpretation: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while interpreting the text"}), 500


@app.route("/api/convert-text", methods=["POST"])
def convert_text():
    """
    Module 2: Convert text to professional email or management update
    """
    logger.info("Text conversion request received")

    try:
        data = request.get_json()
        if not data or "text" not in data or "type" not in data:
            logger.warning("Text and type required but not provided")
            return jsonify({"error": "Text and type required"}), 400

        text = data["text"]
        convert_type = data["type"]
        language = data.get("language", "en")

        if convert_type not in ["email", "update"]:
            logger.warning(f"Invalid conversion type: {convert_type}")
            return jsonify({"error": "Invalid conversion type"}), 400

        logger.info(f"Processing text conversion (type: {convert_type}, language: {language}, length: {len(text)})")

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
        if not client:
            logger.error("OpenAI client not initialized")
            return jsonify({"error": "OpenAI API not configured"}), 500

        logger.info("Calling OpenAI API for text conversion")
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

        # Extract token usage and calculate cost
        usage = response.usage
        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

        input_cost = input_tokens * INPUT_TOKEN_PRICE
        output_cost = output_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost

        logger.info(
            f"Token usage - Input: {input_tokens:,}, Output: {output_tokens:,}, "
            f"Total: {total_tokens:,}, Cost: ${total_cost:.6f}"
        )

        converted = response.choices[0].message.content.strip()
        logger.info(f"Text conversion completed successfully ({len(converted)} characters)")

        return jsonify({"success": True, "converted": converted})

    except Exception as e:
        logger.error(f"Error in text conversion: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while converting the text"}), 500


# ============================================================================
# MODULE 4: GLOSSARY ENDPOINTS
# ============================================================================

# Load glossary data
GLOSSARY_DATA = None
GLOSSARY_FILE = os.path.join(os.path.dirname(__file__), "data", "glossary_terms.json")

try:
    with open(GLOSSARY_FILE, "r", encoding="utf-8") as f:
        GLOSSARY_DATA = json.load(f)
    logger.info(f"Loaded {len(GLOSSARY_DATA['terms'])} glossary terms")
except Exception as e:
    logger.error(f"Error loading glossary data: {e}")
    GLOSSARY_DATA = {"terms": [], "categories": []}


def fuzzy_match_score(query, text):
    """Calculate fuzzy match score between query and text"""
    query_lower = query.lower()
    text_lower = text.lower()
    
    # Exact match
    if query_lower == text_lower:
        return 1.0
    
    # Starts with
    if text_lower.startswith(query_lower):
        return 0.9
    
    # Contains
    if query_lower in text_lower:
        return 0.7
    
    # Use SequenceMatcher for fuzzy matching
    return SequenceMatcher(None, query_lower, text_lower).ratio()


@app.route("/api/glossary/search", methods=["GET"])
def search_glossary():
    """
    Module 4: Search glossary terms with fuzzy matching
    Query params: q (search query), category (optional filter)
    """
    try:
        query = request.args.get("q", "").strip()
        category = request.args.get("category", "").strip()
        
        logger.debug(f"Glossary search - Query: '{query}', Category: '{category if category else 'None'}'")
        
        if not GLOSSARY_DATA or not GLOSSARY_DATA["terms"]:
            logger.error("Glossary data not available")
            return jsonify({"error": "Glossary data not available"}), 500
        
        # If no query, return all terms (optionally filtered by category)
        if not query:
            filtered_terms = GLOSSARY_DATA["terms"]
            if category:
                filtered_terms = [t for t in filtered_terms if t["category"] == category]
            logger.debug(f"No query - returning {len(filtered_terms)} terms")
            return jsonify({
                "success": True,
                "terms": filtered_terms,
                "categories": GLOSSARY_DATA["categories"]
            })
        
        # Search with fuzzy matching
        results = []
        for term in GLOSSARY_DATA["terms"]:
            # Skip if category filter doesn't match
            if category and term["category"] != category:
                continue
            
            # Calculate match scores for different fields
            term_score = fuzzy_match_score(query, term["term"])
            def_score = fuzzy_match_score(query, term["shortDefinition"]) * 0.7
            detail_score = fuzzy_match_score(query, term["detailedDefinition"]) * 0.5
            
            # Take the highest score
            max_score = max(term_score, def_score, detail_score)
            
            if max_score > 0.3:  # Threshold for inclusion
                results.append({
                    **term,
                    "matchScore": max_score
                })
        
        # Sort by match score
        results.sort(key=lambda x: x["matchScore"], reverse=True)
        
        # Limit to top 20 results
        results = results[:20]
        
        logger.info(f"Glossary search found {len(results)} matching terms")
        
        return jsonify({
            "success": True,
            "terms": results,
            "categories": GLOSSARY_DATA["categories"]
        })
        
    except Exception as e:
        logger.error(f"Error in glossary search: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while searching the glossary"}), 500


@app.route("/api/glossary/term/<term_id>", methods=["GET"])
def get_term(term_id):
    """
    Module 4: Get detailed information about a specific term
    """
    try:
        if not GLOSSARY_DATA or not GLOSSARY_DATA["terms"]:
            logger.error("Glossary data not available")
            return jsonify({"error": "Glossary data not available"}), 500
        
        # Find the term
        term = next((t for t in GLOSSARY_DATA["terms"] if t["id"] == term_id), None)
        
        if not term:
            logger.warning(f"Term not found: {term_id}")
            return jsonify({"error": "Term not found"}), 404
        
        logger.debug(f"Found term: {term['term']}")
        return jsonify({"success": True, "term": term})
        
    except Exception as e:
        logger.error(f"Error getting term: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while retrieving the term"}), 500


@app.route("/api/glossary/ai-explain", methods=["POST"])
def ai_explain_term():
    """
    Module 4: Get AI-enhanced explanation of a term
    Body: { term: string, context: string, language: string }
    """
    try:
        data = request.get_json()
        term = data.get("term", "")
        context = data.get("context", "")
        language = data.get("language", "en")
        
        if not term:
            logger.warning("No term provided for AI explanation")
            return jsonify({"error": "No term provided"}), 400
        
        if not client:
            logger.error("OpenAI client not initialized")
            return jsonify({"error": "OpenAI API not configured"}), 500
        
        logger.info(f"AI explain request - Term: {term}, Language: {language}")
        
        # Prepare prompt based on language
        if language == "ko":
            system_prompt = """당신은 반도체 산업 분야의 전문가입니다. 복잡한 반도체 개념을 명확하고 실용적인 통찰력으로 설명하는 것을 전문으로 합니다."""
            user_prompt = f"""'{term}' 용어에 대해 더 자세히 설명해주세요.

배경: {context}

다음을 포함하여 포괄적인 설명을 제공하세요:
- 상세한 기술 설명
- 반도체 제조에서의 실제 응용
- 일반적인 과제 및 고려사항
- 업계 모범 사례
- 구체적인 예시 또는 비유

명확하고 잘 구조화된 마크다운 형식으로 작성하세요."""
        else:
            system_prompt = """You are an expert in semiconductor industry. You specialize in explaining complex semiconductor concepts with clarity and practical insights."""
            user_prompt = f"""Explain the term '{term}' in more detail.

Context: {context}

Provide a comprehensive explanation including:
- Detailed technical description
- Real-world applications in semiconductor manufacturing
- Common challenges and considerations
- Industry best practices
- Specific examples or analogies

Write in clear, well-structured markdown format."""
        
        logger.info("Calling OpenAI for AI explanation")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        explanation = response.choices[0].message.content.strip()
        
        # Track token usage
        usage = response.usage
        input_cost = usage.prompt_tokens * INPUT_TOKEN_PRICE
        output_cost = usage.completion_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost
        
        logger.info(
            f"AI explanation completed - Tokens: {usage.prompt_tokens} + {usage.completion_tokens}, "
            f"Cost: ${total_cost:.6f}"
        )
        
        return jsonify({
            "success": True,
            "explanation": explanation,
            "tokenUsage": {
                "inputTokens": usage.prompt_tokens,
                "outputTokens": usage.completion_tokens,
                "totalCost": total_cost
            }
        })

    except Exception as e:
        logger.error(f"Error in AI explain: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while generating AI explanation"}), 500


@app.route("/api/glossary/related-terms", methods=["POST"])
def get_related_terms():
    """
    Module 4: Get AI-suggested related terms
    Body: { term: string, language: string }
    """
    try:
        data = request.get_json()
        term = data.get("term", "")
        language = data.get("language", "en")
        
        if not term:
            logger.warning("No term provided for related terms")
            return jsonify({"error": "No term provided"}), 400
        
        if not client:
            logger.error("OpenAI client not initialized")
            return jsonify({"error": "OpenAI API not configured"}), 500
        
        logger.info(f"Related terms request - Term: {term}, Language: {language}")
        
        # Get list of available term IDs for validation
        available_term_ids = [t["id"] for t in GLOSSARY_DATA["terms"]]
        available_terms = [t["term"] for t in GLOSSARY_DATA["terms"]]
        
        # Prepare prompt based on language
        if language == "ko":
            system_prompt = """당신은 반도체 산업 전문가입니다. 관련 용어와 개념을 식별하는 데 능숙합니다."""
            user_prompt = f"""반도체 용어 '{term}'과 관련된 5-7개의 관련 용어를 제안하세요.

사용 가능한 용어: {", ".join(available_terms[:50])}... (및 기타)

각 관련 용어에 대해 다음 형식으로 JSON 배열을 제공하세요:
[
  {{"termId": "term-id", "reason": "이 용어와 관련이 있는 이유 (1문장)"}}
]

응답은 유효한 JSON만 작성하세요."""
        else:
            system_prompt = """You are a semiconductor industry expert. You excel at identifying related terms and concepts."""
            user_prompt = f"""Suggest 5-7 related terms for the semiconductor term '{term}'.

Available terms: {", ".join(available_terms[:50])}... (and more)

For each related term, provide a JSON array in this format:
[
  {{"termId": "term-id", "reason": "Why this is related (1 sentence)"}}
]

Respond with valid JSON only."""
        
        logger.info("Calling OpenAI for related terms")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        content = response.choices[0].message.content.strip()
        
        # Parse JSON response
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = re.sub(r"```json\n?|```\n?", "", content)
        
        related = json.loads(content)
        
        # Validate and filter term IDs
        valid_related = []
        for item in related:
            term_id = item.get("termId", "")
            if term_id in available_term_ids:
                valid_related.append(item)
        
        logger.info(f"Found {len(valid_related)} valid related terms")
        
        # Track token usage
        usage = response.usage
        input_cost = usage.prompt_tokens * INPUT_TOKEN_PRICE
        output_cost = usage.completion_tokens * OUTPUT_TOKEN_PRICE
        total_cost = input_cost + output_cost
        
        logger.info(
            f"Related terms completed - Tokens: {usage.prompt_tokens} + {usage.completion_tokens}, "
            f"Cost: ${total_cost:.6f}"
        )
        
        return jsonify({
            "success": True,
            "relatedTerms": valid_related,
            "tokenUsage": {
                "inputTokens": usage.prompt_tokens,
                "outputTokens": usage.completion_tokens,
                "totalCost": total_cost
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting related terms: {str(e)}", exc_info=True)
        return jsonify({"error": "An error occurred while retrieving related terms"}), 500


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Starting Flask backend server")
    logger.info(f"Running on: http://localhost:5001")
    logger.info("=" * 60)
    app.run(debug=True, port=5001)
