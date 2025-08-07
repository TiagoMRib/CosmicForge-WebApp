# Cosmic Forge - Map API Documentation

This document describes the API endpoints for map functionality, including maps, location templates, and locations.

## Database Schema

### Maps Table
- `id` (TEXT PRIMARY KEY)
- `project_id` (TEXT) - References projects(id)
- `name` (TEXT NOT NULL)
- `description` (TEXT)
- `image` (TEXT) - Path to uploaded map image
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Location Templates Table
- `id` (TEXT PRIMARY KEY)
- `project_id` (TEXT) - References projects(id)
- `name` (TEXT NOT NULL)
- `description` (TEXT)
- `icon_url` (TEXT) - URL/path to template icon
- `schema_json` (TEXT) - JSON schema for location fields
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Locations Table
- `id` (TEXT PRIMARY KEY)
- `map_id` (TEXT) - References maps(id)
- `template_id` (TEXT) - References location_templates(id)
- `name` (TEXT NOT NULL)
- `x_position` (REAL) - X coordinate (0.0 to 1.0, relative to image)
- `y_position` (REAL) - Y coordinate (0.0 to 1.0, relative to image)
- `data_json` (TEXT) - JSON data for location fields
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

## Map Endpoints

### GET /api/projects/:projectId/maps
Get all maps for a project.

### GET /api/projects/:projectId/maps/:mapId
Get a specific map.

### POST /api/projects/:projectId/maps
Create a new map.
```json
{
  "name": "My Adventure Map",
  "description": "A map for my campaign"
}
```

### PUT /api/projects/:projectId/maps/:mapId
Update a map.
```json
{
  "name": "Updated Map Name",
  "description": "Updated description"
}
```

### DELETE /api/projects/:projectId/maps/:mapId
Delete a map (and all its locations).

### POST /api/maps/:mapId/image
Upload an image for a map. Send as multipart/form-data with field name "image".

## Location Template Endpoints

### GET /api/projects/:projectId/location-templates
Get all location templates for a project.

### GET /api/location-templates/:templateId
Get a specific location template.

### POST /api/projects/:projectId/location-templates
Create a new location template.
```json
{
  "name": "Town",
  "description": "A settlement location",
  "icon_url": "/icons/town.png",
  "schema": [
    {
      "name": "population",
      "type": "number",
      "label": "Population",
      "required": true
    },
    {
      "name": "ruler",
      "type": "text",
      "label": "Ruler",
      "required": false
    },
    {
      "name": "defenses",
      "type": "select",
      "label": "Defenses",
      "options": ["None", "Wooden Walls", "Stone Walls", "Castle"],
      "required": true
    }
  ]
}
```

### PUT /api/location-templates/:templateId
Update a location template.

### DELETE /api/location-templates/:templateId
Delete a location template (and all locations using it).

## Location Endpoints

### GET /api/maps/:mapId/locations
Get all locations on a map.

### GET /api/locations/:locationId
Get a specific location.

### POST /api/maps/:mapId/locations
Create a new location on a map.
```json
{
  "template_id": "template-uuid",
  "name": "Riverdale",
  "x_position": 0.25,
  "y_position": 0.75,
  "data": {
    "population": 5000,
    "ruler": "Mayor Johnson",
    "defenses": "Wooden Walls"
  }
}
```

### PUT /api/locations/:locationId
Update a location.
```json
{
  "name": "Updated Location Name",
  "x_position": 0.3,
  "y_position": 0.8,
  "data": {
    "population": 5500,
    "ruler": "Mayor Smith",
    "defenses": "Stone Walls"
  }
}
```

### DELETE /api/locations/:locationId
Delete a location.

## Position Coordinates

Location positions are stored as relative coordinates:
- `x_position`: 0.0 (left edge) to 1.0 (right edge)
- `y_position`: 0.0 (top edge) to 1.0 (bottom edge)

This allows locations to scale properly with different image sizes and responsive layouts.

## File Upload

Map images are stored in `/backend/uploads/maps/` and served statically at `/uploads/maps/[filename]`.

## Example Workflow

1. Create a project
2. Create a map for the project
3. Upload an image for the map
4. Create location templates with custom schemas
5. Create locations using the templates
6. Place locations on the map using x/y coordinates

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 404: Not Found
- 500: Internal Server Error

Error responses include a message:
```json
{
  "error": "Map not found"
}
```
