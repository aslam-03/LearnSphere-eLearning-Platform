export const formatDuration = (durationInSeconds: number): string => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = durationInSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
};

export const generateCourseLink = (courseId: string): string => {
    return `${window.location.origin}/courses/${courseId}`;
};

export const filterCoursesByName = (courses: any[], searchTerm: string): any[] => {
    if (!searchTerm) return courses;
    return courses.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
};