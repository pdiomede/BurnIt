# Base Coin Burner Mini App

A web-based mini app for Base that allows you to burn coins/tokens from ERC20 contracts on the Base blockchain.

## Features

- 🔗 **Wallet Connection** - Supports both Base smart wallets (Coinbase SDK) and traditional Web3 wallets (MetaMask, etc.)
- 🎯 **Base App Integration** - Works seamlessly with Base app's smart wallets (no WalletConnect needed)
- 📊 **Contract Information** - View token name, symbol, balance, and decimals
- 🔥 **Burn Functionality** - Burn your tokens with a simple interface
- 💰 **Flexible Amounts** - Burn any amount, max, or half of your balance
- ✅ **Transaction Tracking** - Real-time transaction status and BaseScan links
- 🎨 **Modern UI** - Beautiful, responsive design

## Setup

### Local Development

1. **Serve the files** using a local web server:

```bash
cd mini-app
python3 server.py
```

Or manually:
```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

2. **Open in browser**: Navigate to `http://localhost:8000`

## Deployment

### Quick Deploy (Choose One)

#### 🚀 Netlify (Easiest - Recommended)

**Option A: Drag & Drop**
1. Go to [netlify.com](https://netlify.com)
2. Drag the `mini-app` folder to the deploy area
3. Done! Your app is live instantly

**Option B: CLI**
```bash
npm install -g netlify-cli
cd mini-app
netlify deploy --prod
```

#### ⚡ Vercel

**Option A: Web Interface**
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repo or upload files
3. Deploy!

**Option B: CLI**
```bash
npm install -g vercel
cd mini-app
vercel --prod
```

#### 📦 GitHub Pages

1. Push your code to GitHub
2. Go to Settings → Pages
3. Select source branch
4. Your app will be at `https://yourusername.github.io/repo-name/`

#### 🔧 Using Deployment Script

```bash
cd mini-app
./deploy.sh netlify    # or vercel, github
```

### Full Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on all hosting options.

## Usage

1. **Connect Wallet**
   - **In Base App**: The app automatically detects Base smart wallets and connects seamlessly
   - **In Browser**: Click "Connect Wallet" and select your Web3 wallet (MetaMask, Coinbase Wallet, etc.)
   - The app will automatically detect if you're using a Base smart wallet or traditional wallet
   - Make sure you're on Base network (the app will prompt to switch if needed)

2. **Load Contract**
   - Enter your coin/token contract address
   - Click "Load Contract"
   - View your token information and balance

3. **Burn Tokens**
   - Enter the amount you want to burn
   - Or use "Burn Max" / "Burn Half" buttons
   - Click "Burn Coins"
   - Confirm the transaction in your wallet
   - Wait for confirmation

## Supported Contracts

This app works with ERC20 tokens that have a `burn` or `burnFrom` function. Common burn function signatures:

- `burn(uint256 amount)` - Burns tokens from the caller's balance
- `burnFrom(address from, uint256 amount)` - Burns tokens from a specific address (requires approval)

## Network Support

- ✅ Base Mainnet (Chain ID: 8453)
- ✅ Base Sepolia Testnet (Chain ID: 84532)

The app will automatically detect your network and provide appropriate explorer links.

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never share your private keys** - The app never has access to your private keys
2. **Verify contract addresses** - Always double-check the contract address before burning
3. **Test on Sepolia first** - Use the testnet to verify everything works before using mainnet
4. **Burning is irreversible** - Once tokens are burned, they cannot be recovered
5. **Review transactions** - Always review transaction details in your wallet before confirming

## Base Smart Wallet Support

This app is specifically designed to work with Base app's smart wallets, which don't require WalletConnect:

### Supported Wallet Types:
1. **Base Smart Wallets** (via Coinbase SDK) - Automatically detected when running in Base app
2. **Coinbase Wallet Extension** - Traditional Coinbase Wallet browser extension
3. **MetaMask & Other Web3 Wallets** - Standard EIP-1193 compatible wallets

### How It Works:
- The app automatically detects your wallet type
- Base smart wallets are prioritized when detected
- Falls back to traditional Web3 wallets if Base smart wallet is not available
- All wallet types use the same burn functionality

## Troubleshooting

### Wallet Not Connecting

**For Base Smart Wallets:**
- Make sure you're running the app within Base app
- Check that Base app has wallet functionality enabled
- The app will automatically detect Base smart wallets

**For Traditional Wallets:**
- Make sure you have MetaMask or another Web3 wallet installed
- Check that the wallet extension is enabled
- Try refreshing the page

### Wrong Network
- The app will prompt you to switch to Base network
- You can also manually switch in your wallet settings

### Contract Not Loading
- Verify the contract address is correct
- Make sure the contract is an ERC20 token with a burn function
- Check that you're on the correct network (Base)

### Transaction Fails
- Check you have enough ETH for gas fees
- Verify you have sufficient token balance
- Make sure the contract has a burn function
- Check the transaction on BaseScan for detailed error messages

### Gas Estimation Errors
- Some contracts may require more gas than estimated
- Try increasing the gas limit in your wallet
- Check if the contract requires special permissions

## Customization

### Change Default Contract

Edit `config.js` to set a default contract address:

```javascript
const DEFAULT_CONTRACT_ADDRESS = '0xYourContractAddress';
```

### Modify Styling

Edit `styles.css` to customize the appearance:
- Colors: Update the gradient values in `.btn-primary` and `.btn-danger`
- Layout: Adjust padding, margins, and container width
- Fonts: Change the `font-family` in the `body` selector

## Technical Details

### Dependencies

- **ethers.js v5.7.2** - Loaded via CDN for blockchain interaction
- No build process required - pure HTML/CSS/JavaScript

### Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any browser with Web3 wallet support

### Contract ABI

The app uses a standard ERC20 ABI with burn functions. If your contract uses a different burn function signature, you may need to modify the ABI in `app.js`.

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your contract has a burn function
3. Test on Base Sepolia testnet first
4. Check transaction details on BaseScan

---

**Remember**: Burning tokens is permanent and irreversible. Always double-check amounts and contract addresses before confirming transactions.
