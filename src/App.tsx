import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import MyCourses from "./pages/MyCourses";
import CourseDetail from "./pages/CourseDetail";
import ManageCourse from "./pages/ManageCourse";
import CreateCourse from "./pages/CreateCourse";
import SubmitAssignment from "./pages/SubmitAssignment";
import ViewSubmissions from "./pages/ViewSubmissions";
import GradeAssignment from "./pages/GradeAssignment";
import GradeSubmission from "./pages/GradeSubmission";
import MyGrades from "./pages/MyGrades";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/create" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
            <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/courses/:courseId/manage" element={<ProtectedRoute><ManageCourse /></ProtectedRoute>} />
            <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
            <Route path="/assignments/:assignmentId" element={<ProtectedRoute><GradeAssignment /></ProtectedRoute>} />
            <Route path="/assignments/:assignmentId/submit" element={<ProtectedRoute><SubmitAssignment /></ProtectedRoute>} />
            <Route path="/assignments/:assignmentId/submissions" element={<ProtectedRoute><ViewSubmissions /></ProtectedRoute>} />
            <Route path="/submissions/:submissionId/grade" element={<ProtectedRoute><GradeSubmission /></ProtectedRoute>} />
            <Route path="/my-grades" element={<ProtectedRoute><MyGrades /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
