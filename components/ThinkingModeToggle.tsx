import React from 'react';

interface ThinkingModeToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    isLoading: boolean;
}

const ThinkingModeToggle: React.FC<ThinkingModeToggleProps> = ({ enabled, onChange, isLoading }) => {
    return (
        <div className="flex items-center justify-center gap-3 mt-4" aria-label="Thinking Mode Toggle">
            <label htmlFor="thinking-mode-toggle" className={`flex items-center ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className="relative">
                    <input
                        id="thinking-mode-toggle"
                        type="checkbox"
                        className="sr-only"
                        checked={enabled}
                        onChange={(e) => onChange(e.target.checked)}
                        disabled={isLoading}
                        aria-labelledby="thinking-mode-description"
                    />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-purple-500' : 'bg-gray-700'} ${isLoading ? 'opacity-50' : ''}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </label>
            <div className="text-left">
                <p id="thinking-mode-description" className="text-sm font-semibold text-gray-200">
                    Thinking Mode
                </p>
                <p className="text-xs text-gray-400">
                    Uses a more advanced model to interpret your prompt for better results.
                </p>
            </div>
        </div>
    );
};

export default ThinkingModeToggle;
