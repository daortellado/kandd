// Calculate photos per page based on viewport
function calculatePhotosPerPage() {
    const galleryWidth = document.querySelector('.gallery-container').offsetWidth;
    const minPhotoWidth = window.innerWidth <= 768 ? 150 : 250; // Matches our CSS breakpoints
    const columnsPerRow = Math.floor(galleryWidth / minPhotoWidth);
    // Return enough photos to fill 2 complete rows
    return columnsPerRow * 2;
}

let PHOTOS_PER_PAGE;
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
    
    // Calculate photos per page when showing gallery
    if (viewId === 'galleryView') {
        PHOTOS_PER_PAGE = calculatePhotosPerPage();
        console.log(`Set to load ${PHOTOS_PER_PAGE} photos per page`);
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
                width: directory === 'wedding' ? 800 : 600,
                height: directory === 'wedding' ? 600 : 900,
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
        rootMargin: '100px', // Start loading before reaching the end
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                console.log('Intersection observed, loading more photos');
                loadMorePhotos(currentGalleryType);
            }
        });
    }, options);

    ['wedding', 'photobooth'].forEach(type => {
        const loadingTrigger = document.createElement('div');
        loadingTrigger.className = 'loading-trigger';
        loadingTrigger.id = `${type}-trigger`;
        document.getElementById(type).appendChild(loadingTrigger);
        observer.observe(loadingTrigger);
        console.log(`Set up infinite scroll trigger for ${type}`);
    });
}

async function loadMorePhotos(type) {
    const photos = type === 'wedding' ? weddingPhotos : photoboothPhotos;
    const gallery = document.getElementById(type);
    const startIndex = currentPage[type] * PHOTOS_PER_PAGE;
    
    if (startIndex >= photos.length || isLoading) {
        console.log(`All photos loaded for ${type} gallery or loading in progress`);
        return;
    }
    
    console.log(`Loading ${PHOTOS_PER_PAGE} more ${type} photos starting from index ${startIndex}`);
    isLoading = true;
    
    const endIndex = Math.min(startIndex + PHOTOS_PER_PAGE, photos.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const photo = photos[i];
        
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = photo.thumb;
        img.alt = photo.alt;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.position = 'absolute';
        img.style.objectFit = 'cover';
        
        img.onload = () => {
            console.log(`Loaded image ${i + 1} of batch`);
        };
        
        img.onerror = (err) => {
            console.error(`Failed to load image ${i + 1}:`, photo.thumb);
        };
        
        item.appendChild(img);
        item.addEventListener('click', () => openPhotoSwipe(i, photos));
        gallery.appendChild(item);
    }
    
    currentPage[type]++;
    isLoading = false;

    // Check if we need to keep observing
    if (endIndex >= photos.length) {
        console.log(`Removing infinite scroll for ${type} - all photos loaded`);
        const trigger = document.getElementById(`${type}-trigger`);
        if (trigger) trigger.remove();
    }
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

// Handle window resize
window.addEventListener('resize', () => {
    PHOTOS_PER_PAGE = calculatePhotosPerPage();
});