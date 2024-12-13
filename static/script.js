let bodyTracker, video, ctx, labelContainer;
let currentExercise = "";
let currentPage = 'home';
let currentCount = 0;
let repGoal = 20;
let squatCount = 0;
let pushupCount = 0;
let pullupCount = 0;
let curlCount = 0; 
let shoulderPressCount =0;
let deadliftCount = 0; 
let totalCalories = 0;
let isSquatting = false; // For squat detection
let isDoingPushup = false; // For push-up detection
let isDoingPullup = false; // For pull-up detection
let isDoingCurl = false; // For bench detection 
let isDoingShoulderPress = false; // For shoulder press detection
let isDoingDeadlift = false; // For deadlift detection 


async function init() {
    const workoutType = currentPage === 'weights' ? 'Weights Workout' : 'Bodyweight Workout';
    document.getElementById('workout-type').textContent = workoutType;

    // Load MoveNet Model
    const model = poseDetection.SupportedModels.MoveNet;
    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING, // Use Thunder variant for accuracy
        enableSmoothing: true,
        minPoseScore: 0.5 // Set a minimum pose score for confidence
    };
    detector = await poseDetection.createDetector(model, detectorConfig);

    // Setup Webcam
    const video = document.createElement("video");
    video.setAttribute("playsinline", "true");
    video.width = 640;
    video.height = 480;
    document.getElementById('webcam-container').appendChild(video);

    webcam = await setupWebcam(video);
    video.play();
    
    // Setup Canvas for drawing
    const canvas = document.getElementById("canvas");
    canvas.width = video.width;
    canvas.height = video.height;
    ctx = canvas.getContext("2d");

    labelContainer = document.getElementById("label-container");
    window.requestAnimationFrame(loop);
}

async function setupWebcam(video) {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({
            video: true
        }).then((stream) => {
            video.srcObject = stream;
            video.onloadedmetadata = () => resolve(video);
        }).catch(reject);
    });
}

// Main loop
async function loop() {
    const poses = await detector.estimatePoses(webcam);

    if (poses && poses.length > 0) {
        drawPose(poses[0]);
        switch (currentExercise) {
            case 'Squats':
                detectSquat(poses[0]);
                break;
            case 'Push-ups':
                detectPushup(poses[0]); 
                break;
            case 'Pull-ups':
                detectPullup(poses[0]); 
                break;
            case 'Curls':
                detectCurl(poses[0]);
                break;
            case 'Shoulder Press':
                detectShoulderPress(poses[0]); 
                break;
            case 'Deadlift':
                detectDeadlift(poses[0]); 
                break;
        }
    }

    window.requestAnimationFrame(loop);
}

function detectSquat(pose) {
    const keypoints = pose.keypoints;

    // Check if keypoints are available and have high confidence
    if (keypoints && keypoints[11].score > 0.5 && keypoints[12].score > 0.5 && 
        keypoints[13].score > 0.5 && keypoints[14].score > 0.5 && 
        keypoints[15].score > 0.5 && keypoints[16].score > 0.5) {
        const leftHip = keypoints[11]; // Left hip
        const rightHip = keypoints[12]; // Right hip
        const leftKnee = keypoints[13]; // Left knee
        const rightKnee = keypoints[14]; // Right knee
        const leftAnkle = keypoints[15]; // Left ankle
        const rightAnkle = keypoints[16]; // Right ankle

        // Calculate angles for both legs
        const leftAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
        const rightAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
        
        
        // Check if the user is in a squat position
        if (leftAngle < 120 || rightAngle < 120){//knee.y < hip.y && knee.y < ankle.y) {
            // User is squatting
            console.log(`User is squatting`);
            if (!isSquatting) {
                isSquatting = true; // Set the state to squatting
            }
        } else {
            console.log(`User is not squatting`);
            // User is not squatting
            if (isSquatting) {
                squatCount++; // Increment the squat count
                currentCount = squatCount;
                isSquatting = false; // Reset the state
                console.log(`Squat Count: ${squatCount}`);
                document.getElementById('rep-count').textContent = `Squat Count: ${currentCount}`;

                // Check for quarter milestones
                if (currentCount % (repGoal / 4) === 0) {
                    sendProgressMessage(currentCount);
                }
            }
        }
    }
}

