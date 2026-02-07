import { useEffect, useState } from 'react';
import { fetchCourses, createCourse } from '../services/courseService';
import { Course } from '../types/course';

const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const fetchedCourses = await fetchCourses();
                setCourses(fetchedCourses);
            } catch (err) {
                setError('Failed to fetch courses');
            } finally {
                setLoading(false);
            }
        };

        loadCourses();
    }, []);

    const addCourse = async (courseName: string) => {
        try {
            const newCourse = await createCourse(courseName);
            setCourses((prevCourses) => [...prevCourses, newCourse]);
        } catch (err) {
            setError('Failed to create course');
        }
    };

    return { courses, loading, error, addCourse };
};

export default useCourses;