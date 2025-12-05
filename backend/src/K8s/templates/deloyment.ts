export function createDeploymentTemplate(envId: string) {
  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: `sandbox-${envId}`,
      labels: {
        sandbox: envId,
      },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          sandbox: envId,
        },
      },
      template: {
        metadata: {
          labels: {
            sandbox: envId,
          },
        },
        spec: {
          containers: [
            {
              name: "sandbox-runtime",
              image: "sandbox-runtime:latest", // local image
              imagePullPolicy: "Never",       // don't pull from registry
              ports: [
                { containerPort: 3000 }        // agent server
              ],
            },
          ],
        },
      },
    },
  };
}
