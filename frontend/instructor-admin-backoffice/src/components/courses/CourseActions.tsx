import React from 'react';

interface CourseActionsProps {
    onEdit: () => void;
    onShare: () => void;
}

const CourseActions: React.FC<CourseActionsProps> = ({ onEdit, onShare }) => {
    return (
        <div className="course-actions">
            <button onClick={onEdit} className="edit-button">
                Edit
            </button>
            <button onClick={onShare} className="share-button">
                Share
            </button>
        </div>
    );
};

export default CourseActions;