function detectPushup(pose) {
    const keypoints = pose.keypoints;

    // Check if keypoints are available and have high confidence
    if (keypoints && keypoints[5].score > 0.5 && keypoints[6].score > 0.5 && 
        keypoints[7].score > 0.5 && keypoints[8].score > 0.5){ 
        
        const leftShoulder = keypoints[5]; 
        const rightShoulder = keypoints[6]; 
        const leftElbow = keypoints[7]; 
        const rightElbow = keypoints[8]; 
        

        // Calculate the angle at the elbows
        const leftElbowAngle = calculateTwoPointAngle(leftShoulder, leftElbow);
        const rightElbowAngle = calculateTwoPointAngle(rightShoulder, rightElbow);

        // Check if the user is in a push-up position
        const isInPushupPosition = (leftElbowAngle < 45 || rightElbowAngle < 45); 

        if (isInPushupPosition) {
            // User is in the lowering phase of the push-up
            console.log(`User is doing a push up`);
            console.log(`Left: ${leftElbowAngle}, Right: ${rightElbowAngle}`);
            if (!isDoingPushup) {
                isDoingPushup = true; 
            }
        } else {
            // User is not in the push-up position
            if (isDoingPushup) {
                pushupCount++; 
                currentCount = pushupCount;
                isDoingPushup = false; 
                console.log(`Push-up Count: ${pushupCount}`); 
                document.getElementById('rep-count').textContent = `Push-up Count: ${currentCount}`;

                // Check for quarter milestones
                if (currentCount % (repGoal / 4) === 0) {
                    sendProgressMessage(currentCount);
                }
            }
        }
    }
}

function detectPullup(pose) {
    const keypoints = pose.keypoints;

    // Check if keypoints are available and have high confidence
    if (keypoints && keypoints[5].score > 0.5 && keypoints[6].score > 0.5 && 
        keypoints[7].score > 0.5 && keypoints[8].score > 0.5){ 
        //console.log(`In pull-up detection mode.`);
        const leftShoulder = keypoints[5]; 
        const rightShoulder = keypoints[6]; 
        const leftElbow = keypoints[7]; 
        const rightElbow = keypoints[8]; 
        const leftWrist = keypoints[9]; // Left wrist
        const rightWrist = keypoints[10]; // Right wrist
        

        // Calculate the angle at the elbows
        const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
        const isInPullupPosition = (leftElbow.y < leftShoulder.y || rightElbow.y < rightShoulder.y); 
       
        if (isInPullupPosition){
            // User is in the lowering phase of the pull-up
            console.log(`User is doing a pull up`);
            if (!isDoingPullup) {
                isDoingPullup = true; 
            }
        } else {
            // User is not in the pull-up position
            if (isDoingPullup) {
                pullupCount++; 
                currentCount = pullupCount;
                isDoingPullup = false; 
                console.log(`Pull-up Count: ${pullupCount}`); 
                document.getElementById('rep-count').textContent = `Pull-up Count: ${currentCount}`;

                // Check for quarter milestones
                if (currentCount % (repGoal / 4) === 0) {
                    sendProgressMessage(currentCount);
                }
            }
        }
    }
}

function detectDeadlift(pose){
    const keypoints = pose.keypoints;

    // Check if keypoints are available and have high confidence
    if (keypoints && keypoints[9].score > 0.5 && keypoints[10].score > 0.5 && 
        keypoints[13].score > 0.5 && keypoints[14].score > 0.5){ 
        
        const leftWrist = keypoints[9]; // Left wrist
        const rightWrist = keypoints[10]; // Right wrist
        const leftKnee = keypoints[13]; // Left knee
        const rightKnee = keypoints[14]; // Right knee

        // Check if the user is in a deadlift position
        const isInDeadliftPosition = (leftWrist.y > leftKnee.y || rightWrist.y > rightKnee.y); 
        
        if (isInDeadliftPosition) {
            // User is in the lowering phase of the deadlift
            console.log(`User is doing a deadlift`);
            if (!isDoingDeadlift) {
                isDoingDeadlift = true; 
            }
        } else {
            // User is not in the deadlift position
            if (isDoingDeadlift) {
                deadliftCount++; 
                currentCount = deadliftCount;
                isDoingDeadlift = false; 
                console.log(`Deadlift Count: ${deadliftCount}`); 
                document.getElementById('rep-count').textContent = `Deadlift Count: ${currentCount}`;

                // Check for quarter milestones
                if (currentCount % (repGoal / 4) === 0) {
                    sendProgressMessage(currentCount);
                }
            }
        }
    }
}

