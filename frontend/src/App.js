import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProjectListPage from './pages/ProjectListPage';
import ProjectPage from './pages/ProjectPage';
import MapDetailPage from './pages/MapDetailPage';

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
        
        {/* Map detail page */}
        <Route path="/projects/:projectId/maps/:mapId" element={<MapDetailPage />} />
        
        {/* Catch all other routes and redirect to projects */}
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </Router>
  );
}

export default App;