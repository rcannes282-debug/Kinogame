# Replit.md

## Overview

This is a trivia game application called "KinoGame" focused on movie knowledge. It's a full-stack web application built with React frontend and Express.js backend, featuring multiple game modes including timed challenges, top 250 movies quizzes, infinite mode, and multiplayer capabilities. The application includes user authentication via Replit Auth, a coin-based economy system, leaderboards, and a shop for purchasing in-game items.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom game-themed color variables
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with structured route handlers

### Database Schema
- **Users**: Stores user profiles, coins, scores, and game statistics
- **Questions**: Movie trivia questions with categories and difficulty levels
- **Game Sessions**: Individual game records with scores and metadata
- **Multiplayer Rooms**: Real-time multiplayer game rooms and participants
- **User Inventory**: In-game items and power-ups owned by users
- **Sessions**: Authentication session storage (required for Replit Auth)

### Game Features
- **Multiple Game Modes**: Timed challenges, Top 250 movies, infinite mode, multiplayer
- **Question Categories**: General knowledge, top 250 films, various movie genres
- **Power-up System**: 50/50 elimination, extra time, and skip question items
- **Economy System**: Coin-based rewards and in-game purchases
- **Leaderboards**: User rankings based on scores and achievements

### File Structure
- `/client`: React frontend application
- `/server`: Express.js backend with API routes
- `/shared`: Common TypeScript schemas and types
- `/components.json`: shadcn/ui configuration

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database via `@neondatabase/serverless`
- **Connection Pooling**: Built-in connection management for serverless environments

### Authentication
- **Replit Auth**: OAuth2/OpenID Connect integration for user authentication
- **Session Storage**: PostgreSQL-backed session store using `connect-pg-simple`

### UI Components
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **shadcn/ui**: Pre-built component system with Tailwind CSS styling
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Fast development server and build tool
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundler for production builds

### Third-party Services
- **Replit Environment**: Hosted on Replit platform with environment variable configuration
- **Font Integration**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter)