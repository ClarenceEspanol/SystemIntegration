import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, get, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// Show loading indicator
document.getElementById('loading-indicator').style.display = 'flex';

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
const storage = getStorage(app);

// Hide loading indicator after initialization
document.getElementById('loading-indicator').style.display = 'none';



//orders
document.addEventListener('DOMContentLoaded', () => {
    const dashboardContent = document.getElementById('dashboard-content');
    const ordersDisplay = document.getElementById('orders-display');
    const loadingIndicator = document.getElementById('loading-indicator');

    // References to Firebase
    const ordersRef = ref(db, 'orders');
    const userProfilesRef = ref(db, 'users');

    const displayOrders = async () => {
        try {
            loadingIndicator.style.display = 'flex'; // Show loading indicator
            const ordersSnapshot = await get(ordersRef);
            if (ordersSnapshot.exists()) {
                const orders = ordersSnapshot.val();
                dashboardContent.innerHTML = '';
                ordersDisplay.innerHTML = '';
    
                // Fetch user profiles once
                const userProfilesSnapshot = await get(userProfilesRef);
                const userProfiles = userProfilesSnapshot.val();
    
                if (userProfiles) {
                    // Collect and sort orders
                    let allOrders = [];
                    Object.keys(orders).forEach(userId => {
                        const userOrders = orders[userId];
                        Object.keys(userOrders).forEach(orderId => {
                            const order = userOrders[orderId];
                            allOrders.push({ ...order, userId, orderId });
                        });
                    });
    
                    // Sort orders by timestamp in descending order
                    allOrders.sort((a, b) => b.timestamp - a.timestamp);
    
                    // Display sorted orders
                    allOrders.forEach(order => {
                        const userProfile = userProfiles[order.userId]?.user_profile || {};
                        const username = userProfiles[order.userId]?.username || 'Unknown';
                        const showPickupButton = order.paymentMethod === 'Cash on Pickup';
    
                        if (order.orderStatus === 'Pending') {
                            dashboardContent.innerHTML += `
                                <div class="order-item" data-user-id="${order.userId}" data-order-id="${order.orderId}">
                                    <h3>Order ID: ${order.orderId}</h3>
                                    <p>User Name: ${userProfile.name || 'Anonymous'}</p>
                                    <p>Username: ${username}</p>
                                    <p>Total Price: ₱${order.totalPrice.toFixed(2)}</p>
                                    <p>Shipping Fee: ₱${order.shippingFee.toFixed(2)}</p>
                                    <p>Payment Method: ${order.paymentMethod}</p>
                                    <p>Status: ${order.orderStatus}</p>
                                    <p>Quantity: ${Object.values(order.items).reduce((total, item) => total + item.quantity, 0)}</p>
                                    <div class="order-items">
                                        ${Object.values(order.items).map(item => `
                                            <div class="order-item-detail">
                                                <img src="${item.productImg}" alt="${item.name}" style="width: 100px; height: auto;" />
                                                <p>${item.name} - ₱${item.price.toFixed(2)} x ${item.quantity}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="order-actions">
                                        <button class="confirm-btn">Confirm Order</button>
                                        <button class="reject-btn">Reject Order</button>
                                    </div>
                                </div>
                            `;
                        } else {
                            ordersDisplay.innerHTML += `
                                <div class="order-item" data-user-id="${order.userId}" data-order-id="${order.orderId}">
                                    <h3>Order ID: ${order.orderId}</h3>
                                    <p>User Name: ${userProfile.name || 'Anonymous'}</p>
                                    <p>Username: ${username}</p>
                                    <p>Total Price: ₱${order.totalPrice.toFixed(2)}</p>
                                    <p>Shipping Fee: ₱${order.shippingFee.toFixed(2)}</p>
                                    <p>Payment Method: ${order.paymentMethod}</p>
                                    <p>Status: ${order.orderStatus}</p>
                                    <p>Quantity: ${Object.values(order.items).reduce((total, item) => total + item.quantity, 0)}</p>
                                    <div class="order-items">
                                        ${Object.values(order.items).map(item => `
                                            <div class="order-item-detail">
                                                <img src="${item.productImg}" alt="${item.name}" style="width: 100px; height: auto;" />
                                                <p>${item.name} - ₱${item.price.toFixed(2)} x ${item.quantity}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <button class="preparing-btn">Preparing Order</button>
                                    <button class="ship-btn">Ship Order</button>
                                    ${showPickupButton ? `<button class="pickup-btn">Ready for Pickup</button>` : ''}
                                    <button class="complete-btn">Complete Order</button>
                                </div>
                            `;
                        }
                    });
                } else {
                    dashboardContent.innerHTML = '<p>No pending orders to display.</p>';
                    ordersDisplay.innerHTML = '<p>No confirmed orders to display.</p>';
                }
            } else {
                dashboardContent.innerHTML = '<p>No pending orders to display.</p>';
                ordersDisplay.innerHTML = '<p>No confirmed orders to display.</p>';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            loadingIndicator.style.display = 'none'; // Hide loading indicator
        }
    };

    // Initial display of orders
    displayOrders();

   // Handle button clicks
const handleButtonClick = async (event) => {
    const userId = event.target.closest('.order-item')?.dataset.userId;
    const orderId = event.target.closest('.order-item')?.dataset.orderId;

    if (!userId || !orderId) {
        console.log('Missing data attributes');
        return;
    }

    try {
        loadingIndicator.style.display = 'flex'; // Show loading indicator

        if (event.target.classList.contains('confirm-btn')) {
            console.log('Confirm button clicked');
            const orderRef = ref(db, `orders/${userId}/${orderId}`);
            const orderSnapshot = await get(orderRef);

            if (orderSnapshot.exists()) {
                const order = orderSnapshot.val();
                await update(orderRef, { orderStatus: 'CONFIRMED' });
                await Promise.all(Object.keys(order.items).map(async (itemId) => {
                    const item = order.items[itemId];
                    const productType = item.productType;
                    const itemIdFromOrder = item.id;

                    const productPath = `${productType}/${itemIdFromOrder}`;
                    const productRef = ref(db, productPath);
                    const productSnapshot = await get(productRef);

                    if (productSnapshot.exists()) {
                        const product = productSnapshot.val();
                        const newQuantity = product.quantity - item.quantity;
                        if (newQuantity < 0) {
                            console.error('Insufficient stock for product:', productPath);
                            return;
                        }
                        await update(productRef, { quantity: newQuantity });
                    }
                }));
                alert('Order confirmed successfully!');
            }
        } else if (event.target.classList.contains('reject-btn')) {
            console.log('Reject button clicked');
            const orderRef = ref(db, `orders/${userId}/${orderId}`);
            const orderSnapshot = await get(orderRef);

            if (orderSnapshot.exists()) {
                const order = orderSnapshot.val();
                
                // Add order to 'order-history' with status 'REJECTED'
                const orderHistoryRef = ref(db, `order-history/${userId}/${orderId}`);
                await set(orderHistoryRef, { ...order, orderStatus: 'REJECTED' });

                // Remove order from 'orders' node
                await remove(orderRef);
                
                alert('Order rejected successfully and moved to order history!');
            }
        } else if (event.target.classList.contains('preparing-btn')) {
            console.log('Preparing button clicked');
            const orderRef = ref(db, `orders/${userId}/${orderId}`);
            await update(orderRef, { orderStatus: 'PREPARING' });
            alert('Order status updated to Preparing!');
        } else if (event.target.classList.contains('ship-btn')) {
            console.log('Ship button clicked');
            const orderRef = ref(db, `orders/${userId}/${orderId}`);
            const orderSnapshot = await get(orderRef);

            if (orderSnapshot.exists()) {
                const order = orderSnapshot.val();
                const newStatus = order.paymentMethod === 'Cash on Pick up' 
                    ? 'READY FOR PICKUP' 
                    : 'TO SHIP';
                await update(orderRef, { orderStatus: newStatus });
                alert(`Order status updated to ${newStatus}!`);
            }
        } else if (event.target.classList.contains('pickup-btn')) {
            console.log('Pickup button clicked');
            const orderRef = ref(db, `orders/${userId}/${orderId}`);
            await update(orderRef, { orderStatus: 'READY FOR PICKUP' });
            alert('Order status updated to Ready for Pickup!');
        } else if (event.target.classList.contains('complete-btn')) {
            console.log('Complete button clicked');
            const orderRef = ref(db, `orders/${userId}/${orderId}`);
            const orderSnapshot = await get(orderRef);

            if (orderSnapshot.exists()) {
                const order = orderSnapshot.val();
                await remove(orderRef); // Remove order from the 'orders' section

                // Add order to 'order-history'
                const orderHistoryRef = ref(db, `order-history/${userId}/${orderId}`);
                await set(orderHistoryRef, { ...order, orderStatus: 'COMPLETED' });

                alert('Order marked as Completed and moved to order history!');
            }
        }
        displayOrders();
    } catch (error) {
        console.error('Error updating order:', error);
    } finally {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
    }
};

document.addEventListener('click', handleButtonClick);
});


//add products
document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productName = document.getElementById('product-name').value;
    const productType = document.getElementById('product-type').value;
    const price = document.getElementById('price').value;
    const quantity = document.getElementById('quantity').value;
    const productImg = document.getElementById('product-img').files[0];
    const weight = document.getElementById('weight').value; // Product weight
    const weightUnit = document.getElementById('weight-unit').value; // Weight unit (kg or g)

    // Reference to the selected product type node and ID counter
    const productRef = ref(db, `/${productType}`);
    const productIdCounterRef = ref(db, `/${productType}_counter`);
    // Show loading indicator
    document.getElementById('loading-indicator').style.display = 'flex';

    try {
        // Get the current product ID
        const snapshot = await get(productIdCounterRef);
        let productId = 1; // Start from 1 if no products exist
        if (snapshot.exists()) {
            productId = snapshot.val() + 1;
        }

        let productImgUrl = null;
        if (productImg) {
            // Rename the image file based on the product ID
            const newFileName = `${productId}_${productImg.name}`;
            // Upload image to Firebase Storage
            const imgRef = storageRef(storage, `images/${productType}/${newFileName}`);
            await uploadBytes(imgRef, productImg);
            productImgUrl = await getDownloadURL(imgRef);
        }
        
        // Prepare the new product data
        const newProduct = {
            id: productId,
            name: productName,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            weight: parseFloat(weight), // Weight value
            weightUnit: weightUnit, // Weight unit (kg or g)
            createdAt: new Date().toISOString(),
            productImg: productImgUrl // Store the image URL here
        };
        
        // Save the new product to the database
        await set(ref(db, `/${productType}/${productId}`), newProduct);

        // Update the product ID counter
        await set(productIdCounterRef, productId);

        // Clear the form after submission
        e.target.reset();

        alert('Product added successfully!');
        // Hide loading indicator after initialization
        document.getElementById('loading-indicator').style.display = 'none';
    } catch (error) {
        console.error("Error adding product:", error);
    }
});




// Get modal elements
const modal = document.getElementById("notification-modal");
const notificationIcon = document.getElementById("notification-icon");
const span = document.getElementsByClassName("close")[0];

// Open the modal when notification icon is clicked
notificationIcon.onclick = function() {
modal.style.display = "block";
}

// Close the modal when the 'x' is clicked
span.onclick = function() {
modal.style.display = "none";
}

// Close the modal when user clicks outside of the modal
window.onclick = function(event) {
if (event.target == modal) {
modal.style.display = "none";
    }
}


// Function to update the notification count
function updateNotificationCount(count) {
    const notificationCount = document.getElementById("notification-count");
    if (count > 0) {
        notificationCount.innerText = count;
        notificationCount.style.display = "block"; // Show the count if there are notifications
    } else {
        notificationCount.style.display = "none"; // Hide the count if no notifications
    }
}

// Function to load and monitor products for low stock in real-time
function loadProductsAndNotify() {
    const schoolSuppliesRef = ref(db, '/school-supplies');
    const housewareRef = ref(db, '/houseware');

    let lowStockNotifications = [];

    // Process products and generate notifications
    function processProducts(products) {
        lowStockNotifications = []; // Reset notifications
        Object.values(products).forEach(product => {
            if (product.quantity < 10) {
                lowStockNotifications.push({
                    name: product.name,
                    img: product.productImg,
                    quantity: product.quantity
                });
            }
        });
        // Update notifications list in real-time
        updateNotificationsDisplay();
    }

    // Function to display notifications in the modal and update the count
    function updateNotificationsDisplay() {
        const notificationsList = document.getElementById('notifications-list');
        notificationsList.innerHTML = '';

        if (lowStockNotifications.length > 0) {
            lowStockNotifications.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.classList.add('notification-item');

                const img = document.createElement('img');
                img.src = notification.img;
                img.alt = `${notification.name} Image`;
                img.style.width = '50px';

                const text = document.createElement('p');
                text.textContent = `${notification.name} is low on stock. Only ${notification.quantity} left! Please contact the supplier ASAP.`;

                notificationItem.appendChild(img);
                notificationItem.appendChild(text);
                notificationsList.appendChild(notificationItem);
            });
            updateNotificationCount(lowStockNotifications.length);
        } else {
            notificationsList.innerHTML = '<p>No new notifications.</p>';
            updateNotificationCount(0);
        }
    }

    // Monitor school supplies for changes in real-time
    onValue(schoolSuppliesRef, (snapshot) => {
        if (snapshot.exists()) {
            processProducts(snapshot.val());
        }
    });

    // Monitor houseware for changes in real-time
    onValue(housewareRef, (snapshot) => {
        if (snapshot.exists()) {
            processProducts(snapshot.val());
        }
    });
}

