const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. Deploy Token0
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const token0 = await ERC20.deploy("Token A", "TKA", hre.ethers.parseEther("1000000"));
  await token0.waitForDeployment();
  const token0Address = await token0.getAddress();
  console.log("Token0 deployed to:", token0Address);

  // 2. Deploy Token1
  const token1 = await ERC20.deploy("Token B", "TKB", hre.ethers.parseEther("1000000"));
  await token1.waitForDeployment();
  const token1Address = await token1.getAddress();
  console.log("Token1 deployed to:", token1Address);

  // 3. Deploy MiniSwap
  const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy(token0Address, token1Address);
  await miniSwap.waitForDeployment();
  const miniSwapAddress = await miniSwap.getAddress();
  console.log("MiniSwap deployed to:", miniSwapAddress);

  // 4. Update Frontend Config
  const configPath = path.join(__dirname, "../miniswap-ui/src/app/config.ts");
  let configContent = fs.readFileSync(configPath, "utf8");

  // Replace addresses using Regex
  configContent = configContent.replace(/token0: ".*"/, `token0: "${token0Address}"`);
  configContent = configContent.replace(/token1: ".*"/, `token1: "${token1Address}"`);
  configContent = configContent.replace(/miniSwap: ".*"/, `miniSwap: "${miniSwapAddress}"`);

  fs.writeFileSync(configPath, configContent);
  console.log("\n✅ Frontend config updated automatically!");
  console.log(`Updated: ${configPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
