import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import SubjectsPage from "./pages/student/SubjectsPage";
import StudentNotesPage from "./pages/student/NotesPage";
import StudentAssignmentsPage from "./pages/student/AssignmentsPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudyRoom from "./pages/StudyRoom";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/subjects"
            element={
              <ProtectedRoute allowedRole="student">
                <SubjectsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/notes"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentNotesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentAssignmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/study-room"
            element={
              <ProtectedRoute allowedRole="student">
                <StudyRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;