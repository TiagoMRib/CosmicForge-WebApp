// components/MapTopBar.jsx
import React from 'react';

function MapTopBar({ hasImage, onCreateTemplate, onAddLocation }) {
  if (!hasImage) return null;

  return (
    <div className="map-top-bar">
      <button className="btn" onClick={onCreateTemplate}>
        + Create Location Template
      </button>
      <button className="btn" onClick={onAddLocation}>
        + Add Location
      </button>
    </div>
  );
}

export default MapTopBar;
