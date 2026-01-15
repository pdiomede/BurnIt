import React, { useEffect, useMemo, useState } from 'react';
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
  },
  {
    name: 'revokeOwnership',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
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

const COVALENT_API_KEY = import.meta.env.VITE_COVALENT_API_KEY || '';

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
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState('');
  const [revokeLoading, setRevokeLoading] = useState(false);

  const networkLabel = useMemo(
    () => CHAIN_LABELS[chainId] || `Chain ID: ${chainId || '-'}`,
    [chainId]
  );

  const resetMessages = () => {
    setError('');
    setStatus({ type: '', message: '' });
  };

  useEffect(() => {
    const fetchTokens = async () => {
      setTokensError('');
      setTokens([]);

      if (!isConnected || !address) {
        return;
      }

      if (!COVALENT_API_KEY) {
        setTokensError('Set VITE_COVALENT_API_KEY to load wallet tokens.');
        return;
      }

      const supportedChains = [8453, 84532];
      if (!supportedChains.includes(chainId)) {
        setTokensError('Token list is supported on Base and Base Sepolia only.');
        return;
      }

      try {
        setTokensLoading(true);
        const response = await fetch(
          `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?key=${COVALENT_API_KEY}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch tokens.');
        }
        const payload = await response.json();
        const items = payload?.data?.items || [];
        const parsed = items
          .filter((item) => item.contract_address && item.contract_decimals !== null)
          .map((item) => {
            const decimals = Number(item.contract_decimals || 0);
            const rawBalance = BigInt(item.balance || '0');
            return {
              address: item.contract_address,
              name: item.contract_name || 'Unknown',
              symbol: item.contract_ticker_symbol || '',
              decimals,
              balance: rawBalance,
              formattedBalance: formatUnits(rawBalance, decimals)
            };
          })
          .filter((item) => item.balance > 0n);

        setTokens(parsed);
      } catch (err) {
        setTokensError('Unable to load token list. Check API key and network.');
      } finally {
        setTokensLoading(false);
      }
    };

    fetchTokens();
  }, [address, isConnected, chainId]);

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

  const handleUseToken = (token) => {
    setContractAddress(token.address);
    setTokenInfo({
      name: token.name || '-',
      symbol: token.symbol || '-',
      decimals: token.decimals || 18,
      balance: token.formattedBalance || '0'
    });
    setBurnAmount(token.formattedBalance || '');
    resetMessages();
  };

  const handleRevokeOwnership = async () => {
    resetMessages();

    if (!walletClient) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!isAddress(contractAddress)) {
      setError('Please enter a valid contract address.');
      return;
    }

    const confirmed = confirm(
      'Revoking ownership is irreversible. Are you sure you want to proceed?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setRevokeLoading(true);
      setStatus({ type: 'pending', message: 'Submitting revoke ownership...' });
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: 'revokeOwnership',
        args: []
      });
      setTxHash(hash);
      setStatus({
        type: 'pending',
        message: 'Transaction sent! Waiting for confirmation...'
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus({
        type: 'success',
        message: '✅ Ownership revoked successfully.'
      });
    } catch (err) {
      setError('Failed to revoke ownership. Make sure you are the owner.');
      setStatus({ type: '', message: '' });
    } finally {
      setRevokeLoading(false);
    }
  };

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

      <div className="token-section">
        <div className="info-card">
          <h3>Wallet Tokens</h3>
          {!isConnected && <p>Connect your wallet to load token balances.</p>}
          {isConnected && tokensLoading && <p>Loading tokens...</p>}
          {isConnected && tokensError && <p className="error-text">{tokensError}</p>}
          {isConnected && !tokensLoading && !tokensError && tokens.length === 0 && (
            <p>No ERC20 tokens found with balance.</p>
          )}
          {tokens.length > 0 && (
            <div className="token-list">
              {tokens.map((token) => (
                <div key={token.address} className="token-item">
                  <div>
                    <strong>
                      {token.name} {token.symbol ? `(${token.symbol})` : ''}
                    </strong>
                    <div className="token-meta">{token.formattedBalance}</div>
                    <div className="token-meta">{token.address}</div>
                  </div>
                  <button
                    className="btn btn-link"
                    onClick={() => handleUseToken(token)}
                  >
                    Burn Max
                  </button>
                </div>
              ))}
            </div>
          )}
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

        <button
          className="btn btn-secondary"
          onClick={handleRevokeOwnership}
          disabled={!isConnected || tokenInfo.name === '-' || revokeLoading}
          style={{ marginTop: '12px' }}
        >
          {revokeLoading ? 'Revoking Ownership...' : 'Revoke Ownership'}
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
