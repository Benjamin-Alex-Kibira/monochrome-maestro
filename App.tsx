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
import { enhanceImage, refineImageWithContext, detectFaces } from './services/geminiService';
import { resizeImage, dataUrlToFile, cropImage, FaceBox } from './services/imageService';
import DownloadIcon from './components/icons/DownloadIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import RefinementModal from './components/RefinementModal';
import ImagePreviewCard from './components/ImagePreviewCard';

export interface ImageJob {
    id: string;
    file: File;
    originalUrl: string;
    displayUrl: string;

    // Face Detection & Cropping
    faces: FaceBox[];
    selectedFaceIndex: number | null;
    cropFile: File | null;
    
    // Enhancement
    enhancedUrl: string | null;
    status: 'detecting' | 'selection_needed' | 'ready' | 'processing' | 'done' | 'error';
    error?: string;
}

function App() {
    const [imageJobs, setImageJobs] = useState<ImageJob[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("Crafting your masterpieces...");
    const [error, setError] = useState<string | null>(null);

    // Refinement state
    const [refiningJob, setRefiningJob] = useState<ImageJob | null>(null);
    const [isRefining, setIsRefining] = useState(false);

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
        imageJobs.forEach(job => {
            URL.revokeObjectURL(job.originalUrl)
            if (job.displayUrl !== job.originalUrl) {
                URL.revokeObjectURL(job.displayUrl);
            }
        });
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
            const MAX_DIMENSION = 3072;
            const resizePromises = files.map(file => resizeImage(file, MAX_DIMENSION));
            const resizedFiles = await Promise.all(resizePromises);

            const initialJobs: ImageJob[] = resizedFiles.map((file, index) => {
                const originalUrl = URL.createObjectURL(file);
                return {
                    id: `${file.name}-${index}-${Date.now()}`,
                    file: file,
                    originalUrl: originalUrl,
                    displayUrl: originalUrl,
                    faces: [],
                    selectedFaceIndex: null,
                    cropFile: file,
                    enhancedUrl: null,
                    status: 'detecting',
                };
            });
            setImageJobs(initialJobs);
            setIsLoading(false);

            // Asynchronously detect faces and auto-crop
            initialJobs.forEach(async (job) => {
                try {
                    const faces = await detectFaces(job.file);
                    
                    if (faces.length === 1) { // Auto-crop if one face is found
                        const croppedFile = await cropImage(job.file, faces[0]);
                        const displayUrl = URL.createObjectURL(croppedFile);
                        setImageJobs(prev => prev.map(j => j.id === job.id ? { ...j, faces, selectedFaceIndex: 0, cropFile: croppedFile, displayUrl, status: 'ready' } : j));
                    } else if (faces.length > 1) { // Needs user selection
                        setImageJobs(prev => prev.map(j => j.id === job.id ? { ...j, faces, status: 'selection_needed' } : j));
                    } else { // No faces found, it's ready
                        setImageJobs(prev => prev.map(j => j.id === job.id ? { ...j, faces, status: 'ready' } : j));
                    }
                } catch (err) {
                    console.error(`Face detection failed for ${job.file.name}:`, err);
                    setImageJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'error', error: 'Face detection failed.' } : j));
                }
            });

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while processing the images.');
            console.error(err);
            setIsLoading(false);
        }
    };

    const handleFaceSelect = async (jobId: string, faceIndex: number) => {
        const job = imageJobs.find(j => j.id === jobId);
        if (!job) return;

        try {
            const croppedFile = await cropImage(job.file, job.faces[faceIndex]);
            const displayUrl = URL.createObjectURL(croppedFile);

            // Revoke old URL if it was a temporary crop
            if (job.displayUrl !== job.originalUrl) {
                URL.revokeObjectURL(job.displayUrl);
            }
            
            setImageJobs(prev => prev.map(j => j.id === jobId ? { ...j, selectedFaceIndex: faceIndex, cropFile: croppedFile, displayUrl, status: 'ready' } : j));
        } catch (err) {
            console.error(`Failed to crop image ${job.file.name}:`, err);
             setImageJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'error', error: 'Image cropping failed.' } : j));
        }
    };


    const handleBatchGeneration = async () => {
        if (imageJobs.length === 0) {
            setError("Please upload one or more images first.");
            return;
        }

        setIsLoading(true);
        setError(null);
    
        const jobsToProcess = imageJobs.filter(job => job.status === 'ready' || job.status === 'error');

        for (let i = 0; i < jobsToProcess.length; i++) {
            const currentJob = jobsToProcess[i];
            setLoadingMessage(`Processing image ${i + 1} of ${jobsToProcess.length}...`);

            setImageJobs(prevJobs => prevJobs.map(job =>
                job.id === currentJob.id ? { ...job, status: 'processing', error: undefined } : job
            ));

            try {
                if (!currentJob.cropFile) {
                    throw new Error("Image not ready for processing.");
                }

                const resultUrl = await enhanceImage({
                    imageFile: currentJob.cropFile,
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

    const handleRefineImage = async (
        targetJobId: string,
        prompt: string,
        referenceJobIds: string[]
    ) => {
        const targetJob = imageJobs.find(job => job.id === targetJobId);
        if (!targetJob || !targetJob.enhancedUrl) {
            setError("Target image for refinement not found.");
            return;
        }

        setIsRefining(true);
        setError(null);

        try {
            const targetImageFile = await dataUrlToFile(targetJob.enhancedUrl, targetJob.file.name);
            const referenceImageFiles = await Promise.all(
                imageJobs
                    .filter(job => referenceJobIds.includes(job.id) && job.enhancedUrl)
                    .map(job => dataUrlToFile(job.enhancedUrl!, job.file.name))
            );

            const resultUrl = await refineImageWithContext({
                targetImageFile,
                referenceImageFiles,
                prompt,
            });

            const refinedFile = await dataUrlToFile(resultUrl, `refined-${targetJob.file.name}`);

            setImageJobs(prevJobs => prevJobs.map(job =>
                job.id === targetJobId ? { ...job, enhancedUrl: resultUrl, file: refinedFile } : job
            ));

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred during refinement.');
            console.error(err);
        } finally {
            setIsRefining(false);
            setRefiningJob(null);
        }
    };

    const handleDownloadAll = () => {
        const successfulJobs = imageJobs.filter(job => job.status === 'done' && job.enhancedUrl);
        successfulJobs.forEach(job => {
             const link = document.createElement('a');
            link.href = job.enhancedUrl!;
            
            const nameParts = job.file.name.split('.');
            nameParts.pop();
            const baseName = nameParts.join('.');
            
            const mimeType = job.enhancedUrl!.substring(job.enhancedUrl!.indexOf(':') + 1, job.enhancedUrl!.indexOf(';'));
            let extension = 'png';
            if (mimeType === 'image/jpeg') {
                extension = 'jpg';
            } else if (mimeType === 'image/webp') {
                extension = 'webp';
            }
            
            link.download = `${baseName}-monochrome.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const renderContent = () => {
        if (isLoading && imageJobs.length === 0) {
            return <Spinner message={loadingMessage} />;
        }

        const successfulJobs = imageJobs.filter(job => job.status === 'done');
        const hasResults = imageJobs.some(job => job.status === 'done' || job.status === 'error' && job.faces.length === 0);
        const allJobsReadyForProcessing = imageJobs.every(job => job.status === 'ready' || job.status === 'error');

        if (hasResults) {
            return (
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-12">
                        {imageJobs.map(job => (
                            <div key={job.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col">
                                {job.status === 'done' && job.enhancedUrl ? (
                                    <>
                                        <ImageComparator originalImage={job.originalUrl} enhancedImage={job.enhancedUrl} />
                                        <div className="text-center mt-4 flex items-center justify-center gap-4">
                                            <DownloadButton imageUrl={job.enhancedUrl} fileName={job.file.name} />
                                             <button
                                                onClick={() => setRefiningJob(job)}
                                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-gray-200 font-sans font-semibold rounded-md border border-gray-600 hover:bg-gray-600 hover:text-white transition-all duration-300 transform hover:scale-105"
                                            >
                                                <SparklesIcon className="w-5 h-5" />
                                                Refine
                                            </button>
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
                        {successfulJobs.length > 0 && (
                             <button
                                onClick={handleDownloadAll}
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 font-sans font-semibold rounded-md shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                {`Download All (${successfulJobs.length})`}
                            </button>
                        )}
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
                                    disabled={isLoading || !allJobsReadyForProcessing}
                                    className="px-12 py-4 bg-gray-200 text-gray-900 font-sans font-bold text-lg rounded-md shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                    title={!allJobsReadyForProcessing ? "Please select a face for all images with multiple options." : ""}
                                >
                                    {isLoading ? 'Processing...' : `Create ${imageJobs.length} Masterpiece(s)`}
                                </button>
                                <button
                                    onClick={resetState}
                                    className="px-8 py-4 bg-gray-800 text-gray-300 font-sans font-semibold rounded-md border border-gray-600 hover:bg-gray-700 hover:text-white transition-all duration-300"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>
                         <div className="flex flex-col">
                            <h3 className="font-serif text-2xl text-gray-400 mb-4 text-center lg:text-left">Your Portraits ({imageJobs.length})</h3>
                            <div className="w-full max-h-[80vh] overflow-y-auto bg-gray-900/50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {imageJobs.map(job => (
                                    <ImagePreviewCard key={job.id} job={job} onFaceSelect={handleFaceSelect} />
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
                {refiningJob && (
                    <RefinementModal
                        job={refiningJob}
                        allJobs={imageJobs.filter(j => j.status === 'done' && j.id !== refiningJob!.id)}
                        onClose={() => setRefiningJob(null)}
                        onRefine={handleRefineImage}
                        isRefining={isRefining}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
