var particles = []; // Global scope
let outbreakCenters = [];
let maxParticles = 50;
let numOutbreaks = 100;
let infectionRadius = 500;
let infectionRadiusSq = infectionRadius * infectionRadius;
let growthRate = 0.01;
let globalDecayMultiplier = 1;
let fpsThreshold = 30;
let maxParticlesSet = false;

let hoverRadius = 20;

let targetScrollY = 0; // Target scroll position
let currentScrollY = 0; // Current scroll position for particles
const scrollEaseFactor = 0.2; // Controls how quickly particles catch up to the scroll

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style("position: fixed");
  canvas.style("pointer-events: none");
  noFill();

  function trackScroll() {
  targetScrollY = window.scrollY;
  requestAnimationFrame(trackScroll);
}
trackScroll();

  // Add scroll event listener
  window.onscroll = () => {
    targetScrollY = window.scrollY; // Update target scroll position
  };

  // Determine max particles based on page title
  let pageTitle = document.title.toUpperCase();
  if (pageTitle.includes("VIRAL NECROPSY | FASE 1")) {
    maxParticles = 50;
  } else if (pageTitle.includes("VIRAL NECROPSY | FASE 2")) {
    maxParticles = 500;
  } else if (pageTitle.includes("VIRAL NECROPSY | FASE 3")) {
    maxParticles = 800;
  } else if (pageTitle.includes("VIRAL NECROPSY | FASE 4")) {
    maxParticles = 1200;
  }

  maxParticlesSet = true;

  // Generate outbreak centers and particles
  initializeOutbreaks();
}

function initializeOutbreaks() {
  outbreakCenters = [];
  particles = [];

  // Generate outbreak centers
  for (let i = 0; i < numOutbreaks; i++) {
    let x = random(width);
    let y = random(document.documentElement.scrollHeight);
    let lifespanMultiplier = random(0.05, 5);
    outbreakCenters.push({ x, y, lifespanMultiplier });

    for (let j = 0; j < maxParticles / numOutbreaks; j++) {
      particles.push(new VirusParticle(x, y, lifespanMultiplier));
    }
  }
}

function draw() {
  clear();

  // Smoothly animate currentScrollY toward targetScrollY
  currentScrollY = lerp(currentScrollY, targetScrollY, scrollEaseFactor);

  // Translate particles based on currentScrollY
  translate(0, -currentScrollY);

  // Adjust maxParticles based on frame rate if not already set
  if (!maxParticlesSet) {
    if (frameRate() < fpsThreshold) {
      globalDecayMultiplier = 4;
      maxParticles = Math.max(10, maxParticles - 5);
    } else {
      globalDecayMultiplier = 1;
      maxParticles = 20;
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.grow();
    p.display();

    let isHovered = dist(mouseX, mouseY + window.scrollY, p.x, p.y) < hoverRadius; // Adjust for scroll
    if (isHovered) {
      p.moveTowardsCursor();
    }

    p.updatePosition();
    p.applyFriction();

    if (p.lifespan <= 0) {
      particles.splice(i, 1);
    }

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
        particles.push(new VirusParticle(newX, newY, p.lifespanMultiplier));
      }
    }
  }
}

// Function to check if the cursor is hovering over interactive elements
function isHoveringOverInteractiveElement() {
  let element = document.elementFromPoint(mouseX, mouseY + window.scrollY); // Adjust for scroll
  if (element && (element.tagName === 'BUTTON' || element.tagName === 'A' || element.tagName === 'IFRAME')) {
    return true;
  }
  return false;
}

// Particle class
class VirusParticle {
  constructor(x, y, lifespanMultiplier) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.minRadius = 15;
    this.maxRadius = 32;
    this.size = this.minRadius;
    this.lifespan = random(400, 5000) * lifespanMultiplier;
    this.lifespanMultiplier = lifespanMultiplier;
    this.noiseOffset = random(1000);
    this.alpha = 0;
    this.friction = 0.95;
  }

  grow() {
    let progress = 1 - this.lifespan / (2000 * this.lifespanMultiplier);
    this.size = lerp(this.minRadius, this.maxRadius, progress);
    this.alpha = map(this.lifespan, 50, 0, 105, 0);
    this.lifespan -= 1.5 * this.lifespanMultiplier * globalDecayMultiplier;
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

  moveTowardsCursor() {
    const docMouseY = mouseY + currentScrollY; // Use currentScrollY instead of window.scrollY
    let dx = mouseX - this.x;
    let dy = docMouseY - this.y;
    
    let distance = sqrt(dx * dx + dy * dy);
    let maxDistance = hoverRadius;
    let t = constrain(distance / maxDistance, 0, 1);
    let easeFactor = easeOutQuad(t);
    const baseAccel = 15 / (this.size + 1);
    let accel = baseAccel * easeFactor;
    let angle = atan2(dy, dx);
    this.vx += cos(angle) * accel;
    this.vy += sin(angle) * accel;
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

function easeOutQuad(t) {
  return t * (2 - t);
}

/* Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Resize the canvas
  initializeOutbreaks(); // Reinitialize outbreak centers and particles
}
*/

