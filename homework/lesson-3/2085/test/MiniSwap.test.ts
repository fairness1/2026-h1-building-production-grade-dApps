import { expect } from "chai";
import { ethers } from "hardhat";
import { MiniSwap, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MiniSwap", function () {
  let miniSwap: MiniSwap;
  let tokenA: MockERC20;
  let tokenB: MockERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20Factory.deploy("Token A", "TKA");
    tokenB = await MockERC20Factory.deploy("Token B", "TKB");

    const MiniSwapFactory = await ethers.getContractFactory("MiniSwap");
    miniSwap = await MiniSwapFactory.deploy(
      await tokenA.getAddress(),
      await tokenB.getAddress()
    );

    await tokenA.transfer(user1.address, ethers.parseEther("1000"));
    await tokenB.transfer(user1.address, ethers.parseEther("1000"));
  });

  describe("Add Liquidity", function () {
    it("should add liquidity successfully", async function () {
      const amount = ethers.parseEther("100");

      await tokenA.connect(user1).approve(await miniSwap.getAddress(), amount);
      await tokenB.connect(user1).approve(await miniSwap.getAddress(), amount);

      await expect(miniSwap.connect(user1).addLiquidity(amount, amount))
        .to.emit(miniSwap, "LiquidityAdded")
        .withArgs(user1.address, amount, amount);

      expect(await miniSwap.liquidity(user1.address)).to.equal(amount);
      expect(await miniSwap.totalLiquidity()).to.equal(amount);
    });

    it("should reject non 1:1 ratio", async function () {
      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("200");

      await tokenA.connect(user1).approve(await miniSwap.getAddress(), amountA);
      await tokenB.connect(user1).approve(await miniSwap.getAddress(), amountB);

      await expect(
        miniSwap.connect(user1).addLiquidity(amountA, amountB)
      ).to.be.revertedWith("Must provide 1:1 ratio");
    });

    it("should reject zero amount", async function () {
      await expect(
        miniSwap.connect(user1).addLiquidity(0, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Remove Liquidity", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      await tokenA.connect(user1).approve(await miniSwap.getAddress(), amount);
      await tokenB.connect(user1).approve(await miniSwap.getAddress(), amount);
      await miniSwap.connect(user1).addLiquidity(amount, amount);
    });

    it("should remove liquidity successfully", async function () {
      const amount = ethers.parseEther("50");

      await expect(miniSwap.connect(user1).removeLiquidity(amount))
        .to.emit(miniSwap, "LiquidityRemoved")
        .withArgs(user1.address, amount);

      expect(await miniSwap.liquidity(user1.address)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("should reject excess removal", async function () {
      const amount = ethers.parseEther("200");

      await expect(
        miniSwap.connect(user1).removeLiquidity(amount)
      ).to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Swap", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("100");
      await tokenA.connect(user1).approve(await miniSwap.getAddress(), amount);
      await tokenB.connect(user1).approve(await miniSwap.getAddress(), amount);
      await miniSwap.connect(user1).addLiquidity(amount, amount);
    });

    it("should swap TokenA to TokenB", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(user1).approve(await miniSwap.getAddress(), swapAmount);

      const balanceBefore = await tokenB.balanceOf(user1.address);

      await miniSwap.connect(user1).swap(await tokenA.getAddress(), swapAmount);

      const balanceAfter = await tokenB.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(swapAmount);
    });

    it("should swap TokenB to TokenA", async function () {
      const swapAmount = ethers.parseEther("10");
      await tokenB.connect(user1).approve(await miniSwap.getAddress(), swapAmount);

      const balanceBefore = await tokenA.balanceOf(user1.address);

      await miniSwap.connect(user1).swap(await tokenB.getAddress(), swapAmount);

      const balanceAfter = await tokenA.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(swapAmount);
    });

    it("should reject insufficient pool balance", async function () {
      const swapAmount = ethers.parseEther("200");
      await tokenA.connect(user1).approve(await miniSwap.getAddress(), swapAmount);

      await expect(
        miniSwap.connect(user1).swap(await tokenA.getAddress(), swapAmount)
      ).to.be.revertedWith("Insufficient pool balance");
    });
  });
});
