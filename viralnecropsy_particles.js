// Add these variables at the top
// Add these variables at the top with other declarations
let nextAutoSpawnTime = 0;
let autoSpawnActive = false;

let buttonHoverRadius = 50; // Radius for button hover interaction
let buttonHovered = false; // Track button hover state

let particles = [];
let outbreakCenters = [];
let numOutbreaks = 8;
let growthRate = 0.01;
let infectionRadius = 150;
let baseColor;
let maxParticles = 1000;
let outbreaksToRemove = [];
let hoverRadius = 20;

let globalDecayMultiplier = 10;
let fpsThreshold = 30;

let imgArray = [];
let currentImgIndex = 0;
let imageDisplayDuration = 1000;
let hoveredParticles = new Set();
let hoverCounter = 0;

// Array to store active images and their properties
let activeImages = [];


function preload() {
  imgArray.push(loadImage('assets/Images/0-landing-memes/1.png'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/2.jpg'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/3.png'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/4.jpg'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/5.webp'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/6.png'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/7.jpg'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/8.png'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/9.png'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/10.png'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/11.png'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/12.jpg'));
  imgArray.push(loadImage('assets/Images/0-landing-memes/13.jpg'));
}

function setup() {
  createCanvas(windowWidth, windowHeight);

    if (windowWidth < 1024) {
    maxParticles = 300;
    hoverRadius = 10;
    infectionRadius = 80;
    numOutbreaks = 2;
    autoSpawnActive = true; // Enable auto-spawning for small screens
    nextAutoSpawnTime = millis() + random(1000, 6000); // First spawn in 0.5-5 seconds
  }

  baseColor = color(0, 200, 0);
  noFill();

  // Scale images once during setup
  for (let img of imgArray) {
    if (img.height > 300) {
      let scaleFactor = 200 / img.height;
      img.resize(img.width * scaleFactor, 200);
    }
  }

  // Initialize outbreaks
  for (let i = 0; i < numOutbreaks; i++) {
  let x = random(width);
  let y = random(height);
  let lifespanMultiplier = random(0.05, 5);
  let particleSize = windowWidth < 1024 ? random(1, 3) : random(1, 5);
  outbreakCenters.push({ x: x, y: y, lifespanMultiplier: lifespanMultiplier });
  particles.push(new VirusParticle(x, y, particleSize, lifespanMultiplier));
}

  
  noCursor();

  setupLinkHoverDetection();
}

function draw() {
  background(baseColor);

    // Auto-spawn images for small screens
  if (autoSpawnActive && millis() > nextAutoSpawnTime) {
    const numImages = floor(random(1, 6)); // 1-5 images
    for (let i = 0; i < numImages; i++) {
      spawnImage(
        random(width), 
        random(height),
        random(-2, 2),
        random(-2, 2)
      );
    }
    nextAutoSpawnTime = millis() + random(500, 5000); // Next spawn in 0.5-5 seconds
  }

  let currentFps = frameRate();
  if (currentFps < fpsThreshold) {
    globalDecayMultiplier = map(currentFps, 5, fpsThreshold, 10, 1);
  } else {
    globalDecayMultiplier = 1;
  }

  if (particles.length >= maxParticles && outbreaksToRemove.length === 0) {
    markOutbreaksForRemoval(); 
  }

  if (outbreaksToRemove.length > 0) {
    removeParticlesFromMarkedOutbreaks();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.grow();
    p.display();

    let isHovered = dist(mouseX, mouseY, p.x, p.y) < hoverRadius;
    
    if (isHovered) {
      p.moveTowardsCursor();
      
      if (!hoveredParticles.has(p)) {
        hoveredParticles.add(p);
        hoverCounter++;

        // Spawn image on first hover
        if (hoverCounter === 1) {
          spawnImage(p.x, p.y, p.vx, p.vy); // First hover, spawn an image
        }
        // Every 5th hover after the first one
        else if (hoverCounter % 10 === 0) {
          spawnImage(p.x, p.y, p.vx, p.vy); // Spawn image every 5th hover
        }
      }
    } else {
      hoveredParticles.delete(p);
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
        particles.push(new VirusParticle(newX, newY, random(2, 20), p.lifespanMultiplier));
      }
    }
  }

  // Update and display active images
  activeImages.sort((a, b) => a.createdAt - b.createdAt);
  for (let i = 0; i < activeImages.length; i++) {
    let imgData = activeImages[i];
    imgData.update(); // Call update() to handle fading out
    imgData.updatePosition();
    imgData.applyFriction();

    // Display the image with fading effect
    tint(255, imgData.opacity);
    image(imgData.img, imgData.x - imgData.img.width / 2, imgData.y - imgData.img.height / 2);

    // Remove image when fully faded
    if (imgData.opacity <= 0) {
      activeImages.splice(i, 1);
      i--;
    }
  }
}

// Function to spawn an image at a given position with initial velocity
function spawnImage(x, y, vx, vy) {
  let img = imgArray[currentImgIndex];
  activeImages.push(new ImageObject(x, y, img, vx, vy)); // Create a new ImageObject
  currentImgIndex = (currentImgIndex + 1) % imgArray.length;
}

// ImageObject class to handle image movement and friction
class ImageObject {
  constructor(x, y, img, vx, vy) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.vx = vx || random(-2, 2); // Use particle velocity or random default
    this.vy = vy || random(-2, 2);
    this.createdAt = millis(); // Track creation time
    this.opacity = 255; // Start fully visible
  }


  update() {
    // Update position and physics
    this.updatePosition();
    this.applyFriction();
    
    // Calculate fade timing
    const age = millis() - this.createdAt;
    
    // Full opacity for first 2000ms, then fade over 1000ms
    if (age > 2000) {
      this.opacity = map(age, 2000, 2500, 255, 0);
    }
  }

  // Keep existing position/friction methods
  updatePosition() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  applyFriction() {
    this.vx *= 0.98;
    this.vy *= 0.98;
  }
}

