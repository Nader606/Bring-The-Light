let webcamVideo;
let objectDetector;
let CANVAS_WIDTH;
let CANVAS_HEIGHT;
let lastDetectionTime = 0;
let detections = [];
let particleSystem;
let flowField;
let detectionInProgress = false;
let frameCount = 0;

/**
 * Initializes the setup of the application, including creating the canvas,
 * initializing the webcam, and setting up the object detector.
 */
function setup() {
    CANVAS_WIDTH = windowWidth;
    CANVAS_HEIGHT = windowHeight;
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    initializeWebcam();
    initializeObjectDetector();
    particleSystem = new ParticleSystem();
}

/**
 * Initializes the webcam and sets up the necessary event handlers.
 */
function initializeWebcam() {
    webcamVideo = createCapture(VIDEO, handleWebcamStream);
    webcamVideo.size(width, height);
    webcamVideo.elt.onloadedmetadata = logWebcamMetadata;
    webcamVideo.elt.onerror = logWebcamError;
    webcamVideo.hide();

    // Add error handling for getUserMedia
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            console.log('Webcam stream obtained:', stream);
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
            if (error.name === 'NotAllowedError') {
                console.error('Permission denied. Please allow access to the webcam.');
            } else if (error.name === 'NotFoundError') {
                console.error('No webcam found. Please connect a webcam.');
            } else if (error.name === 'NotReadableError') {
                console.error('Webcam is already in use by another application.');
            } else {
                console.error('An unknown error occurred:', error);
            }
        });
}

/**
 * Handles the webcam stream when it is successfully initialized.
 * @param {MediaStream} stream - The webcam stream.
 */
function handleWebcamStream(stream) {
    console.log('Webcam initialized:', stream);
}

/**
 * Logs a message when the webcam metadata is loaded.
 */
function logWebcamMetadata() {
    console.log('Webcam metadata loaded.');
}

/**
 * Logs an error message when there is a problem with the webcam.
 * @param {Error} error - The error object containing information about the webcam error.
 */
function logWebcamError(error) {
    console.error('Webcam error:', error);
}

/**
 * Asynchronously initializes the object detector using the COCO-SSD model.
 */
async function initializeObjectDetector() {
    objectDetector = await cocoSsd.load();
    console.log('Object detector initialized and running.');
}

/**
 * Handles the main drawing loop of the application, including displaying the webcam feed
 * and performing object detection.
 */
function draw() {
    // Clear the canvas
    clear();

    // Display webcam feed with filters
    push();
    //translate(width, 0);
    //scale(-1, 1);
    image(webcamVideo, 0, 0, width, height);
    //filter(BLUR, 0.5);
    filter(GRAY);
    filter(THRESHOLD, 0.4);

    pop();

    // Load pixels after filters are applied


    // Process detections
    if (frameCount % 10 === 0) {
        performObjectDetection();
    }
    drawDetections();

    //push();
    //blendMode(ADD);
    //particleSystem.update();
    //pop();


}


/**
 * Performs object detection on the webcam feed, updating the detections array
 * at a regular interval.
 */
function performObjectDetection() {
    const currentTime = millis();
    if (currentTime - lastDetectionTime > 100) {
        detectObjects();
    }
}

/**
 * Determines if it is time to perform object detection based on the last detection time.
 * @param {number} currentTime - The current time in milliseconds.
 * @returns {boolean} True if it is time to perform object detection, false otherwise.
 */
function isDetectionTime(currentTime) {
    return currentTime - lastDetectionTime > 100;
}

/**
 * Detects objects in the webcam feed using the object detector.
 */
async function detectObjects() {
    if (!detectionInProgress && objectDetector && webcamVideo?.elt?.readyState === 4) {
        detectionInProgress = true;
        try {
            const results = await objectDetector.detect(webcamVideo.elt);
            updateDetections(results);
        } catch (error) {
            console.error('Detection error:', error);
            detections = []; // Reset on error
        } finally {
            detectionInProgress = false;
        }
    } else if (!webcamVideo?.elt?.readyState === 4) {
        console.warn('Webcam not ready for detection');
        detections = [];
    }
}

/**
 * Updates the detections array with the latest object detection results.
 * @param {Object[]} results - An array of object detection results.
 */
function updateDetections(results) {
    detections = results;
    lastDetectionTime = millis();
    console.log('Detections:', results);
}

/**
 * Draws the detected objects on the canvas.
 */
function drawDetections() {
    detections.forEach(drawDetection);
}


/**
 * Draws a single detected object on the canvas.
 * @param {Object} det - The object detection result.
 */
