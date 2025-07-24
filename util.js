const util = require("util");
const AWS = require("aws-sdk");

const getRandomString = (strings) => {
  return strings[Math.floor(Math.random() * strings.length)];
};

const getAorAn = (word) => {
  const vowels = ["a", "e", "i", "o", "u"];
  return vowels.includes(word[0].toLowerCase()) ? "an" : "a";
};

const removeNarrators = (text) => {
  // Matches "Amy:" or "Matthew:" at the start of any line, with optional spaces and case-insensitive
  return text.replace(/^\s*(Amy|Matthew):\s*/gim, "");
};

const getS3PreSignedUrl = (key) => {
  const s3 = new AWS.S3();
  const params = {
    Bucket: process.env.S3_PERSISTENCE_BUCKET,
    Key: key,
    Expires: 60, // URL expires in 60 seconds
  };

  try {
    return s3.getSignedUrlPromise("getObject", params);
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return null;
  }
};

// New Responses API output is a structured array. This is a safe fallback if output_text is missing.
const extractText = (resp) => {
  if (!resp.output) return "";
  return resp.output
    .flatMap((block) => {
      if (block.type === "message" && Array.isArray(block.content)) {
        return block.content
          .filter((c) => c.type === "output_text")
          .map((c) => c.text);
      }
      return [];
    })
    .join("\n");
};

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
  } catch (e) {
    return util.inspect(obj, { depth: 5 });
  }
}

function logRequestContext(handlerInput) {
  try {
    const envCopy = handlerInput.requestEnvelope
      ? JSON.parse(JSON.stringify(handlerInput.requestEnvelope))
      : null;
    console.log("---- RequestEnvelope ----");
    console.log(safeStringify(envCopy));
  } catch (e) {
    console.log("Failed to stringify requestEnvelope:", e);
  }
}

function logError(error) {
  console.error("---- ERROR OBJECT ----");
  // Include non-enumerable props like message/stack
  const errObj = {};
  Object.getOwnPropertyNames(error || {}).forEach((key) => {
    errObj[key] = error[key];
  });
  console.error(safeStringify(errObj));

  if (error.stack) {
    console.error("---- STACK ----");
    console.error(error.stack);
  }
  if (error.cause) {
    console.error("---- CAUSE ----");
    console.error(safeStringify(error.cause));
  }
}

module.exports = {
  getRandomString,
  getAorAn,
  removeNarrators,
  getS3PreSignedUrl,
  extractText,
  safeStringify,
  logRequestContext,
  logError,
};