function detectShoulderPress(pose) {
    const keypoints = pose.keypoints;

    // Check if keypoints are available and have high confidence
    if (keypoints && keypoints[5].score > 0.5 && keypoints[6].score > 0.5 && 
        keypoints[7].score > 0.5 && keypoints[8].score > 0.5){ 
        const leftShoulder = keypoints[5]; 
        const rightShoulder = keypoints[6]; 
        const leftElbow = keypoints[7]; 
        const rightElbow = keypoints[8]; 

        // Check if the user is in a shoulder press position
        const isInShoulderPressPosition = (leftElbow.y < leftShoulder.y || rightElbow.y < rightShoulder.y); 
        
        if (isInShoulderPressPosition){
            // User is in the lowering phase of the shoulder press
            console.log(`User is doing a shoulder press`);
            if (!isDoingShoulderPress) {
                isDoingShoulderPress = true; 
            }
        } else {
            // User is not in the shoulder press position
            if (isDoingShoulderPress) {
                shoulderPressCount++; 
                currentCount = shoulderPressCount;
                isDoingShoulderPress = false; 
                console.log(`Shoulder Press Count: ${shoulderPressCount}`); 
                document.getElementById('rep-count').textContent = `Shoulder Press Count: ${currentCount}`;

                // Check for quarter milestones
                if (currentCount % (repGoal / 4) === 0) {
                    sendProgressMessage(currentCount);
                }
            }
        }
    }
}

function detectCurl(pose) {
    const keypoints = pose.keypoints;

    // Check if keypoints are available and have high confidence
    if (keypoints && keypoints[5].score > 0.5 && keypoints[6].score > 0.5 && 
        keypoints[7].score > 0.5 && keypoints[8].score > 0.5 && 
        keypoints[9].score > 0.5 && keypoints[10].score > 0.5){ 
        const leftShoulder = keypoints[5]; 
        const rightShoulder = keypoints[6]; 
        const leftElbow = keypoints[7]; 
        const rightElbow = keypoints[8]; 
        const leftHand = keypoints[9]; 
        const rightHand = keypoints[10]; 

        // Check if the user is in a curl position
        const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftHand);
        const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightHand);

        console.log(`Left: ${leftElbowAngle}, Right: ${rightElbowAngle}`);
        if (leftElbowAngle > 45 || rightElbowAngle > 45){
            // User is in the lowering phase of the curl
            console.log(`User is doing a curl`);
            if (!isDoingCurl) {
                isDoingCurl = true; 
            }
        } else {
            // User is not in the curl position
            if (isDoingCurl) {
                curlCount++; 
                currentCount = curlCount;
                isDoingCurl = false; 
                console.log(`Curl Count: ${curlCount}`); 
                document.getElementById('rep-count').textContent = `Curl Count: ${currentCount}`;

                // Check for quarter milestones
                if (currentCount % (repGoal / 4) === 0) {
                    sendProgressMessage(currentCount);
                }
            }
        }
    }
}

function updateRepGoal() {
    const goal = document.getElementById('rep-goal-input').value;
    repGoal = goal;
    document.getElementById('rep-goal').textContent = `Rep Goal: ${repGoal}`;
}

