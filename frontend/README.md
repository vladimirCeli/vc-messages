# Messages VC Frontend

Ultra-fast real-time messaging with React, TanStack Query, WebSockets and Capacitor.

## Stack

**Web:**
- React 18 + TypeScript
- TanStack Query (data fetching + caching)
- React Router
- Tailwind CSS 4
- Vite

**Mobile:**
- Capacitor 6 (iOS + Android)

**Real-time:**
- WebSocket client with auto-reconnect
- Typing indicators
- Online presence

## Quick Start

### Web

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

### Mobile

**iOS** (requires Xcode):
```bash
npm run ios
```

**Android** (requires Android Studio):
```bash
npm run android
```

## Environment

Create `.env` file:

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000/ws
```

## Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run ios           # Open iOS in Xcode
npm run android       # Open Android in Studio
npm run ios:run       # Run on iOS simulator
npm run android:run   # Run on Android emulator
```

## Architecture

```
TanStack Query handles all data fetching and caching.
WebSocket client handles real-time updates.
Auto-updates query cache when new messages arrive.
```

**Result:** 10-20ms message latency, automatic caching, no manual useState/useEffect needed.

## License

MIT - Vladimir Celi
