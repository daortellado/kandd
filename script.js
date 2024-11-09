function calculatePhotosPerPage() {
    // Get actual gallery width
    const gallery = document.querySelector('.gallery.active');
    if (!gallery) return 12; // fallback default

    const galleryWidth = gallery.offsetWidth;
    const minPhotoWidth = window.innerWidth <= 768 ? 150 : 250;
    const columnsPerRow = Math.max(1, Math.floor(galleryWidth / minPhotoWidth));
    console.log(`Gallery width: ${galleryWidth}, columns per row: ${columnsPerRow}`);
    // Return enough photos to fill 3 complete rows
    return columnsPerRow * 3;
}

let PHOTOS_PER_PAGE = 12; // Default value
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
        // Wait for layout to settle
        setTimeout(() => {
            PHOTOS_PER_PAGE = calculatePhotosPerPage();
            console.log(`Set to load ${PHOTOS_PER_PAGE} photos per page`);
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
                // Updated dimensions for wedding photos
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
        
        console.log(`Loaded ${weddingPhotos.length} wedding photos and ${photoboothPhotos.length} photobooth photos`);
        console.log(`Will load ${PHOTOS_PER_PAGE} photos per page`);
        
        if (weddingPhotos.length > 0 || photoboothPhotos.length > 0) {
            setupInfiniteScroll();
            loadMorePhotos('wedding');
            loadMorePhotos('photobooth');
        }
    } catch (error) {
        console.error('Error initializing galleries:', error);
    }
}

function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadMorePhotos(currentGalleryType);
            }
        });
    }, options);

    ['wedding', 'photobooth'].forEach(type => {
        // Create a wrapper for the loading trigger
        const wrapper = document.createElement('div');
        wrapper.className = 'loading-trigger-wrapper';
        
        const loadingTrigger = document.createElement('div');
        loadingTrigger.className = 'loading-trigger';
        loadingTrigger.id = `${type}-trigger`;
        
        wrapper.appendChild(loadingTrigger);
        document.getElementById(type).appendChild(wrapper);
        observer.observe(loadingTrigger);
    });
}

async function loadMorePhotos(type) {
    const photos = type === 'wedding' ? weddingPhotos : photoboothPhotos;
    const gallery = document.getElementById(type);
    const startIndex = currentPage[type] * PHOTOS_PER_PAGE;
    
    if (startIndex >= photos.length || isLoading) return;
    
    isLoading = true;
    
    // Remove old loading trigger
    const oldTriggerWrapper = gallery.querySelector('.loading-trigger-wrapper');
    if (oldTriggerWrapper) {
        oldTriggerWrapper.remove();
    }

    const endIndex = Math.min(startIndex + PHOTOS_PER_PAGE, photos.length);
    
    // Add photos
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
    
    // Add new loading trigger at the end if there are more photos
    if (endIndex < photos.length) {
        const wrapper = document.createElement('div');
        wrapper.className = 'loading-trigger-wrapper';
        
        const loadingTrigger = document.createElement('div');
        loadingTrigger.className = 'loading-trigger';
        loadingTrigger.id = `${type}-trigger`;
        
        wrapper.appendChild(loadingTrigger);
        gallery.appendChild(wrapper);
    }
    
    currentPage[type]++;
    isLoading = false;
}

function switchGallery(type) {
    currentGalleryType = type;
    currentPage[type] = 0; // Reset page count for the selected gallery
    
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
    
    // Recalculate photos per page for new gallery
    PHOTOS_PER_PAGE = calculatePhotosPerPage();
    
    // Setup infinite scroll and load initial photos
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
        closeOnVerticalDrag: true,
        clickToCloseNonZoomable: true,
        pswpModule: window.PhotoSwipe,
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        imageClickAction: 'zoom',
        tapAction: 'zoom',
        preloaderDelay: 0
    };

    const lightbox = new window.PhotoSwipe(options);
    lightbox.on('beforeOpen', () => {
        lightbox.options.initialZoomLevel = 'fit';
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