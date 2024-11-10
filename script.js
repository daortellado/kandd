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
            
            return {
                src: `${actualDir}/full/${filename}.${fileExt}`,
                thumb: `${actualDir}/thumbs/${filename}_thumb.${fileExt}`,
                alt: directory === 'wedding' ? 'Wedding Photo' : 'Photobooth Strip'
            };
        });
        
        return photos;
    } catch (error) {
        console.error(`Error loading ${directory}:`, error);
        return [];
    }
}

// Get image dimensions when needed
async function getImageDimensions(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };
        img.src = src;
    });
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
        rootMargin: '200px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadMorePhotos(currentGalleryType);
            }
        });
    }, options);

    // Create trigger element
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

    for (let i = startIndex; i < Math.min(startIndex + PHOTOS_PER_PAGE, photos.length); i++) {
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
    
    currentPage[type]++;
    isLoading = false;

    // Remove loading indicator if no more photos
    if (startIndex + PHOTOS_PER_PAGE >= photos.length) {
        const loadingTrigger = document.querySelector('.loading-trigger-wrapper');
        if (loadingTrigger) {
            loadingTrigger.remove();
        }
    }
}

async function openPhotoSwipe(index, photos) {
    const pswpElement = document.createElement('div');
    pswpElement.className = 'pswp';
    document.body.appendChild(pswpElement);

    // Show loading state while getting dimensions
    const loader = document.createElement('div');
    loader.style.position = 'fixed';
    loader.style.top = '50%';
    loader.style.left = '50%';
    loader.style.transform = 'translate(-50%, -50%)';
    loader.style.background = 'rgba(0,0,0,0.8)';
    loader.style.color = 'white';
    loader.style.padding = '20px';
    loader.style.borderRadius = '5px';
    loader.style.zIndex = '9999';
    loader.textContent = 'Loading...';
    document.body.appendChild(loader);

    // Get dimensions for current image
    const dimensions = await getImageDimensions(photos[index].src);
    const photoWithDimensions = { ...photos[index], ...dimensions };

    // Remove loader
    document.body.removeChild(loader);

    const options = {
        dataSource: [photoWithDimensions], // Keep single photo for correct aspect ratio
        index: 0,
        closeOnVerticalDrag: true,
        clickToCloseNonZoomable: true,
        pswpModule: window.PhotoSwipe,
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        imageClickAction: 'zoom',
        tapAction: 'zoom',
        preloaderDelay: 0
    };

    const lightbox = new window.PhotoSwipe(options);
    
    // Add our own navigation buttons after PhotoSwipe is initialized
    lightbox.on('firstUpdate', () => {
        let currentIndex = index;

        // Create and style navigation buttons
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '❮';
        prevButton.style.cssText = `
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            padding: 20px;
            cursor: pointer;
            font-size: 24px;
            border-radius: 5px;
            z-index: 9999;
        `;

        const nextButton = document.createElement('button');
        nextButton.innerHTML = '❯';
        nextButton.style.cssText = `
            position: fixed;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            padding: 20px;
            cursor: pointer;
            font-size: 24px;
            border-radius: 5px;
            z-index: 9999;
        `;

        // Add click handlers
        prevButton.onclick = async () => {
            if (currentIndex > 0) {
                currentIndex--;
                const prevDimensions = await getImageDimensions(photos[currentIndex].src);
                lightbox.options.dataSource = [{
                    ...photos[currentIndex],
                    ...prevDimensions
                }];
                lightbox.refreshSlideContent(0);
            }
        };

        nextButton.onclick = async () => {
            if (currentIndex < photos.length - 1) {
                currentIndex++;
                const nextDimensions = await getImageDimensions(photos[currentIndex].src);
                lightbox.options.dataSource = [{
                    ...photos[currentIndex],
                    ...nextDimensions
                }];
                lightbox.refreshSlideContent(0);
            }
        };

        // Add buttons to DOM
        document.body.appendChild(prevButton);
        document.body.appendChild(nextButton);

        // Clean up on close
        lightbox.on('destroy', () => {
            prevButton.remove();
            nextButton.remove();
            pswpElement.remove();
        });
    });

    lightbox.on('beforeOpen', () => {
        lightbox.options.initialZoomLevel = 'fit';
    });

    lightbox.init();
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