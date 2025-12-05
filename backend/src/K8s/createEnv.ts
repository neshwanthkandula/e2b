import { coreApi, appsApi } from "./client";
import { createDeploymentTemplate } from "./templates/deloyment";
import { createServiceTemplate } from "./templates/service";

export async function createEnvironment(envId: string) {
  // Create Deployment
  const deploymentManifest = createDeploymentTemplate(envId);
  await appsApi.createNamespacedDeployment({
    namespace: "default",
    body: deploymentManifest
  });

  // Create Service
  const serviceManifest = createServiceTemplate(envId);
  await coreApi.createNamespacedService({
    namespace: "default",
    body: serviceManifest
  });

  return {
    message: `Environment ${envId} created`
  };
}

