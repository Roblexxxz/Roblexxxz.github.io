// app.js

// Wait for the HTML to load before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Select elements from the HTML
    const emailInput = document.getElementById('email-field');
    const passwordInput = document.getElementById('pass-field');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const statusMsg = document.getElementById('status-msg');

    // Function to handle Log In
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (email === "" || password === "") {
            showMessage("Please enter both email and password.", "#ff5f5f");
        } else {
            // Here you would typically send data to a server
            console.log("Logging in with:", { email, password });
            showMessage("Logging in...", "#00b2ff");
        }
    });

    // Function to handle Sign Up
    signupBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (email === "" || password === "") {
            showMessage("Please fill in the fields to sign up.", "#ff5f5f");
        } else {
            console.log("Signing up with:", { email, password });
            showMessage("Account creation started!", "#00e676");
        }
    });

    // Helper function to display messages
    function showMessage(text, color) {
        statusMsg.textContent = text;
        statusMsg.style.color = color;
    }
});
