const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// CONFIGURATION
// ============================================================================
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================
app.use(helmet());           // Security headers
app.use(cors());            // Enable CORS for frontend
app.use(morgan('combined')); // HTTP request logging
app.use(express.json());     // Parse JSON request bodies

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================================
// DATABASE SETUP
// ============================================================================
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Projects table - stores project metadata
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Templates table - stores entity templates/schemas for each project
  db.run(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      schema_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

    // Maps table - stores maps for each project
  db.run(`
    CREATE TABLE IF NOT EXISTS maps (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Add image column to existing maps table if it doesn't exist
  db.run(`
    ALTER TABLE maps ADD COLUMN image TEXT
  `, (err) => {
    // This will fail if column already exists, which is fine
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Note: Could not add image column to maps table:', err.message);
    }
  });

  // Location templates table - stores reusable location templates for maps
  db.run(`
    CREATE TABLE IF NOT EXISTS location_templates (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon_url TEXT,
      schema_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Locations table - stores actual location instances on maps
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      map_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      x_position REAL NOT NULL,
      y_position REAL NOT NULL,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (map_id) REFERENCES maps(id),
      FOREIGN KEY (template_id) REFERENCES location_templates(id)
    )
  `);

  // Entities table - stores actual entity instances based on templates
  db.run(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    )
  `);
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const handleDatabaseError = (err, res, operation) => {
  console.error(`Error ${operation}:`, err);
  res.status(500).json({ error: `Failed to ${operation}` });
};

const createTimestamp = () => new Date().toISOString();

// ============================================================================
// HEALTH CHECK ROUTE
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: createTimestamp(),
    service: 'Cosmic Forge Backend API'
  });
});

// ============================================================================
// PROJECT ROUTES
// ============================================================================

// GET /api/projects - Retrieve all projects
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY created_at DESC', (err, rows) => {
    if (err) return handleDatabaseError(err, res, 'fetch projects');
    res.json(rows);
  });
});

// GET /api/projects/:id - Retrieve a specific project
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, row) => {
    if (err) return handleDatabaseError(err, res, 'fetch project');
    
    if (!row) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(row);
  });
});

// POST /api/projects - Create a new project
app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  
  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  const project = {
    id: uuidv4(),
    name,
    description: description || '',
    created_at: createTimestamp(),
    updated_at: createTimestamp()
  };
  
  db.run(
    'INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [project.id, project.name, project.description, project.created_at, project.updated_at],
    function(err) {
      if (err) return handleDatabaseError(err, res, 'create project');
      res.status(201).json(project);
    }
  );
});

// PUT /api/projects/:id - Update an existing project
app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  const updated_at = createTimestamp();
  
  db.run(
    'UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?',
    [name, description || '', updated_at, id],
    function(err) {
      if (err) return handleDatabaseError(err, res, 'update project');
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json({ id, name, description, updated_at });
    }
  );
});

// DELETE /api/projects/:id - Delete a project
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
    if (err) return handleDatabaseError(err, res, 'delete project');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  });
});

// ============================================================================
// TEMPLATE ROUTES
// ============================================================================

