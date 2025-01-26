class Particle {
    constructor(x, y, direction) {
        this.pos = createVector(x, y);
        this.vel = direction.copy().mult(random(0.5, 1));
        this.acc = createVector(0, 0);
        this.size = random(0.5, 1);

        // Add a history for the tail
        this.history = [];
        this.maxHistoryLength = 20;

        // Create a base color with random variations
        const hue = random(0, 30); // Warm colors
        const saturation = random(80, 100);
        const brightness = random(90, 100);
        colorMode(HSB, 100);
        this.color = color(hue, saturation, brightness);
        colorMode(RGB, 255);
    }

    display() {
        push();
        noStroke();
        blendMode(ADD);

        // Draw the tail
        for (let i = 0; i < this.history.length - 1; i++) {
            const alpha = map(i, 0, this.history.length - 1, 0, 255); // Fade tail
            const weight = map(i, 0, this.history.length - 1, this.size, 1); // Tail tapers
            stroke(red(this.color), green(this.color), blue(this.color), alpha);
            strokeWeight(weight);
            line(this.history[i].x, this.history[i].y, this.history[i + 1].x, this.history[i + 1].y);
        }
        // Draw glow layers
        for (let i = 4; i > 0; i--) {
            let glowAlpha = map(i, 4, 0, 10, 255); // Opacity decreases in outer layers
            let glowSize = this.size + i * 4;      // Increase size for glow layers

            noStroke();
            fill(red(this.color), green(this.color), blue(this.color), glowAlpha);
            circle(this.pos.x, this.pos.y, glowSize);
        }

        // Draw the main particle
        fill(red(this.color), green(this.color), blue(this.color), 200);
        noStroke();
        circle(this.pos.x, this.pos.y, this.size);
        pop();
    }

    update(target, flowField) {
        // Move toward the target edge point
        let force = p5.Vector.sub(target.position, this.pos);
        force.setMag(0.5); // Increase speed of attraction (was 0.1)
        this.acc.add(force);

        // Add the direction vector from the edge
        this.acc.add(target.direction);

        // Apply flow field effect
        const flowForce = flowField.lookup(this.pos);
        flowForce.mult(1.5); // Amplify flow field influence
        this.acc.add(flowForce);

        // Update velocity and position
        this.vel.add(this.acc);

        // Set a minimum speed for the particles
        if (this.vel.mag() < 2) {
            this.vel.setMag(2); // Ensure minimum speed
        }

        // Optional: Limit the maximum speed
        this.vel.limit(10); // Adjust as needed for smoothness

        this.pos.add(this.vel);

        // Gradually slow down
        this.vel.mult(0.98); // Slightly reduce damping (was 0.95)

        // Reset acceleration
        this.acc.mult(0);

        // Update the tail history
        this.history.push(this.pos.copy());
        if (this.history.length > this.maxHistoryLength) {
            this.history.shift(); // Remove the oldest position
        }
    }
}

class FlowField {
    constructor(resolution) {
        this.resolution = resolution;
        this.cols = floor(width / this.resolution);
        this.rows = floor(height / this.resolution);
        this.field = this.make2DArray(this.cols, this.rows);
        this.init();
    }

    make2DArray(cols, rows) {
        let arr = new Array(cols);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = new Array(rows);
        }
        return arr;
    }

    init() {
        noiseDetail(8, 0.65);
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                let angle = noise(i * 0.1, j * 0.1) * TWO_PI * 4;
                this.field[i][j] = p5.Vector.fromAngle(angle);
            }
        }
    }

    lookup(lookup) {
        let column = int(constrain(lookup.x / this.resolution, 0, this.cols - 1));
        let row = int(constrain(lookup.y / this.resolution, 0, this.rows - 1));
        return this.field[column][row].copy();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
        this.flowField = new FlowField(20); // Initialize flow field
    }

    initializeParticles(edges) {
        this.particles = []; // Clear any existing particles
        for (let i = 0; i < this.maxParticles; i++) {
            const edge = random(edges);
            this.particles.push(new Particle(edge.x, edge.y, edge.direction));
        }
    }

    update(edges) {
        if (edges.length === 0) return;
        // Update each particle to move towards the nearest edge
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const nearestEdge = this.findNearestEdge(particle.pos, edges);

            if (nearestEdge) {
                const distanceToEdge = p5.Vector.dist(particle.pos, nearestEdge.position);

                // If particle is too far, remove it and spawn a new one
                if (distanceToEdge > 100) { // Adjust threshold as needed
                    this.particles.splice(i, 1); // Remove particle
                    const randomEdge = random(edges); // Pick a new edge point
                    this.particles.push(
                        new Particle(randomEdge.x, randomEdge.y, randomEdge.direction)
                    );
                } else {
                    // Update particle to move towards the nearest edge
                    particle.update(nearestEdge, this.flowField);
                    particle.display();
                }
            }
        }
    }

    findNearestEdge(position, edges) {
        if (edges.length === 0) {
            console.warn('No edges available');
            return null;
        }

        let nearestEdge = edges[0];
        let minDist = p5.Vector.dist(position, createVector(nearestEdge.x, nearestEdge.y));

        for (let edge of edges) {
            const dist = p5.Vector.dist(position, createVector(edge.x, edge.y));
            if (dist < minDist) {
                minDist = dist;
                nearestEdge = edge;
            }
        }

        return {
            position: createVector(nearestEdge.x, nearestEdge.y),
            direction: nearestEdge.direction
        };
    }
} 