function calculateTwoPointAngle(hip, knee) {
    // Get the coordinates of the hip and knee
    const hipX = hip.x;
    const hipY = hip.y;
    const kneeX = knee.x;
    const kneeY = knee.y;

    // Calculate the difference in coordinates
    const deltaX = kneeX - hipX; // Horizontal distance
    const deltaY = kneeY - hipY; // Vertical distance

    // Calculate the angle in radians
    const angleInRadians = Math.atan2(deltaY, deltaX);

    // Convert the angle to degrees
    const angleInDegrees = angleInRadians * (180 / Math.PI);

    // Normalize the angle to be between 0 and 180 degrees
    const normalizedAngle = angleInDegrees < 0 ? angleInDegrees + 360 : angleInDegrees;

    return normalizedAngle;
}

function calculateAngle(pointA, pointB, pointC) {
    const a = Math.sqrt(Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2));
    const b = Math.sqrt(Math.pow(pointB.x - pointC.x, 2) + Math.pow(pointB.y - pointC.y, 2));
    const c = Math.sqrt(Math.pow(pointC.x - pointA.x, 2) + Math.pow(pointC.y - pointA.y, 2));

    const angle = Math.acos((b * b + a * a - c * c) / (2 * a * b)) * (180 / Math.PI);
    return angle;
}

// Draw Pose
function drawPose(pose) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (pose.keypoints) {
        for (let keypoint of pose.keypoints) {
            // Only draw points with high confidence
            if (keypoint.score > 0.5) {
                ctx.beginPath();
                ctx.arc(ctx.canvas.width - keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = "Red";
                ctx.fill();
            }
        }
        drawSkeleton(pose.keypoints);
    }
}

// Draw Skeleton
function drawSkeleton(keypoints) {
    const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    
    ctx.strokeStyle = "Green";
    ctx.lineWidth = 2;

    adjacentKeyPoints.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];
        if (kp1.score > 0.5 && kp2.score > 0.5) {
            ctx.beginPath();
            ctx.moveTo(ctx.canvas.width - kp1.x, kp1.y);
            ctx.lineTo(ctx.canvas.width - kp2.x, kp2.y);
            ctx.stroke();
        }
    });
}

function stopWorkout() {
     // Stop the webcam stream
     if (webcam) {
        const stream = webcam.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        webcam.srcObject = null;
    }
    if (currentExercise === 'Squats') {
        squatCount = 0;
    } else if (currentExercise === 'Push-ups') {
        pushupCount = 0;
    } else if (currentExercise === 'Pull-ups') {
        pullupCount = 0;
    } else if(currentExercise === 'Curls') {
        curlCount = 0;
    } else if (currentExercise === 'Shoulder Press') {
        shoulderPressCount = 0;
    } else if (currentExercise === 'Deadlift') {
        deadliftCount = 0;
    }
    currentCount = 0;
    document.getElementById('rep-count').textContent = `${exerciseType} Count: ${currentCount}`;
    //document.getElementById('webcam-container').style.display = 'none';
    //document.getElementById('canvas').style.display = 'none';
} 

// Navigation functions to switch pages
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.modal').forEach(p => p.classList.add('hidden'));
    const targetPage = document.getElementById(`${page}-page`);
    const targetModal = document.getElementById(`${page}-modal`);
    
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else if (targetModal) {
        targetModal.classList.remove('hidden');
    }
    
    currentPage = page;
    if (page === 'home') {
        clearChatSession();
    }
}

function clearChatSession() {
    fetch('/clear_chat_session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        if (response.ok) {
            console.log('Chat session cleared');
            // Clear chat messages from the UI if needed
            document.getElementById('chat-container').innerHTML = '';
        } else {
            console.error('Failed to clear chat session');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}

// Navigation functions to switch exercises
function navigateToExercise(page, exerciseType) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    if (page === 'exercise') {
        currentExercise = exerciseType;
        currentCount = 0;
        if (exerciseType === 'Squats') {
            currentCount = squatCount;
        } else if (exerciseType === 'Push-ups') {
            currentCount = pushupCount;
        } else if (exerciseType === 'Pull-ups') {
            currentCount = pullupCount;
        } else if(exerciseType === 'Curls') {
            currentCount = curlCount;
        } else if (exerciseType === 'Shoulder Press') {
            currentCount = shoulderPressCount;
        } else if (exerciseType === 'Deadlift') {
            currentCount = deadliftCount;
        }
        document.getElementById('exercise-page').classList.remove('hidden');
        document.getElementById('container').classList.remove('hidden');
        document.getElementById('exercise-title').textContent = exerciseType;
        document.getElementById('rep-count').textContent = `${exerciseType} Count: ${currentCount}`;
        currentPage = page;
    } else {
        navigateTo('home');
        alert('Error: No Page Found');
    }
}

