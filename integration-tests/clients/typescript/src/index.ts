import express from "express";
import stakingTransactionsRouter from "./routes/stakingTransactions";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", stakingTransactionsRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
