import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, get, serverTimestamp  } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword ,createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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


// Function to get user data from Firebase
function getUserData(userId, callback) {
    const userRef = ref(db, `users/${userId}`);

    // Get profile and address data
    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            callback(userData);
        }
    });
}

// Display profile and address data in the modal
function displayProfileData(data) {
    const currentProfileData = document.getElementById('current-profile-data');
    const currentAddressData = document.getElementById('current-address-data');

    if (data.user_profile) {
        currentProfileData.innerHTML = `
            <p><strong>Name:</strong> ${data.user_profile.name || 'N/A'}</p>
            <p><strong>Birthday:</strong> ${data.user_profile.birthday || 'N/A'}</p>
            <p><strong>Email:</strong> ${data.user_profile.email || 'N/A'}</p>
        `;
        // Pre-fill the profile form with current data
        document.getElementById('profile-name').value = data.user_profile.name || '';
        document.getElementById('profile-bday').value = data.user_profile.birthday || '';
        document.getElementById('profile-email').value = data.user_profile.email || '';
    }

    if (data.user_address) {
        currentAddressData.innerHTML = `
            <p><strong>Contact Name:</strong> ${data.user_address.contactName || 'N/A'}</p>
            <p><strong>Phone Number:</strong> ${data.user_address.phone || 'N/A'}</p>
            <p><strong>Address:</strong> ${data.user_address.address || 'N/A'}</p>
            <p><strong>House Number:</strong> ${data.user_address.houseNumber || 'N/A'}</p>
            <p><strong>City:</strong> ${data.user_address.city || 'N/A'}</p>
            <p><strong>State/Province:</strong> ${data.user_address.state || 'N/A'}</p>
            <p><strong>Region:</strong> ${data.user_address.region || 'N/A'}</p>
            <p><strong>Zip/Postal Code:</strong> ${data.user_address.zip || 'N/A'}</p>
        `;
        // Pre-fill the address form with current data
        document.getElementById('contact-name').value = data.user_address.contactName || '';
        document.getElementById('contact-phone').value = data.user_address.phone || '';
        document.getElementById('address').value = data.user_address.address || '';
        document.getElementById('house-number').value = data.user_address.houseNumber || '';
        document.getElementById('city').value = data.user_address.city || '';
        document.getElementById('state').value = data.user_address.state || '';
        document.getElementById('region').value = data.user_address.region || '';
        document.getElementById('zip').value = data.user_address.zip || '';
    }
}

// Update profile function
document.getElementById('update-profile-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        const profileName = document.getElementById('profile-name').value;
        const profileBday = document.getElementById('profile-bday').value;
        const profileEmail = document.getElementById('profile-email').value;

        // Update user profile in Firebase
        const userProfileRef = ref(db, `users/${user.uid}/user_profile`);
        set(userProfileRef, {
            name: profileName,
            birthday: profileBday,
            email: profileEmail
        }).then(() => {
            alert('Profile updated successfully!');
            // Refresh profile display
            getUserData(user.uid, (data) => {
                displayProfileData(data);
            });
        }).catch((error) => {
            console.error('Error updating profile:', error);
        });
    } else {
        alert('No user is signed in.');
    }
});

// Update address function
document.getElementById('update-address-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        const contactName = document.getElementById('contact-name').value;
        const contactPhone = document.getElementById('contact-phone').value;
        const address = document.getElementById('address').value;
        const houseNumber = document.getElementById('house-number').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const region = document.getElementById('region').value;
        const zip = document.getElementById('zip').value;

        // Update user address in Firebase
        const userAddressRef = ref(db, `users/${user.uid}/user_address`);
        set(userAddressRef, {
            contactName,
            phone: contactPhone,
            address,
            houseNumber,
            city,
            state,
            region,
            zip
        }).then(() => {
            alert('Address updated successfully!');
            // Refresh address display
            getUserData(user.uid, (data) => {
                displayProfileData(data);
            });
        }).catch((error) => {
            console.error('Error updating address:', error);
        });
    } else {
        alert('No user is signed in.');
    }
});



