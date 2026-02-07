import React from 'react';
import { useCourses } from '../../hooks/useCourses';
import CourseCard from './CourseCard';
import './CourseKanbanView.css'; // Assuming you have some styles for the Kanban view

const CourseKanbanView = () => {
    const { courses } = useCourses();

    return (
        <div className="kanban-view">
            {courses.map(course => (
                <div key={course.id} className="course-card-container">
                    <CourseCard course={course} />
                </div>
            ))}
        </div>
    );
};

export default CourseKanbanView;