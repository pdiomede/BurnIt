// Base Coin Burner Mini App
// Interacts with ERC20 token contracts on Base network

// Base network configuration
const BASE_MAINNET = {
    chainId: '0x2105', // 8453 in decimal
    chainName: 'Base',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org']
};

const BASE_SEPOLIA = {
    chainId: '0x14a34', // 84532 in decimal
    chainName: 'Base Sepolia',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org']
};

// Standard ERC20 ABI (includes burn function)
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_value", "type": "uint256"}
        ],
        "name": "burn",
        "outputs": [],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_from", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "burnFrom",
        "outputs": [],
        "type": "function"
    }
];

// Global state
let provider = null;
let signer = null;
let userAddress = null;
let contract = null;
let walletType = null; // 'coinbase' or 'web3'
let coinbaseWallet = null;
let tokenInfo = {
    name: '',
    symbol: '',
    decimals: 18,
    balance: '0'
};

// DOM elements
const connectWalletBtn = document.getElementById('connect-wallet');
const walletStatus = document.getElementById('wallet-status');
const walletInfo = document.getElementById('wallet-info');
const walletAddress = document.getElementById('wallet-address');
const networkName = document.getElementById('network-name');
const contractAddressInput = document.getElementById('contract-address');
const loadContractBtn = document.getElementById('load-contract');
const contractInfo = document.getElementById('contract-info');
const tokenName = document.getElementById('token-name');
const tokenSymbol = document.getElementById('token-symbol');
const tokenBalance = document.getElementById('token-balance');
const tokenDecimals = document.getElementById('token-decimals');
const burnAmountInput = document.getElementById('burn-amount');
const burnMaxBtn = document.getElementById('burn-max');
const burnHalfBtn = document.getElementById('burn-half');
const burnButton = document.getElementById('burn-button');
const transactionStatus = document.getElementById('transaction-status');
const statusMessage = document.getElementById('status-message');
const txHash = document.getElementById('tx-hash');
const errorMessage = document.getElementById('error-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkWalletConnection();
    setupEventListeners();
});

// Check if wallet is already connected
async function checkWalletConnection() {
    // Check for Base smart wallet first (Coinbase SDK)
    if (await isBaseAppEnvironment()) {
        try {
            await connectBaseSmartWallet();
        } catch (error) {
            console.error('Error connecting Base smart wallet:', error);
        }
    }
    // Fallback to traditional Web3 wallets
    else if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWeb3Wallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    }
}

// Check if we're in Base app environment
async function isBaseAppEnvironment() {
    // Use BaseIntegration helper if available
    if (typeof window.BaseIntegration !== 'undefined' && window.BaseIntegration.isInBaseApp) {
        return window.BaseIntegration.isInBaseApp();
    }
    
    // Check for Coinbase SDK
    if (typeof window.CoinbaseSDK !== 'undefined') {
        return true;
    }
    // Check for Base app specific environment
    if (window.location.hostname.includes('base.org') || 
        window.location.hostname.includes('base.xyz') ||
        window.navigator.userAgent.includes('BaseApp')) {
        return true;
    }
    // Check if coinbase provider exists
    if (window.ethereum && window.ethereum.isCoinbaseWallet) {
        return true;
    }
    // Check for Base app window properties
    if (window.baseApp || window.__BASE_APP__) {
        return true;
    }
    return false;
}

// Setup event listeners
function setupEventListeners() {
    connectWalletBtn.addEventListener('click', connectWallet);
    loadContractBtn.addEventListener('click', loadContract);
    burnMaxBtn.addEventListener('click', () => setBurnAmount('max'));
    burnHalfBtn.addEventListener('click', () => setBurnAmount('half'));
    burnButton.addEventListener('click', burnTokens);
    
    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        connectWallet();
    }
}

// Handle chain changes
function handleChainChanged(chainId) {
    window.location.reload();
}

