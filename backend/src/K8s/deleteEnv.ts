import { appsApi, coreApi } from "./client";

export async function deleteEnvironment(envId: string) {
  await appsApi.deleteNamespacedDeployment({
    name: `sandbox-${envId}`,
    namespace: "default"
  });

  await coreApi.deleteNamespacedService({
    name: `sandbox-svc-${envId}`,
    namespace: "default"
  });

  return {
    message: `Environment ${envId} deleted`
  };
}
