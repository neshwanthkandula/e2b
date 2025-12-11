const { NAMESPACE, SANDBOX_IMAGE, SANDBOX_LABEL_KEY } = require("../config");
const { appsV1 } = require("./client");

function buildDeployment(name, id) {
  const labels = { app: "sandbox", [SANDBOX_LABEL_KEY]: id };

  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: { name, labels },
    spec: {
      replicas: 1,
      selector: { matchLabels: labels },
      template: {
        metadata: { labels },
        spec: {
          containers: [
            {
              name: "sandbox",
              image: SANDBOX_IMAGE,
              imagePullPolicy: "IfNotPresent",
              workingDir: "/workspace",
              ports: [{ containerPort: 3000, name: "http" }],

              stdin: true,
              tty: true
            }
          ]
        }
      }
    }
  };
}

async function createDeployment(name, id) {
   console.log(">>> Creating Deployment...");
  const manifest = buildDeployment(name, id);
  console.log("✓ Deployment created");

  return appsV1.createNamespacedDeployment({
    namespace: NAMESPACE,
    body: manifest
  });
}

async function deleteDeployment(name) {

  return appsV1.deleteNamespacedDeployment({
    name,
    namespace: NAMESPACE
  });
}

module.exports = { createDeployment, deleteDeployment };
