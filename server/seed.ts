import { firestoreStorage } from "./firestoreStorage";

export async function seed() {
  // Check if we have courses
  const existingCourses = await firestoreStorage.getCourses();
  if (existingCourses.length > 0) return;

  console.log("Seeding database...");

  // Create a default instructor user
  const systemInstructorId = "system-instructor";
  
  // Create user in Firestore
  await firestoreStorage.createUser(systemInstructorId, {
    email: "instructor@learnsphere.demo",
    displayName: "System Instructor",
    role: "instructor",
    points: 0,
  });

  // Create Courses
  const course1 = await firestoreStorage.createCourse({
    title: "Introduction to Web Development",
    description: "Learn the basics of HTML, CSS, and JavaScript in this comprehensive course.",
    instructorId: systemInstructorId,
    published: true,
    visibility: "everyone",
    accessRule: "open",
    tags: ["Web Dev", "Beginner", "HTML/CSS"],
    price: 0
  });

  const course2 = await firestoreStorage.createCourse({
    title: "Advanced React Patterns",
    description: "Master React with advanced patterns, hooks, and performance optimization techniques.",
    instructorId: systemInstructorId,
    published: true,
    visibility: "signed_in",
    accessRule: "open",
    tags: ["React", "Advanced", "Frontend"],
    price: 0
  });

  // Create Lessons for Course 1
  await firestoreStorage.createLesson({
    courseId: course1.id,
    title: "HTML Basics",
    type: "video",
    content: "https://www.youtube.com/embed/qz0aGYrrlhU", // Sample video
    description: "Understanding the structure of a web page.",
    order: 1,
    allowDownload: false
  });

  await firestoreStorage.createLesson({
    courseId: course1.id,
    title: "CSS Fundamentals",
    type: "document",
    content: "https://files.example.com/css-cheatsheet.pdf",
    description: "Styling your web pages.",
    order: 2,
    allowDownload: true
  });

  // Create Quiz for Course 1
  const quiz1 = await firestoreStorage.createQuiz({
    courseId: course1.id,
    title: "Web Dev Basics Quiz",
    description: "Test your knowledge of HTML and CSS."
  });

  await firestoreStorage.createQuestion({
    quizId: quiz1.id,
    text: "What does HTML stand for?",
    options: [
      { text: "Hyper Text Markup Language", isCorrect: true },
      { text: "High Tech Modern Language", isCorrect: false },
      { text: "Hyper Transfer Markup Language", isCorrect: false }
    ],
    points: 10,
    order: 1
  });

  await firestoreStorage.createQuestion({
    quizId: quiz1.id,
    text: "Which CSS property changes text color?",
    options: [
      { text: "text-color", isCorrect: false },
      { text: "color", isCorrect: true },
      { text: "font-color", isCorrect: false }
    ],
    points: 10,
    order: 2
  });

  console.log("Database seeded successfully!");
}
