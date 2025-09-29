# Readme.md

## Overview

This is a **Service Order Management Dashboard** - a full-stack web application designed to manage work orders (OS - Ordens de Serviço), technicians, teams, and reports for field service operations. The system provides real-time dashboard functionality to track service order status, manage team assignments, and generate formatted reports for daily operations. Built with React frontend, Express backend, and PostgreSQL database using modern TypeScript tooling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

* **Framework**: React 18 with TypeScript using Vite as the build tool
* **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS
* **State Management**: TanStack Query (React Query) for server state management
* **Routing**: Wouter for lightweight client-side routing
* **Styling**: Custom CSS with glass morphism effects and gradient backgrounds for modern UI

### Backend Architecture

* **Framework**: Express.js with TypeScript running on Node.js
* **API Design**: RESTful APIs with proper HTTP status codes and error handling
* **Data Storage**: In-memory storage with interface for future database integration
* **Development**: Hot module replacement with Vite integration for seamless development

### Database Design

* **ORM**: Drizzle ORM configured for PostgreSQL
* **Schema**: Four main entities:

  * **Technicians**: Store technician information with assigned cities/neighborhoods
  * **Teams**: Group technicians with box numbers for organization
  * **Service Orders**: Track work orders with codes, types, status, and alerts
  * **Reports**: Generate and store formatted daily reports

* **Migrations**: Drizzle Kit for schema management and database migrations

### Key Features Implementation

* **Dashboard Management**: Real-time overview of service orders, team status, and alerts
* **Service Order Tracking**: Search by code, status updates (Concluído, Reagendado, Pendente)
* **Team Management**: Assign technicians to teams, reallocate service orders between teams
* **Alert System**: Special instructions for service orders (e.g., "Ligar 15 minutos antes")
* **Report Generation**: Create formatted reports by date and shift with team assignments
* **Technician Management**: Add/edit technicians with city and neighborhood assignments

### Component Architecture

* **Modular Design**: Separate components for dashboard sections, modals, and UI elements
* **Reusable UI**: Consistent design system using Shadcn/ui component library
* **Modal System**: Dedicated modals for reports, technician management, and team operations
* **Form Handling**: React Hook Form with Zod validation for type-safe form management

## External Dependencies

### Core Framework Dependencies

* **@neondatabase/serverless**: PostgreSQL database connectivity for Neon cloud database
* **drizzle-orm**: Type-safe ORM for PostgreSQL database operations
* **@tanstack/react-query**: Server state management and caching
* **express**: Backend web framework for API endpoints

### UI and Styling Dependencies

* **@radix-ui/**\*: Primitive UI components for accessible design system
* **tailwindcss**: Utility-first CSS framework for styling
* **class-variance-authority**: Type-safe CSS class management
* **lucide-react**: Icon library for consistent iconography

### Development Dependencies

* **vite**: Frontend build tool with hot module replacement
* **tsx**: TypeScript execution for Node.js development
* **esbuild**: Fast bundling for production builds
* **wouter**: Lightweight routing for React applications

### Form and Validation

* **react-hook-form**: Form state management and validation
* **@hookform/resolvers**: Resolver integration for validation libraries
* **zod**: Runtime type checking and validation schema
* **drizzle-zod**: Integration between Drizzle ORM and Zod validation

### Database and Storage

* **connect-pg-simple**: PostgreSQL session store for Express
* **drizzle-kit**: Database migration and schema management tool

## Recent Changes

### September 29, 2025 - Replit Environment Setup (Fresh GitHub Import)
* Successfully imported fresh GitHub clone into Replit environment
* Installed all npm dependencies and configured Node.js environment
* Set up PostgreSQL database with Drizzle ORM schema migrations using `npm run db:push`
* Configured database connection with custom WebSocket SSL handling for Replit's internal database
* Switched storage implementation from MemStorage to DatabaseStorage for persistent data
* Seeded database with initial sample data (cities, neighborhoods, technicians, teams, service orders)
* Configured development workflow on port 5000 with Vite HMR integration
* Verified all API endpoints working correctly with database
* Configured deployment settings for production using autoscale target
* Application fully operational with:
  - 7 database tables: technicians, teams, service_orders, reports, cities, neighborhoods, service_types
  - Frontend serving on 0.0.0.0:5000 with proxy support
  - Backend API responding successfully to all endpoints
  - Sample data loaded with 6 technicians, 3 teams, 2 service orders, 21 neighborhoods, 2 cities, 7 service types

### September 20, 2025 - Initial Replit Environment Setup
* Successfully imported GitHub project into Replit environment
* Set up PostgreSQL database with Drizzle ORM schema migrations
* Configured Vite development server for Replit proxy compatibility (host: 0.0.0.0:5000)
* Fixed React infinite loop issue in SearchActions component useEffect dependency
* Established development workflow running on port 5000 with proper backend/frontend separation
* Configured deployment settings for production using autoscale target
* All 7 database tables created successfully: technicians, teams, service_orders, reports, cities, neighborhoods, service_types

## Development Setup

### Prerequisites
* Node.js environment (provided by Replit)
* PostgreSQL database (configured in Replit)

### Running the Application
1. Dependencies are automatically installed via `npm install`
2. Database schema is applied via `npm run db:push`
3. Start development server: `npm run dev` (configured as workflow)
4. Application runs on port 5000 with both frontend and API endpoints

### Production Deployment
* Build: `npm run build`
* Start: `npm start`
* Target: Autoscale deployment for stateless web application


# Service Order Management Dashboard

## Overview
A service order management dashboard built with React (frontend) and Express.js (backend) using Drizzle ORM with PostgreSQL. This system manages technicians, teams, service orders, and reports for field service operations.

## Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared schema and types
- Database: PostgreSQL with Drizzle ORM

## Technology Stack
- **Frontend**: React 18, Vite, TailwindCSS, Radix UI
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite for frontend, ESBuild for backend

## Environment Setup
The application is configured for Replit environment with:
- Development server on port 5000 (0.0.0.0)
- Production-ready deployment configuration
- Database migrations and seed data included

## Recent Changes
- September 20, 2025: Project imported and configured for Replit
- Database schema migrated and populated with sample data
- Development workflow configured and tested
- Deployment settings configured for autoscale

## Architecture
- **Database**: 7 main tables (technicians, teams, service_orders, reports, cities, neighborhoods, service_types)
- **API**: RESTful API with full CRUD operations
- **Frontend**: Component-based React application with modern UI components
- **Authentication**: Configured for passport-based authentication

## Development
- Run `npm run dev` to start development server
- Database automatically configured with environment variables
- HMR (Hot Module Replacement) enabled for development

## Deployment
- Configured for Replit autoscale deployment
- Build command: `npm run build`
- Start command: `npm start`