function toggleMenu() {
    const menu = document.querySelector('.top-menu ul');
    menu.classList.toggle('show');

    // Add event listeners to menu items (within the toggleMenu function)
    document.querySelectorAll('.top-menu ul.show li a').forEach(link => {
        link.addEventListener('click', () => {
            // Hide the logo on small screens
            if (window.innerWidth <= 768) {
                hideLogo();
            }
            toggleMenu(); // Also toggle the menu
        });
    });
}

// Function to hide the logo
function hideLogo() {
    document.querySelector('.fixed-logo').style.display = 'none';
}

//form logic

document.addEventListener('DOMContentLoaded', function() {
const form = document.getElementById('email-form');
form.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    // Prepare data as JSON
    const data = { name, email };

    fetch('https://script.google.com/macros/s/AKfycbzMScsuc_OM97p1XDXiKfvddPtf-7ZWKgDxb4b3S0tsH6OV71EiQAk3nENm7UwRfBKloA/exec', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.text())
    .then(text => {
        console.log('Form submission response:', text);
        // Show success message or perform other actions
    })
    .catch(error => console.error(error));
});
});

//section logic

function showSection(sectionId) {
    const splashContent = document.getElementById('splash-content');
    const section = document.getElementById(sectionId);
    // Clear splash content
    splashContent.innerHTML = '';
    // Append section content to splash
    const sectionContent = section.innerHTML;
    splashContent.innerHTML = sectionContent;
    // Hide the original section (this line is added)
    section.style.display = 'none';
    // Check if the sectionId is 'the-proposal' and initialize the carousel
    if (sectionId === 'the-proposal') {
        // Initialize carousel
        showSlides();
    }
}

// Carousel
let slideIndex = 1;
let totalSlides;

// Function to show the next slide in the carousel
function nextSlide() {
    slideIndex++;
    if (slideIndex > totalSlides) slideIndex = 1;
    showSlides();
}

// Function to show the previous slide in the carousel
function prevSlide() {
    slideIndex--;
    if (slideIndex < 1) slideIndex = totalSlides;
    showSlides();
}

// Function to show slides
function showSlides() {
    const slides = document.getElementsByClassName("carousel-img");
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slides[slideIndex - 1].style.display = "block";
}

document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.carousel');
    const slides = document.getElementsByClassName("carousel-img");
    totalSlides = slides.length;
    // Initialize carousel
    showSlides();
    // Event listeners for prev and next buttons
    document.querySelector('.prev').addEventListener('click', prevSlide);
    document.querySelector('.next').addEventListener('click', nextSlide);
});