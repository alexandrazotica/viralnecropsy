// Only run the custom cursor if on desktop
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice) {
  document.addEventListener('drag', function(event) {
    document.body.style.cursor = 'none';
  });

  document.addEventListener('dragend', function(event) {
    document.body.style.cursor = 'none';
  });

  new p5(function(p) {
    let targetCursorSize = 5;
    let cursorSize = 5;
    let cursorNoiseOffset = 0;
    let hoverSize = 5;
    const maxCursorSize = 40;

      p.setup = function() {
    updateCanvasSize(); // Initialize canvas
    p.noStroke();
  };

  // New function to handle canvas resizing
  function updateCanvasSize() {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.position(0, 0);
    canvas.style('position', 'fixed');
    canvas.style('pointer-events', 'none');
    canvas.style('z-index', '999999');
  }

  // p5.js automatically calls this when the window resizes
  p.windowResized = function() {
    updateCanvasSize(); // Resize canvas to match new window dimensions
  };

    p.draw = function() {
      p.clear();
      cursorNoiseOffset += 0.01;
      let tempCursorSize = hoverSize;

      if (window.particles) {
        const docMouseY = p.mouseY + window.scrollY;
        p.translate(p.mouseX, docMouseY);
        for (let particle of window.particles) {
          const d = p.dist(p.mouseX, docMouseY, particle.x, particle.y);
          if (d < 15) {
            tempCursorSize += p.map(d, 0, 100, 10, 40);
          }
        }
      }

      if (isHoveringOverInteractiveElement()) {
        tempCursorSize = p.min(tempCursorSize + 15, maxCursorSize);
      }

      tempCursorSize = p.min(tempCursorSize, maxCursorSize);
      targetCursorSize = p.lerp(targetCursorSize, tempCursorSize, 0.1);
      cursorSize = targetCursorSize;

      p.push();
      p.resetMatrix();
      p.fill(200, 0, 200);
      p.translate(p.mouseX, p.mouseY);

      p.beginShape();
      for (let a = 0; a < p.TWO_PI; a += p.radians(10)) {
        const noiseFactor = p.noise(
          cursorNoiseOffset + p.cos(a) * 0.5,
          cursorNoiseOffset + p.sin(a) * 0.5
        );
        const radius = cursorSize + noiseFactor * 10;
        p.vertex(p.cos(a) * radius, p.sin(a) * radius);
      }
      p.endShape(p.CLOSE);
      p.pop();
    };

    function isHoveringOverInteractiveElement() {
      const element = document.elementFromPoint(p.mouseX, p.mouseY);
      return element && (element.tagName === 'BUTTON' || element.tagName === 'A' || element.hasAttribute('role') || element.tagName === 'IMG' || element.tagName === 'SPAN');
    }
  });
}
