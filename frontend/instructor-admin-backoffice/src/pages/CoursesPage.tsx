import React, { useState } from 'react';
import CourseDashboard from '../components/courses/CourseDashboard';
import { useCourses } from '../hooks/useCourses';

const CoursesPage: React.FC = () => {
    const { courses, loading, error } = useCourses();
    const [view, setView] = useState<'kanban' | 'list'>('kanban');

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading courses: {error.message}</div>;

    return (
        <div>
            <CourseDashboard courses={courses} view={view} setView={setView} />
        </div>
    );
};

export default CoursesPage;