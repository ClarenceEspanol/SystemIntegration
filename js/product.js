import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
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

let cart = [];
let isLoggedIn = false;
let userId = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        isLoggedIn = true;
        userId = user.uid;
        fetchCartData();  // Fetch cart data when user logs in
    } else {
        isLoggedIn = false;
        userId = null;
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
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

// Fetch cart data from Firebase and update local storage and display
function fetchCartData() {
    const cartRef = ref(db, 'cart-items');  // Fetch cart items from `cart-items` node

    onValue(cartRef, (snapshot) => {
        if (snapshot.exists()) {
            cart = [];
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                cart.push(product);
            });
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        } else {
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }, (error) => {
        console.error('Error fetching cart data from Firebase:', error);
    });
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

    // Fetch product data
    onValue(productRef, (snapshot) => {
        if (snapshot.exists()) {
            const product = snapshot.val();
            
            // Check if the product is already in the cart
            const cartItemIndex = cart.findIndex(item => item.id === productID);

            if (cartItemIndex > -1) {
                // Update existing item quantity
                cart[cartItemIndex].quantity++;
            } else {
                // Add new item with initial quantity of 1
                cart.push({ ...product, id: productID, quantity: 1 });
            }

            // Save updated cart to Firebase
            saveCartToFirebase();
            updateCartDisplay();
        } else {
            console.log('Product does not exist in Firebase.');
        }
    }, (error) => {
        console.error('Error fetching product data from Firebase:', error);
    });
}




// Function to handle updating item quantity in the cart
function updateQuantity(productID, quantity) {
    const cartItemIndex = cart.findIndex(item => item.id === productID);
    if (cartItemIndex > -1) {
        if (quantity <= 0) {
            removeFromCart(productID);
        } else {
            cart[cartItemIndex].quantity = quantity;
            // Save updated cart to Firebase
            saveCartToFirebase();
            updateCartDisplay();
        }
    }
}

// Function to handle removing items from the cart
function removeFromCart(productID) {
    cart = cart.filter(item => item.id !== productID);
    // Save updated cart to Firebase
    saveCartToFirebase();
    updateCartDisplay();
}

// Function to save the current cart to Firebase
function saveCartToFirebase() {
    const cartRef = ref(db, 'cart-items');

    // Convert cart array to an object with product IDs as keys
    const cartObject = cart.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {});

    set(cartRef, cartObject).then(() => {
        console.log('Cart saved successfully');
    }).catch((error) => {
        console.error('Error saving cart to Firebase:', error);
    });
}


// Function to load the cart from Firebase and update the display
function loadCartFromFirebase() {
    const cartRef = ref(db, 'cart-items');
    onValue(cartRef, (snapshot) => {
        if (snapshot.exists()) {
            cart = snapshot.val();
            if (!Array.isArray(cart)) {
                cart = []; // Reset to empty array if data is not an array
            }
            updateCartDisplay();
        }
    });
}

// Function to update the cart display
function updateCartDisplay() {
    const cartItemsContainer = document.querySelector('#cart-items');
    const cartCount = document.querySelector('#cart-count');
    const cartTotal = document.querySelector('.cart-total .price');

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
        button.addEventListener('click', (event) => {
            const button = event.currentTarget;
            const productID = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');
            const quantityChange = action === 'increase' ? 1 : -1;
            const currentQuantity = cart.find(item => item.id === productID).quantity;
            updateQuantity(productID, currentQuantity + quantityChange);
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

// Function to calculate the total price of items in the cart
function calculateCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}
// Attach event listener to "Add to Cart" buttons
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', addToCart);
    });
});
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromFirebase(); // Load the cart from Firebase on page 
    displayHousewareProducts();
    displayProducts();
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