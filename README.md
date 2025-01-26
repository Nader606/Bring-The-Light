# Bring-The-Light

This project is a real-time visualization of particles following the edges of detected objects in a video feed. It uses computer vision techniques to detect objects and edge detection algorithms to create a dynamic particle system that follows the silhouette of detected objects.

## Features

- **Real-time Object Detection**: Utilizes the COCO-SSD model to detect objects in a webcam feed.
- **Edge Detection**: Applies Sobel operators to detect edges within the bounding box of detected objects.
- **Particle System**: Particles are generated along the detected edges and move in a flow field-like behavior.
- **Dynamic Visualization**: Particles continuously follow the moving edges, creating a visually engaging effect.

## Technologies Used

- **p5.js**: A JavaScript library for creative coding, used for rendering graphics and handling video input.
- **COCO-SSD Model**: A pre-trained object detection model from TensorFlow.js, used for detecting objects in the video feed.
- **JavaScript**: The core programming language used to implement the logic and functionality of the project.
- **HTML/CSS**: Basic web technologies used to structure and style the application interface.

## Setup and Installation

1. **Clone the Repository**: 
   ```bash
   git clone https://github.com/Nader606/Bring-The-Light.git
   cd BringTheLight
   ```

2. **Install Dependencies**: 
   Ensure you have a local server setup to run the project, such as using VSCode's Live Server extension or Python's SimpleHTTPServer.

3. **Run the Application**: 
   Open `index.html` in your browser using your local server setup.

## Usage

- **Webcam Access**: The application requires access to your webcam. Ensure you allow webcam permissions when prompted.
- **Full-Screen Mode**: Click on the canvas to toggle full-screen mode for an immersive experience.
- **Window Resizing**: The application automatically adjusts to window resizing.

## Important Notes

- **Performance**: The application may have performance issues on lower-end devices due to real-time video processing and particle rendering.
- **Browser Compatibility**: Ensure you are using a modern browser that supports WebRTC and WebGL for optimal performance.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgments

- [p5.js](https://p5js.org/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [COCO-SSD Model](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
- [Edge Detection Live! (it works omg)](https://editor.p5js.org/maalvikabhat2027/sketches/RgdVO9_yI)
- [Nature of code](https://natureofcode.com/)
- [Finding the Edges (Sobel Operator) - Computerphile](https://www.youtube.com/watch?v=uihBwtPIBxM)
