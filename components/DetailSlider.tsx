import React from 'react';

interface DetailSliderProps {
    level: number;
    onLevelChange: (level: number) => void;
}

const DetailSlider: React.FC<DetailSliderProps> = ({ level, onLevelChange }) => {
    return (
        <div className="w-full max-w-3xl mx-auto my-8 text-center" aria-label="Detail Enhancement Slider">
            <label htmlFor="detail-slider" className="text-lg font-medium text-gray-300 font-sans mb-4 block">
                Detail Enhancement
            </label>
            <div className="flex items-center justify-center gap-4">
                <input
                    id="detail-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={level}
                    onChange={(e) => onLevelChange(e.target.valueAsNumber)}
                    className="w-64 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-300"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={level}
                />
                <span className="text-lg font-sans font-medium text-gray-200 w-12 text-center bg-gray-800 border border-gray-700 rounded-md py-1">
                    {level}
                </span>
            </div>
        </div>
    );
};

export default DetailSlider;