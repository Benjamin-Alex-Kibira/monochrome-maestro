import React, { useCallback, useState } from 'react';
import UploadIcon from './icons/UploadIcon';

interface ImageUploaderProps {
    onImagesSelect: (files: File[]) => void;
    isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesSelect, isLoading }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onImagesSelect(Array.from(event.target.files));
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            onImagesSelect(Array.from(event.dataTransfer.files));
        }
    }, [onImagesSelect]);

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };
    
    const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const dragDropClasses = isDragging ? 'border-gray-300 bg-gray-800' : 'border-gray-600';

    return (
        <div className="w-full max-w-2xl mx-auto mt-8 mb-12">
            <label 
                htmlFor="file-upload" 
                className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 cursor-pointer transition-colors duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${dragDropClasses}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                <span className="mt-4 block text-lg font-medium text-gray-300 font-sans">
                    Upload Portrait(s)
                </span>
                <p className="text-gray-500 mt-1 text-sm">Drag & drop or click to select files</p>
                <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    multiple
                />
            </label>
        </div>
    );
};

export default ImageUploader;
