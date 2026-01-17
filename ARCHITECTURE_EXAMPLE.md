# Project Architecture Overview

## 1. Real-Time Infrastructure
- **Socket.io Server:** Dedicated server in `socket/socket-server.js` (port 3002) manages real-time chat interactions.
- **API Integration:** Backend in `api/` includes services for Socket.io initialization and background job management.

## 2. Modular Backend
- **Auth System:** Complete JWT-based authentication logic with routes for login and signup.
- **Lounge Management:** Specialized routes for managing chat "lounges."
- **Security & Rate Limiting:** Pre-configured middleware for rate limiting and security headers (Helmet).

## 3. Shared Resources
- `shared/` directory contains unified TypeScript types, schemas, and utility functions used by both frontend and backend for consistency.

## 4. Database & Schema
- Robust Prisma schema in `prisma/schema.prisma` defines models for Users, Sessions, Lounges, Chat Messages, Marketplace, Transactions, and Moderation logs.

---

## Example Directory Structure

```
├─ api/
│  ├─ index.ts
│  ├─ server.ts
│  ├─ socket.ts
│  ├─ jobs/
│  │  └─ worker.ts
│  ├─ routes/
│  │  ├─ auth.ts
│  │  └─ lounges.ts
│  ├─ middleware/
│  │  ├─ auth.ts
│  │  ├─ rateLimit.ts
│  │  └─ security.ts
│  └─ prisma.ts
│
├─ socket/
│  └─ socket-server.ts
│
├─ shared/
│  ├─ types.ts
│  ├─ schemas.ts
│  └─ utils.ts
│
├─ prisma/
│  └─ schema.prisma
│
├─ package.json
└─ tsconfig.json
```

---

## Key Implementation Snippets

### Real-Time Infrastructure

**socket/socket-server.ts**
```ts
import { Server } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join-lounge", (loungeId) => socket.join(loungeId));
  socket.on("message", ({ loungeId, message }) => io.to(loungeId).emit("message", message));
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

server.listen(3002, () => console.log("Socket.IO server running on port 3002"));
```

**api/socket.ts**
```ts
import { Server } from "socket.io";
let io: Server;
export const initSocket = (httpServer: any) => {
  io = new Server(httpServer, { cors: { origin: "*" } });
  return io;
};
export const getSocket = () => { if (!io) throw new Error("Socket not initialized"); return io; };
```

### Modular Backend

**api/server.ts**
```ts
import express from "express";
import http from "http";
import { initSocket } from "./socket";
import authRoutes from "./routes/auth";
import loungeRoutes from "./routes/lounges";
import security from "./middleware/security";
import rateLimit from "./middleware/rateLimit";

const app = express();
const server = http.createServer(app);
initSocket(server);
app.use(express.json());
app.use(security);
app.use(rateLimit);
app.use("/auth", authRoutes);
app.use("/lounges", loungeRoutes);
server.listen(3001, () => console.log("API server running on port 3001"));
```

**api/routes/auth.ts**
```ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../prisma";
const router = Router();
router.post("/signup", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.create({ data: { email: req.body.email, password: hash } });
  res.json(user);
});
router.post("/login", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
  res.json({ token });
});
export default router;
```

**api/routes/lounges.ts**
```ts
import { Router } from "express";
import prisma from "../prisma";
import auth from "../middleware/auth";
const router = Router();
router.get("/", auth, async (_, res) => { res.json(await prisma.lounge.findMany()); });
router.post("/", auth, async (req, res) => { res.json(await prisma.lounge.create({ data: { name: req.body.name } })); });
export default router;
```

**api/middleware/security.ts**
```ts
import helmet from "helmet";
export default helmet();
```

**api/middleware/rateLimit.ts**
```ts
import rateLimit from "express-rate-limit";
export default rateLimit({ windowMs: 60_000, max: 100 });
```

### Shared Resources

**shared/types.ts**
```ts
export interface User { id: string; email: string; }
export interface Lounge { id: string; name: string; }
```

**shared/schemas.ts**
```ts
import { z } from "zod";
export const messageSchema = z.object({ loungeId: z.string(), message: z.string() });
```

**shared/utils.ts**
```ts
export const now = () => new Date().toISOString();
```

### Database & Prisma Schema

**prisma/schema.prisma**
```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
model User { id String @id @default(uuid()); email String @unique; password String; sessions Session[]; messages ChatMessage[] }
model Session { id String @id @default(uuid()); user User @relation(fields: [userId], references: [id]); userId String }
model Lounge { id String @id @default(uuid()); name String; messages ChatMessage[] }
model ChatMessage { id String @id @default(uuid()); content String; user User @relation(fields: [userId], references: [id]); userId String; lounge Lounge @relation(fields: [loungeId], references: [id]); loungeId String; createdAt DateTime @default(now()) }
model Transaction { id String @id @default(uuid()); amount Float; createdAt DateTime @default(now()) }
model ModerationLog { id String @id @default(uuid()); action String; createdAt DateTime @default(now()) }
```