class VirusParticle {
  constructor(x, y, size, lifespanMultiplier) {
    this.x = x;
    this.y = y;
    this.initialSize = size;
    this.size = 0;
    this.minRadius = 8;
    this.maxRadius = 30;
    this.lifespanMultiplier = lifespanMultiplier;
    this.totalLifespan = random(100, 300) * lifespanMultiplier;
    this.lifespan = this.totalLifespan;
    this.noiseOffset = random(1000);
    this.vx = 0;
    this.vy = 0;
  }

  grow() {
    if (this.lifespan > 0) {
      const age = this.totalLifespan - this.lifespan;
      const progress = age / this.totalLifespan;

      if (progress < 0.2) {
        this.size = map(progress, 0, 0.2, this.minRadius, this.maxRadius);
      } else {
        this.size = map(progress, 0.2, 1, this.maxRadius, this.minRadius);
      }

      this.lifespan -= random(0.1, 0.2) * globalDecayMultiplier;
      let sizeDecayFactor = map(this.size, this.minRadius, this.maxRadius, 1.5, 0.5);
      this.lifespan -= random(0.2, 0.4) * globalDecayMultiplier * sizeDecayFactor;
    }
  }

  display() {
    noFill();
    stroke(0);
    push();
    translate(this.x, this.y);
    beginShape();
    for (let a = 0; a < TWO_PI; a += radians(10)) {
      let noiseFactor = noise(
        this.noiseOffset + cos(a) * 0.5,
        this.noiseOffset + sin(a) * 0.5
      );
      let radius = this.size * 0.5 + noiseFactor * this.size * 0.3;
      vertex(cos(a) * radius, sin(a) * radius);
    }
    endShape(CLOSE);
    this.noiseOffset += 0.02;
    pop();
  }

  moveTowardsCursor() {
    let dx = mouseX - this.x;
    let dy = mouseY - this.y;
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
    this.vx *= 0.95;
    this.vy *= 0.95;
  }
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(baseColor);
  
  // Update auto-spawn status when window is resized
  if (windowWidth < 1024) {
    autoSpawnActive = true;
  } else {
    autoSpawnActive = false;
  }
}

let targetCursorSize = 5;
let cursorSize = 5;
let cursorNoiseOffset = 0;

function drawCustomCursor() {
  cursorNoiseOffset += 0.02;
  let tempCursorSize = 5;

  // Check proximity to particles
  for (let p of particles) {
    let d = dist(mouseX, mouseY, p.x, p.y);
    if (d < 15) {
      tempCursorSize += map(d, 0, 100, 10, 40);
    }
  }

  // Check button hover state
  if (buttonHovered) {
    tempCursorSize += 20; // Increase cursor size when hovering over the button
  }

  tempCursorSize = min(tempCursorSize, 30);
  targetCursorSize = lerp(targetCursorSize, tempCursorSize, 0.1);
  cursorSize = targetCursorSize;

  push();
  blendMode(DIFFERENCE);
  fill(baseColor.levels[0], baseColor.levels[1], baseColor.levels[2], 204);
  noStroke();
  translate(mouseX, mouseY);
  beginShape();

  for (let a = 0; a < TWO_PI; a += radians(10)) {
    let noiseFactor = noise(cursorNoiseOffset + cos(a) * 0.5, cursorNoiseOffset + sin(a) * 0.5);
    let radius = cursorSize + noiseFactor * 10;
    vertex(cos(a) * radius, sin(a) * radius);
  }

  endShape(CLOSE);
  pop();
}

function setupLinkHoverDetection() {
  const links = document.querySelectorAll('a');

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      buttonHovered = true;
    });

    link.addEventListener('mouseleave', () => {
      buttonHovered = false;
    });
  });
}

function markOutbreaksForRemoval() { /* ... */ }
function removeParticlesFromMarkedOutbreaks() { /* ... */ }