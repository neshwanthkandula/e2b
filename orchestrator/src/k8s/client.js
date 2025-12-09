const k8s = require("@kubernetes/client-node")

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

module.exports = {
    kc,
    coreV1: kc.makeApiClient(k8s.CoreV1Api),
    appsV1: kc.makeApiClient(k8s.AppsV1Api),
    execClient : new k8s.Exec()
};