// Initialize notifications on page load
loadProductsAndNotify();


// Function to load products for updating
function loadProducts() {
    const schoolSuppliesRef = ref(db, '/school-supplies');
    const housewareRef = ref(db, '/houseware');

    onValue(schoolSuppliesRef, (snapshot) => {
        const schoolSuppliesList = document.getElementById('school-supplies-list');
        if (schoolSuppliesList) {
            schoolSuppliesList.innerHTML = '';
            if (snapshot.exists()) {
                const products = snapshot.val();
                Object.values(products).forEach(product => {
                    const productItem = document.createElement('li');
                    
                    // Create product name and ID text
                    const productText = document.createElement('span');
                    productText.textContent = `${product.name} (ID: ${product.id})`;
                    productItem.appendChild(productText);
                    
                    // Create quantity display
                    const quantityText = document.createElement('span');
                    quantityText.textContent = ` - Quantity: ${product.quantity}`;
                    productItem.appendChild(quantityText);
                    
                    // Create stock indicator
                    const stockIndicator = document.createElement('span');
                    stockIndicator.style.marginLeft = '10px'; // Add spacing
                    if (product.quantity < 10) {
                        stockIndicator.textContent = 'Low Stock';
                        stockIndicator.style.color = 'red'; // Red for low stock
                    } else if (product.quantity <= 30) {
                        stockIndicator.textContent = 'Moderate Stock';
                        stockIndicator.style.color = 'orange'; // Orange for moderate stock
                    } else {
                        stockIndicator.textContent = 'Sufficient Stock';
                        stockIndicator.style.color = 'green'; // Green for sufficient stock
                    }
                    productItem.appendChild(stockIndicator);

                    productItem.dataset.productId = product.id;
                    productItem.dataset.productType = 'school-supplies';
                    productItem.classList.add('product-item');
                    if (product.productImg) {
                        const img = document.createElement('img');
                        img.src = product.productImg;
                        img.alt = `${product.name} Image`;
                        img.style.width = '100px'; // Adjust as needed
                        productItem.appendChild(img);
                    }
                    schoolSuppliesList.appendChild(productItem);
                });
            }
        }
    });

    onValue(housewareRef, (snapshot) => {
        const housewareList = document.getElementById('houseware-list');
        if (housewareList) {
            housewareList.innerHTML = '';
            if (snapshot.exists()) {
                const products = snapshot.val();
                Object.values(products).forEach(product => {
                    const productItem = document.createElement('li');
                    
                    // Create product name and ID text
                    const productText = document.createElement('span');
                    productText.textContent = `${product.name} (ID: ${product.id})`;
                    productItem.appendChild(productText);
                    
                    // Create quantity display
                    const quantityText = document.createElement('span');
                    quantityText.textContent = ` - Quantity: ${product.quantity}`;
                    productItem.appendChild(quantityText);
                    
                    // Create stock indicator
                    const stockIndicator = document.createElement('span');
                    stockIndicator.style.marginLeft = '10px'; // Add spacing
                    if (product.quantity < 10) {
                        stockIndicator.textContent = 'Low Stock';
                        stockIndicator.style.color = 'red'; // Red for low stock
                    } else if (product.quantity <= 30) {
                        stockIndicator.textContent = 'Moderate Stock';
                        stockIndicator.style.color = 'orange'; // Orange for moderate stock
                    } else {
                        stockIndicator.textContent = 'Sufficient Stock';
                        stockIndicator.style.color = 'green'; // Green for sufficient stock
                    }
                    productItem.appendChild(stockIndicator);

                    productItem.dataset.productId = product.id;
                    productItem.dataset.productType = 'houseware';
                    productItem.classList.add('product-item');
                    if (product.productImg) {
                        const img = document.createElement('img');
                        img.src = product.productImg;
                        img.alt = `${product.name} Image`;
                        img.style.width = '100px'; // Adjust as needed
                        productItem.appendChild(img);
                    }
                    housewareList.appendChild(productItem);
                });
            }
        }
    });
}

