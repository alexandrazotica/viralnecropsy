document.addEventListener("DOMContentLoaded", () => {
  const hoverLinks = document.querySelectorAll("a.special-hover, a.multi-hover");
  let activeImages = new Map();
  let targetScrollY = 0;
  let currentScrollY = 0;
  const scrollEaseFactor = 0.2;
  let spawnedImages = new Set();

  // Detect touch devices
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  window.addEventListener("scroll", () => {
    targetScrollY = window.scrollY;
  });

  hoverLinks.forEach(link => {
    if (isTouchDevice) {
      // For touch devices, use click events
      link.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent default link behavior
        if (spawnedImages.has(link)) return;

        if (link.classList.contains("multi-hover")) {
          const imageUrls = link.getAttribute("data-images");
          if (!imageUrls) return;
          spawnMultipleImages(link, event, imageUrls);
        } else {
          const imageUrl = link.getAttribute("data-image");
          if (!imageUrl) return;
          spawnSingleImage(link, event, imageUrl);
        }

        spawnedImages.add(link);

        // Remove images after 5 seconds
        setTimeout(() => {
          removeImages(link);
        }, 2000); // 5 seconds
      });
    } else {
      // For non-touch devices, use hover events
      link.addEventListener("mouseenter", (event) => {
        if (spawnedImages.has(link)) return;

        if (link.classList.contains("multi-hover")) {
          const imageUrls = link.getAttribute("data-images");
          if (!imageUrls) return;
          spawnMultipleImages(link, event, imageUrls);
        } else {
          const imageUrl = link.getAttribute("data-image");
          if (!imageUrl) return;
          spawnSingleImage(link, event, imageUrl);
        }

        spawnedImages.add(link);
      });
    }
  });

  function spawnSingleImage(link, event, imageUrl) {
    const img = createImage(event, imageUrl);
    const draggable = new DraggableImage(img, event.clientX + 250, event.clientY + window.scrollY);
    activeImages.set(link, draggable);
  }

  function spawnMultipleImages(link, event, imageUrls) {
    const imagesArray = imageUrls.split(",").map(img => img.trim());
    const offsets = [
      { x: 250, y: 0 },
      { x: 270, y: 50 },
      { x: 290, y: -50 },
      { x: 310, y: 100 },
      { x: 330, y: -100 }
    ];
  
    // Generate a unique key prefix based on the link's href or id
    const linkKeyPrefix = link.href || link.id || `link-${Math.random().toString(36).substr(2, 9)}`;
  
    imagesArray.forEach((imageUrl, index) => {
      const offset = offsets[index] || { x: 250 + index * 20, y: 0 };
      const img = createImage(event, imageUrl);
      const draggable = new DraggableImage(
        img,
        event.clientX + offset.x,
        event.clientY + window.scrollY + offset.y
      );
      // Use a unique key for each image
      const key = `${linkKeyPrefix}-${index}`;
      activeImages.set(key, draggable);
    });
  }
  
  function removeImages(link) {
    if (link.classList.contains("multi-hover")) {
      // Generate the same unique key prefix as in spawnMultipleImages
      const linkKeyPrefix = link.href || link.id || `link-${Math.random().toString(36).substr(2, 9)}`;
      const imagesArray = link.getAttribute("data-images").split(",").map(img => img.trim());
      imagesArray.forEach((_, index) => {
        const key = `${linkKeyPrefix}-${index}`;
        if (activeImages.has(key)) {
          const draggable = activeImages.get(key);
          document.body.removeChild(draggable.img);
          activeImages.delete(key);
        }
      });
    } else {
      // Remove single image
      if (activeImages.has(link)) {
        const draggable = activeImages.get(link);
        document.body.removeChild(draggable.img);
        activeImages.delete(link);
      }
    }
    spawnedImages.delete(link);
  }

function createImage(event, imageUrl) {
  const img = new Image();
  img.src = imageUrl;
  img.style.position = "fixed";
  img.style.pointerEvents = "auto";
  img.style.maxWidth = "25rem";
  img.style.maxHeight = "25rem";
  img.style.width = "auto";
  img.style.height = "auto";
  img.style.zIndex = "1000";
  img.style.willChange = "transform";
  img.style.transform = "translateZ(0)"; // Force GPU rendering
  document.body.appendChild(img);
  img.addEventListener("dragstart", (e) => e.preventDefault());
  return img;
}


  class DraggableImage {
    constructor(img, x, y) {
      this.img = img;
      this.x = x;
      this.y = y;
      this.vx = random(-2, 8);
      this.vy = random(-2, 8);
      this.isDragging = false;
      this.prevX = x;
      this.prevY = y;
      this.initDragEvents();
    }
    

    initDragEvents() {
      this.img.addEventListener("mousedown", (e) => this.startDrag(e));
      document.addEventListener("mousemove", (e) => this.drag(e));
      document.addEventListener("mouseup", () => this.stopDrag());
      this.img.addEventListener("dragstart", (e) => e.preventDefault());
    }

    startDrag(e) {
      this.isDragging = true;
      this.offsetX = e.clientX - this.x;
      this.offsetY = e.clientY - this.y;
      this.prevX = e.clientX;
      this.prevY = e.clientY;
      this.img.style.cursor = "grabbing";
    }

    drag(e) {
      if (!this.isDragging) return;
      this.vx = e.clientX - this.prevX;
      this.vy = e.clientY - this.prevY;
      this.x = e.clientX - this.offsetX;
      this.y = e.clientY - this.offsetY;
      this.prevX = e.clientX;
      this.prevY = e.clientY;
      this.updatePosition();
    }

    stopDrag() {
      this.isDragging = false;
      this.img.style.cursor = "grab";
    }

    updatePosition() {
      this.img.style.left = `${this.x}px`;
      this.img.style.top = `${this.y - currentScrollY}px`;
    }

    update() {
      if (!this.isDragging) {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.x = constrain(this.x, 0, window.innerWidth - this.img.width);
        this.y = constrain(this.y, 0, document.documentElement.scrollHeight - this.img.height);
        this.updatePosition();
      }
    }
  }

  function constrain(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function updateActiveImages() {
    currentScrollY = lerp(currentScrollY, targetScrollY, scrollEaseFactor);
    activeImages.forEach(imgData => imgData.update());
    requestAnimationFrame(updateActiveImages);
  }

  updateActiveImages();
});

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}