// POST /api/projects/:projectId/templates - Create a new template for a project
app.post('/api/projects/:projectId/templates', (req, res) => {
  const { projectId } = req.params;
  const { name, schema } = req.body;

  // Validation
  if (!name || !schema) {
    return res.status(400).json({ error: 'Name and schema are required' });
  }

  const template = {
    id: uuidv4(),
    project_id: projectId,
    name,
    schema_json: JSON.stringify(schema),
    created_at: createTimestamp(),
    updated_at: createTimestamp()
  };

  db.run(`
    INSERT INTO templates (id, project_id, name, schema_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [template.id, template.project_id, template.name, template.schema_json, template.created_at, template.updated_at], 
  function(err) {
    if (err) return handleDatabaseError(err, res, 'create template');
    
    res.status(201).json({ 
      id: template.id, 
      project_id: template.project_id, 
      name: template.name, 
      schema, 
      created_at: template.created_at, 
      updated_at: template.updated_at 
    });
  });
});

// GET /api/projects/:projectId/templates - Get all templates for a project
app.get('/api/projects/:projectId/templates', (req, res) => {
  const { projectId } = req.params;

  db.all(`
    SELECT * FROM templates WHERE project_id = ?
    ORDER BY created_at DESC
  `, [projectId], (err, rows) => {
    if (err) return handleDatabaseError(err, res, 'fetch templates');

    // Parse schema JSON before sending
    const templates = rows.map(row => ({
      ...row,
      schema: JSON.parse(row.schema_json),
    }));

    res.json(templates);
  });
});

// GET /api/templates/:templateId - Get a specific template
app.get('/api/templates/:templateId', (req, res) => {
  const { templateId } = req.params;

  db.get(`
    SELECT * FROM templates WHERE id = ?
  `, [templateId], (err, row) => {
    if (err) return handleDatabaseError(err, res, 'fetch template');

    if (!row) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      ...row,
      schema: JSON.parse(row.schema_json),
    });
  });
});

// PUT /api/templates/:templateId - Update a template
app.put('/api/templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  const { name, schema } = req.body;

  // Validation
  if (!name || !schema) {
    return res.status(400).json({ error: 'Name and schema are required' });
  }

  const updated_at = createTimestamp();

  db.run(`
    UPDATE templates SET name = ?, schema_json = ?, updated_at = ? WHERE id = ?
  `, [name, JSON.stringify(schema), updated_at, templateId], function(err) {
    if (err) return handleDatabaseError(err, res, 'update template');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ 
      id: templateId, 
      name, 
      schema, 
      updated_at 
    });
  });
});

// DELETE /api/templates/:templateId - Delete a template
app.delete('/api/templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  
  db.run('DELETE FROM templates WHERE id = ?', [templateId], function(err) {
    if (err) return handleDatabaseError(err, res, 'delete template');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  });
});

// ============================================================================
// MAP ROUTES
// ============================================================================

const multer = require('multer');
const upload = multer({ dest: 'uploads/maps/' });

// GET /api/projects/:projectId/maps - Get all maps for a project
app.get('/api/projects/:projectId/maps', (req, res) => {
  const { projectId } = req.params;
  
  db.all('SELECT * FROM maps WHERE project_id = ? ORDER BY created_at DESC', [projectId], (err, rows) => {
    if (err) return handleDatabaseError(err, res, 'fetch maps');
    res.json(rows);
  });
});

// GET /api/projects/:projectId/maps/:mapId - Get a specific map
app.get('/api/projects/:projectId/maps/:mapId', (req, res) => {
  const { projectId, mapId } = req.params;
  
  db.get('SELECT * FROM maps WHERE id = ? AND project_id = ?', [mapId, projectId], (err, row) => {
    if (err) return handleDatabaseError(err, res, 'fetch map');
    
    if (!row) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    res.json(row);
  });
});

// POST /api/projects/:projectId/maps - Create a new map
app.post('/api/projects/:projectId/maps', (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  
  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Map name is required' });
  }
  
  const map = {
    id: uuidv4(),
    project_id: projectId,
    name,
    description: description || '',
    image: null,
    created_at: createTimestamp(),
    updated_at: createTimestamp()
  };
  
  db.run(
    'INSERT INTO maps (id, project_id, name, description, image, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [map.id, map.project_id, map.name, map.description, map.image, map.created_at, map.updated_at],
    function(err) {
      if (err) return handleDatabaseError(err, res, 'create map');
      res.status(201).json(map);
    }
  );
});

// PUT /api/projects/:projectId/maps/:mapId - Update a map
app.put('/api/projects/:projectId/maps/:mapId', (req, res) => {
  const { projectId, mapId } = req.params;
  const { name, description } = req.body;
  
  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Map name is required' });
  }
  
  const updated_at = createTimestamp();
  
  db.run(
    'UPDATE maps SET name = ?, description = ?, updated_at = ? WHERE id = ? AND project_id = ?',
    [name, description || '', updated_at, mapId, projectId],
    function(err) {
      if (err) return handleDatabaseError(err, res, 'update map');
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Map not found' });
      }
      
      res.json({ id: mapId, project_id: projectId, name, description, updated_at });
    }
  );
});

// DELETE /api/projects/:projectId/maps/:mapId - Delete a map
app.delete('/api/projects/:projectId/maps/:mapId', (req, res) => {
  const { projectId, mapId } = req.params;
  
  db.run('DELETE FROM maps WHERE id = ? AND project_id = ?', [mapId, projectId], function(err) {
    if (err) return handleDatabaseError(err, res, 'delete map');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    res.json({ message: 'Map deleted successfully' });
  });
});

// POST /api/maps/:mapId/image - Upload map image
app.post('/api/maps/:mapId/image', upload.single('image'), (req, res) => {
  const { mapId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  
  const imagePath = `/uploads/maps/${req.file.filename}`;
  const updated_at = createTimestamp();
  
  db.run(`UPDATE maps SET image = ?, updated_at = ? WHERE id = ?`, [imagePath, updated_at, mapId], function(err) {
    if (err) return handleDatabaseError(err, res, 'save map image');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Map not found' });
    }
    
    res.json({ image: imagePath, updated_at });
  });
});

// ============================================================================
// LOCATION TEMPLATE ROUTES
// ============================================================================

// GET /api/projects/:projectId/location-templates - Get all location templates for a project
app.get('/api/projects/:projectId/location-templates', (req, res) => {
  const { projectId } = req.params;
  
  db.all('SELECT * FROM location_templates WHERE project_id = ? ORDER BY created_at DESC', [projectId], (err, rows) => {
    if (err) return handleDatabaseError(err, res, 'fetch location templates');
    
    // Parse schema JSON before sending
    const templates = rows.map(row => ({
      ...row,
      schema: JSON.parse(row.schema_json),
    }));
    
    res.json(templates);
  });
});

// GET /api/location-templates/:templateId - Get a specific location template
app.get('/api/location-templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  
  db.get('SELECT * FROM location_templates WHERE id = ?', [templateId], (err, row) => {
    if (err) return handleDatabaseError(err, res, 'fetch location template');
    
    if (!row) {
      return res.status(404).json({ error: 'Location template not found' });
    }
    
    res.json({
      ...row,
      schema: JSON.parse(row.schema_json),
    });
  });
});

// POST /api/projects/:projectId/location-templates - Create a new location template
app.post('/api/projects/:projectId/location-templates', (req, res) => {
  const { projectId } = req.params;
  const { name, description, icon_url, schema } = req.body;
  
  // Validation
  if (!name || !schema) {
    return res.status(400).json({ error: 'Name and schema are required' });
  }
  
  const template = {
    id: uuidv4(),
    project_id: projectId,
    name,
    description: description || '',
    icon_url: icon_url || '',
    schema_json: JSON.stringify(schema),
    created_at: createTimestamp(),
    updated_at: createTimestamp()
  };
  
  db.run(
    'INSERT INTO location_templates (id, project_id, name, description, icon_url, schema_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [template.id, template.project_id, template.name, template.description, template.icon_url, template.schema_json, template.created_at, template.updated_at],
    function(err) {
      if (err) return handleDatabaseError(err, res, 'create location template');
      
      res.status(201).json({
        id: template.id,
        project_id: template.project_id,
        name: template.name,
        description: template.description,
        icon_url: template.icon_url,
        schema,
        created_at: template.created_at,
        updated_at: template.updated_at
      });
    }
  );
});

// PUT /api/location-templates/:templateId - Update a location template
app.put('/api/location-templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  const { name, description, icon_url, schema } = req.body;
  
  // Validation
  if (!name || !schema) {
    return res.status(400).json({ error: 'Name and schema are required' });
  }
  
  const updated_at = createTimestamp();
  
  db.run(
    'UPDATE location_templates SET name = ?, description = ?, icon_url = ?, schema_json = ?, updated_at = ? WHERE id = ?',
    [name, description || '', icon_url || '', JSON.stringify(schema), updated_at, templateId],
    function(err) {
      if (err) return handleDatabaseError(err, res, 'update location template');
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Location template not found' });
      }
      
      res.json({
        id: templateId,
        name,
        description,
        icon_url,
        schema,
        updated_at
      });
    }
  );
});

// DELETE /api/location-templates/:templateId - Delete a location template
app.delete('/api/location-templates/:templateId', (req, res) => {
  const { templateId } = req.params;
  
  db.run('DELETE FROM location_templates WHERE id = ?', [templateId], function(err) {
    if (err) return handleDatabaseError(err, res, 'delete location template');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Location template not found' });
    }
    
    res.json({ message: 'Location template deleted successfully' });
  });
});

// ============================================================================
// LOCATION ROUTES
// ============================================================================

// GET /api/maps/:mapId/locations - Get all locations for a map
app.get('/api/maps/:mapId/locations', (req, res) => {
  const { mapId } = req.params;
  
  db.all(`
    SELECT l.*, lt.name as template_name, lt.icon_url as template_icon_url
    FROM locations l
    JOIN location_templates lt ON l.template_id = lt.id
    WHERE l.map_id = ?
    ORDER BY l.created_at DESC
  `, [mapId], (err, rows) => {
    if (err) return handleDatabaseError(err, res, 'fetch locations');
    
    // Parse data JSON before sending
    const locations = rows.map(row => ({
      ...row,
      data: JSON.parse(row.data_json),
    }));
    
    res.json(locations);
  });
});

// GET /api/locations/:locationId - Get a specific location
app.get('/api/locations/:locationId', (req, res) => {
  const { locationId } = req.params;
  
  db.get(`
    SELECT l.*, lt.name as template_name, lt.icon_url as template_icon_url, lt.schema_json
    FROM locations l
    JOIN location_templates lt ON l.template_id = lt.id
    WHERE l.id = ?
  `, [locationId], (err, row) => {
    if (err) return handleDatabaseError(err, res, 'fetch location');
    
    if (!row) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      ...row,
      data: JSON.parse(row.data_json),
      template_schema: JSON.parse(row.schema_json),
    });
  });
});

// POST /api/maps/:mapId/locations - Create a new location on a map
app.post('/api/maps/:mapId/locations', (req, res) => {
  const { mapId } = req.params;
  const { template_id, name, x_position, y_position, data } = req.body;
  
  // Validation
  if (!template_id || !name || x_position === undefined || y_position === undefined || !data) {
    return res.status(400).json({ error: 'Template ID, name, position, and data are required' });
  }
  
  const location = {
    id: uuidv4(),
    map_id: mapId,
    template_id,
    name,
    x_position,
    y_position,
    data_json: JSON.stringify(data),
    created_at: createTimestamp(),
    updated_at: createTimestamp()
  };
  
  db.run(`
    INSERT INTO locations (id, map_id, template_id, name, x_position, y_position, data_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [location.id, location.map_id, location.template_id, location.name, location.x_position, location.y_position, location.data_json, location.created_at, location.updated_at],
  function(err) {
    if (err) return handleDatabaseError(err, res, 'create location');
    
    res.status(201).json({
      id: location.id,
      map_id: location.map_id,
      template_id: location.template_id,
      name: location.name,
      x_position: location.x_position,
      y_position: location.y_position,
      data,
      created_at: location.created_at,
      updated_at: location.updated_at
    });
  });
});

// PUT /api/locations/:locationId - Update a location
app.put('/api/locations/:locationId', (req, res) => {
  const { locationId } = req.params;
  const { name, x_position, y_position, data } = req.body;
  
  // Validation
  if (!name || x_position === undefined || y_position === undefined || !data) {
    return res.status(400).json({ error: 'Name, position, and data are required' });
  }
  
  const updated_at = createTimestamp();
  
  db.run(`
    UPDATE locations SET name = ?, x_position = ?, y_position = ?, data_json = ?, updated_at = ? WHERE id = ?
  `, [name, x_position, y_position, JSON.stringify(data), updated_at, locationId], function(err) {
    if (err) return handleDatabaseError(err, res, 'update location');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      id: locationId,
      name,
      x_position,
      y_position,
      data,
      updated_at
    });
  });
});

