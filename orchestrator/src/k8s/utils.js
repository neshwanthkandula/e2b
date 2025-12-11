const https = require("https");
const fs = require("fs");
const fetch = require("node-fetch");
const { kc } = require("./client");
const { NAMESPACE, SANDBOX_LABEL_KEY } = require("../config");

// FIXED: Correct Kubernetes fetch auth (works in-cluster + local)
function buildK8sFetchOptions() {
  const cluster = kc.getCurrentCluster();

  //
  // INSIDE THE CLUSTER: use ServiceAccount token + CA cert
  //
  if (process.env.KUBERNETES_SERVICE_HOST) {
    const token = fs.readFileSync(
      "/var/run/secrets/kubernetes.io/serviceaccount/token",
      "utf8"
    );

    const ca = fs.readFileSync(
      "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
    );

    const agent = new https.Agent({
      rejectUnauthorized: true,
      ca
    });

    return {
      agent,
      headers: {
        Authorization: `Bearer ${token}`
      },
      cluster
    };
  }

  //
  // LOCAL DEVELOPMENT MODE: use ~/.kube/config (cert/key/admin)
  //
  const user = kc.getCurrentUser();

  const agent = new https.Agent({
    rejectUnauthorized: false,
    ca: user.caData ? Buffer.from(user.caData, "base64") : undefined,
    cert: user.certData ? Buffer.from(user.certData, "base64") : undefined,
    key: user.keyData ? Buffer.from(user.keyData, "base64") : undefined
  });

  const headers = {};
  if (user.token) {
    headers["Authorization"] = `Bearer ${user.token}`;
  }

  return { agent, headers, cluster };
}

// GET helper
async function k8sGet(path) {
  const { agent, headers, cluster } = buildK8sFetchOptions();
  const url = `${cluster.server}${path}`;

  const res = await fetch(url, { agent, headers, method: "GET" });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Resolve pod by label selector
async function getPodBySandboxId(id) {
  console.log(">>> Resolving Pod...");
  const namespace = NAMESPACE || "default";
  const labelSelector = `${SANDBOX_LABEL_KEY}=${id}`;

  const path =
    `/api/v1/namespaces/${namespace}/pods?labelSelector=` +
    encodeURIComponent(labelSelector);

  console.log(">>> K8s GET:", path);

  const res = await k8sGet(path);

  const items = res.items || [];

  console.log("PODS FOUND:", items.map((i) => i.metadata.name));

  if (items.length === 0) {
    throw new Error(`No pod found for sandbox ${id}`);
  }

  const podName = items[0].metadata.name;
  console.log("✓ Pod resolved:", podName);

  return podName;
}

module.exports = { getPodBySandboxId };
