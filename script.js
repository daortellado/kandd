// Cache frequently accessed elements
const menu = document.querySelector('.top-menu ul');
const menuToggle = document.querySelector('.menu-toggle');
const splashContent = document.getElementById('splash-content');
const form = document.getElementById('email-form');
const loadingSpinner = document.getElementById('loading-spinner');
const logo = document.querySelector('.fixed-logo');
const faq = document.getElementById('faq');

if (faq) {
    faq.addEventListener('click', function(event) {
        console.log('Event listener called');
        if (event.target.classList.contains('faq-question')) {
            console.log('FAQ question clicked');
            toggleFaqAnswer(event);
        }
    });
} else {
    console.log('FAQ element not found');
}

// Call the function when the section changes
// Assuming you have a function to handle section changes
function onSectionChange(section) {
  toggleLogo(section);
}

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
    if (sectionId === 'all-the-details') {
        if (window.innerWidth <= 768) { // Check screen size
            document.getElementById('logo-container').style.display = 'none';
            document.querySelector('.content').classList.add('details-selected');
        }
    } else {
        if (window.innerWidth <= 768) { // Check screen size
            document.getElementById('logo-container').style.display = 'block';
            document.querySelector('.content').classList.remove('details-selected');
        }
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
menuToggle.addEventListener('click', toggleMenu);

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

function showTab(tabId, event) {
    // Hide all tab contents
    var tabContents = document.getElementsByClassName('tab-content');
    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }

    // Remove active class from all tabs
    var tabs = document.getElementsByClassName('tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    // Show the selected tab content
    document.getElementById(tabId).style.display = 'block';

    // Add active class to the selected tab
    if (event) {
        event.target.classList.add('active');
    } else {
        const tabLink = document.querySelector(`[href="#${tabId}"]`);
        if (tabLink) {
            tabLink.classList.add('active');
        }
    }
}

function toggleFaqAnswer(event) {
    console.log('Toggle FAQ answer called');
    console.log(event.target); // Log the element that was clicked
    var answer = event.target.nextElementSibling;
    console.log(answer); // Log the next element sibling

    // Close all other answers
    var allAnswers = document.querySelectorAll('.faq-answer');
    allAnswers.forEach(function(answer) {
        answer.classList.remove('show');
    });

    // Toggle the current answer
    answer.classList.toggle('show');
}

// Event delegation for FAQ questions
faq.addEventListener('click', function(event) {
    console.log('Event listener called');
    if (event.target.classList.contains('faq-question')) {
        console.log('FAQ question clicked');
        toggleFaqAnswer(event);
    }
});

// DOMContentLoaded event listener
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('faq-question')) {
        console.log('FAQ question clicked');
        toggleFaqAnswer(event);
    }
});

// Show the default tab on page load
showTab('schedule'); // Pass the default tab ID