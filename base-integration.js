// Base App Integration Helper
// This file provides additional integration methods for Base app smart wallets

/**
 * Detects if the app is running inside Base app
 */
function isInBaseApp() {
    // Check for Base app user agent
    if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('baseapp') || ua.includes('base-')) {
            return true;
        }
    }
    
    // Check for Base app window properties
    if (typeof window !== 'undefined') {
        if (window.baseApp || window.__BASE_APP__) {
            return true;
        }
        
        // Check if we're in an iframe from Base domain
        try {
            if (window.parent !== window && 
                (window.location.hostname.includes('base.org') || 
                 window.location.hostname.includes('base.xyz'))) {
                return true;
            }
        } catch (e) {
            // Cross-origin, might be Base app
        }
    }
    
    return false;
}

/**
 * Gets the Base app wallet provider if available
 */
async function getBaseWalletProvider() {
    // Method 1: Coinbase SDK
    if (typeof window.CoinbaseSDK !== 'undefined') {
        return {
            type: 'coinbase-sdk',
            sdk: window.CoinbaseSDK
        };
    }
    
    // Method 2: Coinbase Wallet extension/provider
    if (window.ethereum) {
        // Check if Coinbase Wallet
        if (window.ethereum.isCoinbaseWallet) {
            return {
                type: 'coinbase-extension',
                provider: window.ethereum
            };
        }
        
        // Check providers array for Coinbase
        if (window.ethereum.providers) {
            const coinbaseProvider = window.ethereum.providers.find(
                p => p.isCoinbaseWallet || p.isCoinbaseBrowser
            );
            if (coinbaseProvider) {
                return {
                    type: 'coinbase-extension',
                    provider: coinbaseProvider
                };
            }
        }
    }
    
    // Method 3: Base app embedded wallet (postMessage API)
    if (window.parent && window.parent !== window) {
        return {
            type: 'base-embedded',
            parent: window.parent
        };
    }
    
    return null;
}

/**
 * Creates an ethers provider for Base smart wallet
 */
async function createBaseProvider(walletProvider) {
    const { ethers } = window;
    
    if (!ethers) {
        throw new Error('ethers.js is required');
    }
    
    switch (walletProvider.type) {
        case 'coinbase-sdk':
            // Initialize Coinbase SDK
            const { CoinbaseSDK } = walletProvider.sdk;
            const sdk = new CoinbaseSDK({
                appName: 'Base Coin Burner',
                appChainIds: [8453, 84532]
            });
            const wallet = await sdk.connect();
            return {
                provider: new ethers.providers.JsonRpcProvider('https://mainnet.base.org'),
                signer: wallet.getSigner(),
                address: wallet.getAddress(),
                wallet: wallet
            };
            
        case 'coinbase-extension':
            const web3Provider = new ethers.providers.Web3Provider(walletProvider.provider);
            const signer = web3Provider.getSigner();
            const address = await signer.getAddress();
            return {
                provider: web3Provider,
                signer: signer,
                address: address,
                wallet: null
            };
            
        case 'base-embedded':
            // Use postMessage API to communicate with Base app
            return new Promise((resolve, reject) => {
                const messageHandler = (event) => {
                    if (event.data.type === 'WALLET_PROVIDER_RESPONSE') {
                        window.removeEventListener('message', messageHandler);
                        if (event.data.provider) {
                            const web3Provider = new ethers.providers.Web3Provider(event.data.provider);
                            resolve({
                                provider: web3Provider,
                                signer: web3Provider.getSigner(),
                                address: event.data.address,
                                wallet: null
                            });
                        } else {
                            reject(new Error('Failed to get wallet provider from Base app'));
                        }
                    }
                };
                
                window.addEventListener('message', messageHandler);
                walletProvider.parent.postMessage({
                    type: 'REQUEST_WALLET_PROVIDER',
                    source: 'base-coin-burner'
                }, '*');
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    window.removeEventListener('message', messageHandler);
                    reject(new Error('Timeout waiting for Base app wallet provider'));
                }, 5000);
            });
            
        default:
            throw new Error('Unknown wallet provider type');
    }
}

// Make functions available globally if not using modules
if (typeof window !== 'undefined') {
    window.BaseIntegration = {
        isInBaseApp,
        getBaseWalletProvider,
        createBaseProvider
    };
}
