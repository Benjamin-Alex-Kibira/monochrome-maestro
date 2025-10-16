import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageComparator from './components/ImageComparator';
import Spinner from './components/Spinner';
import DownloadButton from './components/DownloadButton';
import MasterStyleSelector from './components/MasterStyleSelector';
import DetailSlider from './components/DetailSlider';
import BackgroundSelector from './components/BackgroundSelector';
import NegativeSpaceToggle from './components/NegativeSpaceToggle';
import PropsToggle from './components/PropsToggle';
import PreviewDisplay from './components/PreviewDisplay';
import { enhanceImage } from './services/geminiService';
import { resizeImage } from './services/imageService';

function App() {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Style and enhancement options state
    const [masterStyle, setMasterStyle] = useState('maestro-signature');
    const [detailLevel, setDetailLevel] = useState(50);
    const [backgroundStyle, setBackgroundStyle] = useState('ai-choice');
    const [addNegativeSpace, setAddNegativeSpace] = useState(true);
    const [maintainProps, setMaintainProps] = useState(true);

    useEffect(() => {
        const savedMasterStyle = localStorage.getItem('masterStyle');
        if (savedMasterStyle) setMasterStyle(savedMasterStyle);

        const savedDetailLevel = localStorage.getItem('detailLevel');
        if (savedDetailLevel) setDetailLevel(JSON.parse(savedDetailLevel));
        
        const savedBackgroundStyle = localStorage.getItem('backgroundStyle');
        if (savedBackgroundStyle) setBackgroundStyle(savedBackgroundStyle);

        const savedNegativeSpace = localStorage.getItem('addNegativeSpace');
        if (savedNegativeSpace) setAddNegativeSpace(JSON.parse(savedNegativeSpace));

        const savedMaintainProps = localStorage.getItem('maintainProps');
        if (savedMaintainProps) setMaintainProps(JSON.parse(savedMaintainProps));

    }, []);

    useEffect(() => { localStorage.setItem('masterStyle', masterStyle); }, [masterStyle]);
    useEffect(() => { localStorage.setItem('detailLevel', JSON.stringify(detailLevel)); }, [detailLevel]);
    useEffect(() => { localStorage.setItem('backgroundStyle', backgroundStyle); }, [backgroundStyle]);
    useEffect(() => { localStorage.setItem('addNegativeSpace', JSON.stringify(addNegativeSpace)); }, [addNegativeSpace]);
    useEffect(() => { localStorage.setItem('maintainProps', JSON.stringify(maintainProps)); }, [maintainProps]);


    const resetState = useCallback(() => {
        setOriginalImageFile(null);
        setOriginalImageUrl(null);
        setEnhancedImageUrl(null);
        setIsLoading(false);
        setIsProcessingImage(false);
        setError(null);
    }, []);

    const handleImageSelect = async (file: File) => {
        setOriginalImageFile(null);
        setOriginalImageUrl(null);
        setEnhancedImageUrl(null); // Clear previous result
        setError(null);
        setIsProcessingImage(true);

        try {
            const MAX_DIMENSION = 2048; // Resize for performance
            const resizedFile = await resizeImage(file, MAX_DIMENSION);
            setOriginalImageFile(resizedFile);
            setOriginalImageUrl(URL.createObjectURL(resizedFile));
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while processing the image.');
            console.error(err);
        } finally {
            setIsProcessingImage(false);
        }
    };

    const handleGeneration = async () => {
        if (!originalImageFile) {
            setError("Please upload an image first.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const resultUrl = await enhanceImage({
                imageFile: originalImageFile,
                masterStyle,
                detailLevel,
                backgroundStyle,
                addNegativeSpace,
                maintainProps,
            });
            setEnhancedImageUrl(resultUrl);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const isBusy = isLoading || isProcessingImage;

    const renderContent = () => {
        if (enhancedImageUrl && originalImageUrl) {
            return (
                <div className="text-center">
                    <ImageComparator originalImage={originalImageUrl} enhancedImage={enhancedImageUrl} />
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
                        <DownloadButton imageUrl={enhancedImageUrl} fileName={originalImageFile?.name || 'masterpiece.png'} />
                        <button
                            onClick={resetState}
                            className="px-8 py-4 bg-gray-800 text-gray-300 font-sans font-semibold rounded-md border border-gray-600 hover:bg-gray-700 hover:text-white transition-all duration-300"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            );
        }

        if (isLoading) {
             return <Spinner />;
        }
        
        if (isProcessingImage) {
            return <Spinner message="Preparing your image..." />;
        }

        if (originalImageUrl) {
            return (
                <PreviewDisplay imageUrl={originalImageUrl} onGenerate={handleGeneration} isGenerating={isLoading}>
                    <MasterStyleSelector selectedStyle={masterStyle} onStyleChange={setMasterStyle} />
                    <DetailSlider value={detailLevel} onChange={setDetailLevel} />
                    <BackgroundSelector selectedStyle={backgroundStyle} onStyleChange={setBackgroundStyle} />
                    <NegativeSpaceToggle enabled={addNegativeSpace} onChange={setAddNegativeSpace} isLoading={isLoading} />
                    <PropsToggle enabled={maintainProps} onChange={setMaintainProps} isLoading={isLoading} />
                </PreviewDisplay>
            );
        }

        return (
            <>
                <div className="w-full max-w-3xl mx-auto my-8 flex flex-col gap-8">
                     <fieldset disabled={isBusy} className={`flex flex-col gap-8 transition-opacity duration-300 ${isBusy ? 'opacity-50' : 'opacity-100'}`}>
                        <MasterStyleSelector selectedStyle={masterStyle} onStyleChange={setMasterStyle} />
                        <DetailSlider value={detailLevel} onChange={setDetailLevel} />
                        <BackgroundSelector selectedStyle={backgroundStyle} onStyleChange={setBackgroundStyle} />
                        <NegativeSpaceToggle enabled={addNegativeSpace} onChange={setAddNegativeSpace} isLoading={isBusy} />
                        <PropsToggle enabled={maintainProps} onChange={setMaintainProps} isLoading={isBusy} />
                    </fieldset>
                </div>
                <ImageUploader onImageSelect={handleImageSelect} isLoading={isBusy} />
            </>
        );
    };


    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 md:p-8">
            <main className="container mx-auto">
                <Header />
                {error && (
                    <div className="my-4 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-md text-center max-w-2xl mx-auto">
                        <p><strong>Error:</strong> {error}</p>
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    );
}

export default App;