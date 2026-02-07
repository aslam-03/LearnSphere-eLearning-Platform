import React from 'react';

interface ViewToggleProps {
    currentView: 'kanban' | 'list';
    onChangeView: (view: 'kanban' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onChangeView }) => {
    return (
        <div className="view-toggle">
            <button
                className={`toggle-button ${currentView === 'kanban' ? 'active' : ''}`}
                onClick={() => onChangeView('kanban')}
            >
                Kanban View
            </button>
            <button
                className={`toggle-button ${currentView === 'list' ? 'active' : ''}`}
                onClick={() => onChangeView('list')}
            >
                List View
            </button>
        </div>
    );
};

export default ViewToggle;