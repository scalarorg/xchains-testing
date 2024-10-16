import { createServer } from "http";
import { parse } from "url";
import next from "next";
import prisma from "./utils/prisma";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Prisma
prisma
  .$connect()
  .then(() => console.log("Connected to the database"))
  .catch((error: any) =>
    console.error("Failed to connect to the database:", error)
  );

app.prepare().then(() => {
  createServer(async (req: any, res: any) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err: any) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      // Disconnect Prisma when the server is closed
      process.on("SIGTERM", () => {
        console.log("SIGTERM signal received: closing HTTP server");
        prisma.$disconnect();
      });
    });
});