// Function to handle form population on product item click
function handleProductItemClick(event) {
    const item = event.target;
    if (item.classList.contains('product-item')) {
        const productId = item.dataset.productId;
        const productType = item.dataset.productType;

        // Fetch product details from Firebase
        const productRef = ref(db, `/${productType}/${productId}`);
        get(productRef).then((snapshot) => {
            if (snapshot.exists()) {
                const product = snapshot.val();
                document.getElementById('update-product-id').value = product.id;
                document.getElementById('update-product-type').value = productType;
                document.getElementById('update-product-name').value = product.name;
                document.getElementById('update-price').value = product.price;
                document.getElementById('update-quantity').value = product.quantity;
                document.getElementById('update-weight').value = product.weight || ''; // Set weight
                document.getElementById('update-weight-unit').value = product.weightUnit || 'kg'; // Set weight unit
                
                // Handle the image
                const productImagePreview = document.getElementById('product-image-preview');
                if (product.productImg) {
                    productImagePreview.src = product.productImg; // Set image source from the database
                    productImagePreview.alt = `${product.name} Image`; // Set alt text for the image
                } else {
                    productImagePreview.src = ''; // Clear image if not available
                    productImagePreview.alt = 'No Image Available'; // Fallback alt text
                }
            }
        });
    }
}


