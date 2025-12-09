const { execClient } = require("./client");
const { NAMESPACE } = require("../config");

function execInPod(podName, cmd) {
  return new Promise((resolve, reject) => {
    execClient.exec(
      NAMESPACE,
      podName,
      "sandbox",
      cmd,
      process.stdout,
      process.stderr,
      null,
      false,
      (status) => {
        status.status === "Success" ? resolve(status) : reject(status);
      }
    );
  });
}

module.exports = { execInPod };
