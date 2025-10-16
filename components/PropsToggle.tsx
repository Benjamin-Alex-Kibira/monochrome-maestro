import React from 'react';

interface PropsToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    isLoading: boolean;
}

const PropsToggle: React.FC<PropsToggleProps> = ({ enabled, onChange, isLoading }) => {
    return (
        <div className="w-full max-w-md mx-auto my-4 text-center" aria-label="Maintain Props Toggle">
             <h2 className="text-lg font-medium text-gray-300 font-sans mb-4" id="props-toggle-label">Subject Context</h2>
            <div className="flex items-center justify-center gap-4">
                <label htmlFor="props-toggle" className={`flex items-center ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className="relative">
                        <input
                            id="props-toggle"
                            type="checkbox"
                            className="sr-only"
                            checked={enabled}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={isLoading}
                            aria-labelledby="props-toggle-description"
                        />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-gray-400' : 'bg-gray-700'} ${isLoading ? 'opacity-50' : ''}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </label>
                <p id="props-toggle-description" className="text-sm text-gray-400 max-w-xs text-left">
                    Preserve objects the subject is interacting with (e.g., chairs, props).
                </p>
            </div>
        </div>
    );
};

export default PropsToggle;