// Update password function
document.getElementById('save-password-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;

        if (newPassword === confirmNewPassword) {
            // Re-authenticate the user and update the password
            signInWithEmailAndPassword(auth, user.email, oldPassword)
                .then(() => {
                    updatePassword(user, newPassword).then(() => {
                        alert('Password updated successfully!');
                    }).catch((error) => {
                        console.error('Error updating password:', error);
                    });
                }).catch((error) => {
                    console.error('Error re-authenticating user:', error);
                });
        } else {
            alert('New passwords do not match.');
        }
    } else {
        alert('No user is signed in.');
    }
});

// Show profile modal
function showProfileModal() {
    const user = auth.currentUser;
    if (user) {
        getUserData(user.uid, (data) => {
            displayProfileData(data);
        });
        document.getElementById('profile-modal').style.display = 'block';
    } else {
        alert('No user is signed in.');
    }
}

// Hide profile modal
function hideProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

// Add event listener to the view profile button
document.getElementById('view-profile-btn').addEventListener('click', showProfileModal);

// Add event listener to the close button
document.getElementById('close-profile-modal').addEventListener('click', hideProfileModal);

// Optional: Hide the modal if the user clicks outside the modal content
window.onclick = function(event) {
    const modal = document.getElementById('profile-modal');
    if (event.target === modal) {
        hideProfileModal();
    }
};
// Log out function
document.getElementById('logout-btn').addEventListener('click', () => {
    const auth = getAuth(); // Initialize auth here if not already done
    signOut(auth).then(() => {
        alert('Log out successfully.');
        // Redirect to login page or another page
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
        alert('An error occurred while signing out. Please try again.');
    });
});

// Reference to the 'School Supplies' node
const dbRefSchoolSupplies = ref(db, "school-supplies");
const dbRefHouseware = ref(db, "houseware");

// Cart initialization
let cart = [];
updateCartDisplay();

// Function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Function to display products in the .school section
function displayProducts() {
    const boxContainer = document.querySelector('.school .box-container');
    boxContainer.innerHTML = ""; // Clear existing content

    onValue(dbRefSchoolSupplies, (snapshot) => {
        const products = [];

        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                const productID = childSnapshot.key;
                products.push({ ...product, id: productID });
            });

            // Shuffle the products array
            shuffleArray(products);

            // Limit to 6 products
            const limitedProducts = products.slice(0, 6);

            // Display the limited products
            limitedProducts.forEach(product => {
                const box = createProductBox(product, 'school-supplies');
                boxContainer.appendChild(box);
            });

            // Add event listeners to "Add to Cart" buttons
            document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                button.addEventListener('click', addToCart);
            });
        } else {
            console.log('No products available');
        }
    }, {
        onlyOnce: true // Optional: only fetch data once, not on every change
    });
}

// Function to display houseware products in the .houseware section
function displayHousewareProducts() {
    const boxContainer = document.querySelector('.houseware .box-container');
    boxContainer.innerHTML = ""; // Clear existing content

    onValue(dbRefHouseware, (snapshot) => {
        const products = [];

        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const product = childSnapshot.val();
                const productID = childSnapshot.key;
                products.push({ ...product, id: productID });
            });

            // Shuffle the products array
            shuffleArray(products);

            // Limit to 6 products
            const limitedProducts = products.slice(0, 6);

            // Display the limited products
            limitedProducts.forEach(product => {
                const box = createProductBox(product, 'houseware');
                boxContainer.appendChild(box);
            });

            // Add event listeners to "Add to Cart" buttons
            document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                button.addEventListener('click', addToCart);
            });
        } else {
            console.log('No products available');
        }
    }, {
        onlyOnce: true // Optional: only fetch data once, not on every change
    });
}

