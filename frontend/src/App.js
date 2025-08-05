import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProjectListPage from './pages/ProjectListPage';
import ProjectPage from './pages/ProjectPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to projects list */}
        <Route path="/" element={<Navigate to="/projects" replace />} />
        
        {/* Projects list page */}
        <Route path="/projects" element={<ProjectListPage />} />
        
        {/* Individual project page */}
        <Route path="/projects/:id" element={<ProjectPage />} />
        
        {/* Catch all other routes and redirect to projects */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </Router>
  );
}

export default App;