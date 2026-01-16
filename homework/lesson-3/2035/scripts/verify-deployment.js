const hre = require("hardhat");

const CONTRACT_ADDRESSES = {
  token0: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  token1: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  miniSwap: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
};

async function main() {
  console.log("Checking contracts on localhost...");
  console.log("Config Addresses:", CONTRACT_ADDRESSES);

  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Check Code
  const code0 = await provider.getCode(CONTRACT_ADDRESSES.token0);
  const code1 = await provider.getCode(CONTRACT_ADDRESSES.token1);
  const codeSwap = await provider.getCode(CONTRACT_ADDRESSES.miniSwap);

  console.log("Token0 Code Size:", code0.length);
  console.log("Token1 Code Size:", code1.length);
  console.log("MiniSwap Code Size:", codeSwap.length);

  if (code0.length <= 2 || code1.length <= 2 || codeSwap.length <= 2) {
    console.error("❌ Contracts NOT found at configured addresses!");
    return;
  }

  console.log("✅ Contracts found!");

  // Try call
  const miniSwap = await hre.ethers.getContractAt("MiniSwap", CONTRACT_ADDRESSES.miniSwap, provider);
  const reserves = await miniSwap.getReserves();
  console.log("Reserves:", reserves);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
