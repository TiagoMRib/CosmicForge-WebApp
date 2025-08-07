import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateLocationTemplateModal from '../components/CreateLocationTemplateModal';
import LocationCreationModal from '../components/LocationCreationModal';
import LocationInstanceForm from '../components/LocationInstanceForm';
import '../components/map_pages_styles.css';

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

      <h1>{map.name}</h1>
      <p>{map.description}</p>

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

            {locations.map(loc => (
              <div
                key={loc.id}
                style={{
                  position: 'absolute',
                  left: `${loc.x_position * 100}%`,
                  top: `${loc.y_position * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                }}
                title={loc.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLocation({
                    ...loc,
                    template: locationTemplates.find(t => t.id === loc.template_id)
                  });
                }}
              >
                {loc.template_icon_url ? (
                  <img
                    src={loc.template_icon_url}
                    alt={loc.name}
                    style={{ width: 32, height: 32 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: '#007bff',
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  />
                )}
              </div>
            ))}
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

      {showTemplateModal && (
        <CreateLocationTemplateModal
            onClose={() => setShowTemplateModal(false)}
            onTemplateCreated={(newTemplate) => {
            setLocationTemplates((prev) => [...prev, newTemplate]);
            setShowTemplateModal(false);
            }}
        />
        )}

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
    </div>
  );
}

export default MapDetailPage;
