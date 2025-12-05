const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

const ROOT = "/sandbox";

// Ensure sandbox exists
if (!fs.existsSync(ROOT)) {
  fs.mkdirSync(ROOT, { recursive: true });
}

/**
 * Create/update a file in /sandbox
 */
app.post("/files", (req, res) => {
  const { filePath, content } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "filePath is required" });
  }

  const absPath = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content ?? "", "utf8");

  res.json({ ok: true, filePath });
});

/**
 * Optional: run shell commands in /sandbox
 */
app.post("/exec", (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: "command is required" });
  }

  exec(command, { cwd: ROOT }, (err, stdout, stderr) => {
    res.json({
      stdout: stdout?.toString(),
      stderr: stderr?.toString(),
      error: err?.message || null,
    });
  });
});

/**
 * Start Next.js dev server in /sandbox on port 3001
 */
app.post("/run", (req, res) => {
  const cmd = 'sh -lc "npm install && PORT=3001 next dev"';

  const child = exec(cmd, { cwd: ROOT });

  child.stdout.on("data", (data) => {
    console.log("[RUN-STDOUT]", data.toString());
  });

  child.stderr.on("data", (data) => {
    console.error("[RUN-STDERR]", data.toString());
  });

  child.on("exit", (code) => {
    console.log("[RUN-EXIT]", code);
  });

  // Don't wait for Next.js to stop; it runs forever in dev mode
  res.json({
    ok: true,
    message: "Next.js dev server is starting on port 3001",
  });
});

app.listen(3000, () => {
  console.log("Sandbox agent listening on port 3000");
});
