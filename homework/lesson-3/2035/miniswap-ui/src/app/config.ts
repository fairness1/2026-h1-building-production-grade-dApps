export const CONTRACT_ADDRESSES = {
  token0: "0x5FbDB2315678afecb367f032d93F642f64180aa3",      // 部署后填入
  token1: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",      // 部署后填入
  miniSwap: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",    // 部署后填入
};

export const CHAIN_CONFIG = {
  chainId: "0x7A69",  // 31337 - Hardhat Local
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"],
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
};

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

export const MINISWAP_ABI = [
  "function addLiquidity(uint256, uint256) returns (uint256)",
  "function removeLiquidity(uint256) returns (uint256, uint256)",
  "function swap(address, uint256) returns (uint256)",
  "function getReserves() view returns (uint256, uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
];
