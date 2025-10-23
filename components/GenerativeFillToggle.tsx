import React, { useState } from 'react';
import ThinkingModeToggle from './ThinkingModeToggle';

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
);


interface GenerativeFillToggleProps {
    onRefine: (prompt: string, useThinkingMode: boolean) => void;
    isRefining: boolean;
}

const GenerativeFillToggle: React.FC<GenerativeFillToggleProps> = ({ onRefine, isRefining }) => {
    const [prompt, setPrompt] = useState('');
    const [useThinkingMode, setUseThinkingMode] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() && !isRefining) {
            onRefine(prompt, useThinkingMode);
            setPrompt('');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg shadow-xl">
            <h3 className="font-serif text-2xl text-gray-200 mb-4 text-center">Refine Your Masterpiece</h3>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Add a retro film grain effect'"
                        className="w-full flex-grow p-3 bg-gray-900 border border-gray-600 rounded-md text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 resize-none"
                        rows={2}
                        disabled={isRefining}
                        aria-label="Refinement prompt"
                    />
                    <button
                        type="submit"
                        disabled={isRefining || !prompt.trim()}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-3 bg-gray-200 text-gray-900 font-sans font-semibold rounded-md shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isRefining ? 'Refining...' : 'Refine'}
                    </button>
                </div>
                 <ThinkingModeToggle 
                    enabled={useThinkingMode}
                    onChange={setUseThinkingMode}
                    isLoading={isRefining}
                />
            </form>
        </div>
    );
};

export default GenerativeFillToggle;
