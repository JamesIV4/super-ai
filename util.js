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

module.exports = {
  getRandomString,
  getAorAn,
  removeNarrators,
  getS3PreSignedUrl,
  extractText,
};