// Connect wallet - tries Base smart wallet first, then falls back to Web3
async function connectWallet() {
    try {
        hideError();
        
        // Try Base smart wallet first
        if (await isBaseAppEnvironment()) {
            await connectBaseSmartWallet();
        } 
        // Fallback to traditional Web3 wallets
        else {
            await connectWeb3Wallet();
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError(`Failed to connect wallet: ${error.message}`);
    }
}

// Connect Base smart wallet (Coinbase SDK)
async function connectBaseSmartWallet() {
    try {
        // Try using BaseIntegration helper first
        if (typeof window.BaseIntegration !== 'undefined') {
            const walletProvider = await window.BaseIntegration.getBaseWalletProvider();
            if (walletProvider) {
                const walletInfo = await window.BaseIntegration.createBaseProvider(walletProvider);
                provider = walletInfo.provider;
                signer = walletInfo.signer;
                userAddress = walletInfo.address;
                coinbaseWallet = walletInfo.wallet;
                walletType = 'coinbase';
                updateWalletUI();
                return;
            }
        }
        
        // Method 1: Try Coinbase SDK if available
        if (typeof window.CoinbaseSDK !== 'undefined') {
            const { CoinbaseSDK } = window.CoinbaseSDK;
            const sdk = new CoinbaseSDK({
                appName: 'Base Coin Burner',
                appLogoUrl: window.location.origin + '/logo.png',
                appChainIds: [8453, 84532] // Base mainnet and Sepolia
            });
            
            coinbaseWallet = await sdk.connect();
            userAddress = coinbaseWallet.getAddress();
            
            // Create provider from Coinbase wallet
            provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
            signer = coinbaseWallet.getSigner();
            
            walletType = 'coinbase';
        }
        // Method 2: Use Coinbase provider if available
        else if (window.ethereum && (window.ethereum.isCoinbaseWallet || window.ethereum.providers)) {
            let ethereum = window.ethereum;
            
            // Check if Coinbase provider exists in providers array
            if (window.ethereum.providers) {
                ethereum = window.ethereum.providers.find(p => p.isCoinbaseWallet) || window.ethereum;
            }
            
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                showError('No accounts found');
                return;
            }
            
            userAddress = accounts[0];
            provider = new ethers.providers.Web3Provider(ethereum);
            signer = provider.getSigner();
            walletType = 'coinbase';
        }
        // Method 3: Direct Base app integration (if embedded)
        else if (window.parent && window.parent !== window && window.parent.postMessage) {
            // Request connection from parent (Base app)
            return new Promise((resolve, reject) => {
                const messageHandler = async (event) => {
                    if (event.data.type === 'WALLET_CONNECTED' && event.data.address) {
                        window.removeEventListener('message', messageHandler);
                        userAddress = event.data.address;
                        
                        // Use Base RPC
                        provider = new ethers.providers.JsonRpcProvider('https://mainnet.base.org');
                        
                        // If Base app provides a provider, use it
                        if (event.data.provider) {
                            provider = new ethers.providers.Web3Provider(event.data.provider);
                            signer = provider.getSigner();
                        } else {
                            // Fallback: create signer from address (may need Base app's signing method)
                            signer = provider.getSigner(userAddress);
                        }
                        
                        walletType = 'coinbase';
                        updateWalletUI();
                        resolve();
                    } else if (event.data.type === 'WALLET_ERROR') {
                        window.removeEventListener('message', messageHandler);
                        reject(new Error(event.data.error || 'Failed to connect wallet'));
                    }
                };
                
                window.addEventListener('message', messageHandler);
                window.parent.postMessage({
                    type: 'CONNECT_WALLET',
                    source: 'base-coin-burner'
                }, '*');
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    // Fallback to Web3 wallet
                    if (typeof window.ethereum !== 'undefined') {
                        connectWeb3Wallet().then(resolve).catch(reject);
                    } else {
                        reject(new Error('Timeout waiting for Base app wallet'));
                    }
                }, 10000);
            });
        } else {
            throw new Error('Base smart wallet not available');
        }
        
        // Verify we're on Base network
        try {
            const network = await provider.getNetwork();
            const isBase = network.chainId === 8453 || network.chainId === 84532;
            
            if (!isBase && walletType === 'coinbase') {
                // Base smart wallets are always on Base, but verify
                console.warn('Network mismatch, but continuing with Base smart wallet');
            }
        } catch (error) {
            // For Base smart wallets, assume Base network
            console.log('Assuming Base network for smart wallet');
        }
        
        // Update UI
        updateWalletUI();
        
    } catch (error) {
        console.error('Error connecting Base smart wallet:', error);
        // Fallback to Web3 wallet
        if (typeof window.ethereum !== 'undefined') {
            console.log('Falling back to Web3 wallet');
            await connectWeb3Wallet();
        } else {
            throw error;
        }
    }
}

// Connect traditional Web3 wallet (MetaMask, etc.)
async function connectWeb3Wallet() {
    if (typeof window.ethereum === 'undefined') {
        showError('Please install MetaMask or another Web3 wallet, or use Base app');
        return;
    }

    // Request account access
    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
        showError('No accounts found');
        return;
    }

    userAddress = accounts[0];
    
    // Initialize provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    walletType = 'web3';
    
    // Check network
    const network = await provider.getNetwork();
    const isBase = network.chainId === 8453 || network.chainId === 84532;
    
    if (!isBase) {
        const switchNetwork = confirm(
            'You are not on Base network. Would you like to switch to Base Mainnet?'
        );
        if (switchNetwork) {
            await switchToBaseNetwork();
        }
    }

    // Update UI
    updateWalletUI();
}

