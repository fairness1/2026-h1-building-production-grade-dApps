const hre = require("hardhat");

const RECEIVER = "0xa31F103CE4b7e0cDf820f3d3f3a5A7A5fC60833f";
const TOKEN0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TOKEN1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Sending funds from:", deployer.address);
  console.log("Receiver:", RECEIVER);

  // 1. Send ETH
  console.log("Sending ETH...");
  const tx = await deployer.sendTransaction({
    to: RECEIVER,
    value: hre.ethers.parseEther("100.0")
  });
  await tx.wait();
  console.log("✅ Sent 100 ETH");

  // 2. Send Token0
  const Token0 = await hre.ethers.getContractAt("ERC20", TOKEN0, deployer);
  const tx0 = await Token0.transfer(RECEIVER, hre.ethers.parseEther("2000"));
  await tx0.wait();
  console.log("✅ Sent 2000 Token A");

  // 3. Send Token1
  const Token1 = await hre.ethers.getContractAt("ERC20", TOKEN1, deployer);
  const tx1 = await Token1.transfer(RECEIVER, hre.ethers.parseEther("2000"));
  await tx1.wait();
  console.log("✅ Sent 2000 Token B");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
