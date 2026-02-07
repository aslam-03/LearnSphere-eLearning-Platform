import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="layout">
            <Header />
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;