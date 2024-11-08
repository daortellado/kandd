const PHOTOS_PER_PAGE = 20;

let weddingPhotos = [];
let photoboothPhotos = [];
let currentGalleryType = 'photos';
let currentPage = {
    photos: 0,
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
        const response = await fetch('./photo-list.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (!data || !data[directory] || !data[directory].files) {
            console.log('Data structure:', data);
            return [];
        }
        
        const photos = data[directory].files.map(filename => {
            const photo = {
                src: `./${directory}/full/${filename}.png`,
                thumb: `./${directory}/thumbs/${filename}_thumb.png`,
                width: directory === 'photos' ? 800 : 600,
                height: directory === 'photos' ? 600 : 900,
                alt: directory === 'photos' ? 'Wedding Photo' : 'Photobooth Strip'
            };
            console.log('Created photo object:', photo);
            return photo;
        });
        
        return photos;
    } catch (error) {
        console.error(`Error loading ${directory}:`, error);
        return [];
    }
}

async function initGalleries() {
    try {
        weddingPhotos = await getPhotosInDirectory('photos');
        photoboothPhotos = await getPhotosInDirectory('photobooth');
        
        console.log(`Loaded ${weddingPhotos.length} wedding photos and ${photoboothPhotos.length} photobooth photos`);
        
        if (weddingPhotos.length > 0 || photoboothPhotos.length > 0) {
            setupInfiniteScroll();
            loadMorePhotos('photos');
            loadMorePhotos('photobooth');
        }
    } catch (error) {
        console.error('Error initializing galleries:', error);
    }
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

    ['photos', 'photobooth'].forEach(type => {
        const loadingTrigger = document.createElement('div');
        loadingTrigger.className = 'loading-trigger';
        loadingTrigger.id = `${type}-trigger`;
        document.getElementById(type).appendChild(loadingTrigger);
        observer.observe(loadingTrigger);
    });
}

async function loadMorePhotos(type) {
    const photos = type === 'photos' ? weddingPhotos : photoboothPhotos;
    const gallery = document.getElementById(type);
    const startIndex = currentPage[type] * PHOTOS_PER_PAGE;
    
    if (startIndex >= photos.length || isLoading) return;
    
    isLoading = true;
    
    for (let i = startIndex; i < Math.min(startIndex + PHOTOS_PER_PAGE, photos.length); i++) {
        const photo = photos[i];
        
        // Create container
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.backgroundColor = 'red'; // Debug styling
        
        // Create image element with explicit dimensions
        const img = document.createElement('img');
        img.src = photo.thumb;
        img.alt = photo.alt;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';
        img.style.objectFit = 'cover';
        img.style.backgroundColor = 'blue'; // Debug styling
        
        console.log('Loading image:', photo.thumb);
        
        img.onload = () => {
            console.log('Image loaded successfully:', photo.thumb);
            item.style.backgroundColor = 'green'; // Visual confirmation of load
        };
        
        img.onerror = (err) => {
            console.error('Image failed to load:', photo.thumb, err);
            item.style.backgroundColor = 'yellow'; // Visual error state
        };
        
        item.appendChild(img);
        item.addEventListener('click', () => openPhotoSwipe(i, photos));
        gallery.appendChild(item);
    }
    
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
        clickToCloseNonZoomable: true,
        pswpModule: window.PhotoSwipe
    };

    const lightbox = new window.PhotoSwipe(options);
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