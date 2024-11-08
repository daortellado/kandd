const PHOTOS_PER_PAGE = 20;

let weddingPhotos = [];
let photoboothPhotos = [];
let currentGalleryType = 'wedding';
let currentPage = {
    wedding: 0,
    photobooth: 0
};
let isLoading = false;

// View management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
}

function returnToSplash() {
    showView('splashView');
}

// Modal management
function showGalleryModal() {
    document.getElementById('galleryModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('galleryModal').style.display = 'none';
    document.getElementById('galleryPassword').value = '';
}

// Password handling
const GALLERY_KEY = 'bGlnaHRob3VzZQ==';

function checkPassword() {
    const password = document.getElementById('galleryPassword').value;
    if (atob(GALLERY_KEY) === password.toLowerCase()) {
        closeModal();
        showView('galleryView');
        if (!document.querySelector('.gallery-item')) {
            initGalleries();
        }
    } else {
        alert('Incorrect password. Please try again.');
    }
}

async function getPhotosInDirectory(directory) {
    try {
        const response = await fetch(`./${directory}/thumbs/`);  // Changed to relative path
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const files = await response.text();
        
        // Different patterns for wedding photos vs photobooth
        const pattern = directory === 'photos' 
            ? /2024_10_12_KatelynDamianWedding-\d+_thumb\.jpg/g
            : /collage_[0-9]+_thumb\.jpg/g;
        
        const thumbFiles = files.match(pattern) || [];
        
        // Sort files based on the numerical portion
        const sortedFiles = thumbFiles.sort((a, b) => {
            const getNumber = (filename) => {
                if (directory === 'photos') {
                    return parseInt(filename.match(/Wedding-(\d+)/)[1]);
                } else {
                    return parseInt(filename.match(/collage_(\d+)/)[1]);
                }
            };
            return getNumber(a) - getNumber(b);
        });

        return sortedFiles.map(thumb => {
            const fullImage = thumb.replace('_thumb', '');
            return {
                src: `./${directory}/full/${fullImage}`,     // Changed to relative path
                thumb: `./${directory}/thumbs/${thumb}`,      // Changed to relative path
                width: directory === 'photos' ? 800 : 600,
                height: directory === 'photos' ? 600 : 900,
                alt: directory === 'photos' ? 'Wedding Photo' : 'Photobooth Strip'
            };
        });
    } catch (error) {
        console.error(`Error loading ${directory}:`, error);
        return [];
    }
}

// Gallery initialization
async function initGalleries() {
    // Load and sort photo lists first
    weddingPhotos = await getPhotosInDirectory('photos');
    photoboothPhotos = await getPhotosInDirectory('photobooth');
    
    console.log(`Loaded ${weddingPhotos.length} wedding photos and ${photoboothPhotos.length} photobooth photos`);
    
    // Then set up infinite scroll and load initial photos
    setupInfiniteScroll();
    loadMorePhotos('wedding');
    loadMorePhotos('photobooth');
}

// Infinite scroll setup
function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadMorePhotos(currentGalleryType);
            }
        });
    }, options);

    // Observe loading trigger elements
    ['wedding', 'photobooth'].forEach(type => {
        const loadingTrigger = document.createElement('div');
        loadingTrigger.className = 'loading-trigger';
        loadingTrigger.id = `${type}-trigger`;
        document.getElementById(type).appendChild(loadingTrigger);
        observer.observe(loadingTrigger);
    });
}

// Load more photos
async function loadMorePhotos(type) {
    const photos = type === 'wedding' ? weddingPhotos : photoboothPhotos;
    const gallery = document.getElementById(type);
    const startIndex = currentPage[type] * PHOTOS_PER_PAGE;
    
    if (startIndex >= photos.length || isLoading) return;
    
    isLoading = true;
    
    const fragment = document.createDocumentFragment();
    const endIndex = Math.min(startIndex + PHOTOS_PER_PAGE, photos.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const photo = photos[i];
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Create and append loading placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'photo-placeholder';
        item.appendChild(placeholder);
        
        // Load image
        const img = new Image();
        img.src = photo.thumb;
        img.alt = photo.alt;
        img.loading = 'lazy';
        
        img.onload = () => {
            placeholder.style.display = 'none';
            item.appendChild(img);
        };
        
        item.addEventListener('click', () => openPhotoSwipe(i, photos));
        fragment.appendChild(item);
    }
    
    // Remove loading trigger before adding new photos
    const loadingTrigger = document.getElementById(`${type}-trigger`);
    if (loadingTrigger) {
        loadingTrigger.remove();
    }
    
    gallery.appendChild(fragment);
    
    // Add back the loading trigger
    const newTrigger = document.createElement('div');
    newTrigger.className = 'loading-trigger';
    newTrigger.id = `${type}-trigger`;
    gallery.appendChild(newTrigger);
    
    currentPage[type]++;
    isLoading = false;
}

// Gallery switching
function switchGallery(type) {
    currentGalleryType = type;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update galleries
    document.querySelectorAll('.gallery').forEach(gallery => {
        gallery.classList.remove('active');
    });
    document.getElementById(type).classList.add('active');
}

// PhotoSwipe initialization
function openPhotoSwipe(index, photos) {
    const pswpElement = document.createElement('div');
    pswpElement.className = 'pswp';
    document.body.appendChild(pswpElement);

    const options = {
        dataSource: photos,
        index: index,
        closeOnVerticalDrag: true,
        clickToCloseNonZoomable: true
    };

    const lightbox = new PhotoSwipe(options);
    lightbox.init();
    
    lightbox.on('destroy', () => {
        pswpElement.remove();
    });
}

// Vendor section toggle
function toggleVendors() {
    const vendorList = document.getElementById('vendorList');
    const toggle = document.querySelector('.vendor-toggle');
    vendorList.classList.toggle('expanded');
    toggle.textContent = vendorList.classList.contains('expanded') 
        ? 'Special Shoutout to Our Vendors ▲'
        : 'Special Shoutout to Our Vendors ▼';
}

// Event listeners
document.getElementById('galleryPassword').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        checkPassword();
    }
});

window.onclick = function(event) {
    const modal = document.getElementById('galleryModal');
    if (event.target === modal) {
        closeModal();
    }
};