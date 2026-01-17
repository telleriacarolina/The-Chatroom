# Performance Optimization Guide

This document outlines performance optimizations implemented in The Chatroom and recommendations for further improvements.

## Implemented Optimizations

### 1. Singleton Prisma Client Pattern

**Issue**: Multiple `new PrismaClient()` instances were being created across different modules, leading to connection pool exhaustion and memory overhead.

**Solution**: Implemented a singleton pattern in `packages/api/src/lib/prisma.ts`:
- Single shared Prisma Client instance across the application
- Global caching in development to prevent hot-reload issues
- Proper connection pooling and resource management

**Files Updated**:
- `packages/api/src/routes/chatroom.js` - Now imports from singleton
- `packages/api/src/services/socketio.js` - Now imports from singleton

### 2. Async Bcrypt Operations

**Issue**: Synchronous bcrypt operations (`hashSync`, `compareSync`) were blocking the Node.js event loop during password hashing, causing request delays.

**Solution**: Converted all bcrypt operations to async:
- `bcrypt.hashSync()` → `await bcrypt.hash()` (signup, password change)
- `bcrypt.compareSync()` → `await bcrypt.compare()` (signin, password verification)

**Performance Impact**: 
- Eliminates event loop blocking during expensive crypto operations
- Allows handling of concurrent requests during password hashing
- Improves overall API responsiveness under load

**Files Updated**:
- `packages/api/src/routes/auth.js` (lines 35, 60, 107, 109)

### 3. Optimized Database Queries

**Issue**: Heartbeat service was performing two separate queries (updateMany + findUnique) for a single operation.

**Solution**: Consolidated into single `update()` query with `select` clause:
```javascript
// Before: 2 queries
const update = await prisma.user.updateMany({...});
const user = await prisma.user.findUnique({...});

// After: 1 query
const user = await prisma.user.update({
  where: { id: userId },
  data: {...},
  select: { id: true, isOnline: true, lastSeenAt: true }
});
```

**Files Updated**:
- `packages/api/src/services/heartbeat.js`

### 4. Background Job Management

**Issue**: Background job intervals were not properly managed, preventing graceful shutdown and resource cleanup.

**Solution**: 
- Store interval references in an array
- Call `unref()` on intervals to allow process exit
- Implement `stopBackgroundJobs()` function for cleanup
- Enable graceful shutdown handling

**Files Updated**:
- `packages/api/src/services/backgroundJobs.js`

### 5. Resolved Merge Conflicts

**Issue**: Unresolved merge conflicts in server configuration could cause startup failures.

**Solution**: Resolved conflicts in `packages/api/src/server.js` to include both route configurations.

## Recommended Database Indexes

To optimize query performance, add the following indexes to your Prisma schema:

```prisma
model User {
  // Existing fields...
  
  @@index([phoneNumber]) // Fast lookup for authentication
  @@index([isOnline, lastSeenAt]) // For background job queries
  @@index([lastSeenAt]) // For transitioning offline users
}

model Session {
  // Existing fields...
  
  @@index([sessionToken]) // Fast refresh token lookup
  @@index([userId, isActive]) // User session queries
  @@index([expiresAt]) // Cleanup expired sessions
}

model TempSession {
  // Existing fields...
  
  @@index([sessionToken]) // Guest session lookup
  @@index([expiresAt]) // Cleanup expired sessions
}

model ChatMessage {
  // Existing fields...
  
  @@index([languageRoomId, createdAt]) // Message history pagination
  @@index([languageRoomId, isDeleted, moderationStatus]) // Filtered message queries
  @@index([userId, createdAt]) // User message history
}

model Lounge {
  // Existing fields...
  
  @@index([isActive]) // Active lounge filtering
}

model LanguageRoom {
  // Existing fields...
  
  @@index([loungeId, isActive]) // Room listing per lounge
}
```

## Additional Recommendations

### 1. Query Result Caching

Consider implementing Redis caching for:
- Lounge and language room listings (rarely change)
- User presence status (can be slightly stale)
- Chat message pagination (with cache invalidation on new messages)

### 2. Connection Pooling

Configure Prisma connection pool size based on your deployment:

```env
# In .env file
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

Recommended pool sizes:
- Development: 5-10 connections
- Production (single instance): 20-30 connections
- Production (multi-instance): Calculate as `total_db_connections / instance_count`

### 3. Message Pagination Optimization

Current implementation uses cursor-based pagination which is efficient. Consider:
- Limiting maximum page size (currently 50, which is good)
- Adding client-side caching of messages
- Implementing virtual scrolling for long message lists

### 4. Socket.IO Optimizations

Consider these Socket.IO performance improvements:
- Enable binary support for efficient data transfer
- Implement room-based broadcasting (already done)
- Add Redis adapter for horizontal scaling
- Implement message compression for large payloads

### 5. Monitoring and Profiling

Set up monitoring for:
- Database query performance (Prisma metrics)
- API endpoint response times
- Socket.IO connection counts and message rates
- Memory usage and event loop lag

Tools to consider:
- Prisma Studio for database inspection
- Clinic.js for Node.js profiling
- PM2 for process management and monitoring
- New Relic or DataDog for APM

## Performance Testing

Before deploying optimizations to production:

1. **Load Testing**: Use tools like `artillery`, `k6`, or `autocannon` to simulate concurrent users
2. **Database Query Analysis**: Use Prisma's query logging to identify slow queries
3. **Memory Profiling**: Use Node.js heap snapshots to detect memory leaks
4. **Response Time Monitoring**: Track P50, P95, P99 latencies

## Conclusion

The implemented optimizations address critical performance bottlenecks:
- ✅ Eliminated multiple Prisma Client instances
- ✅ Removed event loop blocking from bcrypt operations
- ✅ Optimized database query patterns
- ✅ Improved background job management
- ✅ Resolved code conflicts

These changes should significantly improve:
- Request throughput
- Response times under load
- Database connection efficiency
- Server resource utilization
- Application stability

For production deployments, strongly consider implementing the recommended database indexes and monitoring solutions.