// Function to create a product box element
function createProductBox(product, type) {
    const box = document.createElement('div');
    box.className = 'box';
    box.setAttribute('data-name', product.name);
    box.setAttribute('data-price', product.price);
    box.setAttribute('data-id', product.id); // Add ID to box for easy reference

    // Populate the box with content
    box.innerHTML = 
        `<div class="image">
            <img src="${product.productImg}" alt="${product.name}" />
        </div>
        <div class="content">
            <h3>${product.name}</h3>
            <div class="price">₱${product.price}</div>
            <div class="stock">
                <span>Stock:</span>
                <span class="stock-quantity">${product.quantity}</span>
            </div>
            <a href="#" class="btn add-to-cart-btn" data-id="${product.id}" data-type="${type}">Add to Cart</a>
        </div>`;

    // Add event listener to handle add-to-cart action
    box.querySelector('.add-to-cart-btn').addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        
        // Call the addToCart function
        addToCart(event);
    });

    return box;
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
            const cartItemIndex = cart.findIndex(item => item.id === productID);

            if (cartItemIndex > -1) {
                // Update the quantity of the existing item
                cart[cartItemIndex].quantity = Math.max(cart[cartItemIndex].quantity - 1, 1);
            } else {
                // Add the item to the cart with a default quantity of 1
                const newItem = { ...product, id: productID, quantity: 1 };
                cart.push(newItem);
            }

            // Save updated cart to Firebase
            saveCartToFirebase();
            updateCartDisplay();
        }
    });
}
// Function to handle removing items from the cart
function removeFromCart(productID) {
    cart = cart.filter(item => item.id !== productID);

    // Save updated cart to Firebase
    saveCartToFirebase();
    updateCartDisplay();
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
                <div class="item-type">Type: ${item.type}</div>
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromFirebase(); // Load the cart from Firebase on page load
    displayProducts();
    displayHousewareProducts();
});

