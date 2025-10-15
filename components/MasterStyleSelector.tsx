import React from 'react';

interface MasterStyleSelectorProps {
    selectedStyle: string;
    onStyleChange: (style: string) => void;
}

const styles = [
    { id: 'default-gevurah', name: 'Gevurah Signature' },
    { id: 'richard-avedon', name: 'Richard Avedon' },
    { id: 'peter-lindbergh', name: 'Peter Lindbergh' },
];

const MasterStyleSelector: React.FC<MasterStyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
    return (
        <div aria-label="Master Style Selector">
            <h2 className="text-lg font-medium text-gray-300 font-sans mb-4 text-center" id="master-style-label">
                Choose a Master Style
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-labelledby="master-style-label">
                {styles.map(style => {
                    const isSelected = selectedStyle === style.id;
                    return (
                        <button
                            key={style.id}
                            onClick={() => onStyleChange(style.id)}
                            aria-pressed={isSelected}
                            className={`px-5 py-3 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400 text-center
                                ${isSelected ? 'bg-gray-200 text-gray-900 shadow-lg' : 'bg-gray-900 text-gray-300 hover:bg-gray-700 hover:text-gray-100 border border-gray-700'}`}
                        >
                            {style.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(MasterStyleSelector);