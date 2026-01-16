const hre = require("hardhat");

// Addresses from the latest deployment (Step 324)
const TOKEN0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TOKEN1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USER_ADDR = "0xa31F103CE4b7e0cDf820f3d3f3a5A7A5fC60833f";

async function main() {
  console.log("Checking balance for:", USER_ADDR);

  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const t0 = await hre.ethers.getContractAt("ERC20", TOKEN0, provider);
  const t1 = await hre.ethers.getContractAt("ERC20", TOKEN1, provider);

  const bal0 = await t0.balanceOf(USER_ADDR);
  const bal1 = await t1.balanceOf(USER_ADDR);

  console.log("Token A (TKA) Balance:", hre.ethers.formatEther(bal0));
  console.log("Token B (TKB) Balance:", hre.ethers.formatEther(bal1));
  console.log("Token A Address:", TOKEN0);
  console.log("Token B Address:", TOKEN1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
