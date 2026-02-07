import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="header">
            <h1 className="header-title">Instructor Admin Backoffice</h1>
            <nav className="header-nav">
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/courses">Courses</a></li>
                    <li><a href="/settings">Settings</a></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;