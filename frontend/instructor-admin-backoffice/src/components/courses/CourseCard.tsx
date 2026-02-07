import React from 'react';
import { Course } from '../../types/course';
import Badge from '../common/Badge';
import CourseActions from './CourseActions';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <div className="tags">
        {course.tags.map((tag, index) => (
          <span key={index} className="tag">{tag}</span>
        ))}
      </div>
      <div className="course-info">
        <p>Views: {course.viewsCount}</p>
        <p>Total Lessons: {course.totalLessons}</p>
        <p>Total Duration: {course.totalDuration}</p>
        {course.published && <Badge label="Published" />}
      </div>
      <CourseActions courseId={course.id} />
    </div>
  );
};

export default CourseCard;