import React from 'react';
import { Course } from '../../types/course';
import CourseCard from './CourseCard';
import './CourseListView.css'; // Assuming you have some styles for the list view

interface CourseListViewProps {
    courses: Course[];
    onEdit: (courseId: string) => void;
    onShare: (courseId: string) => void;
}

const CourseListView: React.FC<CourseListViewProps> = ({ courses, onEdit, onShare }) => {
    return (
        <div className="course-list-view">
            <h2>Course List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Course Title</th>
                        <th>Tags</th>
                        <th>Views</th>
                        <th>Total Lessons</th>
                        <th>Total Duration</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map(course => (
                        <tr key={course.id}>
                            <td>{course.title}</td>
                            <td>{course.tags.join(', ')}</td>
                            <td>{course.views}</td>
                            <td>{course.totalLessons}</td>
                            <td>{course.totalDuration}</td>
                            <td>
                                <button onClick={() => onEdit(course.id)}>Edit</button>
                                <button onClick={() => onShare(course.id)}>Share</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CourseListView;