// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAmiSdmLGutt2kwljfpUtHRRkBKKFJKHbE",
    authDomain: "fir-javascriptcrud-fa5c9.firebaseapp.com",
    databaseURL: "https://fir-javascriptcrud-fa5c9-default-rtdb.firebaseio.com",
    projectId: "fir-javascriptcrud-fa5c9",
    storageBucket: "fir-javascriptcrud-fa5c9.appspot.com",
    messagingSenderId: "283386349642",
    appId: "1:283386349642:web:207ec2915f0d8464fdfeb3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Show Modal Function
function showModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-active');
    }
}

// Close Modal Function
function closeModalFunction() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-active');
    }
}

// Update UI when user logs in
function updateUIOnLogin(user) {
    const loginLink = document.querySelector('.navbar a[href="#login-modal"]');
    const userMenu = document.querySelector('.user-menu');

    if (loginLink) {
        loginLink.style.display = 'none';
    }
    if (userMenu) {
        userMenu.style.display = 'block';
    }
}

// Handle Registration Form Submission
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const repeatPassword = document.getElementById('repeat-password').value;

        if (password !== repeatPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (!isValidEmail(username)) {
            alert("Please enter a valid email address.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, username, password);
            const userId = userCredential.user.uid;

            await set(ref(db, "/users/" + userId), {
                username: username,
                createdAt: serverTimestamp()
            });

            alert("Registration successful!");
            registerForm.reset();
            closeModalFunction();
        } catch (error) {
            console.error("Error during registration:", error);
            alert("Registration failed: " + error.message);
        }
    });
}

// Handle Login Form Submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!isValidEmail(username)) {
            alert("Please enter a valid email address.");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, username, password);
            closeModalFunction();
            updateUIOnLogin(userCredential.user);
            // Automatically submit pending forms
            if (pendingContactFormData) {
                submitContactForm(pendingContactFormData);
                pendingContactFormData = null;
            }
            if (pendingFeedbackFormData) {
                submitFeedbackForm(pendingFeedbackFormData);
                pendingFeedbackFormData = null;
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("Login failed: " + error.message);
        }
    });
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        updateUIOnLogin(user);
        closeModalFunction();
    }
});

// Handle Log Out Button Click
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        signOut(auth).then(() => {
            localStorage.removeItem('userLoggedIn');
            
            const loginLink = document.querySelector('.navbar a[href="#login-modal"]');
            const userMenu = document.querySelector('.user-menu');
            
            if (loginLink) {
                loginLink.style.display = 'inline-block';
            }
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            
            window.location.reload();
        }).catch((error) => {
            console.error("Error during logout:", error);
            alert("Logout failed: " + error.message);
        });
    });
}

// Helper function to validate email
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Handle Contact Form Submission
let pendingContactFormData = null;
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener("submit", e => {
        e.preventDefault();
        
        if (!auth.currentUser) {
            pendingContactFormData = new FormData(contactForm);
            showModal();
            return;
        }

        submitContactForm(new FormData(contactForm));
    });
}

