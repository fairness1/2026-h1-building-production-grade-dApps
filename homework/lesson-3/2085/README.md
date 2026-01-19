# Lesson 3 作业 - MiniSwap DEX

## 学生信息
- 学号：2085
- 提交日期：2026-01-19

## 项目简介
实现了一个简单的去中心化交易所（MiniSwap DEX），支持：
- 添加流动性（1:1 比例）
- 移除流动性
- Token 兑换（1:1 无手续费）

## 合约部署

### Paseo 测试网部署
- **网络**：Paseo Testnet
- **RPC**：https://testnet-passet-hub-eth-rpc.polkadot.io
- **Chain ID**：420420421
- **TokenA**：0x3bEEbBe939bEB221bdC7A8baA81fEa69295043A8
- **TokenB**：0x298FA4226C8880fAccACB844dc4bc83483969D21
- **MiniSwap**：0x4544F33f362C55E15F13fbc92312b635c8693Db6

部署方式：通过 Hardhat 脚本部署
```bash
npx hardhat run scripts/deploy.ts --network paseo
```

## 测试结果

运行测试：
```bash
npx hardhat test
```

**测试通过**：
测试覆盖：
- - - - - - - - 
## 技术实现

### 智能合约
- **MockERC20**：标准 ERC20 代币
- **MiniSwap**：DEX 核心逻辑
  - `addLiquidity()` - 添加流动性
  - `removeLiquidity()` - 移除流动性
  - `swap()` - 代币兑换
  - `getPoolBalances()` - 查询池子余额

### 开发环境
- Hardhat 2.28.3
- Solidity 0.8.20
- Node.js v18.19.1

## 遇到的问题及解决

### 问题：本地开发环境部署失败
- **现象**：部署到本地 Polkadot 开发环境时报 `CodeRejected` 错误
- **原因**：旧版本节点不支持合约部署
- **解决**：按照老师建议，使用 hardhat-polkadot release nodes-19071579107
- **结果**：
### 验证方式
1. 2. 3. 
## 项目结构
```
.
├── contracts/
│   └── MiniSwap.sol          # 主合约
├── scripts/
│   └── deploy.ts             # 部署脚本
├── test/
│   └── MiniSwap.test.ts      # 测试用例
├── hardhat.config.ts         # Hardhat 配置
├── package.json              # 依赖管理
├── deployed-addresses.json   # 部署地址
└── README.md                 # 本文档
```

## 运行说明

### 安装依赖
```bash
npm install
```

### 编译合约
```bash
npx hardhat compile
```

### 运行测试
```bash
npx hardhat test
```

### 部署合约
```bash
npx hardhat run scripts/deploy.ts --network paseo
```
