// Cache frequently accessed elements
const menu = document.querySelector('.top-menu ul');
const menuToggle = document.querySelector('.menu-toggle');
const splashContent = document.getElementById('splash-content');
const form = document.getElementById('email-form');
const loadingSpinner = document.getElementById('loading-spinner');
const logo = document.querySelector('.fixed-logo'); // Add this line to cache the logo element

// Toggle menu function
function toggleMenu() {
    menu.classList.toggle('show');
}

// Show section function
function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    splashContent.innerHTML = section.innerHTML;
    section.style.display = 'none';

    if (sectionId === 'the-proposal') {
        showSlides();
    }
}

// Submit form event listener
form.addEventListener('submit', function(event) {
    event.preventDefault();
    loadingSpinner.style.display = 'flex';

    const formData = new FormData(form);
    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        loadingSpinner.style.display = 'none';
        if (data === 'success') {
            alert('Thank you! Your submission has been received.');
            form.reset();
        } else {
            alert('Oops! Something went wrong. Please try again later.');
        }
    })
    .catch(error => {
        loadingSpinner.style.display = 'none';
        console.error('Error:', error);
        alert('Oops! Something went wrong. Please try again later.');
    });
});

// Event listener for menu toggle button
menuToggle.addEventListener('click', function() {
    toggleMenu();
});

// Event delegation for menu item clicks
menu.addEventListener('click', function(event) {
    if (event.target.tagName === 'A') {
        toggleMenu();
    }
});

// Event listener for logo click to reload the page
logo.addEventListener('click', function() {
    location.reload();
});

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
    totalSlides = document.querySelectorAll('.carousel-img').length;
    showSlides();
});

// Carousel logic
let slideIndex = 1;
let totalSlides;

function nextSlide() {
    slideIndex++;
    if (slideIndex > totalSlides) slideIndex = 1;
    showSlides();
}

function prevSlide() {
    slideIndex--;
    if (slideIndex < 1) slideIndex = totalSlides;
    showSlides();
}

function showSlides() {
    const slides = document.querySelectorAll('.carousel-img');
    slides.forEach((slide, index) => {
        slide.style.display = (index === slideIndex - 1) ? 'block' : 'none';
    });
}
