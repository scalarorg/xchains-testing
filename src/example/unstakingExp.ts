import { performUnstaking } from "@/scheduled-tasks/unstaking";
import prisma from "@/utils/prisma";

// Initialize Prisma
prisma
  .$connect()
  .then(() => console.log("Connected to the database"))
  .catch((error: any) =>
    console.error("Failed to connect to the database:", error)
  );

performUnstaking();
