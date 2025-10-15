import React from 'react';

interface PreviewDisplayProps {
    imageUrl: string;
    onGenerate: () => void;
    isGenerating: boolean;
    children: React.ReactNode;
}

const PreviewDisplay: React.FC<PreviewDisplayProps> = ({ imageUrl, onGenerate, isGenerating, children }) => {
    return (
        <div className="w-full max-w-6xl mx-auto my-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
                <div className="flex flex-col items-center">
                    <h3 className="font-serif text-2xl text-gray-400 mb-4">Your Portrait</h3>
                    <div className="w-full rounded-lg overflow-hidden shadow-2xl bg-gray-800">
                        <img src={imageUrl} alt="Uploaded portrait for enhancement" className="object-contain w-full h-full max-h-[70vh]" />
                    </div>
                </div>
                <div className="flex flex-col gap-8">
                    {children}
                    <div className="text-center mt-4">
                        <button
                            onClick={onGenerate}
                            disabled={isGenerating}
                            className="px-12 py-4 bg-gray-200 text-gray-900 font-sans font-bold text-lg rounded-md shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        >
                            {isGenerating ? 'Working...' : 'Create Masterpiece'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewDisplay;
