# AI Fitness Coach
AI Fitness Coach is an interactive web application that combines the power of AI to enhance your fitness journey. It provides workout guidance, tracks calorie intake, and uses AI models to deliver feedback on form and food recognition.

# Features
1. AI-Powered Chat
  - GPT Integration: Engage in a conversation with an AI that adapts its responses based on your current workout type and repetition count.
2. Pose Detection for Exercise Tracking
  - TensorFlow MoveNet: Detects and tracks body movements during exercises like squats, push-ups, and more, providing real-time rep counting.
3. Calorie Tracker
  - Manual Input: Add and track your meals with calorie counts.
  - Food Recognition: Upload images of your food, and the app identifies the food items, provides calorie estimates, and categorizes them.
4. Dynamic UI
  - Dark/light mode toggle for better usability.
  - Multi-page navigation for workout tracking, calorie management, and food scanning.



# Tech Stack
## Backend
  - Framework: Flask
  - APIs:
    - OpenAI GPT for chat interactions.
    - Google Generative AI (Gemini) for food image analysis.
  - Session Management: Flask-Session for state persistence.
## Frontend
  - HTML/CSS/JavaScript: Interactive UI for seamless navigation and experience.
  - TensorFlow.js: Real-time pose estimation and workout tracking.



# Installation
  - API Keys:
  - OpenAI API key
  - Google Generative AI API key



# Steps
1. Clone the repository:
```
git clone https://github.com/your-repo/ai-fitness-coach.git
cd ai-fitness-coach
```

2. Install backend dependencies.

3. Set up environment variables:
- Create a .env file:
```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
```
4. Run the server:
```
python app.py
```

# Usage
## Starting a Workout
1. Navigate to the homepage.
2. Select a workout type (weights or bodyweight).
3. Choose an exercise and begin the workout with real-time tracking.
## Calorie Tracker
1. Input meal details or upload an image for AI analysis.
2. View results in the calorie table and track your total intake.
## Chat with the AI
1. Open the chat interface.
2. Ask questions or request exercise tips.

