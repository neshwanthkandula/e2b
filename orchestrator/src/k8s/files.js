const { execInPod } = require("./exec");

async function writeFileToPod(podName, filePath, content) {
  const cmd = [
    "sh",
    "-c",
    `cat << 'EOF' > ${filePath}\n${content}\nEOF`
  ];
  return execInPod(podName, cmd);
}

module.exports = { writeFileToPod };
