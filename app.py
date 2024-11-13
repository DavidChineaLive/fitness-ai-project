from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
import openai
import google.generativeai as genai
from dotenv import load_dotenv
import os
from PIL import Image

app = Flask(__name__)

# Session configuration
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

openai.api_key = os.getenv("OPENAI_API_KEY")
app.secret_key = 'supersecretkey'

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# Home route
@app.route('/')
def home():
    return render_template('index.html')


# Chat route - handles the conversation with the LLM
@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    exercise_type = request.json['currentExercise']
    exercise_count = request.json['currentCount']

    if 'conversation' not in session:
        session['conversation'] = []

    session['conversation'].append({"role": "user", "content": user_message})

    text_file_path = 'topic_prompts/initial_prompt.txt'
    if not os.path.exists(text_file_path):
        return jsonify({'response': 'Initial prompt file not found.'})

    with open(text_file_path, 'r') as file:
        initial_prompt = file.read()

    system_message = f"The user is doing a workout doing this exercise: {exercise_type}. And at the moment of this response, they are at this rep count for that exercise: {exercise_count} Respond accordingly"
    messages = [{
        "role": "system",
        "content": initial_prompt
    }, {
        "role": "system",
        "content": system_message
    }] + session['conversation']

    try:
        # Make a request to OpenAI API
        response = openai.chat.completions.create(model="gpt-3.5-turbo-1106",
                                                  messages=messages)
        gpt_response = response.choices[0].message.content
        session['conversation'].append({
            "role": "assistant",
            "content": gpt_response
        })
        return jsonify({'response': gpt_response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Food recognition route
@app.route('/food_scan', methods=['POST'])
def food_scan():
    image = request.files['image']
    if not image:
        return jsonify({"error": "No image uploaded"}), 400

    # Prepare image data for Gemini
    image_bytes = image.read()
    image_parts = [{"mime_type": image.mimetype, "data": image_bytes}]

    # Define the food recognition prompt
    input_prompt = """
    Identify different types of food in the image. Provide the food name, approximate calorie count,
    and categorize the food type (e.g., fruits, vegetables, grains, etc.).
    """

    # Get response from Gemini model
    try:
        response = model.generate_content([input_prompt, image_parts[0]])
        food_data = response.text  # This should contain Gemini's response text
        return jsonify({"response": food_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080)
""