// Switch to Base network
async function switchToBaseNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_MAINNET.chainId }]
        });
    } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [BASE_MAINNET]
                });
            } catch (addError) {
                showError('Failed to add Base network');
            }
        } else {
            showError('Failed to switch network');
        }
    }
}

// Update wallet UI
async function updateWalletUI() {
    walletStatus.className = 'wallet-status connected';
    const walletTypeText = walletType === 'coinbase' ? ' (Base Smart Wallet)' : ' (Web3)';
    walletStatus.innerHTML = `<span class="status-icon">✅</span><span class="status-text">Connected${walletTypeText}</span>`;
    connectWalletBtn.textContent = 'Disconnect';
    connectWalletBtn.onclick = disconnectWallet;
    
    walletInfo.classList.remove('hidden');
    walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    
    try {
        const network = await provider.getNetwork();
        networkName.textContent = network.chainId === 8453 ? 'Base Mainnet' : 
                                 network.chainId === 84532 ? 'Base Sepolia' : 
                                 `Chain ID: ${network.chainId}`;
    } catch (error) {
        // For Base smart wallets, default to Base Mainnet
        networkName.textContent = walletType === 'coinbase' ? 'Base Mainnet (Smart Wallet)' : 'Unknown';
    }
}

// Disconnect wallet
async function disconnectWallet() {
    // Disconnect Coinbase wallet if connected
    if (walletType === 'coinbase' && coinbaseWallet) {
        try {
            if (coinbaseWallet.disconnect) {
                await coinbaseWallet.disconnect();
            }
        } catch (error) {
            console.error('Error disconnecting Coinbase wallet:', error);
        }
        coinbaseWallet = null;
    }
    
    provider = null;
    signer = null;
    userAddress = null;
    contract = null;
    walletType = null;
    
    walletStatus.className = 'wallet-status disconnected';
    walletStatus.innerHTML = '<span class="status-icon">🔌</span><span class="status-text">Not Connected</span>';
    connectWalletBtn.textContent = 'Connect Wallet';
    connectWalletBtn.onclick = connectWallet;
    
    walletInfo.classList.add('hidden');
    contractInfo.classList.add('hidden');
    burnButton.disabled = true;
    transactionStatus.classList.add('hidden');
}

// Load contract
async function loadContract() {
    try {
        hideError();
        
        if (!signer) {
            showError('Please connect your wallet first');
            return;
        }

        const contractAddress = contractAddressInput.value.trim();
        
        if (!contractAddress || !ethers.utils.isAddress(contractAddress)) {
            showError('Please enter a valid contract address');
            return;
        }

        showStatus('Loading contract...', 'pending');
        
        // Initialize contract
        contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
        
        // Load token info
        try {
            tokenInfo.name = await contract.name();
            tokenInfo.symbol = await contract.symbol();
            tokenInfo.decimals = await contract.decimals();
            const balance = await contract.balanceOf(userAddress);
            tokenInfo.balance = ethers.utils.formatUnits(balance, tokenInfo.decimals);
            
            // Update UI
            tokenName.textContent = tokenInfo.name;
            tokenSymbol.textContent = tokenInfo.symbol;
            tokenBalance.textContent = `${tokenInfo.balance} ${tokenInfo.symbol}`;
            tokenDecimals.textContent = tokenInfo.decimals;
            
            contractInfo.classList.remove('hidden');
            burnButton.disabled = false;
            
            hideStatus();
            
        } catch (error) {
            console.error('Error loading token info:', error);
            showError('Failed to load token information. Make sure this is a valid ERC20 contract.');
        }
        
    } catch (error) {
        console.error('Error loading contract:', error);
        showError(`Failed to load contract: ${error.message}`);
    }
}

// Set burn amount
function setBurnAmount(type) {
    if (!tokenInfo.balance || tokenInfo.balance === '0') {
        showError('No balance to burn');
        return;
    }

    const balance = parseFloat(tokenInfo.balance);
    
    if (type === 'max') {
        burnAmountInput.value = tokenInfo.balance;
    } else if (type === 'half') {
        burnAmountInput.value = (balance / 2).toFixed(6);
    }
}

