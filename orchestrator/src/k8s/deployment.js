const { NAMESPACE, SANDBOX_IMAGE, SANDBOX_LABEL_KEY } = require("../config");
const { appsV1 } = require("./client");

// Read AWS creds from orchestrator environment
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const SANDBOX_S3_BUCKET = process.env.SANDBOX_S3_BUCKET;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !SANDBOX_S3_BUCKET) {
  console.error("Missing AWS credentials or S3 bucket environment variables!");
}

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
          // ---------------------------------------------------------
          // 1. INIT CONTAINER — loads code from S3 into /workspace
          // ---------------------------------------------------------
          initContainers: [
            {
              name: "s3-bootstrap",
              image: "amazon/aws-cli:2.13.11",
              command: ["sh", "-c"],
              args: [
                `
                echo "Syncing S3 workspace for sandbox ${id}...";
                aws s3 sync s3://${SANDBOX_S3_BUCKET}/sandboxes/sandbox-${id}/workspace/ /workspace/ --exact-timestamps
                echo "S3 sync completed.";
                `
              ],
              env: [
                { name: "AWS_ACCESS_KEY_ID", value: AWS_ACCESS_KEY_ID },
                { name: "AWS_SECRET_ACCESS_KEY", value: AWS_SECRET_ACCESS_KEY },
                { name: "AWS_REGION", value: AWS_REGION },
                { name: "SANDBOX_S3_BUCKET", value: SANDBOX_S3_BUCKET }
              ],
              volumeMounts: [
                {
                  name: "workspace",
                  mountPath: "/workspace"
                }
              ]
            }
          ],

          // ---------------------------------------------------------
          // 2. MAIN RUNTIME CONTAINER — pure Vite dev environment
          // ---------------------------------------------------------
          containers: [
            {
              name: "sandbox",
              image: SANDBOX_IMAGE,
              imagePullPolicy: "IfNotPresent",
              workingDir: "/workspace",

              command: ["sh", "-c"],
              args: ["tail -f /dev/null"],

              ports: [{ containerPort: 3000, name: "http" }],
              stdin: true,
              tty: true,

              volumeMounts: [
                {
                  name: "workspace",
                  mountPath: "/workspace"
                }
              ]
            }
          ],

          // ---------------------------------------------------------
          // 3. Shared volume between initContainer & runtime container
          // ---------------------------------------------------------
          volumes: [
            {
              name: "workspace",
              emptyDir: {} // ephemeral, but restored from S3 on each start
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
  console.log("✓ Deployment manifest generated");

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
