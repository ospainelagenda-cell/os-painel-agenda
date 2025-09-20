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
