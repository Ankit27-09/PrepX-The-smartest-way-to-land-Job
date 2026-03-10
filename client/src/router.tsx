import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/components/layout/RootLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Home from "./Pages/Home/Home";
import Login from "./Pages/Auth/Login";
import Signup from "./Pages/Auth/Signup";
import CoursesPage from "./Pages/Courses/CoursesPage";
import CourseDetailPage from "./Pages/Courses/CourseDetailPage";
import PdfChatPage from "./Pages/PdfChat/PdfChatPage";
import CareerPathPage from "./Pages/Career/CareerPathPage";
import AITutorPage from "./Pages/AITutor/AITutorPage";
import JobsPage from "./Pages/Job/JobsPage";
import JobResultsPage from "./Pages/Job/JobResultsPage";
import JobHistoryPage from "./Pages/Job/JobHistoryPage";
import InterviewsPage from "./Pages/Interview/InterviewsPage";
import CreateInterviewPage from "./Pages/Interview/CreateInterviewPage";
import InterviewRoomPage from "./Pages/Interview/InterviewRoomPage";
import ResultsPage from "./Pages/Interview/ResultsPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/courses",
        element: <ProtectedRoute><CoursesPage /></ProtectedRoute>,
      },
      {
        path: "/courses/:courseId",
        element: <ProtectedRoute><CourseDetailPage /></ProtectedRoute>,
      },
      {
        path: "/pdf-chat",
        element: <ProtectedRoute><PdfChatPage /></ProtectedRoute>,
      },
      {
        path: "/career-path",
        element: <ProtectedRoute><CareerPathPage /></ProtectedRoute>,
      },
      {
        path: "/jobs",
        element: <ProtectedRoute><JobHistoryPage /></ProtectedRoute>,
      },
      {
        path: "/jobs/new",
        element: <ProtectedRoute><JobsPage /></ProtectedRoute>,
      },
      {
        path: "/jobs/:searchId",
        element: <ProtectedRoute><JobResultsPage /></ProtectedRoute>,
      },
      {
        path: "/interviews",
        element: <ProtectedRoute><InterviewsPage /></ProtectedRoute>,
      },
      {
        path: "/create-interview",
        element: <ProtectedRoute><CreateInterviewPage /></ProtectedRoute>,
      },
      {
        path: "/results",
        element: <ProtectedRoute><ResultsPage /></ProtectedRoute>,
      },
    ],
  },
  {
    path: "/interview-room",
    element: <ProtectedRoute><InterviewRoomPage /></ProtectedRoute>,
  },
  {
    path: "/ai-tutor",
    element: <AITutorPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
]);
