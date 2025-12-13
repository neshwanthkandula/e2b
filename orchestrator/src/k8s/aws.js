// aws.js (CommonJS version)

const {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const BUCKET = process.env.SANDBOX_S3_BUCKET;
const REGION = process.env.AWS_REGION || "ap-south-1";

if (!BUCKET) {
  throw new Error("SANDBOX_S3_BUCKET environment variable is required");
}

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ---------------------------------------- */
/* Helper: recursively list S3 objects      */
/* ---------------------------------------- */
async function listObjects(prefix) {
  const results = [];
  let token;

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    if (res.Contents) {
      results.push(...res.Contents);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);

  return results;
}

/* ---------------------------------------- */
/* 1. COPY BASE TEMPLATE → SANDBOX WORKSPACE */
/* ---------------------------------------- */
async function copyS3Base(fromPrefix, toPrefix) {
  const objects = await listObjects(fromPrefix);

  for (const obj of objects) {
    if (!obj.Key) continue;

    const relativePath = obj.Key.replace(fromPrefix, "");
    const destKey = `${toPrefix}${relativePath}`;

    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${obj.Key}`,
        Key: destKey,
      })
    );
  }
}

/* ---------------------------------------- */
/* 2. WRITE (or overwrite) A FILE IN S3      */
/* ---------------------------------------- */
async function writeS3Code(sandboxId, relativePath, content) {
  const clean = relativePath.replace(/^\/+/, "");

  const key = `sandboxes/${sandboxId}/workspace/${clean}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: content,
    })
  );
}

/* ---------------------------------------- */
/* 3. READ FILE OR FULL DIRECTORY FROM S3    */
/* ---------------------------------------- */
async function readS3Code(sandboxId, path = "") {
  const prefix = `sandboxes/${sandboxId}/workspace/${path.replace(/^\/+/, "")}`;

  const objects = await listObjects(prefix);

  const result = {};

  for (const obj of objects) {
    if (!obj.Key) continue;

    const rel = obj.Key.replace(`sandboxes/${sandboxId}/workspace/`, "");

    const response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: obj.Key,
      })
    );

    const body = await streamToString(response.Body);
    result[rel] = body;
  }

  return result;
}

/* Stream → string helper */
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

/* ---------------------------------------- */
/* EXPORTS                                  */
/* ---------------------------------------- */
module.exports = {
  copyS3Base,
  writeS3Code,
  readS3Code,
};
