import express from "express";
import { router as healthRouter } from "./routes/health";
import { kc, coreApi, appsApi } from "./K8s/client";

const app = express();
app.use(express.json());

// Health route
app.use("/health", healthRouter);

// Test route to check Kubernetes connectivity
app.get("/k8s-info", async (_req, res) => {
  try {
    const result = await coreApi.listNamespace();
    res.json({
      namespaces: result.items.map(n => n.metadata?.name),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