// Function to handle form submission for updating a product
document.getElementById('update-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('update-product-id').value;
    const productType = document.getElementById('update-product-type').value;
    const productName = document.getElementById('update-product-name').value;
    const price = document.getElementById('update-price').value;
    const quantity = document.getElementById('update-quantity').value;
    const weight = document.getElementById('update-weight').value;
    const weightUnit = document.getElementById('update-weight-unit').value;
    const updateProductImg = document.getElementById('update-product-img').files[0];

    try {
        let productImgUrl = document.getElementById('product-image-preview').src; // Use the existing image URL from preview

        // Check if a new image has been uploaded
        if (updateProductImg) {
            // Rename the image file based on the product ID
            const newFileName = `${productId}_${updateProductImg.name}`;
            // Upload image to Firebase Storage
            const imgRef = storageRef(storage, `images/${productType}/${newFileName}`);
            await uploadBytes(imgRef, updateProductImg);
            productImgUrl = await getDownloadURL(imgRef); // Get new image URL
        }

        // Prepare the updated product data
        const updatedProduct = {
            id: productId,
            name: productName,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            weight: parseFloat(weight), // Include weight
            weightUnit: weightUnit, // Include weight unit
            productImg: productImgUrl // Use the existing or new image URL
        };

        // Save the updated product to the database
        await set(ref(db, `/${productType}/${productId}`), updatedProduct);

        // Clear the form after submission
        document.querySelector('#update-product-form')?.reset();

        // Reset the image preview
        document.getElementById('product-image-preview').src = '';
        document.getElementById('product-image-preview').alt = 'No Image Available';

        alert('Product updated successfully!');
    } catch (error) {
        console.error("Error updating product:", error);
    }
});