// Theme toggle for dark/light mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
}

function addCalorie() {
    const meal = document.getElementById('meal-input').value;
    const calories = parseInt(document.getElementById('calories-input').value, 10);
    
    if (meal && !isNaN(calories)) {
        addCalorieToTable(meal, calories);
    }
}

function deleteRow(button) {
    const row = button.parentElement.parentElement;
    const totalCaloriesForRow = parseInt(row.cells[3].textContent, 10) || 0;

    // Subtract row calories from the total
    updateTotalCalories(-totalCaloriesForRow);

    // Remove the row
    row.remove();
}

function updateTotalCalories(calories) {
    totalCalories += calories;
    document.getElementById('total-calories').textContent = `Total Calories: ${totalCalories}`;
}

function updateCaloriesForRow(caloriesPerServing, servings, totalCalorieCell) {
    const totalCaloriesForRow = caloriesPerServing * servings;
    const previousTotal = parseInt(totalCalorieCell.textContent, 10) || 0;

    // Update the total calories with the difference
    updateTotalCalories(totalCaloriesForRow - previousTotal);

    // Update the row's total calories cell
    totalCalorieCell.textContent = totalCaloriesForRow;
}

function clearTable() {
    const table = document.getElementById('calorie-table');
    table.innerHTML = `<tr><th>Meal</th><th>Calories per Serving</th><th>Servings</th><th>Total Calories</th><th>Actions</th></tr>`;
    totalCalories = 0;
    document.getElementById('total-calories').textContent = `Total Calories: 0`;
}

