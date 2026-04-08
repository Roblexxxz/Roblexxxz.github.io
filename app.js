import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://gstatic.com";

// YOUR SPECIFIC CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCEL4Gedbqne1uxEo6esjrfq192wSA_Vf4",
  authDomain: "://firebaseapp.com",
  projectId: "roblox-ff098",
  storageBucket: "roblox-ff098.firebasestorage.app",
  messagingSenderId: "934102556891",
  appId: "1:934102556891:web:d48165c81c51101e80ecfe"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const emailInput = document.getElementById('email-field');
const passInput = document.getElementById('pass-field');
const statusMsg = document.getElementById('status-msg');

// SIGN UP (Create Account)
document.getElementById('signup-btn').onclick = () => {
    createUserWithEmailAndPassword(auth, emailInput.value, passInput.value)
    .then((userCredential) => {
        statusMsg.style.color = "#00ff00";
        statusMsg.innerText = "Account Created! You are logged in.";
    })
    .catch((error) => {
        statusMsg.style.color = "#ff5f5f";
        if (error.code === 'auth/email-already-in-use') {
            statusMsg.innerText = "That username is taken!";
        } else {
            statusMsg.innerText = error.message;
        }
    });
};

// LOG IN
document.getElementById('login-btn').onclick = () => {
    signInWithEmailAndPassword(auth, emailInput.value, passInput.value)
    .then((userCredential) => {
        statusMsg.style.color = "#00ff00";
        statusMsg.innerText = "Success! Loading game...";
        // window.location.href = "game.html"; // UNCOMMENT THIS LATER
    })
    .catch((error) => {
        statusMsg.style.color = "#ff5f5f";
        statusMsg.innerText = "Wrong password or user doesn't exist.";
    });
};

// STAY LOGGED IN
onAuthStateChanged(auth, (user) => {
    if (user) {
        statusMsg.style.color = "#00ff00";
        statusMsg.innerText = "Signed in as: " + user.email;
    }
});
