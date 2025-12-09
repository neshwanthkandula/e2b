const { coreV1 } = require("./client");
const { NAMESPACE, SANDBOX_LABEL_KEY } = require("../config");

async function getPodBySandboxId(id) {
  const pods = await coreV1.listNamespacedPod({
    namespace: NAMESPACE,
    labelSelector: `${SANDBOX_LABEL_KEY}=${id}`
  });

  console.log("POD RESPONSE:", pods);

  return pods.body?.items?.[0]?.metadata?.name;
}


module.exports = { getPodBySandboxId };
