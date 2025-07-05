# Port 3000 Migration - README

## Summary
Successfully migrated ZK-PRET DApp from port 3005 to port 3000 without breaking any functionality.

## Changes Made

### 1. Environment Configuration (.env)
- ✅ Changed `HTTP_PORT` from `3005` to `3000`
- ✅ Verified `ZK_PRET_WEB_APP_PORT` is set to `3000`
- ✅ Confirmed `CORS_ORIGIN` points to `http://localhost:3000`
- ✅ Ensured `OPERATION_MODE=HTTP` for current setup

### 2. New Batch Files Created
- ✅ `start-localhost-3000.bat` - Easy startup on port 3000
- ✅ `validate-port-3000.bat` - Configuration validation script

### 3. Updated Documentation
- ✅ Updated `start-http-async.bat` to reflect new port
- ✅ All configuration comments updated

## Verified Configurations

### Server Configuration
- **Operation Mode**: HTTP (with async jobs)
- **Port**: 3000 (changed from 3005)
- **Host**: localhost
- **Backend**: http://localhost:3001 (unchanged)
- **WebSocket**: ws://localhost:3000

### Features Preserved
- ✅ HTTP API calls
- ✅ Background job processing  
- ✅ WebSocket support
- ✅ Real-time updates
- ✅ All UI components
- ✅ CORS properly configured
- ✅ Rate limiting
- ✅ Security settings

## How to Start

### Option 1: Use New Batch File (Recommended)
```bash
start-localhost-3000.bat
```

### Option 2: Traditional NPM Commands
```bash
npm run build
npm run dev
```

### Option 3: Direct Environment Override
```bash
npm run dev:http-async
```

## Validation

### Run Configuration Check
```bash
validate-port-3000.bat
```

### Manual Verification
1. Open browser to: http://localhost:3000
2. Check API health: http://localhost:3000/api/v1/health
3. Check status: http://localhost:3000/api/v1/status
4. Check tools: http://localhost:3000/api/v1/tools

## Server Start Sequence

1. **Dependencies Check**: Verifies node_modules exists
2. **TypeScript Build**: Compiles src/ to dist/
3. **Server Start**: Launches on http://localhost:3000
4. **Mode Detection**: Confirms HTTP mode with async jobs
5. **Backend Connection**: Connects to ZK-PRET server at localhost:3001

## No Code Breaking Changes

### Preserved Functionality
- All API endpoints work unchanged
- All verification tools function normally
- WebSocket connections maintained
- Background job processing intact
- File picker APIs operational
- Risk verification systems working
- Blockchain state tracking preserved

### Unchanged Backend Dependencies
- ZK-PRET HTTP Server (localhost:3001)
- ACTUS Server (98.84.165.146:8083)
- All data paths and script mappings
- External service integrations

## Troubleshooting

### If Port 3000 is Already in Use
1. Stop any service using port 3000
2. Or temporarily change HTTP_PORT in .env to another port (e.g., 3004)

### If Server Won't Start
1. Run `validate-port-3000.bat` to check configuration
2. Ensure dependencies are installed: `npm install`
3. Check for TypeScript errors: `npm run build`

### If Backend Connection Fails
- Ensure ZK-PRET HTTP server is running on localhost:3001
- Check network connectivity
- Verify firewall settings

## Success Indicators

When everything is working correctly, you should see:
```
🎉 ZK-PRET Web App is ready!
🌐 Server running at: http://localhost:3000
🔗 WebSocket server: ws://localhost:3000
```

And the browser should load the ZK-PRET interface at http://localhost:3000 with all features working normally.
