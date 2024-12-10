from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv
import os
from PIL import Image
from huggingface_hub import InferenceClient, HfApi, login
from transformers import pipeline


app = Flask(__name__)

# Session configuration
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# openai.api_key = os.getenv("OPENAI_API_KEY")
client_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app.secret_key = 'supersecretkey'

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# api = HfApi()
client = InferenceClient(api_key=os.getenv("HUGGING_FACE_KEY"))
#generator = pipeline("text-generation", model="gpt-2")
#notebook_login()
#login(token=os.getenv("HUGGING_FACE_KEY"))

# Home route
@app.route('/')
def home():
    session.clear()
    return render_template('index.html')


# Chat route - handles the conversation with the LLM
@app.route('/chat', methods=['POST'])
def chat():
    if request.json is None:
        return jsonify({'error': 'Invalid JSON input'}), 400

    user_message = request.json['message']
    exercise_type = request.json['exerciseType']
    exercise_count = request.json['exerciseCount']
    rep_goal = request.json['exerciseGoal']
    system_message = f"{exercise_type}; {exercise_count} out of {rep_goal}:"

    if 'conversation' not in session:
        session['conversation'] = []
    
    if len(session['conversation']) <= 1: 
        # Initial Setup
        text_file_path = 'topic_prompts/initial_prompt.txt'
        if not os.path.exists(text_file_path):
            return jsonify({'response': 'Initial prompt file not found.'})

        with open(text_file_path, 'r') as file:
            initial_prompt = file.read()
            
            session['conversation'].append({
                "role": "user",
                "content": initial_prompt + system_message
            })
            # session['conversation'].append({
            #     "role": "assistant",
            #     "content": "Hi I am your personal assistant."
            # })  # Initial user input with system context
    else:
        # Subsequent interactions
        system_message = f"{exercise_type}; {exercise_count} out of {rep_goal}:"
        new_user_input = system_message + " " + user_message
        session['conversation'].append({
            "role": "user",
            "content": new_user_input
        })

    # Calculate quarter milestones
    # quarter_goal = rep_goal / 4
    # milestones = [quarter_goal, 2 * quarter_goal, 3 * quarter_goal, rep_goal]
    # print(f'Quater Goals: {quarter_goal}')
    # print(f'Milestones: {milestones}')

    # if exercise_count in milestones:
    #     progress_message = f"Great job! You've reached {exercise_count} reps out of your goal of {rep_goal}!"
    #     session['conversation'].append({
    #         "role": "assistant",
    #         "content": progress_message
    #     })
    #     return jsonify({'response': progress_message})

    # Prepare Messages for API Call
    messages = session['conversation'].copy()

    print(f'The message before sending to API: {messages}')

    # try:
    stream = client.chat.completions.create(
        model="Qwen/Qwen2.5-Coder-32B-Instruct", 
        messages=messages, 
        max_tokens=500,
        stream=True
    )
    # Other models that worked: microsoft/Phi-3-mini-4k-instruct; Qwen/Qwen2.5-Coder-32B-Instruct; Qwen/QwQ-32B-Preview
    gpt_response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            print(chunk.choices[0].delta.content, end="")
            gpt_response += chunk.choices[0].delta.content

    print(f'GPT response: {gpt_response}')
    session['conversation'].append({"role": "assistant","content": gpt_response})
    print(f"Session so far: {session['conversation']}")
    return jsonify({'response': gpt_response})
    # except Exception as e:
    #     return jsonify({'error': str(e)}), 500

@app.route('/clear_chat_session', methods=['POST'])
def clear_chat_session():
    session.pop('conversation', None)
    return jsonify({'status': 'success'})


# Food recognition route
@app.route('/food_scan', methods=['POST'])
def food_scan():
    print('Fetch food scan.')
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

     Please format the following food recognition response into a consistent JSON format:
    {
        "food_items": [
            {"<food_name>" | <calorie_count> | "<food_category>"}
        ]
    }
    """
    # Get response from Gemini model
    try:   
        response = model.generate_content([input_prompt, image_parts[0]])
        food_data = response.text  # This should contain Gemini's response text
        print(food_data)
        return jsonify({"response": food_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/generate_plan', methods=['POST'])
def generate_plan():
    data = request.json
    if data is None:
        return jsonify({"error": "Invalid JSON input"}), 400
    days = data.get("days", 3)
    weeks = data.get("weeks", 4)
    squat = data.get("squat", 100)
    bench = data.get("bench", 75)
    deadlift = data.get("deadlift", 120)
    accessory = data.get("accessory", 2)
    units = data.get("units", "kilograms")

    # Prepare the system and user messages
    system_message = {
        "role": "system",
        "content": "You are a personal trainer creating workout plans for users based on their input.",
    }
    user_message = {
        "role": "user",
        "content": f"""
        Create a strength training program focusing on back squat, bench press, and deadlift.
        - Number of sessions per week: {days}
        - Duration: {weeks} weeks
        - Back squat 1RM: {squat} {units}
        - Bench press 1RM: {bench} {units}
        - Deadlift 1RM: {deadlift} {units}
        - Accessory exercises per session: {accessory}
        Provide the first week's training plan.
        """
    }

    # try:
    completion = client_openai.chat.completions.create(
    messages=[
        {
            "role": "system",
            "content": system_message["content"],
        },
        {
            "role": "user",
            "content": user_message["content"],
        },
    ],
    model="gpt-3.5-turbo",
    )
    plan = completion.choices[0].message.content
    return jsonify({"plan": plan})
    # except Exception as e:
    #     return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080)
""
