const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 部署 Token0
  const ERC20 = await hre.ethers.getContractFactory("ERC20");
  const token0 = await ERC20.deploy("Token A", "TKA", hre.ethers.parseEther("1000000"));
  await token0.waitForDeployment();
  console.log("Token0 deployed to:", await token0.getAddress());

  // 部署 Token1
  const token1 = await ERC20.deploy("Token B", "TKB", hre.ethers.parseEther("1000000"));
  await token1.waitForDeployment();
  console.log("Token1 deployed to:", await token1.getAddress());

  // 部署 MiniSwap
  const MiniSwap = await hre.ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwap.deploy(await token0.getAddress(), await token1.getAddress());
  await miniSwap.waitForDeployment();
  console.log("MiniSwap deployed to:", await miniSwap.getAddress());

  // 输出配置信息
  console.log("\n=== Contract Addresses ===");
  console.log(`TOKEN0_ADDRESS=${await token0.getAddress()}`);
  console.log(`TOKEN1_ADDRESS=${await token1.getAddress()}`);
  console.log(`MINISWAP_ADDRESS=${await miniSwap.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
