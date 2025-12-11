const { execClient } = require("./client");
const { NAMESPACE } = require("../config");
const stream = require("stream");


function execInPod(podName, cmd) {
  console.log("exec in pod")
  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";

    const stdoutStream = new stream.Writable({
      write(chunk, encoding, callback) {
        stdoutData += chunk.toString();
        callback();
      },
    });

    const stderrStream = new stream.Writable({
      write(chunk, encoding, callback) {
        stderrData += chunk.toString();
        callback();
      },
    });

    execClient.exec(
      NAMESPACE,
      podName,
      "sandbox",
      cmd,
      stdoutStream,
      stderrStream,
      null,      // no stdin
      false,     // not TTY
      (status) => {
        if (status?.status === "Success") {
          resolve({ stdout: stdoutData, stderr: stderrData, status });
        } else {
          reject(
            new Error(stderrData || `Exec failed: ${JSON.stringify(status || {})}`)
          );
        }
      }
    ).catch((err) => reject(err));
  });
}

module.exports = { execInPod }
