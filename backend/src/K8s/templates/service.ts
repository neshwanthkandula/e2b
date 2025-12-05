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
          name : "agent",
          port: 3000,      // Service port
          targetPort: 3000 // Container port
        },
        {
          name : "app",
          port : 3001,
          targetPort : 3001
        }
      ]
    }
  };
}
