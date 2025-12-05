import express from "express";
import { router as healthRouter } from "./routes/health";
import { router as envRouter}  from "./routes/env"

const app = express();
app.use(express.json());

// Health route
app.use("/health", healthRouter);
app.use("/env", envRouter);

const port = 3000;
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
