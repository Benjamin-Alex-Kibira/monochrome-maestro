import React from 'react';
import DownloadIcon from './icons/DownloadIcon';

interface DownloadButtonProps {
    imageUrl: string;
    fileName: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ imageUrl, fileName }) => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        
        const nameParts = fileName.split('.');
        nameParts.pop();
        const baseName = nameParts.join('.');
        
        // Determine file extension from the data URL's MIME type for accuracy
        const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));
        let extension = 'png'; // Default to PNG for high quality
        if (mimeType === 'image/jpeg') {
            extension = 'jpg';
        } else if (mimeType === 'image/webp') {
            extension = 'webp';
        }
        
        link.download = `${baseName}-monochrome.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 font-sans font-semibold rounded-md shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
        >
            <DownloadIcon className="w-5 h-5" />
            Download Masterpiece
        </button>
    );
};

export default DownloadButton;