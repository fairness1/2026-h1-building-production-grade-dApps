// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC20.sol";

/**
 * @title MiniSwap - 简化版 DEX
 * @notice 实现 1:1 代币兑换，无手续费
 */
contract MiniSwap {
    address public token0;
    address public token1;
    uint256 public reserve0;
    uint256 public reserve1;

    // LP Token 追踪
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event AddLiquidity(address indexed provider, uint256 amount0, uint256 amount1, uint256 shares);
    event RemoveLiquidity(address indexed provider, uint256 amount0, uint256 amount1, uint256 shares);
    event Swap(address indexed user, address tokenIn, uint256 amountIn, address tokenOut, uint256 amountOut);

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    /**
     * @notice 添加流动性
     * @param amount0 Token0 数量
     * @param amount1 Token1 数量
     * @return shares 获得的 LP 份额
     */
    function addLiquidity(uint256 amount0, uint256 amount1) external returns (uint256 shares) {
        // 转入代币
        ERC20(token0).transferFrom(msg.sender, address(this), amount0);
        ERC20(token1).transferFrom(msg.sender, address(this), amount1);

        // 计算 LP 份额（简化：直接用较小值）
        if (totalSupply == 0) {
            shares = amount0 + amount1;
        } else {
            shares = (amount0 + amount1) * totalSupply / (reserve0 + reserve1);
        }

        require(shares > 0, "MiniSwap: INSUFFICIENT_LIQUIDITY");

        // 更新状态
        balanceOf[msg.sender] += shares;
        totalSupply += shares;
        reserve0 += amount0;
        reserve1 += amount1;

        emit AddLiquidity(msg.sender, amount0, amount1, shares);
    }

    /**
     * @notice 移除流动性
     * @param shares 要移除的 LP 份额
     * @return amount0 返还的 Token0 数量
     * @return amount1 返还的 Token1 数量
     */
    function removeLiquidity(uint256 shares) external returns (uint256 amount0, uint256 amount1) {
        require(balanceOf[msg.sender] >= shares, "MiniSwap: INSUFFICIENT_SHARES");

        // 计算返还数量
        amount0 = shares * reserve0 / totalSupply;
        amount1 = shares * reserve1 / totalSupply;

        require(amount0 > 0 && amount1 > 0, "MiniSwap: INSUFFICIENT_LIQUIDITY");

        // 更新状态
        balanceOf[msg.sender] -= shares;
        totalSupply -= shares;
        reserve0 -= amount0;
        reserve1 -= amount1;

        // 转出代币
        ERC20(token0).transfer(msg.sender, amount0);
        ERC20(token1).transfer(msg.sender, amount1);

        emit RemoveLiquidity(msg.sender, amount0, amount1, shares);
    }

    /**
     * @notice 代币兑换（1:1 比例，无手续费）
     * @param tokenIn 输入代币地址
     * @param amountIn 输入数量
     * @return amountOut 输出数量
     */
    function swap(address tokenIn, uint256 amountIn) external returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "MiniSwap: INVALID_TOKEN");
        require(amountIn > 0, "MiniSwap: ZERO_AMOUNT");

        bool isToken0 = tokenIn == token0;
        address tokenOut = isToken0 ? token1 : token0;

        // 简化版：1:1 兑换
        amountOut = amountIn;

        // 检查流动性
        uint256 reserveOut = isToken0 ? reserve1 : reserve0;
        require(amountOut <= reserveOut, "MiniSwap: INSUFFICIENT_LIQUIDITY");

        // 转入
        ERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // 更新储备
        if (isToken0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        // 转出
        ERC20(tokenOut).transfer(msg.sender, amountOut);

        emit Swap(msg.sender, tokenIn, amountIn, tokenOut, amountOut);
    }

    /**
     * @notice 获取储备量
     */
    function getReserves() external view returns (uint256 _reserve0, uint256 _reserve1) {
        return (reserve0, reserve1);
    }
}