function drawDetection(det) {
    if (det.class === 'person') {
        // Get bounding box coordinates and scale them to canvas size
        const bbox = det.bbox;
        const [x, y, bboxWidth, bboxHeight] = bbox;

        // Scale factors for width and height
        const scaleX = CANVAS_WIDTH / webcamVideo.elt.videoWidth;
        const scaleY = CANVAS_HEIGHT / webcamVideo.elt.videoHeight;

        // Scale the bounding box coordinates
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledWidth = bboxWidth * scaleX;
        const scaledHeight = bboxHeight * scaleY;

        // Draw scaled bounding box
        stroke(255, 0, 0);
        strokeWeight(2);
        noFill();
        rect(scaledX, scaledY, scaledWidth, scaledHeight);

        // Use scaled coordinates for edge detection
        const padding = 10;
        const startX = Math.max(1, Math.floor(scaledX - padding));
        const startY = Math.max(1, Math.floor(scaledY - padding));
        const endX = Math.min(CANVAS_WIDTH - 1, Math.ceil(scaledX + scaledWidth + padding));
        const endY = Math.min(CANVAS_HEIGHT - 1, Math.ceil(scaledY + scaledHeight + padding));

        // Store silhouette edges
        const silhouetteEdges = [];
        const MAGNITUDE_THRESHOLD = 60;
        let edgeIndex;

        webcamVideo.loadPixels();

        // Only scan within and around the bounding box
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                // Skip edge pixels to ensure we have valid neighbors
                if (x <= 1 || x >= CANVAS_WIDTH - 2 || y <= 1 || y >= CANVAS_HEIGHT - 2) {
                    continue;
                }

                const pixelIndex = (y * CANVAS_WIDTH + x) * 4;
                const tl = webcamVideo.pixels[((y - 1) * CANVAS_WIDTH + (x - 1)) * 4];
                const t = webcamVideo.pixels[((y - 1) * CANVAS_WIDTH + x) * 4];
                const tr = webcamVideo.pixels[((y - 1) * CANVAS_WIDTH + (x + 1)) * 4];
                const l = webcamVideo.pixels[(y * CANVAS_WIDTH + (x - 1)) * 4];
                const r = webcamVideo.pixels[(y * CANVAS_WIDTH + (x + 1)) * 4];
                const bl = webcamVideo.pixels[((y + 1) * CANVAS_WIDTH + (x - 1)) * 4];
                const b = webcamVideo.pixels[((y + 1) * CANVAS_WIDTH + x) * 4];
                const br = webcamVideo.pixels[((y + 1) * CANVAS_WIDTH + (x + 1)) * 4];

                // Verify all pixel values are defined before proceeding
                if ([tl, t, tr, l, r, bl, b, br].some(p => p === undefined)) {
                    continue;
                }

                // Sobel operators
                const gx = (tr + 2 * r + br) - (tl + 2 * l + bl);
                const gy = (bl + 2 * b + br) - (tl + 2 * t + tr);
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                // Check if this is a strong edge
                if (magnitude > MAGNITUDE_THRESHOLD) {
                    const direction = createVector(-gx, gy).normalize().mult(0.1);
                    const edge = {
                        x: x,
                        y: y,
                        direction: direction,
                        magnitude: magnitude
                    };

                    // Validate edge data
                    if (edge.x !== undefined && edge.y !== undefined && edge.direction !== undefined) {
                        silhouetteEdges.push(edge);
                    } else {
                        console.warn('Invalid edge detected:', edge);
                    }
                }
            }
        }
        console.log('Detected edges:', silhouetteEdges.length);

        // Initialize particles once
        if (particleSystem.particles.length === 0) {
            particleSystem.initializeParticles(silhouetteEdges);

        }
        // Update particles to follow the silhouette edges
        particleSystem.update(silhouetteEdges);

        // Remove used edge to avoid spawning multiple particles at the same spot
        silhouetteEdges.splice(edgeIndex, 1);
    }
    /* // Randomly select from detected edges
    for (let i = 0; i < maxParticlesPerFrame && silhouetteEdges.length > 0; i++) {
        const edgeIndex = Math.floor(random(silhouetteEdges.length));
        const edge = silhouetteEdges[edgeIndex];
        
        if (webcamVideo.pixels[(edge.y * CANVAS_WIDTH + edge.x) * 4] < 50) { // Verify it's still in the silhouette
            // Create a slightly randomized direction vector
            const randomAngle = random(-PI/4, PI/4);
            const direction = edge.direction.copy().rotate(randomAngle);
            
            particleSystem.addParticle(edge.x, edge.y, direction);
            
        }
        
        
    } */
}

/**
 * Handles the mouse press event, toggling the full-screen mode.
 */
function mousePressed() {
    toggleFullscreen();
}

/**
 * Handles window resize event.
 */
function windowResized() {
    CANVAS_WIDTH = windowWidth;
    CANVAS_HEIGHT = windowHeight;
    resizeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    webcamVideo.size(CANVAS_WIDTH, CANVAS_HEIGHT);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        } else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        } else {
            console.warn('Fullscreen mode not supported');
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}