
import React from 'react';

const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V17.25c0 .621 0 1.41.018 2.022a2.25 2.25 0 002.232 2.232c.612.018 1.401.018 2.022.018h10.456c.621 0 1.41 0 2.022-.018a2.25 2.25 0 002.232-2.232c.018-.612.018-1.401.018-2.022V17.25m7.5-6.75l-3.75 3.75-3.75-3.75" />
    </svg>
);

export default UploadIcon;
