// // Teachable Machine model URL
const URL = "https://teachablemachine.withgoogle.com/models/HykrOUcYG/";
let model, webcam, ctx, labelContainer, maxPredictions;
let currentExercise = "";
let currentPage = 'home';

// Navigation functions to switch pages
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`${page}-page`).classList.remove('hidden');
    currentPage = page;
}

// Theme toggle for dark/light mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
}

function addCalorie() {
    const meal = document.getElementById('meal-input').value;
    const calories = document.getElementById('calories-input').value;
    if (meal && calories) {
        const table = document.getElementById('calorie-table');
        const row = table.insertRow();
        const mealCell = row.insertCell(0);
        const calorieCell = row.insertCell(1);
        const actionCell = row.insertCell(2);
        mealCell.innerHTML = meal;
        calorieCell.innerHTML = calories;
        actionCell.innerHTML = `<button onclick="deleteRow(this)">Delete</button>`;
    }
}

function deleteRow(button) {
    button.parentElement.parentElement.remove();
}

function clearTable() {
    const table = document.getElementById('calorie-table');
    table.innerHTML = `<tr><th>Meal</th><th>Calories</th><th>Actions</th></tr>`;
}


// Initialize webcam and model
async function init() {
    const workoutType = currentPage === 'weights' ? 'Weights Workout' : 'Bodyweight Workout';
    document.getElementById('workout-type').textContent = workoutType;
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Setup webcam
    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Setup label container
    const canvas = document.getElementById("canvas");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

// Main prediction loop
async function loop() {
    
    webcam.update();
     predict();
    window.requestAnimationFrame(loop);
}

// Predict function
async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
        if (prediction[i].probability > 0.5) {
            currentExercise = prediction[i].className;
        }
    }
     drawPose(pose);
    
}

function drawPose(pose) {
    
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}

// Send message function
function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (userInput.trim() === "") return;

    addMessageToChat(userInput, 'user');

    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: userInput,
            exerciseType: currentExercise
        }),
    })
    .then(response => response.json())
    .then(data => {
        addMessageToChat(data.response, 'bot');
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    document.getElementById("user-input").value = "";
}

// Add message to chat
function addMessageToChat(message, sender) {
    const chatContainer = document.getElementById("chat-container");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", sender + "-message");
    messageElement.textContent = message;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