// Burn tokens
async function burnTokens() {
    try {
        hideError();
        
        if (!contract || !signer) {
            showError('Please connect wallet and load contract first');
            return;
        }

        const amount = burnAmountInput.value.trim();
        
        if (!amount || parseFloat(amount) <= 0) {
            showError('Please enter a valid amount to burn');
            return;
        }

        const amountToBurn = parseFloat(amount);
        const balance = parseFloat(tokenInfo.balance);
        
        if (amountToBurn > balance) {
            showError('Insufficient balance');
            return;
        }

        // Confirm action
        const confirmBurn = confirm(
            `Are you sure you want to burn ${amount} ${tokenInfo.symbol}? This action is irreversible!`
        );
        
        if (!confirmBurn) {
            return;
        }

        showStatus('Preparing transaction...', 'pending');
        burnButton.disabled = true;

        // Convert amount to wei
        const amountWei = ethers.utils.parseUnits(amount, tokenInfo.decimals);
        
        // Estimate gas
        let gasEstimate;
        try {
            gasEstimate = await contract.estimateGas.burn(amountWei);
        } catch (error) {
            // Try burnFrom if burn doesn't work
            try {
                gasEstimate = await contract.estimateGas.burnFrom(userAddress, amountWei);
            } catch (error2) {
                throw new Error('Cannot estimate gas. Make sure the contract has a burn function.');
            }
        }

        showStatus('Please confirm the transaction in your wallet...', 'pending');

        // Send transaction
        let tx;
        try {
            // For Base smart wallets (Coinbase SDK), use direct transaction encoding
            // For Coinbase extension/Base app wallets, standard contract methods work fine
            if (walletType === 'coinbase' && coinbaseWallet) {
                // Use Coinbase SDK wallet's sendTransaction method
                const txData = contract.interface.encodeFunctionData('burn', [amountWei]);
                tx = await signer.sendTransaction({
                    to: contract.address,
                    data: txData,
                    gasLimit: gasEstimate.mul(120).div(100)
                });
            } else {
                // Standard Web3 wallet or Coinbase extension (both work with contract methods)
                tx = await contract.burn(amountWei, {
                    gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
                });
            }
        } catch (error) {
            // Try burnFrom if burn doesn't work
            try {
                if (walletType === 'coinbase' && coinbaseWallet) {
                    // Coinbase SDK wallet with burnFrom
                    const txData = contract.interface.encodeFunctionData('burnFrom', [userAddress, amountWei]);
                    tx = await signer.sendTransaction({
                        to: contract.address,
                        data: txData,
                        gasLimit: gasEstimate.mul(120).div(100)
                    });
                } else {
                    // Standard Web3 wallet or Coinbase extension
                    tx = await contract.burnFrom(userAddress, amountWei, {
                        gasLimit: gasEstimate.mul(120).div(100)
                    });
                }
            } catch (error2) {
                throw new Error('Transaction failed. Make sure the contract has a burn function. Error: ' + (error2.message || error2));
            }
        }

        showStatus(`Transaction sent! Waiting for confirmation...`, 'pending');
        txHash.classList.remove('hidden');
        const network = await provider.getNetwork();
        const explorerUrl = network.chainId === 8453 
            ? `https://basescan.org/tx/${tx.hash}`
            : network.chainId === 84532
            ? `https://sepolia.basescan.org/tx/${tx.hash}`
            : `#`;
        txHash.innerHTML = `<a href="${explorerUrl}" target="_blank">View on BaseScan: ${tx.hash.substring(0, 10)}...${tx.hash.substring(58)}</a>`;

        // Wait for confirmation
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            showStatus(`✅ Successfully burned ${amount} ${tokenInfo.symbol}!`, 'success');
            
            // Reload balance
            const newBalance = await contract.balanceOf(userAddress);
            tokenInfo.balance = ethers.utils.formatUnits(newBalance, tokenInfo.decimals);
            tokenBalance.textContent = `${tokenInfo.balance} ${tokenInfo.symbol}`;
            
            // Clear burn amount
            burnAmountInput.value = '';
        } else {
            showStatus('Transaction failed', 'error');
        }
        
        burnButton.disabled = false;
        
    } catch (error) {
        console.error('Error burning tokens:', error);
        showError(`Failed to burn tokens: ${error.message}`);
        burnButton.disabled = false;
        hideStatus();
    }
}

// Show status
function showStatus(message, type = 'pending') {
    transactionStatus.classList.remove('hidden');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

// Hide status
function hideStatus() {
    // Keep status visible but can be hidden if needed
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

// Hide error
function hideError() {
    errorMessage.classList.add('hidden');
}
