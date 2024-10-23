import { performStaking } from "@/scheduled-tasks/staking";
import prisma from "@/utils/prisma";

// Initialize Prisma
prisma
  .$connect()
  .then(() => console.log("Connected to the database"))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .catch((error: any) =>
    console.error("Failed to connect to the database:", error)
  );

performStaking();