function submitContactForm(formData) {
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const message = formData.get("message") || "";
    const hiddenId = formData.get("hidden-id");
    const id = hiddenId ? hiddenId : Date.now().toString();

    if (!isValidEmail(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    set(ref(db, "/contact/" + id), {
        name: name,
        email: email,
        phone: phone,
        message: message,
        createdAt: serverTimestamp()
    })
    .then(() => {
        alert("Your contact information has been sent!");
        contactForm.reset();
        if (hiddenId) {
            hiddenId.value = "";
        }
    })
    .catch((error) => {
        console.error("Error saving contact data:", error);
        alert("An error occurred: " + error.message);
    });
}

// Handle Feedback Form Submission
let pendingFeedbackFormData = null;
const feedbackForm = document.getElementById('feedback-form');
const feedbackDisplay = document.getElementById('feedback-display');

if (feedbackForm) {
    feedbackForm.addEventListener("submit", e => {
        e.preventDefault();

        if (!auth.currentUser) {
            pendingFeedbackFormData = new FormData(feedbackForm);
            showModal();
            return;
        }

        submitFeedbackForm(new FormData(feedbackForm));
    });
}

function submitFeedbackForm(formData) {
    const feedbackName = formData.get("feedback-name");
    const feedbackMessage = formData.get("feedback-message");

    if (!feedbackMessage || feedbackMessage.trim() === "") {
        alert("Feedback message cannot be empty.");
        return;
    }

    set(ref(db, "/feedback/" + Date.now().toString()), {
        name: feedbackName || "Anonymous",
        message: feedbackMessage,
        createdAt: serverTimestamp()
    })
    .then(() => {
        feedbackForm.reset();
        alert("Feedback submitted successfully!");
        loadFeedback(); // Reload feedback after submission
    })
    .catch((error) => {
        console.error("Error saving feedback data:", error);
        alert("An error occurred: " + error.message);
    });
}

// Function to render feedback items
function renderFeedback(name, message) {
    const redactedName = name ? `${name.charAt(0)}${'*'.repeat(name.length - 1)}` : 'Anonymous';

    const feedbackItem = document.createElement('div');
    feedbackItem.classList.add('feedback-item');
    feedbackItem.innerHTML = `
        <p><strong>${redactedName}:</strong> ${message}</p>
    `;
    feedbackDisplay.appendChild(feedbackItem);
}
document.addEventListener('DOMContentLoaded', loadFeedback);

// Function to load existing feedback from Firebase and display it
function loadFeedback() {
    const feedbackRef = ref(db, 'feedback');
    onValue(feedbackRef, (snapshot) => {
        feedbackDisplay.innerHTML = ''; // Clear existing feedback
        snapshot.forEach((childSnapshot) => {
            const feedback = childSnapshot.val();
            renderFeedback(feedback.name, feedback.message);
        });
    });
}

// Event listener for modal close button
const closeModal = document.querySelector('.close-modal');
if (closeModal) {
    closeModal.addEventListener('click', closeModalFunction);
}

// Event listener to close modal if clicking outside the modal content
window.addEventListener('click', function(event) {
    const modal = document.getElementById('login-modal');
    if (modal && event.target === modal) {
        closeModalFunction();
    }
});

// Event listeners for switching between login and register forms
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');

if (showRegister && showLogin) {
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
    });
}

// Show modal when clicking on certain buttons or links
const openModalTriggers = document.querySelectorAll('.open-login-modal');
openModalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        if (!auth.currentUser) {
            showModal();
        }
    });
});



// Select necessary elements
let navbar = document.querySelector('.navbar');
let menuBtn = document.querySelector('#menu-btn');
let cartBtn = document.getElementById('cart-btn');
let cartItemsContainer = document.querySelector('.header .cart-items-container');
let navLinks = document.querySelectorAll('.navbar a');

// Toggle menu visibility
menuBtn.onclick = () => {
    if (cartItemsContainer.classList.contains('active')) {
        cartItemsContainer.classList.remove('active');
    }
    navbar.classList.toggle('active');
};

// Toggle cart items visibility
cartBtn.onclick = () => {
    if (!auth.currentUser) {
        showModal();
    } else {
        if (navbar.classList.contains('active')) {
            navbar.classList.remove('active');
        }
        cartItemsContainer.classList.toggle('active');
        console.log('Cart button clicked, active class toggled.'); // Debugging
    }
};

// Close menu and cart when scrolling
window.onscroll = () => {
    navbar.classList.remove('active');
    cartItemsContainer.classList.remove('active');
};

// Close menu when clicking on a nav link
navLinks.forEach(link => {
    link.onclick = () => {
        navbar.classList.remove('active');
    };
});

// Open the login modal when clicking on the "Log In" link
document.querySelector('.navbar a[href="#login-modal"]').addEventListener('click', function(e) {
    e.preventDefault();
    showModal();
});



