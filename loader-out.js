window.onload = function () {
    const loadingScreen = document.getElementById("loading-screen");
    const content = document.querySelector(".content");

    // Show the green loader (simulating a delay)
    loadingScreen.style.display = "block";

    setTimeout(() => {
        // Fade out the green loader
        loadingScreen.style.opacity = "0";

        // Reveal the content after loader disappears
        setTimeout(() => {
            loadingScreen.style.display = "none";
            content.style.opacity = "1";
        }, 1000); // Match fade-out time
    }, 500); // Delay before fade-out
}