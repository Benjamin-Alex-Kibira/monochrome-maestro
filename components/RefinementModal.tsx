import React, { useState, FormEvent } from 'react';
import SparklesIcon from './icons/SparklesIcon';

interface ImageJob {
    id: string;
    file: File;
    originalUrl: string;
    enhancedUrl: string | null;
}

interface RefinementModalProps {
    job: ImageJob;
    allJobs: ImageJob[];
    onClose: () => void;
    onRefine: (targetJobId: string, prompt: string, referenceJobIds: string[]) => void;
    isRefining: boolean;
}

const RefinementModal: React.FC<RefinementModalProps> = ({ job, allJobs, onClose, onRefine, isRefining }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);

    const handleToggleReference = (id: string) => {
        setSelectedReferenceIds(prev =>
            prev.includes(id) ? prev.filter(refId => refId !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onRefine(job.id, prompt, selectedReferenceIds);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="font-serif text-2xl text-gray-200">Refine Masterpiece</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
                </header>

                <div className="flex-grow p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
                    {/* Left side: Target Image */}
                    <div className="flex-shrink-0 w-full md:w-1/2 flex flex-col items-center">
                        <p className="text-sm text-gray-400 mb-2">Image to Refine</p>
                        <img 
                            src={job.enhancedUrl!} 
                            alt="Image to be refined" 
                            className="w-full h-auto object-contain rounded-lg max-h-96"
                        />
                    </div>

                    {/* Right side: Controls */}
                    <div className="w-full md:w-1/2 flex flex-col gap-4">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label htmlFor="refine-prompt" className="block text-sm font-medium text-gray-300 mb-2">
                                    Your Instruction
                                </label>
                                <textarea
                                    id="refine-prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., 'Complete the top of his head using the other photos as a reference.'"
                                    className="w-full flex-grow p-3 bg-gray-800 border border-gray-600 rounded-md text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 resize-none"
                                    rows={4}
                                    disabled={isRefining}
                                    aria-label="Refinement prompt"
                                    required
                                />
                            </div>
                            
                            {allJobs.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                                        Contextual References (Optional)
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-3">Select images to help the AI fill in missing parts.</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-800/50 rounded-md">
                                        {allJobs.map(refJob => (
                                            <button 
                                                type="button"
                                                key={refJob.id} 
                                                onClick={() => handleToggleReference(refJob.id)}
                                                className={`relative rounded-md overflow-hidden aspect-square focus:outline-none transition-all duration-200 ${selectedReferenceIds.includes(refJob.id) ? 'ring-2 ring-blue-500' : 'ring-1 ring-transparent hover:ring-gray-500'}`}
                                            >
                                                <img 
                                                    src={refJob.enhancedUrl!} 
                                                    alt="Reference image"
                                                    className={`w-full h-full object-cover transition-opacity ${selectedReferenceIds.includes(refJob.id) ? 'opacity-100' : 'opacity-70'}`}
                                                />
                                                {selectedReferenceIds.includes(refJob.id) && (
                                                    <div className="absolute inset-0 bg-blue-500/50 flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                             <div className="mt-auto flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gray-700 text-gray-300 font-sans font-semibold rounded-md hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRefining || !prompt.trim()}
                                    className="inline-flex items-center justify-center gap-3 px-6 py-2 bg-white text-gray-900 font-sans font-semibold rounded-md shadow-lg hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    {isRefining ? 'Refining...' : 'Refine'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefinementModal;