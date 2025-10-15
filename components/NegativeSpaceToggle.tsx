import React from 'react';

interface NegativeSpaceToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    isLoading: boolean;
}

const NegativeSpaceToggle: React.FC<NegativeSpaceToggleProps> = ({ enabled, onChange, isLoading }) => {
    return (
        <div className="w-full max-w-md mx-auto my-4 text-center" aria-label="Add Negative Space Toggle">
             <h2 className="text-lg font-medium text-gray-300 font-sans mb-4" id="negative-space-label">Compositional Framing</h2>
            <div className="flex items-center justify-center gap-4">
                <label htmlFor="negative-space-toggle" className={`flex items-center ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="relative">
                        <input
                            id="negative-space-toggle"
                            type="checkbox"
                            className="sr-only"
                            checked={enabled}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={isLoading}
                            aria-labelledby="negative-space-description"
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-gray-400' : 'bg-gray-700'} ${isLoading ? 'opacity-50' : ''}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </label>
                <p id="negative-space-description" className="text-sm text-gray-400 max-w-xs text-left">
                    Add breathing room if the subject is tightly cropped to improve composition.
                </p>
            </div>
        </div>
    );
};

export default NegativeSpaceToggle;