// Function to handle cancel button click
document.querySelector('#update-product-form .cancel')?.addEventListener('click', () => {
    document.querySelector('#update-product-form form')?.reset(); // Ensure you target the form element
    const imagePreview = document.getElementById('product-image-preview');
    if (imagePreview) {
        imagePreview.src = ''; // Clear the image source
        imagePreview.alt = 'No Image Available'; // Optionally set alt text
    }
});

// Function to delete a product
async function deleteProduct(productType, productId) {
    try {
        // Reference to the product in the database
        const productRef = ref(db, `/${productType}/${productId}`);
        
        // Fetch the product to get the image URL
        const productSnapshot = await get(productRef);
        if (!productSnapshot.exists()) {
            throw new Error('Product does not exist.');
        }
        
        const product = productSnapshot.val();
        const productImgUrl = product.productImg;
        
        // Remove the product from the database
        await remove(productRef);
        console.log('Product deleted successfully.');

        if (productImgUrl) {
            // Extract the file path from the URL
            const url = new URL(productImgUrl);
            const filePath = url.pathname.split('/o/')[1].split('?')[0];
            
            // Construct the image reference path
            const imgPath = decodeURIComponent(filePath);
            console.log(`Deleting image at path: ${imgPath}`);

            // Construct image reference and delete
            const imgRef = storageRef(storage, imgPath);
            await deleteObject(imgRef);
            console.log('Image deleted successfully.');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
    }
}

// Function to handle delete button click with confirmation
document.querySelector('#update-product-form .delete')?.addEventListener('click', async () => {
    const productId = document.getElementById('update-product-id').value;
    const productType = document.getElementById('update-product-type').value;

    if (!productId || !productType) {
        alert('Product ID or type is missing.');
        return;
    }

    if (confirm('Are you sure you want to delete this product?')) {
        await deleteProduct(productType, productId);
        
        // Clear the form after deletion
        document.querySelector('#update-product-form form')?.reset();
    }
});


// Function to load feedback
function loadFeedback() {
    const feedbackRef = ref(db, 'feedback/');
    onValue(feedbackRef, (snapshot) => {
        const feedbackDisplay = document.getElementById('feedback-display');
        if (feedbackDisplay) {
            feedbackDisplay.innerHTML = ''; // Clear the display area
            if (snapshot.exists()) {
                const feedbacks = snapshot.val();
                
                // Sort feedbacks by createdAt in descending order
                const sortedFeedbacks = Object.values(feedbacks).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                // Limit to the latest 10 feedback entries
                const recentFeedbacks = sortedFeedbacks.slice(0, 10);
                
                // Display the latest 10 feedback entries
                recentFeedbacks.forEach(feedback => {
                    const feedbackItem = document.createElement('div');
                    feedbackItem.classList.add('feedback-item');
                    feedbackItem.innerHTML = `
                        <p><strong>${feedback.name || 'Anonymous'}</strong></p>
                        <p>${feedback.message}</p>
                        <p><small>${new Date(feedback.createdAt).toLocaleString()}</small></p>
                    `;
                    feedbackDisplay.appendChild(feedbackItem);
                });
            } else {
                feedbackDisplay.innerHTML = '<p>No feedback found.</p>';
            }
        }
    }, (error) => {
        console.error("Error loading feedback data:", error);
    });
}

// Function to load contact submissions
function loadContacts() {
    const contactsRef = ref(db, 'contact/');
    onValue(contactsRef, (snapshot) => {
        const contactDisplay = document.getElementById('contact-display');
        if (contactDisplay) {
            contactDisplay.innerHTML = ''; // Clear the display area
            if (snapshot.exists()) {
                const contacts = snapshot.val();
                // Sort contacts by createdAt in descending order
                const sortedContacts = Object.values(contacts).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                // Limit to the latest 10 contacts
                const recentContacts = sortedContacts.slice(0, 10);

                // Display the latest 10 contacts
                recentContacts.forEach(contact => {
                    const contactItem = document.createElement('div');
                    contactItem.classList.add('contact-item');
                    contactItem.innerHTML = `
                        <p><strong>${contact.name || 'Anonymous'}</strong></p>
                        <p>${contact.message}</p>
                        <p><small>${new Date(contact.createdAt).toLocaleString()}</small></p>
                    `;
                    contactDisplay.appendChild(contactItem);
                });
            } else {
                contactDisplay.innerHTML = '<p>No contacts found.</p>';
            }
        }
    }, (error) => {
        console.error("Error loading contact data:", error);
    });
}
// Function to load user registrations
function loadUsers() {
    const usersRef = ref(db, 'users/');
    onValue(usersRef, (snapshot) => {
        const usersDisplay = document.getElementById('users-display');
        if (usersDisplay) {
            usersDisplay.innerHTML = ''; // Clear the display area
            if (snapshot.exists()) {
                const users = snapshot.val();
                const sortedUsers = Object.values(users).sort((a, b) => {
                    return (b.createdAt || 0) - (a.createdAt || 0); // Sort by registration timestamp in descending order
                });

                if (sortedUsers.length > 0) {
                    sortedUsers.forEach(user => {
                        const userItem = document.createElement('div');
                        userItem.classList.add('user-item');
                        userItem.innerHTML = `
                            <p><strong>Email:</strong> ${user.username || 'No email provided'}</p>
                            <p><small>Registered at: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}</small></p>
                        `;
                        usersDisplay.appendChild(userItem);
                    });
                } else {
                    usersDisplay.innerHTML = '<p>No users found.</p>';
                }
            } else {
                usersDisplay.innerHTML = '<p>No users found.</p>';
            }
        }
    }, (error) => {
        console.error("Error loading user data:", error);
    });
}

// Global array to hold product data
let productsData = [];

document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.querySelector('.download-reports');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            try {
                await fetchProductsData(); // Wait for data to be fetched before generating PDF
                await generatePDFReport(); // Ensure PDF generation is awaited
            } catch (error) {
                console.error('Error fetching product data:', error);
            }
        });
    }
});

