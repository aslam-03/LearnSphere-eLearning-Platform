# Instructor Admin Backoffice

This project is a React-based application designed for managing online courses. It provides an intuitive dashboard for instructors and administrators to create, edit, and organize courses efficiently.

## Features

- **Courses Dashboard**: A comprehensive dashboard that displays all courses in both Kanban and List views.
- **Search Functionality**: Easily search for courses by name.
- **Course Details**: Each course card displays essential information, including:
  - Course title
  - Tags
  - Views count
  - Total lessons count
  - Total duration
  - Published badge (if applicable)
- **Course Actions**: Options to edit course details or share course links.
- **Create Course Modal**: A user-friendly modal for creating new courses.

## Project Structure

```
instructor-admin-backoffice
├── src
│   ├── app.ts
│   ├── components
│   │   ├── courses
│   │   │   ├── CourseDashboard.tsx
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseKanbanView.tsx
│   │   │   ├── CourseListView.tsx
│   │   │   ├── CreateCourseModal.tsx
│   │   │   └── CourseActions.tsx
│   │   ├── common
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ViewToggle.tsx
│   │   └── layout
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Layout.tsx
│   ├── pages
│   │   └── CoursesPage.tsx
│   ├── hooks
│   │   └── useCourses.ts
│   ├── services
│   │   └── courseService.ts
│   ├── types
│   │   └── course.ts
│   ├── utils
│   │   └── helpers.ts
│   └── styles
│       └── globals.css
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd instructor-admin-backoffice
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.