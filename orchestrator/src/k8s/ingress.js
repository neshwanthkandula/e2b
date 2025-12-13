const { kc } = require("./client");
const k8s = require("@kubernetes/client-node");
const { NAMESPACE } = require("../config");

const networkingV1 = kc.makeApiClient(k8s.NetworkingV1Api);

function buildIngress(name, sandboxId, serviceName) {
  return {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name
    },
    spec: {
      ingressClassName: "nginx",
      rules: [
        {
          host: "sandbox.local.gymmanagement.me",
          http: {
            paths: [
              {
                // ✅ NO REGEX — required for modern ingress
                path: `/sandbox/${sandboxId}/`,
                pathType: "Prefix",
                backend: {
                  service: {
                    name: serviceName,
                    port: { number: 3000 }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  };
}

async function createSandboxIngress(sandboxId, serviceName) {
  const name = `ingress-sandbox-${sandboxId}`;
  console.log(">>> Creating Ingress...");
  const manifest = buildIngress(name, sandboxId, serviceName);
  console.log("✓ Ingress created");
  
  return networkingV1.createNamespacedIngress({
    namespace: NAMESPACE,
    body: manifest
  });
}

async function deleteSandboxIngress(sandboxId) {
  const name = `ingress-sandbox-${sandboxId}`;

  return networkingV1.deleteNamespacedIngress({
    name,
    namespace: NAMESPACE
  });
}

module.exports = {
  createSandboxIngress,
  deleteSandboxIngress
};