// Function to fetch products data from Firebase
async function fetchProductsData() {
    const schoolSuppliesRef = ref(db, 'school-supplies');
    const housewareRef = ref(db, 'houseware');

    const schoolSuppliesSnapshot = await get(schoolSuppliesRef);
    const housewareSnapshot = await get(housewareRef);

    const schoolSupplies = schoolSuppliesSnapshot.val() || {};
    const houseware = housewareSnapshot.val() || {};

    // Log the number of products fetched from each node
    console.log('School Supplies Count:', Object.keys(schoolSupplies).length);
    console.log('Houseware Count:', Object.keys(houseware).length);

    productsData = [];
    for (const id in schoolSupplies) {
        productsData.push({ id, ...schoolSupplies[id], type: 'school-supplies' });
    }
    for (const id in houseware) {
        productsData.push({ id, ...houseware[id], type: 'houseware' });
    }

    // Log the total number of products retrieved
    console.log('Total Products Loaded:', productsData.length);
}


// Function to generate the PDF report
async function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const margin = 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    const logoPath = 'images/logojbc.png';
    const logoImg = await loadImage(logoPath);
    doc.addImage(logoImg, 'PNG', 10, 10, 30, 25);

    // Add Title
    doc.setFontSize(18);
    const title = 'JBC SCHOOL SUPPLIES AND HOUSEWARE';
    const titleX = (pageWidth - doc.getTextWidth(title)) / 2;
    doc.text(title, titleX, 30);

    doc.setFontSize(12);
    doc.text('============================================================================', margin, 40);
    yPosition = 50;

    // Separate products by type and sort them
    const productTypes = {
        'houseware': productsData.filter(p => p.type === 'houseware').sort((a, b) => a.quantity - b.quantity),
        'school-supplies': productsData.filter(p => p.type === 'school-supplies').sort((a, b) => a.quantity - b.quantity),
    };

    // Add Products Table for each product type
    addProductsToPDF(productTypes.houseware, 'Houseware');
    addProductsToPDF(productTypes['school-supplies'], 'School Supplies');

    doc.save('Stocks_Report.pdf');

    function addProductsToPDF(products, type) {
        // Center the section title
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const headingX = (pageWidth - doc.getTextWidth(type + ':')) / 2;
        doc.text(`${type}:`, headingX, yPosition);
        yPosition += 10;

        // Define table headers and column widths
        const headers = ['Product Name', 'Price', 'Quantity', 'Quantity Status'];
        const columnWidths = [90, 30, 25, 45]; // Adjusted widths to prevent overlap

        drawTableHeaders(headers, columnWidths);

        // Add product rows
        doc.setFont('helvetica', 'normal');
        products.forEach(product => {
            if (yPosition > pageHeight - 30) {
                doc.addPage();
                yPosition = 20;
                drawTableHeaders(headers, columnWidths); // Redraw headers on new page
            }

            const row = [
                product.name,
                `P${product.price.toFixed(2)}`,
                product.quantity.toString(),
                getStockStatus(product.quantity),
            ];

            drawTableRow(row, columnWidths);
        });

        yPosition += 10;
    }

    function drawTableHeaders(headers, columnWidths) {
        let x = margin;
        headers.forEach((header, index) => {
            const centerX = x + (columnWidths[index] - doc.getTextWidth(header)) / 2;
            doc.text(header, centerX, yPosition); // Center-align all headers
            x += columnWidths[index];

            // Draw a vertical line between columns (with better alignment)
            if (index < headers.length - 1) {
                drawVerticalLine(x);
            }
        });
        yPosition += 10;
    }

    function drawTableRow(row, columnWidths) {
        let x = margin;
        row.forEach((data, index) => {
            let textY = yPosition;

            // Auto-wrap product name
            if (index === 0) {
                const lines = doc.splitTextToSize(data, columnWidths[index] - 5); // Allow for padding
                lines.forEach(line => {
                    doc.text(line, x, textY);
                    textY += 6;
                });
            } else {
                const centerX = x + (columnWidths[index] - doc.getTextWidth(data)) / 2;
                doc.text(data, centerX, yPosition); // Center-align text
            }
            x += columnWidths[index];

            // Draw a vertical line between columns (with better alignment)
            if (index < row.length - 1) {
                drawVerticalLine(x);
            }
        });
        yPosition += 12; // Added space between rows
    }

    function drawVerticalLine(x) {
        doc.line(x, yPosition - 10, x, yPosition + 2); // Adjusted height for cleaner lines
    }

    async function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    }

    function getStockStatus(quantity) {
        if (quantity >= 30) return 'Sufficient Stock';
        if (quantity >= 10) return 'Moderate Stock';
        return 'Low Stock';
    }
}











