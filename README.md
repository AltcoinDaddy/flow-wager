# 🌊 FlowWager

**The First Prediction Market Platform on Flow Blockchain**

> **⚠️ Important**: Trading on prediction markets involves financial risk. Please ensure compliance with local regulations and only participate with funds you can afford to lose.

## 🎯 What is FlowWager?

FlowWager is a revolutionary prediction market platform where users can bet real money on the outcomes of future events. Think you know what will happen next? Put your money where your predictions are!

**Bet on anything:**
- 🏀 Sports outcomes ("Will the Lakers win tonight?")
- 💰 Crypto prices ("Will Bitcoin hit $100k this year?")
- 🎬 Entertainment ("Will Taylor Swift release a new album?")
- 🗳️ Political events ("Who will win the next election?")
- 🌤️ Weather ("Will it rain tomorrow?")

## ✨ Why FlowWager?

### 🚀 First on Flow Blockchain
- **Pioneer advantage**: Only prediction market on Flow
- **Ultra-low fees**: Trade for less than $0.01 vs $50+ on Ethereum
- **Lightning fast**: Instant transactions, no waiting
- **Mobile-first**: Perfect experience on your phone

### 🛡️ Built Different
- **Secure**: Flow's resource-oriented programming prevents asset loss
- **Fair**: Automated market resolution via smart contracts
- **Transparent**: All trades recorded on Flow blockchain
- **Community-owned**: Decentralized governance and revenue sharing

### 💡 Key Features
- **Real-time trading** with live price updates
- **Creator economy** - earn money by creating markets
- **Social features** - discuss predictions with community
- **Portfolio tracking** - monitor your performance
- **Mobile-optimized** - trade anywhere, anytime

## 🏗️ Technical Stack

### Smart Contracts (Cadence)
- **FlowWager.cdc** - Core prediction market logic
- **MarketFactory.cdc** - Market creation and management
- **UserRegistry.cdc** - User profiles and statistics
- **FlowTokenHelper.cdc** - Payment processing

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **Blockchain**: Flow Client Library (FCL) integration
- **UI Components**: Shadcn/ui for consistent design

## 📋 Smart Contract Addresses

| Network | Address | Explorer |
|---------|---------|----------|
| **Mainnet** | `0x6c1b12e35dca8863` | [View on FlowScan](https://flowscan.org/account/0x6c1b12e35dca8863) |


## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Flow CLI ([Installation Guide](https://developers.flow.com/tools/flow-cli))
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flowwager.git
   cd flowwager
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   Update the environment variables:
   ```env
   NEXT_PUBLIC_FLOW_NETWORK=mainnet
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x6c1b12e35dca8863
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🛠️ Development

### Project Structure
```
flowwager/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── markets/     # Market-specific components
│   │   ├── dashboard/   # User dashboard components
│   │   └── admin/       # Admin panel components
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── styles/          # Global styles
├── contracts/           # Cadence smart contracts
├── flow.json           # Flow configuration
└── public/             # Static assets
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Flow Commands
npm run flow:deploy  # Deploy contracts to testnet
npm run flow:test    # Run contract tests

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔧 How It Works

### 1. Market Creation
Users can create prediction markets by:
- Defining a clear question with binary outcomes
- Setting market parameters (end time, minimum bet, etc.)
- Adding an image and description
- Paying a small creation fee

### 2. Trading Mechanics
- **Automated Market Maker**: Liquidity provided by smart contracts
- **Real-time Pricing**: Prices adjust based on supply and demand
- **Outcome Tokens**: Each prediction outcome is a tradeable token
- **Portfolio Management**: Track all positions in your dashboard

### 3. Market Resolution
- **Automated Resolution**: Markets resolve using reliable data sources
- **Fair Payouts**: Winners automatically receive losers' stakes
- **Dispute System**: Community governance for contested outcomes
- **Instant Settlement**: Winnings distributed immediately

## 🏆 Beta Testing

We're actively seeking beta testers! Join our community to:
- Test new features before public release
- Provide feedback to shape the platform
- Earn early adopter rewards
- Be part of Flow blockchain history

**How to join:**
1. Join our [Discord community](coming soon)
2. Follow us on [Twitter](https://twitter.com/flowwager)
3. Sign up for beta access in our Discord

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Bug Reports
- Use GitHub Issues to report bugs
- Provide detailed reproduction steps
- Include screenshots if applicable

### Feature Requests
- Discuss new ideas in our Discord
- Submit detailed proposals via GitHub Issues
- Consider the impact on user experience

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Ensure mobile responsiveness
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🛡️ Security

### Reporting Security Issues
If you discover a security vulnerability, please email us at security@flowwager.com instead of using the issue tracker.

### Security Features
- Non-custodial architecture
- Regular security audits
- Multi-signature governance
- Emergency pause mechanisms

## 🗺️ Roadmap

### ✅ Completed
- Smart contracts deployed on mainnet
- Core betting functionality
- User dashboard and portfolio tracking
- Admin panel for market management
- Mobile-optimized UI

### 🚧 In Progress
- Beta testing program
- Security audit completion
- Advanced analytics features
- Mobile app development

### 📅 Coming Soon
- iOS/Android native apps
- Advanced market types
- Social features expansion
- Governance token launch
- Creator monetization program

## 📞 Contact & Community

- **Website**: [flowwager.com](https://flowwager.xyz)
- **Discord**: [Join our community](coming soon)
- **Twitter**: [@flowwager](https://twitter.com/flowwager)


## 🙏 Acknowledgments

- [Flow Foundation](https://onflow.org) for the amazing blockchain technology
- [Cadence](https://cadence-lang.org) for secure smart contract development
- Flow community for ongoing support and feedback
- Beta testers for their valuable contributions

---

**Built with ❤️ on Flow Blockchain**

*FlowWager - Where predictions meet profits*