// DELETE /api/locations/:locationId - Delete a location
app.delete('/api/locations/:locationId', (req, res) => {
  const { locationId } = req.params;
  
  db.run('DELETE FROM locations WHERE id = ?', [locationId], function(err) {
    if (err) return handleDatabaseError(err, res, 'delete location');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ message: 'Location deleted successfully' });
  });
});

// ============================================================================
// ENTITY ROUTES
// ============================================================================

// POST /api/templates/:templateId/entities - Create a new entity based on a template
app.post('/api/templates/:templateId/entities', (req, res) => {
  const { templateId } = req.params;
  const { project_id, name, data } = req.body;

  // Validation
  if (!project_id || !name || !data) {
    return res.status(400).json({ error: 'Project ID, name, and data are required' });
  }

  const entity = {
    id: uuidv4(),
    project_id,
    template_id: templateId,
    name,
    data_json: JSON.stringify(data),
    created_at: createTimestamp(),
    updated_at: createTimestamp()
  };

  db.run(`
    INSERT INTO entities (id, project_id, template_id, name, data_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [entity.id, entity.project_id, entity.template_id, entity.name, entity.data_json, entity.created_at, entity.updated_at], 
  function(err) {
    if (err) return handleDatabaseError(err, res, 'create entity');
    
    res.status(201).json({ 
      id: entity.id, 
      project_id: entity.project_id, 
      template_id: entity.template_id, 
      name: entity.name, 
      data, 
      created_at: entity.created_at, 
      updated_at: entity.updated_at 
    });
  });
});

// GET /api/templates/:templateId/entities - Get all entities for a template
app.get('/api/templates/:templateId/entities', (req, res) => {
  const { templateId } = req.params;

  db.all(`
    SELECT * FROM entities WHERE template_id = ?
    ORDER BY created_at DESC
  `, [templateId], (err, rows) => {
    if (err) return handleDatabaseError(err, res, 'fetch entities');

    // Parse data JSON before sending
    const entities = rows.map(row => ({
      ...row,
      data: JSON.parse(row.data_json),
    }));

    res.json(entities);
  });
});

// PUT /api/entities/:entityId - Update an entity
app.put('/api/entities/:entityId', (req, res) => {
  const { entityId } = req.params;
  const { name, data } = req.body;

  // Validation
  if (!name || !data) {
    return res.status(400).json({ error: 'Name and data are required' });
  }

  const updated_at = createTimestamp();

  db.run(`
    UPDATE entities SET name = ?, data_json = ?, updated_at = ? WHERE id = ?
  `, [name, JSON.stringify(data), updated_at, entityId], function(err) {
    if (err) return handleDatabaseError(err, res, 'update entity');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    res.json({ 
      id: entityId, 
      name, 
      data, 
      updated_at 
    });
  });
});

// DELETE /api/entities/:entityId - Delete an entity
app.delete('/api/entities/:entityId', (req, res) => {
  const { entityId } = req.params;
  
  db.run('DELETE FROM entities WHERE id = ?', [entityId], function(err) {
    if (err) return handleDatabaseError(err, res, 'delete entity');
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    res.json({ message: 'Entity deleted successfully' });
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================
app.listen(PORT, () => {
  console.log(`🚀 Cosmic Forge Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app; 