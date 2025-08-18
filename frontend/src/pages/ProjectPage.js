// pages/ProjectPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateTemplateModal from '../components/entities/CreateTemplateModal';
import EditTemplateModal from '../components/entities/EditTemplateModal';
import CreateMapModal from '../components/maps/CreateMapModal';
import CreateEntityModal from '../components/entities/CreateEntityModal';
import EditEntityModal from '../components/entities/EditEntityModal';
import CreateLocationTemplateModal from '../components/maps/CreateLocationTemplateModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function ProjectPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [maps, setMaps] = useState([]);
  const [showCreateMap, setShowCreateMap] = useState(false);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showEditEntityModal, setShowEditEntityModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [entities, setEntities] = useState([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Location template state
  const [locationTemplates, setLocationTemplates] = useState([]);
  const [showCreateLocationTemplate, setShowCreateLocationTemplate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const fetchProject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      // Don't set error for templates, just log it
    }
  };

  const fetchMaps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/maps`);
      if (!response.ok) throw new Error('Failed to fetch maps');
      const data = await response.json();
      setMaps(data);
    } catch (err) {
      console.error('Error fetching maps:', err);
    }
  };

  const fetchLocationTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/location-templates`);
      if (!response.ok) throw new Error('Failed to fetch location templates');
      const data = await response.json();
      setLocationTemplates(data);
    } catch (err) {
      console.error('Error fetching location templates:', err);
    }
  };

  const handleMapCreated = (newMap) => {
    setMaps(prev => [newMap, ...prev]);
  };


  const fetchEntities = async (templateId) => {
    if (!templateId) return;
    
    try {
      setLoadingEntities(true);
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}/entities`);
      if (!response.ok) throw new Error('Failed to fetch entities');
      const data = await response.json();
      setEntities(data);
    } catch (err) {
      console.error('Error fetching entities:', err);
      setEntities([]);
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleTemplateSelected = (template) => {
    setSelectedTemplate(template);
    fetchEntities(template.id);
  };

  const handleTemplateCreated = (newTemplate) => {
    setTemplates([newTemplate, ...templates]);
  };

  const handleTemplateUpdated = (updatedTemplate) => {
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    if (selectedTemplate?.id === updatedTemplate.id) {
      setSelectedTemplate(updatedTemplate);
    }
  };

  const handleTemplateDeleted = (templateId) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
      setEntities([]);
    }
  };

  const handleEntityCreated = (newEntity) => {
    setEntities([newEntity, ...entities]);
  };

  const handleEntityUpdated = (updatedEntity) => {
    setEntities(entities.map(e => e.id === updatedEntity.id ? updatedEntity : e));
  };

  const handleEntityDeleted = (entityId) => {
    setEntities(entities.filter(e => e.id !== entityId));
  };

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template? This will also delete all entities created from this template.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete template');
      handleTemplateDeleted(templateId);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    }
  };

  const deleteEntity = async (entityId) => {
    if (!window.confirm('Are you sure you want to delete this entity?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/entities/${entityId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete entity');
      handleEntityDeleted(entityId);
    } catch (err) {
      console.error('Error deleting entity:', err);
      setError('Failed to delete entity');
    }
  };

  const openEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowEditTemplate(true);
  };

  const openEditEntity = (entity) => {
    setEditingEntity(entity);
    setShowEditEntityModal(true);
  };

  // Location template handlers
  const handleLocationTemplateCreated = (newTemplate) => {
    setLocationTemplates(prev => [newTemplate, ...prev]);
    setShowCreateLocationTemplate(false);
  };

  const handleDeleteLocationTemplate = (template) => {
    setDeletingItem({ type: 'location-template', item: template });
    setShowDeleteModal(true);
  };

  const handleDeleteMap = (map) => {
    setDeletingItem({ type: 'map', item: map });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      const { type, item } = deletingItem;
      
      if (type === 'location-template') {
        const response = await fetch(`${API_BASE_URL}/location-templates/${item.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete location template');
        setLocationTemplates(prev => prev.filter(t => t.id !== item.id));
      } else if (type === 'map') {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/maps/${item.id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete map');
        setMaps(prev => prev.filter(m => m.id !== item.id));
      }
      
      setShowDeleteModal(false);
      setDeletingItem(null);
    } catch (err) {
      console.error('Error during deletion:', err);
      alert(`Failed to delete ${deletingItem.type.replace('-', ' ')}`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await fetchProject();
      await fetchTemplates();
      await fetchMaps();
      await fetchLocationTemplates();
      setLoading(false);
    };

    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <button className="back-btn" onClick={() => navigate('/projects')}>
          ← Back to Projects
        </button>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/projects')} className="btn-small">
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button className="back-btn" onClick={() => navigate('/projects')}>
        ← Back to Projects
      </button>

      <div className="project-page">
        <h1>{project?.name}</h1>
        <p>{project?.description}</p>

        <hr />

        <h2>Templates</h2>

        <button 
          className="btn" 
          onClick={() => setShowCreateTemplate(true)}
        >
          + Create Template
        </button>

        {templates.length === 0 ? (
          <div className="empty-state">
            <h3>No templates yet</h3>
            <p>Create your first template to get started!</p>
          </div>
        ) : (
          <ul className="template-list">
            {templates.map(template => (
              <li key={template.id} className="template-item">
                <div className="template-header">
                  <button
                    className={`template-button ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelected(template)}
                  >
                    {template.name}
                  </button>
                  <div className="template-actions">
                    <button 
                      className="btn-small"
                      onClick={() => openEditTemplate(template)}
                      title="Edit template"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-small delete-btn"
                      onClick={() => deleteTemplate(template.id)}
                      title="Delete template"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}


        {selectedTemplate && (
          <>
            <hr />
            <div className="template-section">
              <h2>Entities for "{selectedTemplate.name}"</h2>
              
              <button 
                className="btn" 
                onClick={() => setShowEntityModal(true)}
              >
                + Create {selectedTemplate.name}
              </button>

              {loadingEntities ? (
                <div className="loading">
                  <p>Loading entities...</p>
                </div>
              ) : entities.length === 0 ? (
                <div className="empty-state">
                  <h3>No entities yet</h3>
                  <p>Create your first {selectedTemplate.name} to get started!</p>
                </div>
              ) : (
                <ul className="entity-list">
                  {entities.map(entity => (
                    <li key={entity.id} className="entity-item">
                      <div className="entity-header">
                        <h4>{entity.name}</h4>
                        <div className="entity-actions">
                          <button 
                            className="btn-small"
                            onClick={() => openEditEntity(entity)}
                            title="Edit entity"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-small delete-btn"
                            onClick={() => deleteEntity(entity.id)}
                            title="Delete entity"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="entity-data">
                        {Object.entries(entity.data || {}).map(([key, value]) => {
                          const fieldDef = selectedTemplate.schema.find(f => f.name === key);
                          const isComputed = fieldDef?.type === 'computed';

                          let content;

                          if (fieldDef?.type === 'image' && typeof value === 'string') {
                            content = <img src={value} alt={key} style={{ maxWidth: '150px', maxHeight: '150px' }} />;
                          } else if (value === null || value === undefined) {
                            content = <span className={isComputed ? 'computed-value' : ''}>null</span>;
                          } else if (typeof value === 'object') {
                            content = <span className={isComputed ? 'computed-value' : ''}>
                              {Array.isArray(value) ? value.join(', ') : JSON.stringify(value)}
                            </span>;
                          } else {
                            content = <span className={isComputed ? 'computed-value' : ''}>{String(value)}</span>;
                          }

                          return (
                            <div key={key} className={`entity-field ${isComputed ? 'computed-field' : ''}`}>
                              <strong>{key}:</strong> {content}
                              {isComputed && (
                                <span className="computed-badge" title="This value was computed automatically">
                                  🔢
                                </span>
                              )}
                            </div>
                          );
                        })}

                        
                        {/* Show computed fields that might be missing */}
                        {selectedTemplate.schema
                          .filter(field => field.type === 'computed')
                          .filter(field => !entity.data || !(field.name in entity.data))
                          .map(field => (
                            <div key={field.name} className="entity-field computed-field missing">
                              <strong>{field.name}:</strong> 
                              <span className="computed-value missing">
                                Not computed
                              </span>
                              <span className="computed-badge" title="This computed field is missing">
                                ⚠️
                              </span>
                            </div>
                          ))}
                      </div>
                      <p><small>Created: {new Date(entity.created_at).toLocaleDateString()}</small></p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

        <h2>Maps</h2>

        <button className="btn" onClick={() => setShowCreateMap(true)}>
          + Create Map
        </button>

        {maps.length === 0 ? (
          <div className="empty-state">
            <h3>No maps yet</h3>
            <p>Create a map to start placing locations.</p>
          </div>
        ) : (
          <ul className="template-list">
            {maps.map(map => (
              <li key={map.id} className="template-item">
                <div className="template-header">
                  <button 
                    className="template-button"
                    onClick={() => navigate(`/projects/${projectId}/maps/${map.id}`)}
                  >
                    🗺️ {map.name}
                  </button>
                  <div className="template-actions">
                    <button 
                      className="btn-small delete-btn"
                      onClick={() => handleDeleteMap(map)}
                      title="Delete map"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p>{map.description}</p>
              </li>
            ))}
          </ul>
        )}

        <hr />

        <h2>Location Templates</h2>

        <button className="cosmic-btn cosmic-btn-primary" onClick={() => setShowCreateLocationTemplate(true)}>
          + Create Location Template
        </button>

        {locationTemplates.length === 0 ? (
          <div className="empty-state">
            <h3>No location templates yet</h3>
            <p>Create location templates to place on your maps!</p>
          </div>
        ) : (
          <ul className="template-list">
            {locationTemplates.map(template => (
              <li key={template.id} className="template-item">
                <div className="template-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cosmic-space-sm)' }}>
                    {template.icon_url && (
                      <img 
                        src={template.icon_url} 
                        alt={template.name}
                        style={{ width: 24, height: 24, borderRadius: 'var(--cosmic-radius)' }}
                      />
                    )}
                    <div>
                      <div className="template-button" style={{ background: 'none', padding: 1, textAlign: 'left', color: 'var(--cosmic-text-muted)' }}>
                        {template.name}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--cosmic-text-muted)' }}>
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <div className="template-actions">
                    <button 
                      className="btn-small delete-btn"
                      onClick={() => handleDeleteLocationTemplate(template)}
                      title="Delete location template"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        

      {showCreateTemplate && (
        <CreateTemplateModal
          projectId={projectId}
          onClose={() => setShowCreateTemplate(false)}
          onTemplateCreated={handleTemplateCreated}
        />
      )}

      {showCreateMap && (
        <CreateMapModal
          projectId={projectId}
          onClose={() => setShowCreateMap(false)}
          onMapCreated={handleMapCreated}
        />
      )}


      {showEditTemplate && editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowEditTemplate(false);
            setEditingTemplate(null);
          }}
          onTemplateUpdated={handleTemplateUpdated}
        />
      )}

      {showEntityModal && selectedTemplate && (
        <CreateEntityModal
          projectId={projectId}
          template={selectedTemplate}
          onClose={() => setShowEntityModal(false)}
          onEntityCreated={handleEntityCreated}
        />
      )}

      {showEditEntityModal && editingEntity && selectedTemplate && (
        <EditEntityModal
          entity={editingEntity}
          template={selectedTemplate}
          onClose={() => {
            setShowEditEntityModal(false);
            setEditingEntity(null);
          }}
          onEntityUpdated={handleEntityUpdated}
        />
      )}

      {showCreateLocationTemplate && (
        <CreateLocationTemplateModal
          projectId={projectId}
          onClose={() => setShowCreateLocationTemplate(false)}
          onCreate={handleLocationTemplateCreated}
        />
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          itemName={deletingItem?.name || ''}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingItem(null);
          }}
        />
      )}
    </div>
  );
}

export default ProjectPage;
