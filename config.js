// Configuration file for Base Coin Burner Mini App

// Default contract address (optional - can be set via UI)
const DEFAULT_CONTRACT_ADDRESS = '';

// Network configuration
const NETWORK_CONFIG = {
    mainnet: {
        chainId: 8453,
        name: 'Base Mainnet',
        rpcUrl: 'https://mainnet.base.org',
        explorerUrl: 'https://basescan.org'
    },
    sepolia: {
        chainId: 84532,
        name: 'Base Sepolia',
        rpcUrl: 'https://sepolia.base.org',
        explorerUrl: 'https://sepolia.basescan.org'
    }
};

// Gas settings
const GAS_SETTINGS = {
    defaultGasLimit: 100000,
    gasMultiplier: 1.2 // 20% buffer
};

// Export for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEFAULT_CONTRACT_ADDRESS,
        NETWORK_CONFIG,
        GAS_SETTINGS
    };
}
