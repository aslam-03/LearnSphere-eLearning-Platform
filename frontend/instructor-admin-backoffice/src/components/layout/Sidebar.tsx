import React from 'react';

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar">
            <h2>Navigation</h2>
            <ul>
                <li><a href="/courses">Courses</a></li>
                <li><a href="/users">Users</a></li>
                <li><a href="/settings">Settings</a></li>
                <li><a href="/reports">Reports</a></li>
            </ul>
        </div>
    );
};

export default Sidebar;