window.particles = window.particles || []; // Use existing global array or create it
let maxParticles = 50;
let hoverRadius = 20;
let targetScrollY = 0;
let currentScrollY = 0;

let canvas;

function setup() {
  let canvasHeight = document.documentElement.scrollHeight;
  canvas = createCanvas(windowWidth, canvasHeight);
  canvas.position(0, 0);
  canvas.style("pointer-events", "none");
  noFill();

  window.addEventListener("scroll", () => {
    targetScrollY = window.scrollY;
  });
}

function draw() {
  clear();
  currentScrollY = window.scrollY;

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.grow();
    p.display();
    
    // Adjust mouseY for scroll when checking hover
    if (dist(mouseX, mouseY, p.x, p.y) < hoverRadius) {
      p.moveTowardsCursor();
    }

    p.updatePosition();
    p.applyFriction();

    if (p.lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
}

class Particle {
  constructor(x, y, lifespanMultiplier = random(0.05, 5)) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.minRadius = 6;
    this.maxRadius = 30;
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
    this.lifespan -= 1.5 * this.lifespanMultiplier;
  }

  display() {
    fill(0, 200, 0, this.alpha);
    noStroke();
    push();
    translate(this.x, this.y); // Adjust particle position instead of translating the canvas
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
    // Remove scroll adjustment (mouseY is already correct)
    let dx = mouseX - this.x;
    let dy = mouseY - this.y;
    let distance = sqrt(dx * dx + dy * dy);
    let t = constrain(distance / hoverRadius, 0, 1);
    let easeFactor = easeOutQuad(t);
    let accel = (15 / (this.size + 1)) * easeFactor;
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

function windowResized() {
  let canvasHeight = document.documentElement.scrollHeight;
  resizeCanvas(windowWidth, canvasHeight);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".fase, .titolo-sezione, .bibliografia").forEach((el) => {
    el.addEventListener("mouseenter", (e) => {
      let hoverPos = { x: e.pageX, y: e.pageY };
      let particlesToCreate = el.classList.contains("titolo-sezione") ? 30 : 20;
      if (el.getAttribute("data-link") === "FASE1.html") particlesToCreate = 2;
      if (el.getAttribute("data-link") === "FASE2.html") particlesToCreate = 5;
      if (el.getAttribute("data-link") === "FASE3.html") particlesToCreate = 15;
      if (el.getAttribute("data-link") === "FASE4.html") particlesToCreate = 30;
      if (el.getAttribute("data-link") === "Bibliografia.html") particlesToCreate = 10;
      
      particles = particles.filter(p => p.lifespan > 0);
      for (let i = 0; i < particlesToCreate; i++) {
        particles.push(new Particle(hoverPos.x, hoverPos.y));
      }
    });

    el.addEventListener("click", (event) => {
      let link = el.getAttribute("data-link");
      if (link) window.location.href = link;
    });
  });
});
