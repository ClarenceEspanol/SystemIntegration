// Helper functions to update cart count and total price
function updateCartCount() {
    let cartCount = document.getElementById('cart-count');
    let itemsCount = cartItemsContainer.querySelectorAll('.cart-item').length;
    if (cartCount) {
        cartCount.textContent = itemsCount;
    }
}

function updateItemTotalPrice(cartItem, itemPrice, quantity) {
    let itemTotalPriceElement = cartItem.querySelector('.item-total-price');
    let newTotalPrice = itemPrice * quantity;
    itemTotalPriceElement.textContent = newTotalPrice.toFixed(2);
    
    // Ensure the overall total is updated
    updateTotalPrice();
}

function updateTotalPrice() {
    let totalPriceElement = document.querySelector('.cart-total .price');
    let total = 0;

    // Iterate over each cart item and compute total
    cartItemsContainer.querySelectorAll('.cart-item').forEach(item => {
        let itemPrice = parseFloat(item.querySelector('.item-total-price').textContent.replace('₱', ''));
        let quantity = parseInt(item.querySelector('.quantity-input').value);
        total += itemPrice * quantity;
    });

    // Update total price in the DOM
    if (totalPriceElement) {
        totalPriceElement.textContent = `₱${total.toFixed(2)}`;
    } else {
        console.error('Total price element not found!');
    }
}

// Navbar and menu button functionality
let navbar = document.querySelector('.navbar');
let menuBtn = document.querySelector('#menu-btn');
let cartItemsContainer = document.querySelector('.cart-items-container');
let searchForm = document.querySelector('.search-form');
let navLinks = document.querySelectorAll('.navbar a');

// Toggle menu visibility
menuBtn.onclick = () => {
    navbar.classList.toggle('active');
    cartItemsContainer.classList.remove('active');
};

// Toggle cart items visibility
document.querySelector('#cart-btn').onclick = () => {
    cartItemsContainer.classList.toggle('active');
    navbar.classList.remove('active');
};

// Close menu on scroll
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

