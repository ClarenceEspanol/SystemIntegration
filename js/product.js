import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAmiSdmLGutt2kwljfpUtHRRkBKKFJKHbE",
    authDomain: "fir-javascriptcrud-fa5c9.firebaseapp.com",
    databaseURL: "https://fir-javascriptcrud-fa5c9-default-rtdb.firebaseio.com",
    projectId: "fir-javascriptcrud-fa5c9",
    storageBucket: "fir-javascriptcrud-fa5c9.appspot.com",
    messagingSenderId: "283386349642",
    appId: "1:283386349642:web:207ec2915f0d8464fdfeb3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const dbRefSchoolSupplies = ref(db, 'school-supplies');
const dbRefHouseware = ref(db, 'houseware');

// Cart initialization
let cart = JSON.parse(localStorage.getItem('cart')) || [];
updateCartDisplay();

let isLoggedIn = false;
let userId = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        isLoggedIn = true;
        userId = user.uid;
        // Fetch user-specific cart data from Firebase
        fetchCartData();
    } else {
        isLoggedIn = false;
        userId = null;
        // Reset cart data if not logged in
        cart = [];
        updateCartDisplay();
    }
});

function displayProducts() {
    const boxContainer = document.querySelector('.school .box-container');
    if (boxContainer) {
        console.log('Fetching school supplies...');
        boxContainer.innerHTML = "";
        onValue(dbRefSchoolSupplies, (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const product = childSnapshot.val();
                    const productID = childSnapshot.key;
                    const box = createProductBox({ ...product, id: productID }, 'school-supplies');
                    boxContainer.appendChild(box);
                });
            } else {
                console.log('No school supplies available');
            }
        }, (error) => {
            console.error('Error fetching school supplies from Firebase:', error);
        });
    }
}

function displayHousewareProducts() {
    const boxContainer = document.querySelector('.houseware .box-container');
    if (boxContainer) {
        console.log('Fetching houseware products...');
        boxContainer.innerHTML = "";
        onValue(dbRefHouseware, (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const product = childSnapshot.val();
                    const productID = childSnapshot.key;
                    const box = createProductBox({ ...product, id: productID }, 'houseware');
                    boxContainer.appendChild(box);
                });
            } else {
                console.log('No houseware products available');
            }
        }, (error) => {
            console.error('Error fetching houseware products from Firebase:', error);
        });
    }
}

function createProductBox(product, type) {
    const box = document.createElement('div');
    box.className = 'box';
    box.setAttribute('data-name', product.name);
    box.setAttribute('data-price', product.price);

    box.innerHTML = `
        <div class="image">
            <img src="${product.productImg}" alt="${product.name}" />
        </div>
        <div class="content">
            <h3>${product.name}</h3>
            <div class="stars">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
            </div>
            <div class="price">₱${product.price}</div>
            <div class="stock">
                <span>Stock:</span>
                <span class="stock-quantity">${product.quantity}</span>
            </div>
            <a href="#" class="btn add-to-cart-btn" data-id="${product.id}" data-type="${type}">Add to Cart</a>
        </div>
    `;

    return box;
}

function addToCart(event) {
    if (event.target.classList.contains('add-to-cart-btn')) {
        event.preventDefault();
        if (!isLoggedIn) {
            showLoginModal();
            return;
        }

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

                if (userId) {
                    set(ref(db, `users/${userId}/cart-items`), cart);  // Update here
                }

                // Save updated cart to local storage
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
            }
        });
    }
}

function fetchCartData() {
    if (userId) {
        const userCartRef = ref(db, `users/${userId}/cart-items`);  // Update here
        onValue(userCartRef, (snapshot) => {
            if (snapshot.exists()) {
                cart = snapshot.val();
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
            } else {
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartDisplay();
            }
        });
    }
}

function updateQuantity(productID, quantity) {
    const cartItem = cart.find(item => item.id === productID);
    if (cartItem) {
        cartItem.quantity = quantity;
        if (cartItem.quantity <= 0) {
            removeFromCart(productID);
        } else {
            // Save updated cart to local storage
            if (userId) {
                set(ref(db, `users/${userId}/cart-items`), cart);  // Update here
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }
}

function removeFromCart(productID) {
    cart = cart.filter(item => item.id !== productID);

    // Save updated cart to local storage
    if (userId) {
        set(ref(db, `users/${userId}/cart-items`), cart);  // Update here
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function showLoginModal() {
    const loginModal = document.querySelector('#login-modal');
    if (loginModal) {
        loginModal.style.display = 'block';
    }
}

function updateCartDisplay() {
    const cartItemsContainer = document.querySelector('#cart-items');
    const cartCount = document.querySelector('#cart-count');
    const cartTotal = document.querySelector('.cart-total .price');

    if (!cartItemsContainer || !cartCount || !cartTotal) return;

    // Update cart count
    cartCount.textContent = cart.length;

    // Update total price
    cartTotal.textContent = `₱${calculateCartTotal()}`;

    // Update cart items
    cartItemsContainer.innerHTML = "";

    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-image">
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
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    // Add event listeners for quantity buttons and remove buttons
    cartItemsContainer.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const button = event.currentTarget;
            const productID = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');
            const quantityChange = action === 'increase' ? 1 : -1;
            updateQuantity(productID, cart.find(item => item.id === productID).quantity + quantityChange);
        });
    });

    cartItemsContainer.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const button = event.currentTarget;
            const productID = button.getAttribute('data-id');
            removeFromCart(productID);
        });
    });
}

function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.querySelector('#cart-btn');
    const cartContainer = document.querySelector('#cart-container');

    if (cartBtn && cartContainer) {
        cartBtn.addEventListener('click', () => {
            console.log('Cart button clicked, active class toggled.');
            cartContainer.style.display = cartContainer.style.display === 'block' ? 'none' : 'block';
        });
    } else {
        console.error('Cart button or container not found.');
    }

    displayProducts();
    displayHousewareProducts();
    document.querySelector('.box-container').addEventListener('click', addToCart);
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