//checkout
document.addEventListener('DOMContentLoaded', () => {
    const checkoutBtn = document.getElementById('checkoutbtn');
    const modal = document.getElementById('checkout-modal');
    const closeBtn = document.querySelector('.close-btn');
    const confirmBtn = document.getElementById('confirm-checkout');

    checkoutBtn.addEventListener('click', (event) => {
        event.preventDefault();
        populateCheckoutModal();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    confirmBtn.addEventListener('click', async () => {
        const paymentMethod = document.getElementById('payment-method').value;
        if (!paymentMethod) {
            alert('Please select a payment method.');
            return;
        }

        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;

            // Generate the order ID
            const currentDate = new Date();
            const day = String(currentDate.getDate()).padStart(2, '0');
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const year = String(currentDate.getFullYear()).slice(-2);
            const dateStr = `${day}${month}${year}`;
            
            const dateCountRef = ref(db, `order-count/${dateStr}`);
            const newOrderRef = ref(db, `orders/${userId}`);
            
            let orderCount = 1;
            await get(dateCountRef).then((snapshot) => {
                if (snapshot.exists()) {
                    orderCount = snapshot.val() + 1;
                }
            });

            // Update the count for the date
            await set(dateCountRef, orderCount);

            // Create the order ID
            const orderId = `${dateStr}_${String(orderCount).padStart(2, '0')}`;

            // Get cart items
            const cartItemsRef = ref(db, 'cart-items');
            onValue(cartItemsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const cartItems = snapshot.val();
                    const totalPrice = Object.values(cartItems).reduce((acc, item) => acc + item.price * item.quantity, 0);

                    // Create order object with status
                    const orderData = {
                        orderId: orderId,
                        userId: userId,
                        paymentMethod: paymentMethod,
                        totalPrice: totalPrice,
                        items: cartItems,
                        timestamp: Date.now(), // Store the order timestamp
                        orderStatus: 'Pending' // Initial status
                    };

                    // Save the order data to Firebase
                    set(push(newOrderRef), orderData)
                        .then(() => {
                            alert(`Checkout confirmed with payment method: ${paymentMethod}`);

                            // Clear the cart items
                            remove(cartItemsRef)
                                .then(() => {
                                    modal.style.display = 'none';
                                    document.getElementById('checkout-items').innerHTML = '<p>No items in cart.</p>';
                                    document.getElementById('checkout-total').textContent = '₱0.00';
                                    // Reload the page
                                    location.reload();
                                })
                                .catch((error) => {
                                    console.error('Error clearing cart items:', error);
                                });
                        })
                        .catch((error) => {
                            console.error('Error saving order data:', error);
                        });
                } else {
                    alert('No items in cart to checkout.');
                }
            });
        } else {
            alert('You must be logged in to complete the checkout.');
        }
    });

    function populateCheckoutModal() {
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;

            // Fetch user profile information from Firebase 'users/{userId}/user_profile' node
            const userProfileRef = ref(db, 'users/' + userId + '/user_profile');
            onValue(userProfileRef, (snapshot) => {
                const userProfile = snapshot.val();
                if (userProfile) {
                    document.getElementById('user-name').textContent = 'Name: ' + (userProfile.name || 'N/A');
                    document.getElementById('user-email').textContent = 'Email: ' + (userProfile.email || 'N/A');
                } else {
                    document.getElementById('user-name').textContent = 'Name: N/A';
                    document.getElementById('user-email').textContent = 'Email: N/A';
                }
            });

            // Fetch user address from Firebase 'users/{userId}/user_address' node
            const userAddressRef = ref(db, 'users/' + userId + '/user_address');
            onValue(userAddressRef, (snapshot) => {
                const userAddress = snapshot.val();
                if (userAddress) {
                    document.getElementById('user-address').innerHTML = `
                        <p><strong>Address:</strong> ${userAddress.address || 'N/A'}</p>
                        <p><strong>City:</strong> ${userAddress.city || 'N/A'}</p>
                        <p><strong>Phone Number:</strong> ${userAddress.phone || 'N/A'}</p>
                        <p><strong>Region:</strong> ${userAddress.region || 'N/A'}</p>
                        <p><strong>State/Province:</strong> ${userAddress.state || 'N/A'}</p>
                        <p><strong>Zip/Postal Code:</strong> ${userAddress.zip || 'N/A'}</p>
                    `;
                } else {
                    document.getElementById('user-address').innerHTML = `
                        <p><strong>Address:</strong> N/A</p>
                        <p><strong>City:</strong> N/A</p>
                        <p><strong>Phone Number:</strong> N/A</p>
                        <p><strong>Region:</strong> N/A</p>
                        <p><strong>State/Province:</strong> N/A</p>
                        <p><strong>Zip/Postal Code:</strong> N/A</p>
                    `;
                }
            });

        } else {
            document.getElementById('user-name').textContent = 'Name: Guest';
            document.getElementById('user-email').textContent = 'Email: N/A';
            document.getElementById('user-address').innerHTML = `
                <p><strong>Address:</strong> N/A</p>
                <p><strong>City:</strong> N/A</p>
                <p><strong>Phone Number:</strong> N/A</p>
                <p><strong>Region:</strong> N/A</p>
                <p><strong>State/Province:</strong> N/A</p>
                <p><strong>Zip/Postal Code:</strong> N/A</p>
            `;
        }

        // Fetch cart items from Firebase
        const cartItemsRef = ref(db, 'cart-items');
        onValue(cartItemsRef, (snapshot) => {
            if (snapshot.exists()) {
                const cartItems = snapshot.val();
                const cartItemsContainer = document.getElementById('checkout-items');
                let totalPrice = 0;

                cartItemsContainer.innerHTML = '';
                Object.values(cartItems).forEach(item => {
                    cartItemsContainer.innerHTML += `
                        <div class="checkout-item">
                            <img src="${item.productImg}" alt="${item.name}" style="width: 100px; height: auto;" />
                            <p>${item.name} - ₱${item.price.toFixed(2)}</p>
                        </div>
                    `;
                    totalPrice += item.price * item.quantity;
                });

                document.getElementById('checkout-total').textContent = `₱${totalPrice.toFixed(2)}`;
            } else {
                document.getElementById('checkout-items').innerHTML = '<p>No items in cart.</p>';
                document.getElementById('checkout-total').textContent = '₱0.00';
            }
        });
    }
});





