import React, { useState } from 'react';
import CourseCard from './CourseCard';
import CourseKanbanView from './CourseKanbanView';
import CourseListView from './CourseListView';
import CreateCourseModal from './CreateCourseModal';
import SearchBar from '../common/SearchBar';
import ViewToggle from '../common/ViewToggle';

const CourseDashboard = () => {
    const [view, setView] = useState('kanban'); // Default view
    const [courses, setCourses] = useState([]); // This should be populated with course data
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreateCourse = (courseName) => {
        // Logic to create a new course
        setIsModalOpen(false);
    };

    const filteredCourses = courses; // Implement filtering logic based on search input

    return (
        <div className="course-dashboard">
            <header>
                <h1>Courses Dashboard</h1>
                <SearchBar />
                <button onClick={() => setIsModalOpen(true)}>+ Create Course</button>
                <ViewToggle currentView={view} onChange={setView} />
            </header>
            {view === 'kanban' ? (
                <CourseKanbanView courses={filteredCourses} />
            ) : (
                <CourseListView courses={filteredCourses} />
            )}
            {isModalOpen && <CreateCourseModal onCreate={handleCreateCourse} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

export default CourseDashboard;