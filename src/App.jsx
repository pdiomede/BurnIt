import React, { useMemo, useState } from 'react';
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient
} from 'wagmi';
import { formatUnits, isAddress, parseUnits } from 'viem';
import { Wallet } from '@coinbase/onchainkit/wallet';

const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'burn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'burnFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  }
];

const CHAIN_LABELS = {
  8453: 'Base Mainnet',
  84532: 'Base Sepolia'
};

const EMPTY_TOKEN = {
  name: '-',
  symbol: '-',
  decimals: 18,
  balance: '0'
};

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [contractAddress, setContractAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState(EMPTY_TOKEN);
  const [burnAmount, setBurnAmount] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const networkLabel = useMemo(
    () => CHAIN_LABELS[chainId] || `Chain ID: ${chainId || '-'}`,
    [chainId]
  );

  const resetMessages = () => {
    setError('');
    setStatus({ type: '', message: '' });
  };

  const handleLoadContract = async () => {
    resetMessages();

    if (!isConnected || !address) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!isAddress(contractAddress)) {
      setError('Please enter a valid contract address.');
      return;
    }

    try {
      setStatus({ type: 'pending', message: 'Loading contract...' });
      const [name, symbol, decimals, balance] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'name'
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address]
        })
      ]);

      const formattedBalance = formatUnits(balance, decimals);
      setTokenInfo({
        name,
        symbol,
        decimals,
        balance: formattedBalance
      });
      setStatus({ type: '', message: '' });
    } catch (err) {
      setError('Failed to load token information.');
      setStatus({ type: '', message: '' });
    }
  };

  const handleBurnAmount = (type) => {
    if (!tokenInfo.balance || tokenInfo.balance === '0') {
      setError('No balance to burn.');
      return;
    }
    const balance = parseFloat(tokenInfo.balance);
    if (type === 'max') {
      setBurnAmount(tokenInfo.balance);
    } else {
      setBurnAmount((balance / 2).toFixed(6));
    }
  };

  const handleBurn = async () => {
    resetMessages();

    if (!walletClient) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!isAddress(contractAddress)) {
      setError('Please enter a valid contract address.');
      return;
    }

    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      setError('Please enter a valid amount to burn.');
      return;
    }

    const amountWei = parseUnits(burnAmount, tokenInfo.decimals);

    try {
      setStatus({ type: 'pending', message: 'Preparing transaction...' });
      let hash;
      try {
        hash = await walletClient.writeContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'burn',
          args: [amountWei]
        });
      } catch (err) {
        hash = await walletClient.writeContract({
          address: contractAddress,
          abi: ERC20_ABI,
          functionName: 'burnFrom',
          args: [address, amountWei]
        });
      }

      setTxHash(hash);
      setStatus({
        type: 'pending',
        message: 'Transaction sent! Waiting for confirmation...'
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setStatus({
        type: 'success',
        message: `✅ Successfully burned ${burnAmount} ${tokenInfo.symbol}!`
      });

      const newBalance = await publicClient.readContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address]
      });
      setTokenInfo((prev) => ({
        ...prev,
        balance: formatUnits(newBalance, prev.decimals)
      }));
      setBurnAmount('');
    } catch (err) {
      setError('Transaction failed. Make sure the contract supports burning.');
      setStatus({ type: '', message: '' });
    }
  };

  const explorerBase = chainId === 84532 ? 'https://sepolia.basescan.org' : 'https://basescan.org';

  return (
    <div className="container">
      <header>
        <h1>🔥 Base Coin Burner</h1>
        <p className="subtitle">Burn your coins/posts on Base</p>
      </header>

      <div className="wallet-section">
        <div
          id="wallet-status"
          className={`wallet-status ${isConnected ? 'connected' : 'disconnected'}`}
        >
          <span className="status-icon">{isConnected ? '✅' : '🔌'}</span>
          <span className="status-text">
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        <Wallet>
          <Wallet.ConnectButton className="btn btn-primary" />
        </Wallet>

        <div id="wallet-info" className={`wallet-info ${isConnected ? '' : 'hidden'}`}>
          <p>
            <strong>Address:</strong>{' '}
            <span id="wallet-address">
              {address
                ? `${address.slice(0, 6)}...${address.slice(address.length - 4)}`
                : '-'}
            </span>
          </p>
          <p>
            <strong>Network:</strong>{' '}
            <span id="network-name">{networkLabel}</span>
          </p>
        </div>
      </div>

      <div className="burn-section">
        <div className="form-group">
          <label htmlFor="contract-address">Coin Contract Address</label>
          <input
            type="text"
            id="contract-address"
            placeholder="0x..."
            className="input-field"
            value={contractAddress}
            onChange={(event) => setContractAddress(event.target.value.trim())}
          />
          <button id="load-contract" className="btn btn-secondary" onClick={handleLoadContract}>
            Load Contract
          </button>
        </div>

        <div id="contract-info" className={`contract-info ${tokenInfo.name === '-' ? 'hidden' : ''}`}>
          <div className="info-card">
            <h3>Contract Information</h3>
            <p>
              <strong>Name:</strong> <span id="token-name">{tokenInfo.name}</span>
            </p>
            <p>
              <strong>Symbol:</strong> <span id="token-symbol">{tokenInfo.symbol}</span>
            </p>
            <p>
              <strong>Your Balance:</strong>{' '}
              <span id="token-balance">
                {tokenInfo.balance} {tokenInfo.symbol}
              </span>
            </p>
            <p>
              <strong>Decimals:</strong> <span id="token-decimals">{tokenInfo.decimals}</span>
            </p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="burn-amount">Amount to Burn</label>
          <input
            type="number"
            id="burn-amount"
            placeholder="0.0"
            step="0.000001"
            min="0"
            className="input-field"
            value={burnAmount}
            onChange={(event) => setBurnAmount(event.target.value)}
          />
          <div className="button-group">
            <button id="burn-max" className="btn btn-link" onClick={() => handleBurnAmount('max')}>
              Burn Max
            </button>
            <button id="burn-half" className="btn btn-link" onClick={() => handleBurnAmount('half')}>
              Burn Half
            </button>
          </div>
        </div>

        <button
          id="burn-button"
          className="btn btn-danger"
          onClick={handleBurn}
          disabled={!isConnected || tokenInfo.name === '-'}
        >
          🔥 Burn Coins
        </button>
      </div>

      {status.message && (
        <div id="transaction-status" className="transaction-status">
          <h3>Transaction Status</h3>
          <div id="status-message" className={`status-message ${status.type}`}>
            {status.message}
          </div>
          {txHash && (
            <div id="tx-hash" className="tx-hash">
              <a href={`${explorerBase}/tx/${txHash}`} target="_blank" rel="noreferrer">
                View on BaseScan: {txHash.slice(0, 10)}...{txHash.slice(-6)}
              </a>
            </div>
          )}
        </div>
      )}

      {error && <div id="error-message" className="error-message">{error}</div>}
    </div>
  );
}
