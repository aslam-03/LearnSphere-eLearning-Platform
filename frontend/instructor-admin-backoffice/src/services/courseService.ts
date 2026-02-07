import axios from 'axios';
import { Course } from '../types/course';

const API_URL = 'https://api.example.com/courses'; // Replace with your actual API URL

export const fetchCourses = async (): Promise<Course[]> => {
    const response = await axios.get<Course[]>(API_URL);
    return response.data;
};

export const createCourse = async (courseName: string): Promise<Course> => {
    const response = await axios.post<Course>(API_URL, { name: courseName });
    return response.data;
};

export const editCourse = async (courseId: string, updatedData: Partial<Course>): Promise<Course> => {
    const response = await axios.put<Course>(`${API_URL}/${courseId}`, updatedData);
    return response.data;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
    await axios.delete(`${API_URL}/${courseId}`);
};