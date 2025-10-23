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
import { enhanceImage, refineImage, generateRefinedPrompt } from './services/geminiService';
import { resizeImage, dataUrlToFile } from './services/imageService';

interface ImageJob {
    id: string;
    file: File;
    originalUrl: string;
    enhancedUrl: string | null;
    status: 'pending' | 'processing' | 'done' | 'error';
    error?: string;
}

function App() {
    const [imageJobs, setImageJobs] = useState<ImageJob[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("Crafting your masterpieces...");
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
        imageJobs.forEach(job => URL.revokeObjectURL(job.originalUrl));
        setImageJobs([]);
        setIsLoading(false);
        setError(null);
    }, [imageJobs]);

    const handleImagesSelect = async (files: File[]) => {
        resetState();
        setError(null);
        setIsLoading(true);
        setLoadingMessage(`Preparing ${files.length} image(s)...`);

        try {
            const MAX_DIMENSION = 2048; // Resize for performance
            const resizePromises = files.map(file => resizeImage(file, MAX_DIMENSION));
            const resizedFiles = await Promise.all(resizePromises);

            const newJobs: ImageJob[] = resizedFiles.map((file, index) => ({
                id: `${file.name}-${index}-${Date.now()}`,
                file: file,
                originalUrl: URL.createObjectURL(file),
                enhancedUrl: null,
                status: 'pending',
            }));
            setImageJobs(newJobs);

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while processing the images.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setLoadingMessage("Crafting your masterpieces...");
        }
    };

    const handleBatchGeneration = async () => {
        if (imageJobs.length === 0) {
            setError("Please upload one or more images first.");
            return;
        }

        setIsLoading(true);
        setError(null);
    
        const jobsToProcess = imageJobs.filter(job => job.status === 'pending' || job.status === 'error');

        for (let i = 0; i < jobsToProcess.length; i++) {
            const currentJob = jobsToProcess[i];
            setLoadingMessage(`Processing image ${i + 1} of ${jobsToProcess.length}...`);

            setImageJobs(prevJobs => prevJobs.map(job =>
                job.id === currentJob.id ? { ...job, status: 'processing', error: undefined } : job
            ));

            try {
                const resultUrl = await enhanceImage({
                    imageFile: currentJob.file,
                    masterStyle,
                    detailLevel,
                    backgroundStyle,
                    addNegativeSpace,
                    maintainProps,
                });

                setImageJobs(prevJobs => prevJobs.map(job =>
                    job.id === currentJob.id ? { ...job, status: 'done', enhancedUrl: resultUrl } : job
                ));

            } catch (err: any) {
                const errorMessage = err.message || 'An unknown error occurred.';
                setImageJobs(prevJobs => prevJobs.map(job =>
                    job.id === currentJob.id ? { ...job, status: 'error', error: errorMessage } : job
                ));
            }
        }

        setIsLoading(false);
        setLoadingMessage("Crafting your masterpieces...");
    };

    const renderContent = () => {
        if (isLoading) {
            return <Spinner message={loadingMessage} />;
        }

        const hasResults = imageJobs.some(job => job.status === 'done' || job.status === 'error');

        if (hasResults) {
            return (
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-12">
                        {imageJobs.map(job => (
                            <div key={job.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col">
                                {job.status === 'done' && job.enhancedUrl ? (
                                    <>
                                        <ImageComparator originalImage={job.originalUrl} enhancedImage={job.enhancedUrl} />
                                        <div className="text-center mt-4">
                                            <DownloadButton imageUrl={job.enhancedUrl} fileName={job.file.name} />
                                        </div>
                                    </>
                                ) : job.status === 'error' ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                        <img src={job.originalUrl} alt={job.file.name} className="object-contain w-full h-auto max-h-64 rounded-lg opacity-50 mb-4" />
                                        <h4 className="font-semibold text-red-400">Processing Failed</h4>
                                        <p className="text-sm text-red-500 max-w-sm">{job.error}</p>
                                    </div>
                                ) : (
                                     <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                        <img src={job.originalUrl} alt={job.file.name} className="object-contain w-full h-auto max-h-64 rounded-lg" />
                                        <p className="mt-4 text-gray-400">Waiting to be processed...</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                     <div className="flex items-center justify-center gap-4 mt-8">
                        <button
                            onClick={resetState}
                            className="px-8 py-4 bg-gray-800 text-gray-300 font-sans font-semibold rounded-md border border-gray-600 hover:bg-gray-700 hover:text-white transition-all duration-300"
                        >
                            Create Another Batch
                        </button>
                    </div>
                </div>
            );
        }

        if (imageJobs.length > 0) {
            return (
                <div className="w-full max-w-7xl mx-auto my-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                        <div className="flex flex-col gap-8 lg:sticky lg:top-8">
                            <MasterStyleSelector selectedStyle={masterStyle} onStyleChange={setMasterStyle} />
                            <DetailSlider value={detailLevel} onChange={setDetailLevel} />
                            <BackgroundSelector selectedStyle={backgroundStyle} onStyleChange={setBackgroundStyle} />
                            <NegativeSpaceToggle enabled={addNegativeSpace} onChange={setAddNegativeSpace} isLoading={isLoading} />
                            <PropsToggle enabled={maintainProps} onChange={setMaintainProps} isLoading={isLoading} />
                            <div className="text-center mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleBatchGeneration}
                                    disabled={isLoading}
                                    className="px-12 py-4 bg-gray-200 text-gray-900 font-sans font-bold text-lg rounded-md shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    {`Create ${imageJobs.length} Masterpiece(s)`}
                                </button>
                                <button
                                    onClick={resetState}
                                    className="px-8 py-4 bg-gray-800 text-gray-300 font-sans font-semibold rounded-md border border-gray-600 hover:bg-gray-700 hover:text-white transition-all duration-300"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                         <div className="flex flex-col items-center">
                            <h3 className="font-serif text-2xl text-gray-400 mb-4">Your Portraits ({imageJobs.length})</h3>
                            <div className="w-full max-h-[80vh] overflow-y-auto bg-gray-800 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {imageJobs.map(job => (
                                    <img key={job.id} src={job.originalUrl} alt={job.file.name} className="object-cover w-full aspect-square rounded-md shadow-lg" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <>
                <div className="w-full max-w-3xl mx-auto my-8 flex flex-col gap-8">
                     <fieldset disabled={isLoading} className={`flex flex-col gap-8 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                        <MasterStyleSelector selectedStyle={masterStyle} onStyleChange={setMasterStyle} />
                        <DetailSlider value={detailLevel} onChange={setDetailLevel} />
                        <BackgroundSelector selectedStyle={backgroundStyle} onStyleChange={setBackgroundStyle} />
                        <NegativeSpaceToggle enabled={addNegativeSpace} onChange={setAddNegativeSpace} isLoading={isLoading} />
                        <PropsToggle enabled={maintainProps} onChange={setMaintainProps} isLoading={isLoading} />
                    </fieldset>
                </div>
                <ImageUploader onImagesSelect={handleImagesSelect} isLoading={isLoading} />
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
