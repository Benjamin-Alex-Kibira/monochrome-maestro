import React from 'react';

interface PreviewDisplayProps {
    previewImage: string | null;
    isLoading: boolean;
}

const PreviewDisplay: React.FC<PreviewDisplayProps> = ({ previewImage, isLoading }) => {
    return (
        <div className="w-full max-w-sm mx-auto my-8 p-4 bg-gray-800 border border-gray-700 rounded-lg text-center shadow-2xl">
            <h3 className="font-sans text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Live Preview</h3>
            <div className="relative w-full aspect-square bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                         <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>
                    </div>
                )}
                {previewImage ? (
                    <img src={previewImage} alt="Style preview" className="object-contain w-full h-full" />
                ) : (
                    <p className="text-gray-600 text-sm p-4">Adjust controls below to see a preview</p>
                )}
            </div>
        </div>
    );
};

export default PreviewDisplay;