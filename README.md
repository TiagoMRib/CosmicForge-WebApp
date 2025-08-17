# 🌌 The Cosmic Forge (Early Development)

The Cosmic Forge is a **world-building and game design tool** that empowers creators to build immersive worlds with structured data management.

Create projects with **custom templates**, **dynamic entities**, and **interactive maps** - providing a flexible yet organized approach to managing game worlds, stories, and creative projects.

---

## ✨ Core Features

### 📦 **Projects**
- **Multi-project management**: Organize different worlds and stories
- **Hierarchical structure**: Each project contains templates, entities, location templates, and maps

### 🧩 **Entity Templates**
Define reusable data structures that serve as blueprints for your world's objects, characters, and items.

**Examples**: "Monster", "NPC", "Weapon", "Spell", "Location"

**Supported Field Types**:
- **Text**: Names, descriptions, notes
- **Number**: Stats, quantities, measurements  
- **Boolean**: True/false flags (e.g., "Is Magical")
- **Select**: Single choice from predefined options
- **Multi-Select**: Multiple choices from predefined options
- **Computed**: Auto-calculated fields using formulas based on other field values

**Dynamic Form Generation**: Templates automatically generate forms for data entry and editing.

### 👤 **Entities**
Bring your templates to life by creating specific instances with custom data.

**Examples**: 
- A "Flame Sword of Etrigan" entity from a "Weapon" template
- A "Gandalf the Grey" entity from an "NPC" template
- A "Ancient Red Dragon" entity from a "Monster" template

**Features**:
- **Template-driven forms**: Automatically generated based on template structure
- **Full lifecycle management**: Create, view, edit, and delete entities
- **Computed field evaluation**: Automatic calculation of formula-based fields

### 🗺️ **Interactive Maps**
Create immersive, clickable maps with dynamic location management.

**Map Management**:
- **Custom map uploads**: Use your own map images

**Location Templates**:
- **Structured location types**: Define templates like "Town", "Dungeon", "Route"
- **Custom icons**: Visual representation for different location types
- **Template-based data**: Each location template defines what data locations will have

**Interactive Placement**:
- **Click-to-place**: Drop locations anywhere on the map
- **Visual markers**: Locations display with their template icons
- **Relative positioning**: Coordinates adapt to map resizing
- **Edit on click**: Click locations to view and edit details

---

## 🎯 Use Cases

- **Tabletop RPG Campaigns**: Manage NPCs, items, locations, and world lore
- **Video Game Development**: Organize game assets, characters, and level design
- **Creative Writing**: Track characters, locations, and story elements
- **World Building**: Create detailed fictional universes with interconnected elements

---

## 🚀 Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose installed
- Git (for cloning the repository)

### Quick Start
1. **Clone the repository**:
```bash
git clone https://github.com/TiagoMRib/CosmicForge-WebApp.git
cd CosmicForge-WebApp
```

2. **Run with Docker Compose**:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

3. **Access the application**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001

### Development Setup

For local development without Docker:

1. **Backend Setup**:
```bash
cd backend
npm install
npm run dev
```

2. **Frontend Setup** (in a new terminal):
```bash
cd frontend
npm install
npm start
```

---

## 🏗️ Architecture

### Frontend
- **React 18.2.0** 
- **React Router** 
- **CSS Variables** 
- **Modular component structure** 

### Backend
- **Node.js** with Express.js framework
- **SQLite** database for lightweight, file-based storage
- **RESTful API** design with full CRUD operations
- **File upload handling** for maps and icons

### Database Schema
- **Projects**: Top-level containers
- **Templates**: Entity and location template definitions
- **Entities**: Template instances with custom data
- **Maps**: Uploaded map images with metadata
- **Location Templates**: Reusable location type definitions
- **Locations**: Map-placed instances of location templates

---

## 📁 Project Structure

```
CosmicForge-WebApp/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── entities/    # Entity management components
│   │   │   ├── maps/        # Map and location components
│   │   │   └── projects/    # Project management components
│   │   ├── pages/           # Main application pages
│   │   └── App.js           # Application root
│   └── public/              # Static assets
├── backend/                 # Node.js API server
│   ├── server.js           # Express server setup
│   ├── database.sqlite     # SQLite database file
│   └── uploads/            # User-uploaded files
└── docker-compose.*.yml    # Container orchestration
```

---

## 🎨 Features in Detail

### Dynamic Form Generation
The system automatically generates forms based on template schemas

### Computed Fields
Create fields that automatically calculate values using formulas:
- Reference other fields in the same entity
- Perform mathematical operations
- Support for complex expressions

### Interactive Map System
- **Responsive design**: Maps adapt to different screen sizes
- **Zoom and pan**: Navigate large maps easily
- **Icon customization**: Upload custom icons for location templates
- **Coordinate precision**: Accurate placement and positioning

