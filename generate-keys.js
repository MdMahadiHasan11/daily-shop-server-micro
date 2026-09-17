const crypto = require("crypto");
const fs = require("fs");

// RSA Key Pair জেনারেট করা
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

fs.writeFileSync("private.key", privateKey);
fs.writeFileSync("public.key", publicKey);

console.log("✅ RSA Private and Public keys generated successfully!");
