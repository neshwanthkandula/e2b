const { coreV1 } = require("./client");
const { NAMESPACE, SANDBOX_LABEL_KEY } = require("../config");

function buildService(name, id) {
  return {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name,
      labels: { app: "sandbox", [SANDBOX_LABEL_KEY]: id }
    },
    spec: {
      type: "ClusterIP",
      selector: { app: "sandbox", [SANDBOX_LABEL_KEY]: id },
      ports: [
        {
          name: "http",
          port: 3000,
          targetPort: 3000
        }
      ]
    }
  };
}

async function createService(name, id) {
  console.log(">>> Creating service...");
  const manifest = buildService(name, id);
  console.log("✓ service created");

  return coreV1.createNamespacedService({
    namespace: NAMESPACE,
    body: manifest
  });
}

async function deleteService(name) {
  return coreV1.deleteNamespacedService({
    name,
    namespace: NAMESPACE
  });
}

module.exports = { createService, deleteService };
