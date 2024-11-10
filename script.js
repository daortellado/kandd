function calculatePhotosPerPage() {
    const gallery = document.querySelector('.gallery.active');
    if (!gallery) return 12;

    const galleryWidth = gallery.offsetWidth;
    const minPhotoWidth = window.innerWidth <= 768 ? 150 : 250;
    const columnsPerRow = Math.max(1, Math.floor(galleryWidth / minPhotoWidth));
    // Return enough photos to fill 3 complete rows
    return columnsPerRow * 3;
}

let PHOTOS_PER_PAGE = 12;
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
    
    if (viewId === 'galleryView') {
        setTimeout(() => {
            PHOTOS_PER_PAGE = calculatePhotosPerPage();
        }, 100);
    }
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
        
        const dirMap = {
            'wedding': 'photos',
            'photobooth': 'photobooth'
        };

        if (!data || !data[directory] || !data[directory].files) {
            console.log('Data structure:', data);
            return [];
        }
        
        const photos = data[directory].files.map(filename => {
            const actualDir = dirMap[directory];
            const fileExt = directory === 'wedding' ? 'jpg' : 'png';
            
            const photo = {
                src: `${actualDir}/full/${filename}.${fileExt}`,
                thumb: `${actualDir}/thumbs/${filename}_thumb.${fileExt}`,
                width: directory === 'wedding' ? 1500 : 600,
                height: directory === 'wedding' ? 1000 : 900,
                alt: directory === 'wedding' ? 'Wedding Photo' : 'Photobooth Strip'
            };
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
        PHOTOS_PER_PAGE = calculatePhotosPerPage();
        weddingPhotos = await getPhotosInDirectory('wedding');
        photoboothPhotos = await getPhotosInDirectory('photobooth');
        
        if (weddingPhotos.length > 0 || photoboothPhotos.length > 0) {
            setupInfiniteScroll();
            loadMorePhotos('wedding');
        }
    } catch (error) {
        console.error('Error initializing galleries:', error);
    }
}

function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '200px', // Increased margin to trigger earlier
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                console.log('Loading more photos...'); // Debug log
                loadMorePhotos(currentGalleryType);
            }
        });
    }, options);

    // Create trigger element outside the grid structure
    const galleryContainer = document.querySelector('.gallery-container');
    const loadingTrigger = document.createElement('div');
    loadingTrigger.className = 'loading-trigger-wrapper';
    const trigger = document.createElement('div');
    trigger.className = 'loading-trigger';
    loadingTrigger.appendChild(trigger);
    galleryContainer.appendChild(loadingTrigger);
    
    observer.observe(trigger);
}

async function loadMorePhotos(type) {
    const photos = type === 'wedding' ? weddingPhotos : photoboothPhotos;
    const gallery = document.getElementById(type);
    const startIndex = currentPage[type] * PHOTOS_PER_PAGE;
    
    if (startIndex >= photos.length || isLoading) return;
    
    isLoading = true;
    
    const endIndex = Math.min(startIndex + PHOTOS_PER_PAGE, photos.length);
    
    // Remove old loading trigger
    const oldTrigger = gallery.querySelector('.loading-trigger-wrapper');
    if (oldTrigger) {
        oldTrigger.remove();
    }

    for (let i = startIndex; i < endIndex; i++) {
        const photo = photos[i];
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = photo.thumb;
        img.alt = photo.alt;
        img.loading = 'lazy';
        
        item.appendChild(img);
        item.addEventListener('click', () => openPhotoSwipe(i, photos));
        gallery.appendChild(item);
    }
    
    // Add new loading trigger if there are more photos
    if (endIndex < photos.length) {
        const loadingTrigger = document.createElement('div');
        loadingTrigger.className = 'loading-trigger-wrapper';
        const trigger = document.createElement('div');
        trigger.className = 'loading-trigger';
        loadingTrigger.appendChild(trigger);
        gallery.appendChild(loadingTrigger);
    }
    
    currentPage[type]++;
    isLoading = false;
}

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
        gallery.innerHTML = ''; // Clear existing photos
    });
    
    const selectedGallery = document.getElementById(type);
    selectedGallery.classList.add('active');
    
    // Reset page count and reload photos
    currentPage[type] = 0;
    PHOTOS_PER_PAGE = calculatePhotosPerPage();
    setupInfiniteScroll();
    loadMorePhotos(type);
}

function openPhotoSwipe(index, photos) {
    const pswpElement = document.createElement('div');
    pswpElement.className = 'pswp';
    document.body.appendChild(pswpElement);

    const options = {
        dataSource: photos,
        index: index,
        bgOpacity: 0.9,
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        imageClickAction: 'close',
        tapAction: 'close',
        preloaderDelay: 0,
        wheelToZoom: true,
        initialZoomLevel: 'fit',
        secondaryZoomLevel: 2,
        maxZoomLevel: 4,
        // Add these options for better fit
        showHideAnimationType: 'fade',
        showAnimationDuration: 300,
        hideAnimationDuration: 300,
        // Force contain mode
        baseMode: 'fit'
    };

    const lightbox = new window.PhotoSwipe(options);
    
    // Ensure proper sizing before opening
    lightbox.on('contentLoad', (e) => {
        const { content } = e;
        if (content.type === 'image') {
            // Let PhotoSwipe calculate max zoom based on image and viewport size
            content.panAreaSize = { x: null, y: null };
            content.fit = { x: null, y: null };
        }
    });

    lightbox.init();
    
    lightbox.on('destroy', () => {
        pswpElement.remove();
    });
}

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

// Handle window resize
window.addEventListener('resize', () => {
    PHOTOS_PER_PAGE = calculatePhotosPerPage();
});