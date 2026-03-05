import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/components/layout/RootLayout";
import Home from "@/pages/Home/Home";
import Login from "@/pages/Auth/Login";
import Signup from "@/pages/Auth/Signup";
import CoursesPage from "@/pages/Courses/CoursesPage";
import CourseDetailPage from "@/pages/Courses/CourseDetailPage";
import PdfChatPage from "@/pages/PdfChat/PdfChatPage";
import CareerPathPage from "@/pages/Career/CareerPathPage";
import AITutorPage from "@/pages/AITutor/AITutorPage";

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
        element: <CoursesPage />,
      },
      {
        path: "/courses/:courseId",
        element: <CourseDetailPage />,
      },
      {
        path: "/pdf-chat",
        element: <PdfChatPage />,
      },
      {
        path: "/career-path",
        element: <CareerPathPage />,
      },
    ],
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
