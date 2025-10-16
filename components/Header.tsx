import React from 'react';

const Header: React.FC = () => (
    <header className="text-center my-8 md:my-12">
        <h1 className="font-serif text-4xl md:text-6xl font-light text-gray-100 tracking-wider">
            Monochrome Maestro
        </h1>
        <p className="font-sans text-gray-400 mt-3 text-lg md:text-xl max-w-2xl mx-auto">
            Transform your portraits into timeless, cinematic black & white masterpieces.
        </p>
    </header>
);

export default Header;