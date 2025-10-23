export interface FaceBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

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

export const cropImage = (file: File, box: FaceBox, targetAspectRatio: number = 3 / 4): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Could not read file for cropping."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const { naturalWidth: iw, naturalHeight: ih } = img;
                
                const faceBox = {
                    x: box.x * iw,
                    y: box.y * ih,
                    width: box.width * iw,
                    height: box.height * ih,
                };

                const faceCenterX = faceBox.x + faceBox.width / 2;
                const faceCenterY = faceBox.y + faceBox.height / 2;
                
                const paddingFactor = 2.5;
                let cropHeight = faceBox.height * paddingFactor;
                let cropWidth = cropHeight * targetAspectRatio;

                if (cropWidth > iw) {
                    cropWidth = iw;
                    cropHeight = cropWidth / targetAspectRatio;
                }
                if (cropHeight > ih) {
                    cropHeight = ih;
                    cropWidth = cropHeight * targetAspectRatio;
                }
                
                let sx = faceCenterX - cropWidth / 2;
                let sy = faceCenterY - cropHeight / 2;

                sx = Math.max(0, Math.min(sx, iw - cropWidth));
                sy = Math.max(0, Math.min(sy, ih - cropHeight));

                const canvas = document.createElement('canvas');
                canvas.width = cropWidth;
                canvas.height = cropHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context for cropping'));
                }

                ctx.drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                
                const mimeType = 'image/jpeg';
                const quality = 0.98;

                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Canvas to Blob conversion failed during crop.'));
                    }
                    const fileName = file.name.substring(0, file.name.lastIndexOf('.')) + '-cropped.jpg';
                    const newFile = new File([blob], fileName, {
                        type: mimeType,
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                }, mimeType, quality);
            };
            img.onerror = (err) => reject(new Error('Image failed to load for cropping.'));
        };
        reader.onerror = (err) => reject(new Error('File reader failed for cropping.'));
    });
};
