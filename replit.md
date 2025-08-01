# Overview

This is a scalable web application inspired by Ali Abdaal's LifeOS framework, designed to help aspiring entrepreneurs and productivity-focused users transform their vision into actionable tasks. The app provides a comprehensive productivity system that includes vision planning, quarterly goal tracking, weekly planning, daily task management, and integrated Pomodoro timer functionality.

The application follows a full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database, designed to work seamlessly across desktop, tablet, and mobile devices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming, following a mobile-first responsive approach
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Server**: Express.js with TypeScript for API endpoints and middleware
- **Database ORM**: Drizzle ORM with Neon serverless PostgreSQL for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Structure**: RESTful endpoints with consistent error handling and request/response patterns

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with schema definitions in TypeScript
- **Key Tables**: 
  - Users and sessions for authentication
  - Vision plans for long-term goal setting
  - Quarterly quests for 90-day goal tracking
  - Weekly plans and daily tasks for short-term execution
  - Pomodoro sessions and reflections for productivity tracking

## Component Structure
The application is organized into feature-based modules:
- **Vision Planning**: Core values, 3-year vision, and motivation tracking
- **Quarterly Tracking**: GPS-based goal setting (Goal, Plan, Systems)
- **Weekly Planning**: Priority setting and progress tracking
- **Daily Management**: Task management with impact levels and completion tracking
- **Timer Integration**: Pomodoro timer with task association and productivity metrics
- **Reflection System**: Daily reflection and tomorrow planning

## Development Workflow
- **Build System**: Vite for frontend development with hot module replacement
- **Backend Build**: esbuild for server-side compilation and bundling
- **Database Operations**: Drizzle Kit for schema migrations and database management
- **Development Mode**: Concurrent frontend and backend development with proxy setup

# External Dependencies

## Core Technologies
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time features
- **Replit Platform**: Development environment with built-in authentication and deployment
- **Radix UI**: Headless UI components for accessibility and customization
- **TanStack Query**: Server state management with intelligent caching and synchronization

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe CSS class composition

## Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performant form handling with validation integration
- **Wouter**: Lightweight routing solution for single-page application navigation

## Authentication and Session Management
- **OpenID Client**: OAuth integration for secure authentication flows
- **Passport.js**: Authentication middleware for Express.js
- **Connect PG Simple**: PostgreSQL session store for persistent user sessions

The application is designed to be deployment-ready on Vercel with PostgreSQL database connectivity and includes offline-capable PWA features for cross-device synchronization.