async function scanFood() {
    const imageInput = document.getElementById("food-image-input");
    if (!imageInput.files || imageInput.files.length === 0) {
        alert("Please select an image of the food.");
        return;
    }

    const formData = new FormData();
    formData.append("image", imageInput.files[0]);
    console.log(`FormData: ${formData}`);

    try {
        displayUploadedImage(imageInput.files[0]);

        const response = await fetch("/food_scan", {
            method: "POST",
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[scanFood] Stringified ${JSON.stringify(data.response)}`);
        if (data.error) {
            alert("Food recognition failed: " + data.error);
        } else {
            // Pass the parsed JSON directly to the parser
            parseAndAddFoodData(JSON.stringify(data.response));
        }
    
    } catch (error) {
        console.error("Error scanning food:", error);
        alert("An error occurred while scanning the food.");
    }
}

function displayUploadedImage(file) {
    console.log(`displayUploadedImage: ${file}`);
    const img = document.getElementById("uploaded-image");
    img.src = URL.createObjectURL(file);
    img.style.display = "block";
}

function parseAndAddFoodData(responseText) {
    // Parsing the Gemini response assuming it contains food item and calorie info
    //const foodItems = responseText.split('\n'); // Example format
    console.log(`*******\nResponse Text: ${responseText} \n********`);
    const data = JSON.parse(responseText);
    const foodItemRegex = /{\s*"food_name"\s*:\s*"([^"]+)"\s*,\s*"calorie_count"\s*:\s*"([^"]+)"\s*,\s*"food_category"\s*:\s*"([^"]+)"\s*}/g;
    const matches = [...data.matchAll(foodItemRegex)];

    if (matches.length === 0) {
        console.error("No valid food items found in the response.");
        return;
    }

    console.log(`Data: ${data}`);
    console.log(`Data: ${matches}`);
    
    matches.forEach(match => {
        const foodName = match[1]; // Captured group for food_name
        const calorieValue = parseInt(match[2], 10); // Captured group for calorie_count
        const foodCategory = match[3]; // Captured group for food_category

        if (foodName && !isNaN(calorieValue)) {
            // Add to the calorie table or process further
            addCalorieToTable(foodName, calorieValue);
            console.log(`Added: ${foodName} (${calorieValue} cal) - Category: ${foodCategory}`);
        } else {
            console.warn(`Invalid food data: ${match[0]}`);
        }
    });
}

function addCalorieToTable(food, caloriesPerServing) {
    const table = document.getElementById('calorie-table');
    // Check if the food already exists in the table
    for (let i = 1; i < table.rows.length; i++) { // Start at 1 to skip the header row
        const row = table.rows[i];
        const mealCell = row.cells[0]; // Assuming the food name is in the first cell

        if (mealCell.textContent === food) {
            // Update servings input for the existing row
            const servingsInput = row.cells[2].querySelector('input');
            servingsInput.value = parseInt(servingsInput.value) + 1; // Increment servings
            servingsInput.dispatchEvent(new Event('input')); // Trigger input event to update total calories
            console.log(`${food} already exists. Updated servings instead.`);
            return;
        }
    }

    const row = table.insertRow();
    const mealCell = row.insertCell(0);
    const calorieCell = row.insertCell(1);
    const servingsCell = row.insertCell(2);
    const totalCalorieCell = row.insertCell(3);
    const actionCell = row.insertCell(4);

    mealCell.innerHTML = food;
    calorieCell.innerHTML = caloriesPerServing;

    const servingsInput = document.createElement('input');
    servingsInput.type = 'number';
    servingsInput.value = 1;
    servingsInput.min = 1;
    servingsInput.addEventListener('input', function() {
        updateCaloriesForRow(caloriesPerServing, servingsInput.value, totalCalorieCell);
    });
    servingsCell.appendChild(servingsInput);

    // Set initial total calories for this row based on 1 serving
    updateCaloriesForRow(caloriesPerServing, 1, totalCalorieCell);

    // Add delete button
    actionCell.innerHTML = `<button onclick="deleteRow(this, ${totalCalorieCell.textContent})">Delete</button>`;
}

// Send message function
function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (userInput.trim() === "") return;
  
    addMessageToChat(userInput, "user");
  
    fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userInput,
        exerciseType: currentExercise,
        exerciseCount: currentCount,
        exerciseGoal: repGoal,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        addMessageToChat(data.response, "bot");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  
    document.getElementById("user-input").value = "";
  }

  function sendProgressMessage(progress) {
    const progressMessage = `Great job! You've reached ${progress} reps out of your goal of ${repGoal}!`;

    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: progressMessage,
            exerciseType: currentExercise,
            exerciseCount: currentCount,
            exerciseGoal: repGoal,
        }),
    })
    .then((response) => response.json())
    .then((data) => {
        addMessageToChat(data.response, "bot");
    })
    .catch((error) => {
        console.error("Error:", error);
    });
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
  
  // Event listener for Enter key
  document
    .getElementById("user-input")
    .addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        sendMessage();
      }
    });

async function submitPlanForm() {
    const form = document.getElementById("plan-form");
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/generate_plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.error) {
            alert("Error generating workout plan: " + result.error);
        } else {
            displayPlan(result.plan);
            navigateTo('generated-plan');
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while generating the workout plan.");
    }
}

function displayPlan(planText) {
    const planOutput = document.getElementById("plan-output");
    planOutput.innerHTML = formatPlan(planText);
}

function formatPlan(planText) {
    // Replace * ** with <h4>
    planText = planText.replace(/\* \*\*/g, "<h2>").replace(/\*\* \*/g, "</h2>");
    
    // Replace ** with <b>
    planText = planText.replace(/\*\*/g, "<b>").replace(/\*\*/g, "</b>");
    
    // Replace * with <li> and wrap the entire text in <ul>
    planText = planText.replace(/\*/g, "<li>").replace(/\*/g, "</li>");
    planText = "<ul>" + planText + "</ul>";
    
    // // Replace newlines with <br>
    planText = planText.replace(/\n/g, "<br>");
    
    return planText;
}