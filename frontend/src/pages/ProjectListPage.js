import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CreateProjectButton from '../components/CreateProjectButton';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete project');
      setProjects(projects.filter(project => project.id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <Link to="/projects" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>The Cosmic Forge</h1>
          </Link>
          <p>Bring your universes to light</p>
        </div>
      </header>

      <main className="container">
        <div className="actions">
          <button 
            className="btn" 
            onClick={() => setShowCreate(true)}
          >
            Create Project
          </button>
        </div>

        {showCreate && (
          <CreateProjectButton 
            onClose={() => setShowCreate(false)} 
            onProjectCreated={handleProjectCreated} 
          />
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="btn-small">Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Click the "Create Project" button to get started!</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="project-card clickable"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-header">
                  <h3>{project.name}</h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id);
                    }}
                    className="delete-btn"
                    title="Delete project"
                  >
                    ×
                  </button>
                </div>
                <p>{project.description}</p>
                <p><small>Created: {formatDate(project.created_at)}</small></p>
                {project.updated_at !== project.created_at && (
                  <p><small>Updated: {formatDate(project.updated_at)}</small></p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ProjectListPage;
