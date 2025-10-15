import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageComparator from './components/ImageComparator';
import Spinner from './components/Spinner';
import DownloadButton from './components/DownloadButton';
import BackgroundSelector from './components/BackgroundSelector';
import MasterStyleSelector from './components/MasterStyleSelector';
import DetailSlider from './components/DetailSlider';
import { enhancePortrait } from './services/geminiService';

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalMimeType, setOriginalMimeType] = useState<string | null>(null);
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
    const [originalFileName, setOriginalFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [masterStyle, setMasterStyle] = useState<string>(() => localStorage.getItem('masterStyle') || 'default-gevurah');
    const [backgroundStyle, setBackgroundStyle] = useState<string>(() => localStorage.getItem('backgroundStyle') || 'plain-light');
    const [detailLevel, setDetailLevel] = useState<number>(() => parseInt(localStorage.getItem('detailLevel') || '50', 10));

    useEffect(() => {
        localStorage.setItem('masterStyle', masterStyle);
    }, [masterStyle]);

    useEffect(() => {
        localStorage.setItem('backgroundStyle', backgroundStyle);
    }, [backgroundStyle]);

    useEffect(() => {
        localStorage.setItem('detailLevel', detailLevel.toString());
    }, [detailLevel]);


    const processImage = async (base64Data: string, mimeType: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { base64: enhancedBase64, mimeType: enhancedMimeType } = await enhancePortrait(base64Data, mimeType, masterStyle, backgroundStyle, detailLevel);
            setEnhancedImage(`data:${enhancedMimeType};base64,${enhancedBase64}`);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred while processing the image.");
            }
            setEnhancedImage(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (PNG, JPG, WEBP).');
            return;
        }
        setEnhancedImage(null);
        setOriginalFileName(file.name);
        setOriginalMimeType(file.type);
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (e) => {
            const originalDataUrl = e.target?.result as string;
            setOriginalImage(originalDataUrl);
            const base64Data = originalDataUrl.split(',')[1];
            processImage(base64Data, file.type);
        };
        reader.onerror = () => {
             setError("Failed to read the selected file.");
             setIsLoading(false);
        };
    }, [masterStyle, backgroundStyle, detailLevel]);
    
    const handleEnhanceAgain = useCallback(async () => {
        if (!originalImage || !originalMimeType) return;
        const base64Data = originalImage.split(',')[1];
        processImage(base64Data, originalMimeType);
    }, [originalImage, originalMimeType, masterStyle, backgroundStyle, detailLevel]);

    const handleStartOver = () => {
        setOriginalImage(null);
        setEnhancedImage(null);
        setOriginalFileName(null);
        setOriginalMimeType(null);
        setError(null);
        setIsLoading(false);
    };
    
    const ControlsPanel = (
        <div className="w-full max-w-4xl mx-auto my-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg space-y-8">
            <MasterStyleSelector selectedStyle={masterStyle} onStyleChange={setMasterStyle} />
            <BackgroundSelector selectedStyle={backgroundStyle} onStyleChange={setBackgroundStyle} />
            <DetailSlider value={detailLevel} onChange={setDetailLevel} />
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return <Spinner />;
        }

        if (error) {
             return (
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-red-400 text-center my-8 font-sans bg-red-900/20 border border-red-500/30 p-4 rounded-md">{error}</p>
                    {originalImage && (
                        <div className="w-full rounded-lg overflow-hidden shadow-lg bg-gray-800 border-2 border-red-500/30">
                            <img src={originalImage} alt="Original portrait (failed to process)" className="object-contain w-full h-full max-h-[50vh]" />
                        </div>
                    )}
                    <div className="text-center mt-8 space-x-4">
                        <button onClick={handleEnhanceAgain} disabled={isLoading} className="px-8 py-4 bg-gray-600 text-white font-sans font-semibold rounded-md hover:bg-gray-500 transition-colors">
                            Try Again
                        </button>
                         <button onClick={handleStartOver} className="px-8 py-4 text-gray-400 font-sans font-semibold rounded-md hover:bg-white/5 transition-colors">
                           Start Over
                        </button>
                    </div>
                    {ControlsPanel}
                </div>
            );
        }

        if (originalImage && enhancedImage) {
            return (
                <>
                    <ImageComparator originalImage={originalImage} enhancedImage={enhancedImage} />
                    <div className="flex justify-center items-center gap-4 mt-6 mb-8">
                       {originalFileName && <DownloadButton imageUrl={enhancedImage} fileName={originalFileName} />}
                        <button onClick={handleEnhanceAgain} disabled={isLoading} className="px-8 py-4 bg-white/10 border border-white/20 text-white font-sans font-semibold rounded-md hover:bg-white/20 transition-colors">
                           Re-generate Style
                        </button>
                         <button onClick={handleStartOver} className="px-8 py-4 text-gray-400 font-sans font-semibold rounded-md hover:bg-white/5 transition-colors">
                           Start Over
                        </button>
                    </div>
                    {ControlsPanel}
                </>
            );
        }
        
        return (
            <>
                {ControlsPanel}
                <ImageUploader onImageSelect={handleImageSelect} isLoading={isLoading} />
            </>
        );
    };

    return (
        <div className="bg-gray-900 min-h-screen font-sans text-gray-200 selection:bg-gray-500 selection:text-white">
            <main className="container mx-auto px-4 py-8">
                <Header />
                {renderContent()}
            </main>
            <footer className="text-center py-6 text-gray-600 text-sm space-y-1">
                <p>A Project by Benjamin Alex Kibira</p>
                <p>Powered by Gemini AI | Designed for Portrait Artists</p>
            </footer>
        </div>
    );
};

export default App;