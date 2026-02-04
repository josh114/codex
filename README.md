# Realtime Messaging Service (NestJS)

This service provides a Socket.IO-based realtime messaging API built with NestJS. It supports:

- Direct user-to-user messages.
- Group messages (room-based).
- Horizontal scaling across multiple pods using the Redis adapter, ensuring messages are broadcast across all instances.

## Requirements

- Node.js 18+
- Redis (for Socket.IO adapter and user socket registry)

## Setup

```bash
npm install
```

## Run locally

```bash
REDIS_URL=redis://localhost:6379 npm run start:dev
```

The server listens on `PORT` (defaults to `3000`).

## Socket.IO events

### Authentication

Clients must send a `userId` during the Socket.IO handshake:

```ts
const socket = io("http://localhost:3000", {
  auth: { userId: "user-123" }
});
```

### Direct message

Emit:

```ts
socket.emit("direct_message", { toUserId: "user-456", content: "Hello" });
```

Receive:

```ts
socket.on("direct_message", (payload) => {
  console.log(payload.fromUserId, payload.content);
});
```

### Join group

Emit:

```ts
socket.emit("join_group", { groupId: "team-1" });
```

### Group message

Emit:

```ts
socket.emit("group_message", { groupId: "team-1", content: "Hi team" });
```

Receive:

```ts
socket.on("group_message", (payload) => {
  console.log(payload.groupId, payload.content);
});
```

## Scaling on Kubernetes

This service uses the Socket.IO Redis adapter. When you run multiple pods, Redis keeps the Socket.IO rooms and broadcasts in sync, so messages are delivered across all instances instead of being dropped on a single pod.

Make sure every pod uses the same `REDIS_URL` and that Redis is reachable from the cluster.
