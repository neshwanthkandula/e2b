const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

const { createDeployment, deleteDeployment } = require("../k8s/deployment");
const { createService, deleteService } = require("../k8s/service");
const { execInPod } = require("../k8s/exec");
const { writeFileToPod } = require("../k8s/files");
const { getPodBySandboxId } = require("../k8s/utils");

router.post("/", async (req, res) => {
  try {
    const id = uuidv4().slice(0, 8);
    const name = `sandbox-${id}`;

    await createDeployment(name, id);
    await createService(name, id);

    const podName = await getPodBySandboxId(id);

    res.json({ sandboxId: id, pod: podName, deployment: name, service: name });
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
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/exec", async (req, res) => {
  const { cmd } = req.body; // cmd: array of strings

  if (!Array.isArray(cmd) || cmd.length === 0) {
    return res.status(400).json({ error: 'cmd must be a non-empty array' });
  }

  try {
    const pod = await getPodBySandboxId(req.params.id);
    await execInPod(pod, req.body.cmd);
    res.json({ ok: true });
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

    await execInPod(pod, ["sh", "-c", "test -f package.json || create-vite . --template react"]);
    await execInPod(pod, ["sh", "-c", "npm install"]);
    await execInPod(pod, ["sh", "-c", "nohup npm run dev -- --host 0.0.0.0 --port 3000 &"]);

    res.json({ ok: true, message: "Dev server started" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
