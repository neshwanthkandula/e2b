const k8s = require("@kubernetes/client-node")
const https = require("https");
const fs = require("fs");

const kc = new k8s.KubeConfig();
if (process.env.KUBERNETES_SERVICE_HOST) {
  kc.loadFromCluster();   // running inside Kind cluster
} else {
  kc.loadFromDefault();   // running on your laptop
}




module.exports = {
    kc,
    coreV1: kc.makeApiClient(k8s.CoreV1Api),
    appsV1: kc.makeApiClient(k8s.AppsV1Api),
    execClient : new k8s.Exec(kc)
};
