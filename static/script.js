let bodyTracker, video, ctx, labelContainer;
let currentExercise = "";
let currentPage = 'home';
let squatCount = 0;
let pushupCount = 0;
let pullupCount = 0;
let benchCount = 0; 
let deadliftCount = 0; 
let isSquatting = false; // For squat detection
let isDoingPushup = false; // For push-up detection
let isDoingPullup = false; // For pull-up detection
let isDoingBench = false; // For bench detection 
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
                detectPushup(poses[0]); // Implement this function for push-up detection
                break;
            case 'Pull-ups':
                detectSquat(poses[0]);//detectPullup(poses[0]); // Implement this function for pull-up detection
                break;
            case 'Bench':
                detectSquat(poses[0]);//detectBench(poses[0]); // Implement this function for bench detection
                break;
            case 'Barbell Squats':
                detectSquat(poses[0]); // Use the same squat detection for Barbell Squat
                break;
            case 'Deadlift':
                detectSquat(poses[0]);//detectDeadlift(poses[0]); // Implement this function for deadlift detection
                break;
        }
    }

    window.requestAnimationFrame(loop);
}

function detectSquat(pose) {
    const keypoints = pose.keypoints;

    // Check if keypoints are available and have high confidence
    if (keypoints && keypoints[11].score > 0.5 && keypoints[12].score > 0.5 && 
        keypoints[13].score > 0.5 && keypoints[14].score > 0.5){
        const leftHip = keypoints[11]; // Left hip
        const rightHip = keypoints[12]; // Right hip
        const leftKnee = keypoints[13]; // Left knee
        const rightKnee = keypoints[14]; // Right knee
        

        // Calculate angles for both legs
        const leftAngle = calculateTwoPointAngle(leftHip, leftKnee);
        const rightAngle = calculateTwoPointAngle(rightHip, rightKnee);
        
        
        // Check if the user is in a squat position
        if (leftAngle < 45 || rightAngle < 45){
            // User is squatting
            console.log(`User is squatting`);
            console.log(`Left: ${leftAngle}, Right: ${rightAngle}`);
            if (!isSquatting) {
                isSquatting = true; 
            }
        } else {
            console.log(`User is not squatting`);
            // User is not squatting
            if (isSquatting) {
                squatCount++; 
                isSquatting = false; 
                console.log(`***`); 
                console.log(`Squat Count: ${squatCount}`); // Log the count 
                console.log(`***`); 
                document.getElementById('rep-count').textContent = `Squat Count: ${squatCount}`;
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
                isDoingPushup = false; 
                console.log(`Push-up Count: ${pushupCount}`); 
                document.getElementById('rep-count').textContent = `Push-up Count: ${pushupCount}`;
            }
        }
    }
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
    if (currentExercise === 'Squats' || currentExercise === "Barbell Squats") {
        squatCount = 0;
    } else if (currentExercise === 'Push-ups') {
        pushupCount = 0;
    } else if (currentExercise === 'Pull-ups') {
        pullupCount = 0;
    } else if (currentExercise === 'Bench') {
        benchCount = 0;
    } else if (currentExercise === 'Deadlift') {
        deadliftCount = 0;
    }
    document.getElementById('webcam-container').style.display = 'none';
    document.getElementById('canvas').style.display = 'none';
} 

// Navigation functions to switch pages
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`${page}-page`).classList.remove('hidden');
    currentPage = page;
}

// Navigation functions to switch exercises
function navigateToExercise(page, exerciseType) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

    if (page === 'exercise') {
        currentExercise = exerciseType;
        exerciseCount = 0;
        if (exerciseType === 'Squats') {
            exerciseCount = squatCount;
        } else if (exerciseType === 'Push-ups') {
            exerciseCount = pushupCount;
        } else if (exerciseType === 'Pull-ups') {
            exerciseCount = pullupCount;
        } 
        document.getElementById('exercise-page').classList.remove('hidden');
        document.getElementById('exercise-title').textContent = exerciseType;
        document.getElementById('rep-count').textContent = `${exerciseType} Count: ${exerciseCount}`;
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


