export const resizeImage = (file: File, maxDimension: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Could not read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                const mimeType = 'image/jpeg';
                const quality = 0.95;

                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed'));
                    }
                    const fileName = file.name.substring(0, file.name.lastIndexOf('.')) + '.jpg';
                    const newFile = new File([blob], fileName, {
                        type: mimeType,
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, mimeType, quality);
            };
            img.onerror = (err) => reject(new Error('Image failed to load.'));
        };
        reader.onerror = (err) => reject(new Error('File reader failed.'));
    });
};

export const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const mimeType = blob.type;
    const extension = mimeType.split('/')[1] || 'png';
    const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const newFilename = `${baseName}.${extension}`;
    return new File([blob], newFilename, { type: mimeType });
};