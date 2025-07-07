document.getElementById("start-transition").addEventListener("click", function () {
    const transitionScreen = document.getElementById("transition-screen");
    
    // Make the screen black
    transitionScreen.style.opacity = "1";
    transitionScreen.style.pointerEvents = "all";

    // Wait for the transition, then redirect to menu.html
    setTimeout(() => {
        window.location.href = "menu.html";
    }, 900); // Match the transition duration
})