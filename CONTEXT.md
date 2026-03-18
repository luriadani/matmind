# MatMind Development Context

## Development Guidelines

**IMPORTANT: When programming, keep responses concise and focused. Avoid showing excessive implementation details unless specifically requested. Focus on high-level solutions and key implementation points.**

## Project Overview

**MatMind** is a Brazilian Jiu-Jitsu training companion app built with React Native and Expo. It helps practitioners organize techniques, schedule training sessions, and track their progress.

## Current Features

### Core Functionality
- **Technique Library**: Store and organize BJJ techniques with video links
- **Training Schedule**: Manage weekly training sessions with instructors
- **Smart Notifications**: Get reminded of techniques before training
- **Multi-language Support**: Hebrew and English localization
- **Subscription System**: Free tier (7 techniques) and paid tiers (unlimited)

### Main Screens
- **Library (Dashboard)**: View upcoming techniques and training schedule
- **Add**: Create new techniques and training sessions
- **Schedule**: Manage training calendar
- **Settings**: User preferences and subscription management
- **Admin**: User and gym management (admin only)

### Data Management
- **Techniques**: Video links, categories, notes, training associations
- **Trainings**: Weekly schedule with instructors and locations
- **Users**: Profile management with belt levels and preferences
- **Gyms**: Multi-gym support with sharing capabilities

## Technology Stack

### Frontend
- **React Native** (0.79.5) with **Expo** (53.0.20)
- **Expo Router** for navigation
- **TypeScript** for type safety
- **React Navigation** for tab navigation

### State Management
- **React Context** for global state
- **AsyncStorage** for local persistence
- Custom entity classes for data management

### UI/UX
- **Expo Vector Icons** for iconography
- **React Native Reanimated** for animations
- **Expo Haptics** for tactile feedback
- **Expo Notifications** for push notifications

### Development Tools
- **ESLint** for code quality
- **TypeScript** for type checking
- **Expo Dev Client** for development builds

## Data Models

### Technique
- Title, video URL, thumbnail
- Source platform (Instagram, Facebook, YouTube)
- Categories (Try Next Class, Show Coach, Favorite)
- Training associations
- Notes and tags

### Training
- Day of week and time
- Instructor and location
- Category (gi, no-gi)
- User associations

### User
- Profile information and belt level
- Notification preferences
- Subscription status
- Custom categories and settings

## Key Components

- **SubscriptionGuard**: Manages feature access based on subscription level
- **NotificationScheduler**: Handles training reminders
- **TechniqueImporter**: Bulk import techniques
- **ShareHandler**: Social sharing functionality
- **BeltManager**: Belt progression tracking

## Development Notes

- Uses file-based routing with Expo Router
- Implements subscription-based feature gating
- Supports both individual and gym-based usage
- Local data persistence with AsyncStorage
- Cross-platform (iOS, Android, Web)

## Next Development Priorities

1. **Backend Integration**: Replace local storage with API
2. **Enhanced Sharing**: Improve gym sharing and collaboration
3. **Analytics**: Track technique usage and progress
4. **Offline Support**: Better offline functionality
5. **Performance**: Optimize video loading and caching

