# API Endpoints Documentation

This file documents all API endpoints for The Chatroom project.

## Authentication
- POST /auth/signup — Register a new user
- POST /auth/login — Login and receive JWT

## Lounges
- GET /lounges — List all lounges (auth required)
- POST /lounges — Create a new lounge (auth required)

## Real-Time Messaging
- Socket.io events: join-lounge, message

See ARCHITECTURE.md for architecture details and README.md for setup instructions.
