import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateLocationTemplateModal from '../components/maps/CreateLocationTemplateModal';
import LocationCreationModal from '../components/maps/LocationCreationModal';
import LocationInstanceForm from '../components/maps/LocationInstanceForm';
import EditMapModal from '../components/maps/EditMapModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import '../components/maps/map_pages_styles.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function MapDetailPage() {
  const { projectId, mapId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [locationTemplates, setLocationTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [locations, setLocations] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);

  // --- Map edit/delete states
  const [showEditMapModal, setShowEditMapModal] = useState(false);
  const [showDeleteMapModal, setShowDeleteMapModal] = useState(false);

  // --- Fetch map data
  const fetchMap = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/maps/${mapId}`);
      if (!res.ok) throw new Error('Failed to load map');
      const data = await res.json();
      setMap(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch location templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/location-templates`);
      if (!res.ok) throw new Error('Failed to load templates');
      const data = await res.json();
      setLocationTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Fetch locations for this map
  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/maps/${mapId}/locations`);
      if (!res.ok) throw new Error('Failed to load locations');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMap();
    fetchTemplates();
    fetchLocations();
  }, [projectId, mapId]);

  // --- Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await fetch(`${API_BASE_URL}/maps/${mapId}/image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');

      const { image } = await res.json();
      setMap((prev) => ({ ...prev, image }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  // --- Handle clicking on image to place location
  const handleMapClick = async (e) => {
    if (!selectedTemplate || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newLocation = {
      template_id: selectedTemplate.id,
      name: `New ${selectedTemplate.name}`,
      x_position: x,
      y_position: y,
      data: {}
    };

    try {
      const res = await fetch(`${API_BASE_URL}/maps/${mapId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation)
      });

      if (!res.ok) throw new Error('Failed to create location');
      
      const createdLocation = await res.json();
      setLocations([...locations, createdLocation]);
      setActiveLocation({ ...createdLocation, template: selectedTemplate });
      setSelectedTemplate(null); // deactivate after placing
    } catch (err) {
      console.error('Error creating location:', err);
      alert('Failed to create location');
    }
  };

  // --- Handle creating location template
  const handleTemplateCreated = async (templateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/location-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateData.name,
          description: templateData.description,
          icon_url: templateData.icon_url || '',
          schema: templateData.schema
        })
      });

      if (!response.ok) throw new Error('Failed to create location template');
      
      const newTemplate = await response.json();
      setLocationTemplates([...locationTemplates, newTemplate]);
    } catch (err) {
      console.error('Error creating location template:', err);
      alert('Failed to create location template');
    }
  };

  // --- Handle map editing
  const handleEditMap = async (updatedMapData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/maps/${mapId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMapData)
      });

      if (!response.ok) throw new Error('Failed to update map');
      
      const updatedMap = await response.json();
      setMap(updatedMap);
      setShowEditMapModal(false);
    } catch (err) {
      console.error('Error updating map:', err);
      alert('Failed to update map');
    }
  };

  // --- Handle map deletion
  const handleDeleteMap = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/maps/${mapId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete map');
      
      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error deleting map:', err);
      alert('Failed to delete map');
    }
  };

  if (loading) return <div className="container"><p>Loading map...</p></div>;
  if (error) return (
    <div className="container">
      <p>Error: {error}</p>
      <button onClick={() => navigate(`/projects/${projectId}`)}>← Back to Project</button>
    </div>
  );

  return (
    <div className="container">
      <button onClick={() => navigate(`/projects/${projectId}`)} className="back-btn">
        ← Back to Project
      </button>

      <div className="map-header">
        <div>
          <h1>{map.name}</h1>
          <p>{map.description}</p>
        </div>
        <div className="map-actions">
          <button 
            className="cosmic-btn cosmic-btn-secondary cosmic-btn-sm" 
            onClick={() => setShowEditMapModal(true)}
          >
            Edit Map
          </button>
          <button 
            className="cosmic-btn cosmic-btn-danger cosmic-btn-sm" 
            onClick={() => setShowDeleteMapModal(true)}
          >
            Delete Map
          </button>
        </div>
      </div>

      {map.image && (
        <div className="top-bar">
          <button className="btn" onClick={() => setShowTemplateModal(true)}>
            + Create Location Template
          </button>
          <button className="btn" onClick={() => setShowLocationModal(true)}>
            + Add Location
          </button>
        </div>
      )}

      <div className="map-image-section">
        <h3>Map Image</h3>
        {map.image ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={map.image}
              alt="Map"
              ref={mapRef}
              onClick={handleMapClick}
              style={{ maxWidth: '100%', maxHeight: '600px', border: '1px solid #ccc' }}
            />

            {locations.map(loc => {
              const template = locationTemplates.find(t => t.id === loc.template_id);
              return (
                <div
                  key={loc.id}
                  className="location-marker"
                  style={{
                    position: 'absolute',
                    left: `${loc.x_position * 100}%`,
                    top: `${loc.y_position * 100}%`,
                  }}
                  title={loc.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLocation({
                      ...loc,
                      template: template
                    });
                  }}
                >
                  {template?.icon_url ? (
                    <img
                      src={template.icon_url}
                      alt={loc.name}
                      style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: 'var(--cosmic-accent)',
                        borderRadius: '50%',
                        border: '2px solid var(--cosmic-text-light)',
                        boxShadow: 'var(--cosmic-shadow)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>No map image uploaded yet.</p>
        )}

        <div style={{ marginTop: '1rem' }}>
          <label>
            Upload Image:{' '}
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
          {uploading && <p>Uploading...</p>}
        </div>
      </div>

      {showLocationModal && (
        <LocationCreationModal
          templates={locationTemplates}
          onSelectTemplate={(tpl) => {
            setSelectedTemplate(tpl);
            setShowLocationModal(false);
          }}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {activeLocation && (
        <LocationInstanceForm
          location={activeLocation}
          onSave={async (updatedData) => {
            try {
              const res = await fetch(`${API_BASE_URL}/locations/${activeLocation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: updatedData.name,
                  x_position: activeLocation.x_position,
                  y_position: activeLocation.y_position,
                  data: updatedData
                })
              });

              if (!res.ok) throw new Error('Failed to update location');
              
              const updatedLocation = await res.json();
              setLocations(locations.map(loc =>
                loc.id === activeLocation.id
                  ? { ...loc, ...updatedLocation }
                  : loc
              ));
              setActiveLocation(null);
            } catch (err) {
              console.error('Error updating location:', err);
              alert('Failed to update location');
            }
          }}
          onDelete={async (locationId) => {
            try {
              const res = await fetch(`${API_BASE_URL}/locations/${locationId}`, {
                method: 'DELETE',
              });

              if (!res.ok) throw new Error('Failed to delete location');
              
              setLocations(locations.filter(loc => loc.id !== locationId));
              setActiveLocation(null);
            } catch (err) {
              console.error('Error deleting location:', err);
              alert('Failed to delete location');
            }
          }}
          onCancel={() => setActiveLocation(null)}
        />
      )}

      {showTemplateModal && (
        <CreateLocationTemplateModal
          onClose={() => setShowTemplateModal(false)}
          onCreate={(templateData) => {
            handleTemplateCreated(templateData);
            setShowTemplateModal(false);
          }}
        />
      )}

      {showEditMapModal && (
        <EditMapModal
          map={map}
          onSave={handleEditMap}
          onClose={() => setShowEditMapModal(false)}
        />
      )}

      {showDeleteMapModal && (
        <ConfirmDeleteModal
          title="Delete Map"
          message="Are you sure you want to delete this map? All locations on this map will also be deleted."
          itemName={map?.name}
          onConfirm={handleDeleteMap}
          onCancel={() => setShowDeleteMapModal(false)}
        />
      )}
    </div>
  );
}

export default MapDetailPage;
