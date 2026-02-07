import React from 'react';

interface BadgeProps {
    text: string;
    type?: 'success' | 'warning' | 'error' | 'info';
}

const Badge: React.FC<BadgeProps> = ({ text, type = 'info' }) => {
    const badgeStyles = {
        success: 'bg-green-500 text-white',
        warning: 'bg-yellow-500 text-black',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded ${badgeStyles[type]}`}>
            {text}
        </span>
    );
};

export default Badge;