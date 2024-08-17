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

// Navbar and menu button functionality
let navbar = document.querySelector('.navbar');
let menuBtn = document.querySelector('#menu-btn');
let navLinks = document.querySelectorAll('.navbar a');

// Toggle menu visibility
menuBtn.onclick = () => {
    navbar.classList.toggle('active');
};