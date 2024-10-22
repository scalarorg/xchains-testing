/* eslint-disable @typescript-eslint/no-var-requires */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import prisma from "./utils/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
let port = process.env.PORT ? parseInt(process.env.PORT) : 3002;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Prisma
prisma
  .$connect()
  .then(() => console.log("Connected to the database"))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .catch((error: any) =>
    console.error("Failed to connect to the database:", error)
  );

app.prepare().then(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const server = createServer(async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const startServer = () => {
    server
      .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        // Disconnect Prisma when the server is closed
        process.on("SIGTERM", () => {
          console.log("SIGTERM signal received: closing HTTP server");
          prisma.$disconnect();
        });
      })
      .on("error", (e: NodeJS.ErrnoException) => {
        if (e.code === "EADDRINUSE") {
          console.log(`Port ${port} is in use, trying ${port + 1}`);
          port++;
          startServer();
        } else {
          console.error(e);
          process.exit(1);
        }
      });
  };

  startServer();
});
