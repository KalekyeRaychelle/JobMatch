import openai
from flask import Flask, request, jsonify
import PyPDF2
import os
from dotenv import load_dotenv
from flask_cors import CORS
import logging
import json
import re
import requests  # Added for URL validation

app = Flask(__name__)
CORS(app)

load_dotenv()

openai.api_key = os.getenv('OPENAI_API_KEY')

logging.basicConfig(filename='app.log', level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# URL validation function
def is_valid_url(url):
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except requests.RequestException:
        return False

@app.route('/get-questions', methods=['POST'])
def generate_questions():
    data = request.json
    job_description = data.get('job_description')

    if not job_description:
        return jsonify({'error': 'Missing job description'}), 400

    prompt = f"Based on the following job description, generate 10 common interview questions and their answers in the format Q: ... A: ...\n\n{job_description}"

    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    answer_text = response['choices'][0]['message']['content']

    qa_pairs = []
    lines = answer_text.split('\n')
    current_q = ''
    current_a = ''
    for line in lines:
        if line.strip().startswith("Q:"):
            if current_q and current_a:
                qa_pairs.append({'question': current_q, 'answer': current_a})
            current_q = line.strip()[2:].strip()
            current_a = ''
        elif line.strip().startswith("A:"):
            current_a = line.strip()[2:].strip()
        else:
            current_a += ' ' + line.strip()

    if current_q and current_a:
        qa_pairs.append({'question': current_q, 'answer': current_a})

    return jsonify({'questions': qa_pairs})

@app.route('/Ask', methods=['POST'])
def Ask():
    try:
        data = request.get_json()
        question = data.get('question')

        if not question:
            return jsonify({"error": "No question provided"}), 400

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  
            messages=[{"role": "user", "content": question}],
            max_tokens=150
        )

        answer = response['choices'][0]['message']['content'].strip()
        logger.debug(f"Received question: {question}")
        logger.debug(f"OpenAI response: {answer}")

        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_text_from_pdf(pdf_file):
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
        logger.info('PDF text extraction successful')
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        raise

def compare_with_gpt_for_non_immediate_interview(job_description, cv_text):
    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"""
Job Description: {job_description}

CV Content: {cv_text}

Analyze the match between the job description and the CV. Return a JSON object with the following keys:

- "match_percentage": Number (e.g., 70)
- "similarities": List of matching skills/qualifications
- "missing": List of skills/requirements missing from the CV
- "course_recommendations": A list of objects. Each object should have:
    - "name": a short course title related to a missing skill
    - "url": a direct link to one relevant course online 

{{

}}"""
    }
        ]

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )

        feedback_raw = response['choices'][0]['message']['content'].strip()

        match = re.search(r"\{.*\}", feedback_raw, re.DOTALL)
        if match:
            feedback_clean = match.group(0)
            feedback = json.loads(feedback_clean)
        else:
            logger.error("No JSON object found in GPT response.")
            raise ValueError("Invalid response format from GPT")

        # Validate course URLs
        valid_courses = []
        for course in feedback.get('course_recommendations', []):
            if is_valid_url(course['url']):
                valid_courses.append(course)

        feedback['course_recommendations'] = valid_courses

        logger.info(f"Processed feedback: {json.dumps(feedback, indent=2)}")
        return feedback
    except Exception as e:
        logger.error(f"Error in GPT-3 API request: {e}")
        raise

@app.route('/analyze', methods=['POST'])
def analyze():
    job_description = request.form.get('job_description')
    file = request.files.get('cv')

    if not job_description or not file:
        logger.error('Missing data: Job description or CV not provided')
        return jsonify({'error': 'Missing data'}), 400

    try:
        cv_text = extract_text_from_pdf(file)
    except Exception as e:
        logger.error(f"Error processing CV: {e}")
        return jsonify({'error': f"Error processing CV: {str(e)}"}), 500

    try:
        feedback = compare_with_gpt_for_non_immediate_interview(job_description, cv_text)

        return jsonify({'feedback': feedback}), 200
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        return jsonify({'error': f"Error during analysis: {str(e)}"}), 500
    
@app.route('/analyzeManyCvs', methods=['POST'])
def analyze_many_cvs():
    job_description = request.form.get('jobDescription')
    files = request.files.getlist('cvs') 

    if not job_description or not files:
        logger.error('Missing data: Job description or CVs not provided')
        return jsonify({'error': 'Missing data'}), 400

    results = []

    for file in files:
        try:
            cv_text = extract_text_from_pdf(file)
            feedback = compare_with_gpt_for_non_immediate_interview(job_description, cv_text)
            results.append({
                'filename': file.filename,
                'feedback': feedback
            })
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {e}")
            results.append({
                'filename': file.filename,
                'error': str(e)
            })

    return jsonify({'results': results}), 200

@app.route('/analyzeManyCvsTable', methods=['POST'])
def analyze_many_cvs_table():
    job_description = request.form.get('jobDescription')
    files = request.files.getlist('cvs')

    if not job_description or not files:
        logger.error('Missing data: Job description or CVs not provided')
        return jsonify({'error': 'Missing data'}), 400

    table_data = []

    for file in files:
        try:
            cv_text = extract_text_from_pdf(file)
            feedback = compare_with_gpt_for_non_immediate_interview(job_description, cv_text)
            
            table_data.append({
                'cv_name': file.filename,
                'match_percent': f"{feedback.get('match_percentage', 0)}%",
                'similarity_items': ', '.join(feedback.get('similarities', [])),
                'missing_items': ', '.join(feedback.get('missing', []))
            })
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {e}")
            table_data.append({
                'cv_name': file.filename,
                'match_percent': 'Error',
                'similarity_items': '',
                'missing_items': '',
                'error': str(e)
            })

    return jsonify({'table_data': table_data}), 200

if __name__ == '__main__':
    app.run(debug=True)
