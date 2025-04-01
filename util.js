const AWS = require("aws-sdk");

const getRandomString = (strings) => {
  return strings[Math.floor(Math.random() * strings.length)];
};

const getAorAn = (word) => {
  const vowels = ["a", "e", "i", "o", "u"];
  return vowels.includes(word[0].toLowerCase()) ? "an" : "a";
};

const removeNarrators = (text) => {
  return text.replace(/^(Amy|Matthew):\s*/i, "");
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

module.exports = {
  getRandomString,
  getAorAn,
  removeNarrators,
  getS3PreSignedUrl,
};
