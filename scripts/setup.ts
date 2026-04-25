// import { generateKeyPairSync } from "crypto";
// const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
//   privateKeyEncoding: { type: "pkcs8", format: "der" },
//   publicKeyEncoding: { type: "spki", format: "der" },
// });
// console.log("PRIVATE:", privateKey.toString("base64"));
// console.log("PUBLIC:", publicKey.toString("base64"));

// import { randomBytes } from "crypto";
// console.log(randomBytes(32).toString("hex"));

// import { generateEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";
// import dotenv from "dotenv";

// dotenv.config();

// const ciphertext = await generateEntitySecretCiphertext({
//   apiKey: process.env.CIRCLE_API_KEY!,
//   entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
// });

// console.log(ciphertext);

// import { registerEntitySecretCiphertext } from "@circle-fin/developer-controlled-wallets";
// import { mkdirSync } from "fs";
// import dotenv from "dotenv";

// dotenv.config();

// mkdirSync("./output", { recursive: true });

// const response = await registerEntitySecretCiphertext({
//   apiKey: process.env.CIRCLE_API_KEY!,
//   entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
//   recoveryFileDownloadPath: "./output/",
// });

// console.log(response);

import { RunixClient } from "@basilgoodluck/runix-sdk";

async function register() {
  const { apiKey, walletAddress, agentId } = await RunixClient.register({
    metadataUri: "https://gist.githubusercontent.com/basilgoodluck/83651a3b32ffea1bb14f2052863a9c63/raw/472aac106dd7816925edbebfb9a01f6d44ed14b7/runix-code-agent.json"
  });

  console.log("apikey:", apiKey);
  console.log("walletAddress:", walletAddress);
  console.log("agentId:", agentId);
}

register();