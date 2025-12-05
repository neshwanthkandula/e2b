const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

const ROOT = "/sandbox";

// Ensure sandbox folder exists
if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });

//update files

app.post("/files", (req, res) => {
  const { filePath, content } = req.body;

  if (!filePath) return res.status(400).json({ error: "filePath required" });

  const absPath = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content);

  res.json({ ok: true, filePath });
});

// Execute terminal commands



app.post("/exec", (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "command required" });

  exec(command, { cwd: ROOT }, (err, stdout, stderr) => {
    res.json({
      stdout: stdout?.toString(),
      stderr: stderr?.toString(),
      error: err?.message || null
    });
  });
});


// Start Next.js dev server or run project



app.post("/run", (req, res) => {
  exec("npm install && npm run dev", { cwd: ROOT }, (err, stdout, stderr) => {
    res.json({
      stdout,
      stderr,
      error: err?.message || null
    });
  });
});

app.listen(3000, () => console.log("Sandbox agent is running on port 3000"));
