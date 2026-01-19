// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 标准 ERC20 接口
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/**
 * @title MockERC20
 * @dev 用于测试的代币，部署时可指定名称和符号
 */
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public override totalSupply;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        _mint(msg.sender, 1000000 * 10**18); // 默认给部署者铸造 100 万代币
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }
}

/**
 * @title MiniSwap
 * @dev 简化版 DEX：1:1 兑换，无手续费，无 Liquidity 奖励
 */
contract MiniSwap {
    IERC20 public tokenA;
    IERC20 public tokenB;

    // 记录用户的流动性份额
    mapping(address => uint256) public liquidity;
    uint256 public totalLiquidity;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }

    // 1. 添加流动性：按 1:1 存入代币
    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA == amountB, "Must provide 1:1 ratio");
        require(amountA > 0, "Amount must be greater than 0");

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        liquidity[msg.sender] += amountA;
        totalLiquidity += amountA;

        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    // 2. 移除流动性：按 1:1 返还代币
    function removeLiquidity(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(liquidity[msg.sender] >= amount, "Insufficient liquidity");

        liquidity[msg.sender] -= amount;
        totalLiquidity -= amount;

        tokenA.transfer(msg.sender, amount);
        tokenB.transfer(msg.sender, amount);

        emit LiquidityRemoved(msg.sender, amount);
    }

    // 3. 兑换：TokenA 换 TokenB 或 TokenB 换 TokenA (1:1，无手续费)
    function swap(address tokenIn, uint256 amountIn) external {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), "Invalid token");

        IERC20 inputToken;
        IERC20 outputToken;

        if (tokenIn == address(tokenA)) {
            inputToken = tokenA;
            outputToken = tokenB;
        } else {
            inputToken = tokenB;
            outputToken = tokenA;
        }

        require(outputToken.balanceOf(address(this)) >= amountIn, "Insufficient pool balance");

        // 1:1 兑换，无手续费
        inputToken.transferFrom(msg.sender, address(this), amountIn);
        outputToken.transfer(msg.sender, amountIn);

        emit Swap(msg.sender, tokenIn, address(outputToken), amountIn, amountIn);
    }

    // 查询池子余额
    function getPoolBalances() external view returns (uint256 balanceA, uint256 balanceB) {
        balanceA = tokenA.balanceOf(address(this));
        balanceB = tokenB.balanceOf(address(this));
    }
}
