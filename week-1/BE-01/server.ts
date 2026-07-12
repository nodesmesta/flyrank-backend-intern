import http from "node:http";

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200);
    res.end(JSON.stringify({ message: "Hello, World!" }));
  } else if (req.method === "GET" && url.pathname === "/api/status") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: "ok",
        uptime: `${process.uptime().toFixed(2)}s`,
        timestamp: new Date().toISOString(),
      })
    );
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
