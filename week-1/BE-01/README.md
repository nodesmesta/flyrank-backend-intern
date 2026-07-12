# BE-01 — Smallest Possible Backend

> FlyRank Internship — Backend Engineering Track | Week 1

A minimal HTTP server built with **Node.js + TypeScript** — two JSON endpoints, zero frameworks, ~25 lines.

## 🎯 Goal

- Understand the **request → response loop** from the server side
- Build a server that responds with **JSON**
- Test endpoints with **curl** and a **browser**
- Ready for **GitHub** as portfolio

## 🚀 Running the Server

```bash
# Install dependencies
npm install

# Start with watch mode (auto-restart on changes)
npm run dev

# Or one-shot
npm start
```

Server runs at **http://localhost:3000**

## 📡 Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Hello World — sanity check |
| `GET` | `/api/status` | Server status (uptime, timestamp) |

### Example Response

**`GET /`**
```json
{
  "message": "Hello, World!"
}
```

**`GET /api/status`**
```json
{
  "status": "ok",
  "uptime": "2.35s",
  "timestamp": "2026-07-12T03:01:07.868Z"
}
```

## 🧪 Test with curl

```bash
curl http://localhost:3000/
curl http://localhost:3000/api/status
```

## 🛠 Tech Stack

| Tool | Version |
|------|---------|
| Node.js | v22.22.3 |
| TypeScript | ^7.0.2 |
| tsx | ^4.23.0 |

No framework — just the built-in **`node:http`** module.

## 📂 Project Structure

```
BE-01/
├── server.ts       # Entry point — HTTP server
├── package.json    # Dependencies & scripts
├── tsconfig.json   # TypeScript configuration
└── README.md       # This documentation
