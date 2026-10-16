# Messages VC - Real-time Messaging Platform

A self-hosted, real-time messaging application with web and mobile support.

## Features

✅ **Real-time messaging** - WebSocket-powered instant communication
✅ **Media sharing** - Send photos and videos
✅ **Multi-platform** - Web, iOS, and Android apps
✅ **Self-hosted** - No third-party services required
✅ **End-to-end** - Complete backend + frontend solution

## Tech Stack

### Backend
- **Fastify** - High-performance Node.js web framework
- **PostgreSQL** - Reliable SQL database
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - Secure authentication
- **Drizzle ORM** - Type-safe database queries

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time updates

### Mobile
- **Capacitor 6** - Cross-platform mobile framework
- **iOS** - Native iOS app
- **Android** - Native Android app

## Project Structure

```
messages-vc/
├── backend/          # API server + WebSocket
├── frontend/         # React web app + mobile
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- Xcode (for iOS development)
- Android Studio (for Android development)

### Backend Setup

```bash
cd backend
npm install
npm run db:push     # Setup database
npm run dev         # Start server on http://localhost:3000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev         # Start web app on http://localhost:5173
```

### Mobile Setup

```bash
cd frontend
npm run build
npx cap sync        # Sync to iOS and Android
npx cap open ios    # Open in Xcode
npx cap open android # Open in Android Studio
```

## Features Roadmap

- [x] User authentication
- [x] Real-time messaging
- [x] Chat rooms/conversations
- [x] Media upload (photos/videos)
- [x] Read receipts
- [x] Typing indicators
- [x] Message history
- [ ] Group chats
- [ ] Push notifications
- [ ] Voice messages
- [ ] Video calls

## License

MIT - Build whatever you want!

## Author

Vladimir Celi (@vladimirCeli)