//nav greetings
function updateGreetingAndDateTime() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const time = now.toLocaleTimeString([], options);
    const date = now.toLocaleDateString();

    // Determine the greeting based on the time of day
    let greeting;
    const hours = now.getHours();
    if (hours < 12) {
        greeting = 'Good morning, ADMIN';
    } else if (hours < 18) {
        greeting = 'Good afternoon, ADMIN';
    } else {
        greeting = 'Good evening, ADMIN';
    }

    // Update the HTML elements
    document.getElementById('greeting').textContent = greeting;
    document.getElementById('datetime').textContent = `${time} ${date}`;
}

// Update the greeting and date/time on page load
updateGreetingAndDateTime();

// Update the time every second
setInterval(updateGreetingAndDateTime, 1000);

// Get modal element
const modals = document.getElementById("notification-modal");

// Navbar and menu button functionality
let navbar = document.querySelector('.navbar');
let menuBtn = document.querySelector('#menu-btn');
let navLinks = document.querySelectorAll('.navbar a');
let notifIcons = document.querySelectorAll('.notification-icon');

// Toggle menu visibility
menuBtn.onclick = () => {
    navbar.classList.toggle('active');
    menuBtn.classList.toggle('active');
    if (modal.style.display === 'block') {
        modals.style.display = 'none';
    }

};

// Close modal when user scrolls
window.onscroll = () => {
    navbar.classList.remove('active');
    menuBtn.classList.remove('active');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    }
};

// Close modal when clicking outside the modal
window.onclick = (event) => {
    if (event.target === modal) {
        modals.style.display = 'none';
    }
};

// Open the modal when notification icon is clicked
notifIcons.forEach(icon => {
    icon.onclick = () => {
        // Close the menu if it's open
        if (navbar.classList.contains('active')) {
            navbar.classList.remove('active');
            menuBtn.classList.remove('active');
        }
        // Open the modal
        modals.style.display = 'block';
    };
});


// Load initial data
loadFeedback();
loadContacts();
loadUsers();


// Load products on page load
window.onload = loadProducts;
document.getElementById('school-supplies-list')?.addEventListener('click', handleProductItemClick);
document.getElementById('houseware-list')?.addEventListener('click', handleProductItemClick);

