import React from 'react';

interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange }) => {
    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder="Search courses by name..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="search-input"
            />
        </div>
    );
};

export default SearchBar;