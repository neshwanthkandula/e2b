import { KubeConfig, CoreV1Api, AppsV1Api } from "@kubernetes/client-node";

const kc = new KubeConfig();
kc.loadFromDefault();

const coreApi = kc.makeApiClient(CoreV1Api);
const appsApi = kc.makeApiClient(AppsV1Api);

export { kc, coreApi, appsApi };
