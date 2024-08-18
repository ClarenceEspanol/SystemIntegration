// Import statements for Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

let cart = [];

// Load cart items from localStorage if available
function loadCartFromLocalStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

// Function to handle adding items to the cart
function addToCart(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const productID = button.getAttribute('data-id');
    const type = button.getAttribute('data-type');

    let productRef;
    if (type === 'school-supplies') {
        productRef = ref(db, `school-supplies/${productID}`);
    } else if (type === 'houseware') {
        productRef = ref(db, `houseware/${productID}`);
    }

    onValue(productRef, (snapshot) => {
        if (snapshot.exists()) {
            const product = snapshot.val();
            const cartItem = cart.find(item => item.id === productID);

            if (cartItem) {
                cartItem.quantity++;
            } else {
                cart.push({ ...product, id: productID, quantity: 1 });
            }

            // Save cart items to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            // Save cart items to Firebase
            const user = auth.currentUser;
            if (user) {
                set(ref(db, `cart-items/${user.uid}`), cart)
                    .catch(error => console.error('Error saving cart items to Firebase:', error));
            }

            updateCartDisplay();
        } else {
            console.log('Product not found in Firebase.');
        }
    });
}

// Function to handle removing items from the cart
function removeFromCart(productID) {
    cart = cart.filter(item => item.id !== productID);
    localStorage.setItem('cart', JSON.stringify(cart));

    // Save updated cart items to Firebase
    const user = auth.currentUser;
    if (user) {
        set(ref(db, `cart-items/${user.uid}`), cart)
            .catch(error => console.error('Error removing cart item from Firebase:', error));
    }

    updateCartDisplay();
}

// Function to handle updating item quantity in the cart
function updateQuantity(productID, quantity) {
    const cartItem = cart.find(item => item.id === productID);
    if (cartItem) {
        cartItem.quantity = quantity;
        if (cartItem.quantity <= 0) {
            removeFromCart(productID);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));

            // Save updated cart items to Firebase
            const user = auth.currentUser;
            if (user) {
                set(ref(db, `cart-items/${user.uid}`), cart)
                    .catch(error => console.error('Error updating cart item quantity in Firebase:', error));
            }

            updateCartDisplay();
        }
    }
}

// Function to update the cart display
function updateCartDisplay() {
    const cartItemsContainer = document.querySelector('#cart-items');
    const cartCount = document.querySelector('#cart-count');
    const cartTotal = document.querySelector('#total-price');

    if (!cartItemsContainer || !cartCount || !cartTotal) {
        console.log('Cart display elements not found.');
        return;
    }

    // Update cart count
    cartCount.textContent = cart.length;

    // Update total price
    cartTotal.textContent = `₱${calculateCartTotal()}`;

    // Update cart items
    cartItemsContainer.innerHTML = "";

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = 
            `<div class="item-image">
                <img src="${item.productImg}" alt="${item.name}" />
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">₱${item.price}</div>
                <div class="item-quantity">
                    <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                </div>
                <button class="remove-btn" data-id="${item.id}">X</button>
            </div>`;
        cartItemsContainer.appendChild(cartItem);
    });

    // Add event listeners for quantity buttons and remove buttons
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', handleQuantityChange);
    });

    cartItemsContainer.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', handleRemoveFromCart);
    });
}

// Function to handle quantity change
function handleQuantityChange(event) {
    const button = event.currentTarget;
    const productID = button.getAttribute('data-id');
    const action = button.getAttribute('data-action');
    
    const cartItem = cart.find(item => item.id === productID);
    if (cartItem) {
        const newQuantity = action === 'increase' ? cartItem.quantity + 1 : cartItem.quantity - 1;
        updateQuantity(productID, newQuantity);
    }
}

// Function to handle item removal from cart
function handleRemoveFromCart(event) {
    const button = event.currentTarget;
    const productID = button.getAttribute('data-id');
    removeFromCart(productID);
}

// Function to calculate the total price of items in the cart
function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

// Load cart items from Firebase when user logs in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Load cart from local storage first
        loadCartFromLocalStorage();

        const cartItemsRef = ref(db, `cart-items/${user.uid}`);
        onValue(cartItemsRef, (snapshot) => {
            if (snapshot.exists()) {
                const firebaseCart = snapshot.val() || [];
                // Merge with local cart if any
                cart = Array.isArray(firebaseCart) ? firebaseCart : [];
                // Update local storage with Firebase cart
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
            } else {
                console.log('No cart data found for the user.');
                cart = []; // Ensure cart is cleared if no data is found
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
            }
        });
    }
});

// Add event listeners to add-to-cart buttons
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', addToCart);
});

// Navbar, Search Form, and Cart Item Toggle
let navbar = document.querySelector('.navbar');
let searchForm = document.querySelector('.search-form');
let cartItem = document.querySelector('.cart-items-container');

if (navbar && searchForm && cartItem) {
    document.querySelector('#menu-btn').onclick = () => {
        navbar.classList.toggle('active');
        searchForm.classList.remove('active');
        cartItem.classList.remove('active');
    }

    document.querySelector('#search-btn').onclick = () => {
        searchForm.classList.toggle('active');
        cartItem.classList.remove('active');
        navbar.classList.remove('active');
    }

    document.querySelector('#cart-btn').onclick = () => {
        cartItem.classList.toggle('active');
        navbar.classList.remove('active');
        searchForm.classList.remove('active');
    }

    window.onscroll = () => {
        navbar.classList.remove('active');
        searchForm.classList.remove('active');
        cartItem.classList.remove('active');
    }
} else {
    console.log('One or more of the navbar, search form, or cart item elements are not found.');
}
