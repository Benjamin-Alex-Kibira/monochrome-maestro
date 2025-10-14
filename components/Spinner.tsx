
import React from 'react';

const Spinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 my-16">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
        <p className="text-gray-300 font-sans tracking-wide">Crafting your masterpiece...</p>
    </div>
);

export default Spinner;
