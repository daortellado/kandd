const fs = require('fs');
const path = require('path');

function generatePhotoList() {
    const photoList = {
        wedding: { files: [] },
        photobooth: { files: [] }
    };

    try {
        // Wedding photos
        console.log('\nChecking wedding photos...');
        const weddingPath = path.join('.', 'photos', 'thumbs');
        console.log('Wedding path:', weddingPath);
        
        const allWeddingFiles = fs.readdirSync(weddingPath);
        console.log('All files in wedding thumbs:', allWeddingFiles);
        
        const weddingFiles = allWeddingFiles
            .filter(file => {
                const isThumb = file.includes('_thumb') && (file.endsWith('.jpg') || file.endsWith('.png'));
                console.log(`${file}: is thumb? ${isThumb}`);
                return isThumb;
            })
            .map(file => {
                // Remove both _thumb.jpg and _thumb.png
                const baseName = file.replace(/_thumb\.(jpg|png)$/, '');
                console.log(`Converting ${file} to ${baseName}`);
                return baseName;
            })
            .sort((a, b) => {
                try {
                    const numA = parseInt(a.match(/Wedding-(\d+)/)[1]);
                    const numB = parseInt(b.match(/Wedding-(\d+)/)[1]);
                    return numA - numB;
                } catch (error) {
                    console.log('Error sorting:', error);
                    return 0;
                }
            });

        // Photobooth photos
        console.log('\nChecking photobooth photos...');
        const photoboothPath = path.join('.', 'photobooth', 'thumbs');
        console.log('Photobooth path:', photoboothPath);
        
        const allPhotoboothFiles = fs.readdirSync(photoboothPath);
        console.log('All files in photobooth thumbs:', allPhotoboothFiles);
        
        const photoboothFiles = allPhotoboothFiles
            .filter(file => {
                const isThumb = file.includes('_thumb') && (file.endsWith('.jpg') || file.endsWith('.png'));
                console.log(`${file}: is thumb? ${isThumb}`);
                return isThumb;
            })
            .map(file => {
                // Remove both _thumb.jpg and _thumb.png
                const baseName = file.replace(/_thumb\.(jpg|png)$/, '');
                console.log(`Converting ${file} to ${baseName}`);
                return baseName;
            })
            .sort((a, b) => {
                try {
                    const numA = parseInt(a.match(/collage_(\d+)/)[1]);
                    const numB = parseInt(b.match(/collage_(\d+)/)[1]);
                    return numA - numB;
                } catch (error) {
                    console.log('Error sorting:', error);
                    return 0;
                }
            });

        photoList.wedding.files = weddingFiles;
        photoList.photobooth.files = photoboothFiles;

        console.log('\nFinal results:');
        console.log('Wedding photos found:', weddingFiles.length);
        console.log('Photobooth photos found:', photoboothFiles.length);

        // Also show the final data structure
        console.log('\nGenerated data:');
        console.log(JSON.stringify(photoList, null, 2));

        fs.writeFileSync('photo-list.json', JSON.stringify(photoList, null, 2));
        console.log('\nSuccessfully generated photo-list.json');

    } catch (error) {
        console.error('\nError generating photo list:', error);
        if (error.code === 'ENOENT') {
            console.error(`\nDirectory not found. Current working directory: ${process.cwd()}`);
            console.error('Please ensure you\'re running this script from the root folder containing photos/ and photobooth/ directories');
        }
    }
}

generatePhotoList();