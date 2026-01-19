import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8546"
    },
    development: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
      }
    },
    paseo: {
      url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
      accounts: {
        mnemonic: "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
      }
    }
  }
};

export default config;
