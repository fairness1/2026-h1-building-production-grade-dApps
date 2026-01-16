const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MiniSwap", function () {
  let Token, token0, token1, MiniSwap, miniSwap;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Tokens
    Token = await ethers.getContractFactory("ERC20");
    token0 = await Token.deploy("Token0", "TK0", ethers.parseEther("1000"));
    token1 = await Token.deploy("Token1", "TK1", ethers.parseEther("1000"));

    // Deploy MiniSwap
    MiniSwap = await ethers.getContractFactory("MiniSwap");
    miniSwap = await MiniSwap.deploy(await token0.getAddress(), await token1.getAddress());
  });

  describe("Liquidity", function () {
    it("Should add liquidity", async function () {
      const amount = ethers.parseEther("100");

      await token0.approve(await miniSwap.getAddress(), amount);
      await token1.approve(await miniSwap.getAddress(), amount);

      await expect(miniSwap.addLiquidity(amount, amount))
        .to.emit(miniSwap, "AddLiquidity")
        .withArgs(owner.address, amount, amount, ethers.parseEther("200")); // Simple sum in initial case
    });

    it("Should remove liquidity", async function () {
      const amount = ethers.parseEther("100");

      await token0.approve(await miniSwap.getAddress(), amount);
      await token1.approve(await miniSwap.getAddress(), amount);

      await miniSwap.addLiquidity(amount, amount);

      // Remove half
      const shares = ethers.parseEther("100");
      await expect(miniSwap.removeLiquidity(shares))
        .to.emit(miniSwap, "RemoveLiquidity");
    });
  });

  describe("Swap", function () {
    it("Should swap token0 for token1", async function () {
      // Add liquidity first
      const liquidity = ethers.parseEther("500");
      await token0.approve(await miniSwap.getAddress(), liquidity);
      await token1.approve(await miniSwap.getAddress(), liquidity);
      await miniSwap.addLiquidity(liquidity, liquidity);

      // Swap
      const swapAmount = ethers.parseEther("10");
      await token0.approve(await miniSwap.getAddress(), swapAmount);

      await expect(miniSwap.swap(await token0.getAddress(), swapAmount))
        .to.emit(miniSwap, "Swap")
        .withArgs(owner.address, await token0.getAddress(), swapAmount, await token1.getAddress(), swapAmount);
    });
  });
});
