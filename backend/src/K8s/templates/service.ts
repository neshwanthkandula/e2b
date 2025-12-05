export function createServiceTemplate(envId: string) {
  return {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: `sandbox-svc-${envId}`,
      labels: {
        sandbox: envId,
      },
    },
    spec: {
      selector: {
        sandbox: envId,
      },
      ports: [
        {
          port: 3000,      // Service port
          targetPort: 3000 // Container port
        }
      ]
    }
  };
}
