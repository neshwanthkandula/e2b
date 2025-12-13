const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { createDeployment, deleteDeployment } = require("../k8s/deployment");
const { createService, deleteService } = require("../k8s/service");
const { execInPod } = require("../k8s/exec");
const { writeFileToPod } = require("../k8s/files");
const { getPodBySandboxId } = require("../k8s/utils");
const { createSandboxIngress, deleteSandboxIngress } = require("../k8s/ingress");
const { copyS3Base, writeS3Code } = require("../k8s/aws");

router.post("/", async (req, res) => {
  try {
    const id = uuidv4().slice(0, 8);
    const name = `sandbox-${id}`;
    const viteConfig = `
      import { defineConfig } from "vite";
      import react from "@vitejs/plugin-react";

      export default defineConfig({
        base: "/sandbox/${id}/",
        plugins: [react()],
        server: {
          host: "0.0.0.0",
          port: 3000,
          allowedHosts: ["sandbox.local.gymmanagement.me"]
        }
      });
      `;

    console.log("\n=== CREATE SANDBOX REQUEST ===");
    console.log("Sandbox ID:", id);
    console.log("Resource Name:", name);

    await copyS3Base("base/react-template/", `sandboxes/${name}/workspace/`);
    await writeS3Code(name, "vite.config.ts", viteConfig);
    await createDeployment(name, id);
    await createService(name, id);
    await createSandboxIngress(id, name);

    const podName = await getPodBySandboxId(id);

    res.json({ sandboxId: id, pod: podName, publicUrl: `http://sandbox.local/sandbox/${id}/` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const name = `sandbox-${id}`;

  try {
    await deleteDeployment(name);
    await deleteService(name);
    await deleteSandboxIngress(id);

    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/exec", async (req, res) => {
  const { cmd } = req.body;

  if (!Array.isArray(cmd) || cmd.length === 0) {
    return res.status(400).json({ error: "cmd must be a non-empty array" });
  }

  try {
    const pod = await getPodBySandboxId(req.params.id);

    const result = await execInPod(pod, cmd);

    res.json({
      success: true,
      stdout: result.stdout,
      stderr: result.stderr,
      exitStatus: result.exitCode ?? result.status?.exitCode ?? 0,
      pod
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/files", async (req, res) => {
  const { path, content } = req.body;

  if (!path || typeof content !== 'string') {
    return res.status(400).json({ error: 'path and content required' });
  }

  try {
    await writeS3Code(`sandbox-${id}` , normalizedPath, content);
    const pod = await getPodBySandboxId(req.params.id);
    await writeFileToPod(pod, path, content);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/run", async (req, res) => {
  try {
    const pod = await getPodBySandboxId(req.params.id);

    // 1. Ensure we have a project (if no package.json uploaded yet)
    await execInPod(pod, [
      "sh",
      "-c",
      "if [ ! -f /workspace/package.json ]; then echo 'No project initialized'; exit 1; fi"
    ]);

    // 2. Install dependencies
    await execInPod(pod, [
      "sh",
      "-c",
      "cd /workspace && npm install"
    ]);

    // 3. Start dev server with PM2 (keeps it alive after exec closes)
    await execInPod(pod, [
      "sh",
      "-c",
      "cd /workspace && pm2 start npm --name dev -- run dev -- --host 0.0.0.0 --port 3000"
    ]);

    res.json({
      ok: true,
      message: "React dev server started",
      url: `/sandbox/${req.params.id}/`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/stop", async (req, res) => {
  try {
    const pod = await getPodBySandboxId(req.params.id);

    const result = await execInPod(pod, ["sh", "-c", "pm2 stop dev || true"]);

    res.json({ success: true, stdout: result.stdout, stderr: result.stderr });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/:id/status", async (req, res) => {
  try {
    const pod = await getPodBySandboxId(req.params.id);

    const result = await execInPod(pod, ["sh", "-c", "pm2 ls"]);

    res.json({
      success: true,
      stdout: result.stdout,
      stderr: result.stderr
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



module.exports = router;
