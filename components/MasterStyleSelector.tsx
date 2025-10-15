import React from 'react';

interface MasterStyleSelectorProps {
    selectedStyle: string;
    onStyleChange: (style: string) => void;
}

const styles = [
    { id: 'default-maestro', name: 'Maestro Default', description: 'Timeless, cinematic elegance with masterful lighting.' },
    { id: 'richard-avedon', name: 'Avedon Style', description: 'High-contrast, sharp, psychological portraits on a stark background.' },
    { id: 'diane-arbus', name: 'Arbus Style', description: 'Direct, flash-lit, and unflinchingly authentic character studies.' },
    { id: 'ansel-adams-zone', name: 'Adams Tonal Range', description: 'Maximum tonal depth, from the richest blacks to luminous whites.' },
    { id: 'sebastiao-salgado', name: 'Salgado Epic', description: 'Grand, dramatic, high-contrast images with a film-like grain.' },
    { id: 'peter-lindbergh', name: 'Lindbergh Cinema', description: 'Soulful, cinematic, and narrative portraits with soft, natural light.' },
];

const MasterStyleSelector: React.FC<MasterStyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
    return (
        <div className="w-full max-w-4xl mx-auto my-8 text-center" aria-label="Master Style Selector">
            <h2 className="text-lg font-medium text-gray-300 font-sans mb-4" id="master-style-label">
                Choose a Master Style
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" role="group" aria-labelledby="master-style-label">
                {styles.map(style => {
                    const isSelected = selectedStyle === style.id;
                    return (
                        <button
                            key={style.id}
                            onClick={() => onStyleChange(style.id)}
                            aria-pressed={isSelected}
                            title={style.description}
                            className={`flex flex-col items-center justify-center p-4 text-sm font-medium rounded-lg transition-all duration-200 h-28 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400 text-center
                                ${isSelected ? 'bg-gray-200 text-gray-900 shadow-lg scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'}`}
                        >
                            <span className="font-semibold">{style.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MasterStyleSelector;