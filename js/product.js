import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, get} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
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
//auth
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
//display school products
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
//display houseware products
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

// Function to create a product box element
function createProductBox(product, type) {
    const box = document.createElement('div');
    box.className = 'box';
    box.setAttribute('data-name', product.name);
    box.setAttribute('data-price', product.price);
    box.setAttribute('data-id', product.id); // Add ID to box for easy reference

    // Check if the stock is less than 5
    const isOutOfStock = product.quantity < 5;

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
            ${isOutOfStock 
                ? '<a href="#" class="btn out-of-stock-btn" disabled>Out of Stock</a>' 
                : `<a href="#" class="btn add-to-cart-btn" data-id="${product.id}" data-type="${type}">Add to Cart</a>`
            }
        </div>`;

    // Add event listener to handle add-to-cart action
    if (!isOutOfStock) {
        box.querySelector('.add-to-cart-btn').addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            
            // Call the addToCart function
            addToCart(event);
        });
    }

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
            const cartItemIndex = cart.findIndex(item => item.id === productID);

            if (cartItemIndex > -1) {
                // Update existing item quantity
                cart[cartItemIndex].quantity++;
            } else {
                // Add new item with initial quantity of 1
                cart.push({ ...product, id: productID, quantity: 1, type });
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
    loadCartFromFirebase(); // Load the cart from Firebase on page 
    displayHousewareProducts();
    displayProducts();
});


//check out
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
            const dateStr = `${year}${month}${day}`; // Format as YYMMDD
            
            const dateCountRef = ref(db, `order-count/${dateStr}`);
            
            let orderCount = 1;
            try {
                // Get the current order count for the date
                const snapshot = await get(dateCountRef);
                if (snapshot.exists()) {
                    orderCount = snapshot.val() + 1;
                }
                
                // Update the count for the date
                await set(dateCountRef, orderCount);
    
                // Create the order ID
                const orderId = `${dateStr}_${String(orderCount).padStart(2, '0')}`;
    
                // Define the path for new orders
                const newOrderRef = ref(db, `orders/${userId}/${orderId}`);
    
                // Get cart items
                const cartItemsRef = ref(db, 'cart-items');
                onValue(cartItemsRef, async (snapshot) => {
                    if (snapshot.exists()) {
                        const cartItems = snapshot.val();
                        const totalPrice = Object.values(cartItems).reduce((acc, item) => acc + item.price * item.quantity, 0);
                        
                        // Determine user region
                        const userRegion = await getUserRegion(userId);

                        // Calculate shipping fee
                        const shippingFee = calculateShippingFee(cartItems, userRegion, paymentMethod);
                        if (paymentMethod === 'Cash on Pick up') {
                            shippingFee = 0;
                        }

                        // Create order object with status, product types, and timestamp
                        const orderData = {
                            orderId: orderId,
                            userId: userId,
                            paymentMethod: paymentMethod,
                            totalPrice: totalPrice,
                            shippingFee: shippingFee,
                            totalAmount: totalPrice + shippingFee,
                            items: Object.keys(cartItems).map(key => ({
                                ...cartItems[key],
                                productType: cartItems[key].type // Include product type
                            })),
                            timestamp: currentDate.toISOString(), // Store the order timestamp in ISO format
                            orderStatus: 'Pending' // Initial status
                        };
    
                        // Save the order data to Firebase
                        try {
                            await set(newOrderRef, orderData);
                            alert(`Checkout confirmed with payment method: ${paymentMethod}`);
    
                            // Clear the cart items
                            await remove(cartItemsRef);
                            modal.style.display = 'none';
                            document.getElementById('checkout-items').innerHTML = '<p>No items in cart.</p>';
                            document.getElementById('checkout-total').textContent = '₱0.00';
                            document.getElementById('shipping-fee').textContent = '₱0.00';
                            // Reload the page
                            location.reload();
                        } catch (error) {
                            console.error('Error saving order data:', error);
                        }
                    } else {
                        alert('No items in cart to checkout.');
                    }
                });
            } catch (error) {
                console.error('Error handling order count:', error);
            }
        } else {
            alert('You must be logged in to complete the checkout.');
        }
    });
    async function getUserRegion(userId) {
        const userAddressRef = ref(db, `users/${userId}/user_address`);
        try {
            const snapshot = await get(userAddressRef);
            const userAddress = snapshot.val();
            
            // Log the entire user_address object for debugging
            console.log('Retrieved User Address:', userAddress);
            
            if (userAddress && userAddress.region) {
                const region = userAddress.region.toLowerCase().trim();
                console.log('Processed Region:', region);
                return region;
            } else {
                console.warn('Region is null or undefined, defaulting to "island"');
                return 'island';
            }
        } catch (error) {
            console.error('Error retrieving user address:', error);
            return 'island';
        }
    }
    
    
    // Function to calculate shipping fee
    function calculateShippingFee(cartItems, region, paymentMethod) {
        // Ensure paymentMethod is defined and is a string
        paymentMethod = paymentMethod || '';
    
        // Initialize shipping fee
        let shippingFee = 0;
    
        // Check payment method
        if (paymentMethod.toLowerCase() === 'cash on pick up') {
            // No shipping fee for 'cash on pick up'
            return shippingFee;
        }
    
        // Handle invalid or missing region
        if (!region) {
            console.error('Invalid region provided');
            return shippingFee;
        }
    
        // Calculate the total weight in grams
        let totalWeightInGrams = Object.keys(cartItems).reduce((acc, key) => {
            const item = cartItems[key];
            const weight = item.weight; // Weight from /cart-items/{id}/weight
            const weightUnit = item.weightUnit.toLowerCase(); // Weight unit from /cart-items/{id}/weightUnit
    
            // Ensure the weight is in grams
            let weightInGrams = weight;
            if (weightUnit === 'kg') {
                weightInGrams = weight * 1000; // Convert kilograms to grams
            }
    
            // Add the weight of the item multiplied by its quantity
            return acc + (weightInGrams * item.quantity);
        }, 0);
    
        // Convert total weight to kilograms for fee calculation
        let totalWeightInKg = totalWeightInGrams / 1000;
    
        // Calculate shipping fee based on region
        switch(region.toLowerCase().trim()) {
            case 'south-luzon':
            case 'north-luzon':
                shippingFee = totalWeightInKg <= 0.5 ? 85 : totalWeightInKg <= 1 ? 155 : totalWeightInKg <= 3 ? 180 : totalWeightInKg <= 4 ? 270 : totalWeightInKg <= 5 ? 360 : 455;
                break;
            case 'metro-manila':
                shippingFee = totalWeightInKg <= 0.5 ? 95 : totalWeightInKg <= 1 ? 165 : totalWeightInKg <= 3 ? 190 : totalWeightInKg <= 4 ? 280 : totalWeightInKg <= 5 ? 370 : 465;
                break;
            case 'visayas':
                shippingFee = totalWeightInKg <= 0.5 ? 100 : totalWeightInKg <= 1 ? 180 : totalWeightInKg <= 3 ? 200 : totalWeightInKg <= 4 ? 300 : totalWeightInKg <= 5 ? 400 : 500;
                break;
            case 'mindanao':
                shippingFee = totalWeightInKg <= 0.5 ? 105 : totalWeightInKg <= 1 ? 195 : totalWeightInKg <= 3 ? 220 : totalWeightInKg <= 4 ? 330 : totalWeightInKg <= 5 ? 440 : 550;
                break;
            default: // 'island'
                shippingFee = totalWeightInKg <= 0.5 ? 115 : totalWeightInKg <= 1 ? 205 : totalWeightInKg <= 3 ? 230 : totalWeightInKg <= 4 ? 340 : totalWeightInKg <= 5 ? 450 : 560;
                break;
        }
    
        return shippingFee;
    }
    
    // Function to update shipping fee display
    async function updateShippingFee() {
        const paymentMethod = document.getElementById('payment-method').value;
        const cartItems = {}; // Retrieve your cart items here
    
        try {
            // Get the current user from Firebase Authentication
            const user = auth.currentUser;
            if (!user) {
                console.error('No user is logged in');
                document.getElementById('shipping-fee').innerText = '₱0.00';
                return;
            }
    
            const userId = user.uid; // Get the user ID
            const region = await getUserRegion(userId);
    
            if (!region) {
                console.warn('Region is null or undefined, defaulting to "island"');
            }
    
            const shippingFee = calculateShippingFee(cartItems, region, paymentMethod);
    
            // Check payment method and adjust the shipping fee text
            let shippingFeeText = `₱${shippingFee.toFixed(2)}`;
            if (paymentMethod !== 'cash-on-pickup') {
                shippingFeeText += ' <span class="shipping-provider">shipped by J&T Express</span>';
            }
            
            document.getElementById('shipping-fee').innerHTML = shippingFeeText;
    
        } catch (error) {
            console.error('Error updating shipping fee:', error);
            document.getElementById('shipping-fee').innerText = '₱0.00';
        }
    }
    // Event listener for payment method change
    document.getElementById('payment-method').addEventListener('change', updateShippingFee);
    
    // Event listener for confirm checkout button
    document.getElementById('confirm-checkout').addEventListener('click', updateShippingFee);
    
    // Initialize shipping fee display to 0 on page load
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('shipping-fee').innerText = '₱0.00';
    });

    function populateCheckoutModal() {
        const user = auth.currentUser;
        if (user) {
            const userId = user.uid;
    
            // Fetch user profile information from Firebase 'users/{userId}/user_address' node
            const userAddressRef = ref(db, `users/${userId}/user_address`);
            onValue(userAddressRef, (snapshot) => {
                const userAddress = snapshot.val();
                const userNameElem = document.getElementById('user-name');
                const userEmailElem = document.getElementById('user-email');
                const userPhoneElem = document.getElementById('user-phone');
                const userAddressElem = document.getElementById('user-address');
                
                if (userAddress) {
                    if (userNameElem) userNameElem.textContent = `Name: ${userAddress.contactName || 'N/A'}`;
                    if (userEmailElem) userEmailElem.textContent = `Email: ${user.email || 'N/A'}`;
                    if (userPhoneElem) userPhoneElem.textContent = `Phone: ${userAddress.phoneNumber || 'N/A'}`;
                    if (userAddressElem) userAddressElem.innerHTML = `
                        <p><strong>Address:</strong> ${userAddress.address || 'N/A'}</p>
                        <p><strong>City:</strong> ${userAddress.city || 'N/A'}</p>
                        <p><strong>Region:</strong> ${userAddress.region || 'N/A'}</p>
                        <p><strong>State:</strong> ${userAddress.state || 'N/A'}</p>
                        <p><strong>Zip Code:</strong> ${userAddress.zip || 'N/A'}</p>
                    `;
                } else {
                    if (userNameElem) userNameElem.textContent = 'Name: N/A';
                    if (userEmailElem) userEmailElem.textContent = 'Email: N/A';
                    if (userPhoneElem) userPhoneElem.textContent = 'Phone: N/A';
                    if (userAddressElem) userAddressElem.innerHTML = '<p>No address information available.</p>';
                }
            });
    
            // Fetch cart items and calculate total price
            const cartItemsRef = ref(db, 'cart-items');
            onValue(cartItemsRef, (snapshot) => {
                const checkoutItemsContainer = document.getElementById('checkout-items');
                const checkoutTotalElem = document.getElementById('checkout-total');
                const shippingFeeElem = document.getElementById('shipping-fee');
                const paymentMethodElem = document.getElementById('payment-method');
                
                if (checkoutItemsContainer && checkoutTotalElem && shippingFeeElem && paymentMethodElem) {
                    if (snapshot.exists()) {
                        const cartItems = snapshot.val();
                        let totalPrice = 0;
    
                        checkoutItemsContainer.innerHTML = ''; // Clear previous items
    
                        Object.keys(cartItems).forEach(key => {
                            const item = cartItems[key];
                            const imageUrl = item.productImg || 'default-image-url'; // Use a default image if URL is not available
                            
                            const itemElem = document.createElement('div');
                            itemElem.classList.add('checkout-item');
                            itemElem.innerHTML = `
                                <img src="${imageUrl}" alt="${item.name}" class="item-image">
                                <p><strong>Product:</strong> ${item.name} (x${item.quantity}) - ₱${(item.price * item.quantity).toFixed(2)}</p>
                            `;
                            checkoutItemsContainer.appendChild(itemElem);
    
                            totalPrice += item.price * item.quantity;
                        });
    
                        checkoutTotalElem.textContent = `₱${totalPrice.toFixed(2)}`;
    
                        // Function to update total price based on shipping fee and payment method
                        const updateTotalPrice = () => {
                            const shippingFeeText = shippingFeeElem.textContent;
                            const shippingFee = parseFloat(shippingFeeText.replace(/[^\d.-]/g, '')) || 0;
                            const isCashOnPickup = paymentMethodElem.value === 'cash-on-pickup';
                            const finalTotalPrice = isCashOnPickup ? 0 : totalPrice + shippingFee;
                            checkoutTotalElem.textContent = `₱${finalTotalPrice.toFixed(2)}`;
                        };
    
                        // Fetch user region and calculate shipping fee
                        getUserRegion(userId).then(userRegion => {
                            const shippingFee = calculateShippingFee(cartItems, userRegion);
                            shippingFeeElem.innerHTML = `₱${shippingFee.toFixed(2)} <span class="shipping-provider">shipped by J&T Express</span>`;
                            updateTotalPrice(); // Update total price with initial shipping fee
                        });
    
                        // Use MutationObserver to listen for changes in the shipping fee element
                        const observer = new MutationObserver(updateTotalPrice);
                        observer.observe(shippingFeeElem, { childList: true, subtree: true });
    
                        // Listen for changes to the payment method
                        paymentMethodElem.addEventListener('change', updateTotalPrice);
    
                    } else {
                        checkoutItemsContainer.innerHTML = '<p>No items in cart.</p>';
                        checkoutTotalElem.textContent = '₱0.00';
                        shippingFeeElem.textContent = '₱0.00';
                    }
                }
            });
        } else {
            alert('You must be logged in to checkout.');
        }
    }
});

//track order
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