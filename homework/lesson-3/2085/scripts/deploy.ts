import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const tokenA = await MockERC20Factory.deploy("Token A", "TKA");
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("TokenA deployed to:", tokenAAddress);

  const tokenB = await MockERC20Factory.deploy("Token B", "TKB");
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("TokenB deployed to:", tokenBAddress);

  const MiniSwapFactory = await ethers.getContractFactory("MiniSwap");
  const miniSwap = await MiniSwapFactory.deploy(tokenAAddress, tokenBAddress);
  await miniSwap.waitForDeployment();
  const miniSwapAddress = await miniSwap.getAddress();
  console.log("MiniSwap deployed to:", miniSwapAddress);

  console.log("\nDeployment completed!");
  console.log({
    tokenA: tokenAAddress,
    tokenB: tokenBAddress,
    miniSwap: miniSwapAddress,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
