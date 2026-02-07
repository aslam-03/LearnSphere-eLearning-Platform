export interface Course {
    id: string;
    title: string;
    tags: string[];
    viewsCount: number;
    totalLessonsCount: number;
    totalDuration: number; // in seconds
    isPublished: boolean;
}