import React from 'react';

interface DetailSliderProps {
    value: number;
    onChange: (value: number) => void;
}

const DetailSlider: React.FC<DetailSliderProps> = ({ value, onChange }) => {
    return (
        <div aria-label="Detail Enhancement Slider">
            <h2 className="text-lg font-medium text-gray-300 font-sans mb-4 text-center" id="detail-slider-label">
                Detail Enhancement
            </h2>
            <div className="relative pt-1">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    aria-labelledby="detail-slider-label"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Soft</span>
                    <span>Natural</span>
                    <span>Crisp</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(DetailSlider);