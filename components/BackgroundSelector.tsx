import React from 'react';

interface BackgroundSelectorProps {
    selectedStyle: string;
    onStyleChange: (style: string) => void;
}

const styles = [
    { id: 'ai-choice', name: 'AI Choice' },
    { id: 'plain-light', name: 'Plain Light' },
    { id: 'plain-dark', name: 'Plain Dark' },
    { id: 'subtle-gradient', name: 'Subtle Gradient' },
    { id: 'textured-canvas', name: 'Textured Canvas' },
    { id: 'deep-void', name: 'Deep Void' },
];

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ selectedStyle, onStyleChange }) => {

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onStyleChange(e.target.value);
    };

    const isColorPickerSelected = selectedStyle.startsWith('#');

    return (
        <div className="w-full max-w-3xl mx-auto my-8 text-center" aria-label="Background Style Selector">
            <h2 className="text-lg font-medium text-gray-300 font-sans mb-4" id="background-style-label">Choose a Background Style</h2>
            <div className="flex flex-wrap justify-center items-center gap-3" role="group" aria-labelledby="background-style-label">
                {styles.map(style => {
                    const isSelected = selectedStyle === style.id;
                    return (
                        <button
                            key={style.id}
                            onClick={() => onStyleChange(style.id)}
                            aria-pressed={isSelected}
                            className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400
                                ${isSelected ? 'bg-gray-200 text-gray-900 shadow-md' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}`}
                        >
                            {style.name}
                        </button>
                    );
                })}
                <div className="relative">
                     <label 
                        htmlFor="color-picker"
                        className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-gray-400
                            ${isColorPickerSelected ? 'bg-gray-200 text-gray-900 shadow-md' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}`}
                     >
                        Custom Tone
                        <input
                            id="color-picker"
                            type="color"
                            aria-label="Custom background color"
                            value={isColorPickerSelected ? selectedStyle : '#333333'}
                            onChange={handleColorChange}
                            className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-transparent"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default BackgroundSelector;