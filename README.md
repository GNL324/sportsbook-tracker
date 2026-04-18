# 🎯 Sportsbook Tracker

Execution Cockpit for sports betting arbitrage tracking.

---

## 🚀 Features

### 🧮 Arbitrage Calculator
- Calculate optimal bet stakes across sportsbooks
- Support for American odds (+150, -110)
- Real-time profit and ROI calculations
- Guaranteed profit detection

### 💰 Bankroll Tracker
- Track deposits and withdrawals
- Monitor balances across multiple sportsbooks:
  - DraftKings
  - BetMGM
  - theScore BET
  - BetRivers
- Transaction history with notes

### 📊 Bet History
- Log all your arbitrage bets
- Track bet status (Pending/Won/Lost)
- Profit/loss summary
- Export to Excel (coming soon)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages
- **Data Persistence:** localStorage

---

## 🏃 Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
sportsbook-tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home dashboard
│   │   ├── calculator/        # Arbitrage calculator
│   │   ├── tracker/           # Bankroll tracker
│   │   ├── bets/              # Bet history

│   ├── data/
│   │   └── exercises.ts       # Exercise library
│   └── components/            # Reusable components
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Pages deployment
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS config
└── package.json
```

---

## 🌐 Live Demo

**GitHub Pages:** https://gnl324.github.io/sportsbook-tracker/

---

## 📊 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Dashboard with all tools |
| Calculator | `/calculator` | Arbitrage bet calculator |
| Tracker | `/tracker` | Bankroll management |
| Bets | `/bets` | Bet history logging |


---

## 💾 Data Storage

All data is stored in **localStorage**:

- `gnl_tracker_transactions` - Bankroll transactions
- `gnl_bet_history` - Bet history


**Note:** Data is browser-specific. Clearing cache will remove data.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use for personal projects!

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [GitHub Pages](https://pages.github.com/)
