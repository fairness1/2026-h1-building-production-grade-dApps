import { useState } from 'react';
import { ethers } from 'ethers';
import { MiniSwap_ADDRESS, MiniSwap_ABI, ERC20_ABI } from '../constants';

interface SwapProps {
    provider: ethers.BrowserProvider;
    account: string;
    canSendTx?: boolean;
}

export const Swap = ({ provider, account, canSendTx = false }: SwapProps) => {
    const [tokenIn, setTokenIn] = useState('');
    const [tokenOut, setTokenOut] = useState('');
    const [amountIn, setAmountIn] = useState('');
    const [status, setStatus] = useState('');

    const handleSwap = async () => {
        setStatus('Swapping...');
        try {
            if (!canSendTx) {
                setStatus('Connected wallet cannot send transactions; please use MetaMask or another EVM wallet');
                return;
            }

            const signer = await provider.getSigner();
            console.log('swap: signer', typeof (signer as any).sendTransaction === 'function');
            const uniswap = new ethers.Contract(MiniSwap_ADDRESS, MiniSwap_ABI, signer);
            // Use JSON-RPC provider for reliable read operations
            const readProvider = new ethers.JsonRpcProvider((await import('../constants')).RPC);
            const tokenInRead = new ethers.Contract(tokenIn, ERC20_ABI, readProvider as any);
            const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);

            const amountInWei = ethers.parseEther(amountIn);
            // Check allowance
            let allowance: bigint = 0n;
            try {
                allowance = await tokenInRead.allowance(account, MiniSwap_ADDRESS);
            } catch (e: any) {
                // Provide clearer feedback if RPC returned empty result (0x) or decode failed
                throw new Error('Failed to read token allowance from network RPC. Please ensure the token contract is deployed and reachable; try again or refresh the page.');
            }

            if (allowance < amountInWei) {
                setStatus('Approving token...');
                if (typeof (signer as any).sendTransaction !== 'function') throw new Error('Connected wallet cannot send transactions; please use MetaMask');
                const tx = await tokenInContract.approve(MiniSwap_ADDRESS, amountInWei);
                await tx.wait();
                setStatus('Approved. Swapping...');
            }

            const tx = await uniswap.swap(
                tokenIn,
                tokenOut,
                amountInWei
            );
            await tx.wait();
            setStatus('Swap successful!');
        } catch (err: any) {
            console.error(err);
            setStatus(`Swap failed: ${err?.message || String(err)}`);
        }
    };

    return (
        <div className="card">
            <h2>Swap</h2>
            <div className="input-group">
                <label>Token In Address</label>
                <input
                    placeholder="0x..."
                    value={tokenIn}
                    onChange={(e) => setTokenIn(e.target.value)}
                />
                <input
                    placeholder="Amount"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                />
            </div>
            <div className="input-group">
                <label>Token Out Address</label>
                <input
                    placeholder="0x..."
                    value={tokenOut}
                    onChange={(e) => setTokenOut(e.target.value)}
                />
            </div>
            <button onClick={handleSwap}>Swap</button>
            {status && <p className="status-msg">{status}</p>}
        </div>
    );
};
