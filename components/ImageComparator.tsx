
import React from 'react';

interface ImageComparatorProps {
    originalImage: string;
    enhancedImage: string;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({ originalImage, enhancedImage }) => {
    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
            <div className="flex flex-col items-center">
                <h3 className="font-serif text-2xl text-gray-400 mb-4">Before</h3>
                <div className="w-full rounded-lg overflow-hidden shadow-2xl bg-gray-800">
                    <img src={originalImage} alt="Original portrait" className="object-contain w-full h-full max-h-[70vh]" />
                </div>
            </div>
            <div className="flex flex-col items-center">
                <h3 className="font-serif text-2xl text-gray-200 mb-4">After</h3>
                <div className="w-full rounded-lg overflow-hidden shadow-2xl bg-gray-800 border-2 border-white/20">
                    <img src={enhancedImage} alt="Enhanced black and white portrait" className="object-contain w-full h-full max-h-[70vh]" />
                </div>
            </div>
        </div>
    );
};

export default ImageComparator;
