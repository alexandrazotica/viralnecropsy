// Global variables
var particles = [];
let outbreakCenters = [];
let maxParticles = 1; // Fixed number of particles for all pages
let numOutbreaks = 1;
let infectionRadius = 1000;
let growthRate = 5;

// Variables for page transition
let isTransitioning = false;
let targetPage = null;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style("position: fixed");
  canvas.style("top: 0");
  canvas.style("left: 0");
  canvas.style("z-index: 9999"); // Ensure it covers everything
  canvas.style("pointer-events: none");
  noFill();

  // Generate outbreak centers and particles
  initializeOutbreaks();

  // Intercept link clicks for smooth transition
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      targetPage = this.href;
      startTransition();
    });
  });
}

function startTransition() {
  isTransitioning = true;
  growthRate = 0.1;
  maxParticles = 2500; // Briefly increase for transition effect
}

function initializeOutbreaks() {
  outbreakCenters = [];
  particles = [];

  for (let i = 0; i < numOutbreaks; i++) {
    let x = random(width);
    let y = random(height); // No scrolling dependency
    outbreakCenters.push({ x, y });

    for (let j = 0; j < maxParticles / numOutbreaks; j++) {
      particles.push(new VirusParticle(x, y));
    }
  }
}

function draw() {
  clear();

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.display();
    p.updatePosition();
    p.applyFriction();

    if (random(1) < growthRate && particles.length < maxParticles) {
      let angle = random(TWO_PI);
      let d = random(10, infectionRadius);
      let newX = p.x + cos(angle) * d;
      let newY = p.y + sin(angle) * d;

      if (random(1) < 0.7) {
        newX = lerp(p.x, newX, random(0.2, 0.5));
        newY = lerp(p.y, newY, random(0.2, 0.5));
      }

      if (newX > 0 && newX < width && newY > 0 && newY < height) {
        particles.push(new VirusParticle(newX, newY));
      }
    }
  }

  // Transition effect before navigation
  if (isTransitioning && particles.length >= maxParticles * 0.9) {
    setTimeout(() => {
      window.location.href = targetPage;
    }, 500);
  }
}

// VirusParticle class with randomized radii
class VirusParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.minRadius = 2; // Minimum radius
    this.maxRadius = 25; // Maximum radius
    this.size = random(this.minRadius, this.maxRadius); // Randomize size
    this.noiseOffset = random(1000);
    this.alpha = 255; // Fixed alpha (fully visible)
    this.friction = 0.95;
  }

  display() {
    fill(0, 200, 0, this.alpha);
    noStroke();
    push();
    translate(this.x, this.y);
    beginShape();
    const angleIncrement = TWO_PI / 26;
    for (let a = 0; a < TWO_PI; a += angleIncrement) {
      let noiseFactor = noise(this.noiseOffset + cos(a) * 0.5, this.noiseOffset + sin(a) * 0.5);
      let radius = this.size * 0.5 + noiseFactor * this.size * 0.3;
      vertex(cos(a) * radius, sin(a) * radius);
    }
    endShape(CLOSE);
    this.noiseOffset += 0.02;
    pop();
  }

  updatePosition() {
    this.x += this.vx;
    this.y += this.vy;
  }

  applyFriction() {
    this.vx *= this.friction;
    this.vy *= this.friction;
  }
}

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeOutbreaks();
}