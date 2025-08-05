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