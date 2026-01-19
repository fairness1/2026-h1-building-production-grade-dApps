import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONFIG = {
  networkName: 'Polkadot Paseo Testnet',
  chainId: 420420421,
  rpcUrl: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
  tokenA: '0x3bEEbBe939bEB221bdC7A8baA81fEa69295043A8',
  tokenB: '0x298FA4226C8880fAccACB844dc4bc83483969D21',
  miniSwap: '0x4544F33f362C55E15F13fbc92312b635c8693Db6',
};

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
];

const MINISWAP_ABI = [
  'function addLiquidity(uint256 amountA, uint256 amountB)',
  'function removeLiquidity(uint256 amount)',
  'function swap(address tokenIn, uint256 amountIn)',
  'function liquidity(address) view returns (uint256)',
  'function getPoolBalances() view returns (uint256, uint256)',
];

export default function Home() {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState<any>(null);
  const [balances, setBalances] = useState({ tokenA: '0', tokenB: '0', liquidity: '0' });
  const [poolBalances, setPoolBalances] = useState({ tokenA: '0', tokenB: '0' });
  
  const [addAmountA, setAddAmountA] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState('AtoB');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      
      const network = await provider.getNetwork();
      if (network.chainId !== CONFIG.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + CONFIG.chainId.toString(16) }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x' + CONFIG.chainId.toString(16),
                chainName: CONFIG.networkName,
                rpcUrls: [CONFIG.rpcUrl],
              }],
            });
          }
        }
      }

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(provider);
      setAccount(address);
      await loadBalances(provider, address);
      setMessage('Wallet connected successfully!');
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    }
  };

  const loadBalances = async (provider: any, address: string) => {
    try {
      const tokenA = new ethers.Contract(CONFIG.tokenA, ERC20_ABI, provider);
      const tokenB = new ethers.Contract(CONFIG.tokenB, ERC20_ABI, provider);
      const miniSwap = new ethers.Contract(CONFIG.miniSwap, MINISWAP_ABI, provider);

      const [balA, balB, liq, poolBals] = await Promise.all([
        tokenA.balanceOf(address),
        tokenB.balanceOf(address),
        miniSwap.liquidity(address),
        miniSwap.getPoolBalances(),
      ]);

      setBalances({
        tokenA: ethers.utils.formatEther(balA),
        tokenB: ethers.utils.formatEther(balB),
        liquidity: ethers.utils.formatEther(liq),
      });

      setPoolBalances({
        tokenA: ethers.utils.formatEther(poolBals[0]),
        tokenB: ethers.utils.formatEther(poolBals[1]),
      });
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const handleAddLiquidity = async () => {
    if (!provider || !addAmountA) return;
    
    try {
      setLoading(true);
      setMessage('Adding liquidity...');
      
      const signer = provider.getSigner();
      const amount = ethers.utils.parseEther(addAmountA);
      
      const tokenA = new ethers.Contract(CONFIG.tokenA, ERC20_ABI, signer);
      const tokenB = new ethers.Contract(CONFIG.tokenB, ERC20_ABI, signer);
      const miniSwap = new ethers.Contract(CONFIG.miniSwap, MINISWAP_ABI, signer);
      
      const tx1 = await tokenA.approve(CONFIG.miniSwap, amount);
      await tx1.wait();
      
      const tx2 = await tokenB.approve(CONFIG.miniSwap, amount);
      await tx2.wait();
      
      const tx3 = await miniSwap.addLiquidity(amount, amount);
      await tx3.wait();
      
      setMessage('Liquidity added successfully!');
      setAddAmountA('');
      await loadBalances(provider, account);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!provider || !removeAmount) return;
    
    try {
      setLoading(true);
      setMessage('Removing liquidity...');
      
      const signer = provider.getSigner();
      const amount = ethers.utils.parseEther(removeAmount);
      const miniSwap = new ethers.Contract(CONFIG.miniSwap, MINISWAP_ABI, signer);
      
      const tx = await miniSwap.removeLiquidity(amount);
      await tx.wait();
      
      setMessage('Liquidity removed successfully!');
      setRemoveAmount('');
      await loadBalances(provider, account);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!provider || !swapAmount) return;
    
    try {
      setLoading(true);
      setMessage('Swapping tokens...');
      
      const signer = provider.getSigner();
      const amount = ethers.utils.parseEther(swapAmount);
      const tokenIn = swapDirection === 'AtoB' ? CONFIG.tokenA : CONFIG.tokenB;
      const token = new ethers.Contract(tokenIn, ERC20_ABI, signer);
      const miniSwap = new ethers.Contract(CONFIG.miniSwap, MINISWAP_ABI, signer);
      
      const tx1 = await token.approve(CONFIG.miniSwap, amount);
      await tx1.wait();
      
      const tx2 = await miniSwap.swap(tokenIn, amount);
      await tx2.wait();
      
      setMessage('Swap completed successfully!');
      setSwapAmount('');
      await loadBalances(provider, account);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>        <p>Polkadot Paseo Testnet</p>
      </header>

      <div style={styles.walletSection}>
        {!account ? (
          <button onClick={connectWallet} style={styles.connectButton}>
            Connect MetaMask
          </button>
        ) : (
          <div style={styles.accountInfo}>
            <p>          </div>
        )}
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {account && (
        <>
          <div style={styles.card}>
            <h3>            <p>Token A: {balances.tokenA}</p>
            <p>Token B: {balances.tokenB}</p>
            <p>My Liquidity: {balances.liquidity}</p>
          </div>

          <div style={styles.card}>
            <h3>            <p>Token A: {poolBalances.tokenA}</p>
            <p>Token B: {poolBalances.tokenB}</p>
          </div>

          <div style={styles.card}>
            <h3>            <input
              type="number"
              placeholder="Amount (1:1 ratio)"
              value={addAmountA}
              onChange={(e) => setAddAmountA(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleAddLiquidity} disabled={loading} style={styles.button}>
              {loading ? 'Processing...' : 'Add Liquidity'}
            </button>
          </div>

          <div style={styles.card}>
            <h3>            <input
              type="number"
              placeholder="Amount"
              value={removeAmount}
              onChange={(e) => setRemoveAmount(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleRemoveLiquidity} disabled={loading} style={styles.button}>
              {loading ? 'Processing...' : 'Remove Liquidity'}
            </button>
          </div>

          <div style={styles.card}>
            <h3>            <select
              value={swapDirection}
              onChange={(e) => setSwapDirection(e.target.value)}
              style={styles.select}
            >
              <option value="AtoB">Token A ¡ú Token B</option>
              <option value="BtoA">Token B ¡ú Token A</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleSwap} disabled={loading} style={styles.button}>
              {loading ? 'Processing...' : 'Swap'}
            </button>
          </div>
        </>
      )}

      <footer style={styles.footer}>
        <p>      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '10px',
    color: 'white',
  },
  walletSection: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  connectButton: {
    padding: '15px 30px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  accountInfo: {
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
  },
  message: {
    padding: '10px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    marginTop: '40px',
    padding: '20px',
    color: '#666',
  },
};
