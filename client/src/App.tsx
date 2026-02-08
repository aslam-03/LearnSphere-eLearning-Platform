import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";


import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Courses from "@/pages/Courses";
import Dashboard from "@/pages/Dashboard";
import InstructorHub from "@/pages/InstructorHub";
import CourseEditor from "@/pages/CourseEditor";
import CourseDetails from "@/pages/CourseDetails";
import Learn from "@/pages/Learn";
import QuizBuilder from "@/pages/QuizBuilder";
import Reporting from "@/pages/Reporting";
import AdminDashboard from "@/pages/AdminDashboard";
import ManageInstructors from "@/pages/ManageInstructors";

function Router() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={CourseDetails} />

      {/* Learner Pages */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/learn/:courseId" component={Learn} />
      <Route path="/learn/:courseId/lesson/:lessonId" component={Learn} />

      {/* Instructor Pages */}
      <Route path="/instructor" component={InstructorHub} />
      <Route path="/instructor/course/:id" component={CourseEditor} />
      <Route path="/instructor/course/:courseId/quiz/:quizId" component={QuizBuilder} />
      <Route path="/instructor/reporting" component={Reporting} />

      {/* Admin Pages */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/instructors" component={ManageInstructors} />
      <Route path="/admin/course/:id" component={CourseEditor} />
      <Route path="/admin/course/:courseId/quiz/:quizId" component={QuizBuilder} />

      {/* Fallback */}
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-gray-600 mb-4">Page not found</p>
            <a href="/" className="text-primary hover:underline">Return Home</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
