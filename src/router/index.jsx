import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Public
import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import Signup from '../pages/public/Signup';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import PublicCourses from '../pages/public/Courses';
import CompleteProfile from '../pages/public/CompleteProfile';
import UnderConstruction from '../pages/public/UnderConstruction';

// Student
import StudentDashboard from '../pages/student/Dashboard';
import StudentCourses from '../pages/student/Courses';
import StudentCatalog from '../pages/student/Catalog';
import StudentCertificates from '../pages/student/Certificates';
import CoursePlayer from '../pages/student/CoursePlayer';

// Trainer
import TrainerDashboard from '../pages/trainer/Dashboard';
import TrainerCourses from '../pages/trainer/Courses';
import TrainerLiveSessions from '../pages/trainer/LiveSessions';
import TrainerStudents from '../pages/trainer/Students';

// Admin
import AdminDashboard from '../pages/admin/Dashboard';
import AdminCourses from '../pages/admin/Courses';
import AdminCategories from '../pages/admin/Categories';
import AdminUsers from '../pages/admin/Users';
import AdminAssessments from '../pages/admin/Assessments';
import AdminCurriculum from '../pages/admin/Curriculum';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'courses', element: <PublicCourses /> },
      { path: 'under-construction', element: <UnderConstruction /> },
    ],
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  },
  {
    path: '/complete-profile',
    element: <ProtectedRoute allowedRoles={['student', 'user']} />,
    children: [
      { index: true, element: <CompleteProfile /> }
    ]
  },
  {
    path: '/student',
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: 'browse', element: <StudentCatalog /> },
          { path: 'courses', element: <StudentCourses /> },
          { path: 'certificates', element: <StudentCertificates /> }
        ]
      },
      // Course player is full-screen — no sidebar/nav layout
      { path: 'course/:id', element: <CoursePlayer /> },
    ]
  },
  {
    path: '/trainer',
    element: <ProtectedRoute allowedRoles={['trainer']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <TrainerDashboard /> },
          { path: 'courses', element: <TrainerCourses /> },
          { path: 'live', element: <TrainerLiveSessions /> },
          { path: 'students', element: <TrainerStudents /> }
        ]
      }
    ]
  },
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'categories', element: <AdminCategories /> },
          { path: 'courses', element: <AdminCourses /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'assessments', element: <AdminAssessments /> },
        ]
      }
    ]
  },
  // Shared Management Protected Routes
  {
    path: '/manage',
    element: <ProtectedRoute allowedRoles={['admin', 'trainer']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: 'course/:courseId', element: <AdminCurriculum /> }
        ]
      }
    ]
  }
]);