//trackorder
document.addEventListener('DOMContentLoaded', () => {
    const trackOrdersLink = document.getElementById('track-orders-link');
    const trackOrdersModal = document.getElementById('track-orders-modal');
    const orderHistoryModal = document.getElementById('order-history-modal');
    const closeModalBtn = document.querySelectorAll('.track-modal .close-btn');
    const ordersList = document.getElementById('orders-list');
    const historyList = document.getElementById('history-list');
    const totalPriceElement = document.getElementById('total-price');
    const viewHistoryBtn = document.getElementById('view-history-btn');

    if (trackOrdersLink) {
        trackOrdersLink.addEventListener('click', (event) => {
            event.preventDefault();
            populateOrdersModal();
            trackOrdersModal.style.display = 'block';
        });
    }

    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', () => {
            trackOrdersModal.style.display = 'none';
            populateOrderHistoryModal();
            orderHistoryModal.style.display = 'block';
        });
    }

    closeModalBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            trackOrdersModal.style.display = 'none';
            orderHistoryModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === trackOrdersModal || event.target === orderHistoryModal) {
            trackOrdersModal.style.display = 'none';
            orderHistoryModal.style.display = 'none';
        }
    });

    async function populateOrdersModal() {
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
            const ordersRef = ref(db, `orders/${userId}`);
            
            onValue(ordersRef, (snapshot) => {
                let cumulativeTotalPrice = 0; // Initialize cumulative total price
    
                if (snapshot.exists()) {
                    const orders = snapshot.val();
                    ordersList.innerHTML = ''; // Clear existing content
    
                    Object.entries(orders).forEach(([orderKey, order]) => {
                        const orderItem = document.createElement('div');
                        orderItem.className = 'order-item';
                        
                        let orderTotal = 0;
    
                        Object.entries(order.items).forEach(([itemKey, item]) => {
                            const itemTotal = item.price * item.quantity;
                            orderTotal += itemTotal; // Calculate total for this order
                            cumulativeTotalPrice += itemTotal; // Add to cumulative total
    
                            orderItem.innerHTML += `
                                <div class="order-item-details">
                                    <img src="${item.productImg}" alt="${item.name}" style="width: 80px; height: auto;" />
                                    <p>${item.name} - ₱${item.price.toFixed(2)} x ${item.quantity}</p>
                                </div>
                            `;
                        });
    
                        orderItem.innerHTML += `
                            <p><strong>Order ID:</strong> ${order.orderId}</p>
                            <p><strong>Total Price:</strong> ₱${orderTotal.toFixed(2)}</p>
                            <p><strong>Status:</strong> ${order.orderStatus}</p>
                            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                            <button class="cancel-btn" data-order-id="${orderKey}">Cancel Order</button>
                        `;
                        ordersList.appendChild(orderItem);
                    });
    
                    // Update the total price container with the cumulative total price
                    totalPriceElement.textContent = `₱${cumulativeTotalPrice.toFixed(2)}`;
    
                    // Add event listener for cancel buttons
                    document.querySelectorAll('.cancel-btn').forEach(btn => {
                        btn.addEventListener('click', async (event) => {
                            const orderKey = event.target.getAttribute('data-order-id');
                            console.log('Attempting to cancel order ID:', orderKey);
    
                            const orderRef = ref(db, `orders/${userId}/${orderKey}`);
                            const historyRef = ref(db, `order-history/${userId}/${orderKey}`);
    
                            try {
                                const orderSnapshot = await get(orderRef);
                                if (orderSnapshot.exists()) {
                                    const orderData = orderSnapshot.val();
                                    const status = orderData.orderStatus;
    
                                    console.log('Order data retrieved:', orderData);
    
                                    if (status === 'Pending') {
                                        await set(historyRef, {
                                            ...orderData,
                                            orderStatus: 'Canceled',
                                            canceledDate: new Date().toISOString()
                                        });
                                        await remove(orderRef);
                                        alert('Order canceled successfully.');
                                        populateOrdersModal(); // Refresh the orders list
                                        populateOrderHistoryModal(); // Refresh the order history list
                                    } else {
                                        alert('Order cannot be canceled. Only orders with "Pending" status can be canceled.');
                                    }
                                } else {
                                    console.error('Order does not exist in database:', orderKey);
                                    alert('Order does not exist.');
                                }
                            } catch (error) {
                                console.error('Error retrieving or removing order:', error);
                            }
                        });
                    });
                } else {
                    ordersList.innerHTML = '<p>No orders found.</p>';
                    totalPriceElement.textContent = '₱0.00'; // Set total price to ₱0.00 when no orders exist
                }
            });
        } else {
            ordersList.innerHTML = '<p>You need to log in to view orders.</p>';
            totalPriceElement.textContent = '₱0.00'; // Set total price to ₱0.00 for logged out users
        }
    }

    async function populateOrderHistoryModal() {
        const user = auth.currentUser;
        
        if (user) {
            const userId = user.uid;
            const historyRef = ref(db, `order-history/${userId}`);
        
            try {
                const snapshot = await get(historyRef);
                if (snapshot.exists()) {
                    const orders = snapshot.val();
                    historyList.innerHTML = ''; // Clear existing content
    
                    // Convert orders object to an array of entries
                    const ordersArray = Object.entries(orders);
    
                    // Sort orders by timestamp (latest first)
                    ordersArray.sort(([aKey, aOrder], [bKey, bOrder]) => {
                        const aTimestamp = aOrder.timestamp ? new Date(aOrder.timestamp).getTime() : 0;
                        const bTimestamp = bOrder.timestamp ? new Date(bOrder.timestamp).getTime() : 0;
                        return bTimestamp - aTimestamp; // Sort in descending order
                    });
    
                    console.log('Order history retrieved and sorted:', ordersArray);
    
                    // Display all sorted orders
                    ordersArray.forEach(([orderKey, order]) => {
                        const orderItem = document.createElement('div');
                        orderItem.className = 'order-item';
    
                        let orderTotal = 0;
    
                        Object.values(order.items).forEach(item => {
                            orderTotal += item.price * item.quantity;
    
                            orderItem.innerHTML += `
                                <div class="order-item-details">
                                    <img src="${item.productImg}" alt="${item.name}" style="width: 80px; height: auto;" />
                                    <p>${item.name} - ₱${item.price.toFixed(2)} x ${item.quantity}</p>
                                </div>
                            `;
                        });
    
                        orderItem.innerHTML += `
                            <p><strong>Order ID:</strong> ${order.orderId || 'N/A'}</p>
                            <p><strong>Total Price:</strong> ₱${orderTotal.toFixed(2)}</p>
                            <p><strong>Status: ${order.orderStatus}</strong></p>
                            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
                            <p><strong>Order Date:</strong> ${order.timestamp ? new Date(order.timestamp).toLocaleDateString() : 'N/A'}</p>
                            <button class="reorder-btn" data-order-id="${orderKey}">Reorder</button>
                        `;
                        historyList.appendChild(orderItem);
                    });
    
                    // Add event listener for reorder buttons
                    document.querySelectorAll('.reorder-btn').forEach(btn => {
                        btn.addEventListener('click', async (event) => {
                            const orderKey = event.target.getAttribute('data-order-id');
                            const cartRef = ref(db, `cart-items/`);
                            const historyRef = ref(db, `order-history/${userId}/${orderKey}`);
    
                            try {
                                const orderSnapshot = await get(historyRef);
                                if (orderSnapshot.exists()) {
                                    const orderData = orderSnapshot.val();
                                    const items = orderData.items;
    
                                    const cartItemsSnapshot = await get(cartRef);
                                    const itemIds = cartItemsSnapshot.val() || {};
                                    const newItemId = Object.keys(itemIds).length + 1;
    
                                    for (let itemKey in items) {
                                        const item = items[itemKey];
                                        const newCartItemRef = ref(db, `cart-items/${newItemId}`);
                                        await set(newCartItemRef, item);
                                    }
    
                                    alert('Items reordered and added to cart.');
                                } else {
                                    console.error('Order does not exist in order history:', orderKey);
                                    alert('Order does not exist in order history.');
                                }
                            } catch (error) {
                                console.error('Error retrieving or adding items to cart:', error);
                            }
                        });
                    });
    
                } else {
                    historyList.innerHTML = '<p>No order history found.</p>';
                }
            } catch (error) {
                console.error('Error retrieving order history:', error);
                historyList.innerHTML = '<p>Error loading order history.</p>';
            }
        } else {
            historyList.innerHTML = '<p>You need to log in to view order history.</p>';
        }
    }
});








// Ensure this script is executed after DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.querySelector('.modal');
    const modalContent = document.querySelector('.modal-content');

    function centerModal() {
        const windowHeight = window.innerHeight;
        const modalHeight = modalContent.offsetHeight;

        if (modalHeight < windowHeight) {
            modalContent.style.top = '50%';
            modalContent.style.transform = 'translate(-50%, -50%)';
        } else {
            modalContent.style.top = '10px';
            modalContent.style.transform = 'translate(-50%, 0)';
        }
    }

    window.addEventListener('resize', centerModal);
});

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

            // Store user data in Firebase Realtime Database
            await set(ref(db, `/users/${userId}`), {
                uid: userId, // Store the user ID
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


