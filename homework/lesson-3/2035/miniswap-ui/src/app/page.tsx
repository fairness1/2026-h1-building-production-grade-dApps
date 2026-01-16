"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, CHAIN_CONFIG, ERC20_ABI, MINISWAP_ABI } from "./config";

export default function Home() {
  const [account, setAccount] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [activeTab, setActiveTab] = useState<"swap" | "liquidity">("swap");

  // Swap state
  const [swapAmount, setSwapAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState<"0to1" | "1to0">("0to1");

  // Liquidity state
  const [addAmount0, setAddAmount0] = useState("");
  const [addAmount1, setAddAmount1] = useState("");
  const [removeShares, setRemoveShares] = useState("");

  // Pool info
  const [reserves, setReserves] = useState({ reserve0: "0", reserve1: "0" });
  const [lpBalance, setLpBalance] = useState("0");
  const [tokenSymbols, setTokenSymbols] = useState({ token0: "TK0", token1: "TK1" });

  // Connect wallet
  async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setProvider(provider);
      setAccount(accounts[0]);

      // Switch to correct network
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_CONFIG.chainId }],
        });
      } catch (switchError: any) {
        // This error code 4902 indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          // For local hardhat usage, sometimes we need to manually add it.
          // But usually 'wallet_addEthereumChain' is the way.
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CHAIN_CONFIG],
            });
          } catch (addError) {
            console.error("Failed to add chain", addError);
          }
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  }

  // Load pool info
  async function loadPoolInfo() {
    if (!provider || !CONTRACT_ADDRESSES.miniSwap) return;

    try {
      const miniSwap = new ethers.Contract(CONTRACT_ADDRESSES.miniSwap, MINISWAP_ABI, provider);
      const [reserve0, reserve1] = await miniSwap.getReserves();
      setReserves({
        reserve0: ethers.formatEther(reserve0),
        reserve1: ethers.formatEther(reserve1),
      });

      if (account) {
        const balance = await miniSwap.balanceOf(account);
        setLpBalance(ethers.formatEther(balance));
      }

      // Load symbols (optional, assuming we know them)
      // const t0 = new ethers.Contract(CONTRACT_ADDRESSES.token0, ERC20_ABI, provider);
      // ...
    } catch (e) {
      console.error("Error loading pool info:", e);
    }
  }

  useEffect(() => {
    if (provider && account) {
      loadPoolInfo();
      // Poll for updates
      const interval = setInterval(loadPoolInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [provider, account]);

  // Swap function
  async function handleSwap() {
    if (!provider || !account) return;

    try {
      const signer = await provider.getSigner();
      const tokenIn = swapDirection === "0to1" ? CONTRACT_ADDRESSES.token0 : CONTRACT_ADDRESSES.token1;
      const amount = ethers.parseEther(swapAmount);

      // Approve
      const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
      console.log("Approving...");
      const approveTx = await token.approve(CONTRACT_ADDRESSES.miniSwap, amount);
      await approveTx.wait();
      console.log("Approved");

      // Swap
      const miniSwap = new ethers.Contract(CONTRACT_ADDRESSES.miniSwap, MINISWAP_ABI, signer);
      console.log("Swapping...");
      const swapTx = await miniSwap.swap(tokenIn, amount);
      await swapTx.wait();

      alert("Swap successful!");
      loadPoolInfo();
      setSwapAmount("");
    } catch (error: any) {
      console.error(error);
      alert("Swap failed: " + (error.reason || error.message));
    }
  }

  // Add liquidity
  async function handleAddLiquidity() {
    if (!provider || !account) return;

    try {
      const signer = await provider.getSigner();
      const amount0 = ethers.parseEther(addAmount0);
      const amount1 = ethers.parseEther(addAmount1);

      // Approve both tokens
      const token0 = new ethers.Contract(CONTRACT_ADDRESSES.token0, ERC20_ABI, signer);
      const token1 = new ethers.Contract(CONTRACT_ADDRESSES.token1, ERC20_ABI, signer);

      console.log("Approving Token0...");
      await (await token0.approve(CONTRACT_ADDRESSES.miniSwap, amount0)).wait();
      console.log("Approving Token1...");
      await (await token1.approve(CONTRACT_ADDRESSES.miniSwap, amount1)).wait();

      // Add liquidity
      const miniSwap = new ethers.Contract(CONTRACT_ADDRESSES.miniSwap, MINISWAP_ABI, signer);
      console.log("Adding Liquidity...");
      const tx = await miniSwap.addLiquidity(amount0, amount1);
      await tx.wait();

      alert("Liquidity added!");
      loadPoolInfo();
      setAddAmount0("");
      setAddAmount1("");
    } catch (error: any) {
      console.error(error);
      alert("Add Liquidity failed: " + (error.reason || error.message));
    }
  }

  // Remove liquidity
  async function handleRemoveLiquidity() {
    if (!provider || !account) return;

    try {
      const signer = await provider.getSigner();
      const shares = ethers.parseEther(removeShares);

      const miniSwap = new ethers.Contract(CONTRACT_ADDRESSES.miniSwap, MINISWAP_ABI, signer);
      console.log("Removing Liquidity...");
      const tx = await miniSwap.removeLiquidity(shares);
      await tx.wait();

      alert("Liquidity removed!");
      loadPoolInfo();
      setRemoveShares("");
    } catch (error: any) {
      console.error(error);
      alert("Remove Liquidity failed: " + (error.reason || error.message));
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8 font-mono">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">MiniSwap 2035</h1>

        {/* Connect Wallet */}
        <div className="text-center mb-6">
          {account ? (
            <p className="text-green-400 bg-gray-800 py-2 rounded">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          ) : (
            <button onClick={connectWallet} className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Connect MetaMask
            </button>
          )}
        </div>

        {/* Config Check */}
        {!CONTRACT_ADDRESSES.miniSwap && (
          <div className="bg-red-900/50 border border-red-500 p-4 rounded mb-6 text-sm text-center">
            ⚠️ Contract addresses not set in <code>apps/config.ts</code>
          </div>
        )}

        {/* Pool Info */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Pool Statistics</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Reserve Token0:</div>
            <div className="text-right text-white">{parseFloat(reserves.reserve0).toFixed(4)}</div>
            <div className="text-gray-400">Reserve Token1:</div>
            <div className="text-right text-white">{parseFloat(reserves.reserve1).toFixed(4)}</div>
            <div className="border-t border-gray-700 col-span-2 my-1"></div>
            <div className="text-gray-400">Your LP Shares:</div>
            <div className="text-right text-yellow-400">{parseFloat(lpBalance).toFixed(4)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-4 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("swap")}
            className={`flex-1 py-2 rounded-md transition ${activeTab === "swap" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
          >
            Swap
          </button>
          <button
            onClick={() => setActiveTab("liquidity")}
            className={`flex-1 py-2 rounded-md transition ${activeTab === "liquidity" ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"}`}
          >
            Liquidity
          </button>
        </div>

        {/* Swap Panel */}
        {activeTab === "swap" && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-center">Swap Tokens (1:1)</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Direction</label>
                <select
                  value={swapDirection}
                  onChange={(e) => setSwapDirection(e.target.value as "0to1" | "1to0")}
                  className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-blue-500 outline-none"
                >
                  <option value="0to1">Token0 → Token1</option>
                  <option value="1to0">Token1 → Token0</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-blue-500 outline-none"
                />
              </div>
              <button
                onClick={handleSwap}
                disabled={!swapAmount || !account}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 py-3 rounded font-bold hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
              >
                Swap Now
              </button>
            </div>
          </div>
        )}

        {/* Liquidity Panel */}
        {activeTab === "liquidity" && (
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-center border-b border-gray-700 pb-2">Add Liquidity</h3>
            <div className="space-y-3 mb-8">
              <input
                type="number"
                placeholder="Token0 Amount"
                value={addAmount0}
                onChange={(e) => setAddAmount0(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
              />
              <input
                type="number"
                placeholder="Token1 Amount"
                value={addAmount1}
                onChange={(e) => setAddAmount1(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
              />
              <button
                onClick={handleAddLiquidity}
                disabled={!addAmount0 || !addAmount1 || !account}
                className="w-full bg-green-600 py-2 rounded hover:bg-green-500 disabled:opacity-50 font-semibold"
              >
                Add
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-4 text-center border-b border-gray-700 pb-2">Remove Liquidity</h3>
            <div className="space-y-3">
              <input
                type="number"
                placeholder="LP Shares to Remove"
                value={removeShares}
                onChange={(e) => setRemoveShares(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white"
              />
              <button
                onClick={handleRemoveLiquidity}
                disabled={!removeShares || !account}
                className="w-full bg-red-600 py-2 rounded hover:bg-red-500 disabled:opacity-50 font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
