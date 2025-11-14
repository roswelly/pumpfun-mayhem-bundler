# PumpFun Mayhem Trading Bot

A TypeScript library for creating PumpFun coins with Mayhem Mode support on Solana.

## Overview

This project provides a bundler for creating tokens on PumpFun with Mayhem Mode enabled. Mayhem Mode is an experimental feature that uses an AI trading agent to boost volume and visibility for new coins during their first 24 hours.

## Features

- **Mayhem Mode Bundler**: Create coins with Mayhem Mode using `create_v2` instruction
- **Token2022 Support**: Full support for Token2022 program standard
- **Error Handling**: Comprehensive error handling with custom error types
- **Input Validation**: Built-in validation for coin parameters
- **Type Safety**: Full TypeScript support with proper types

## Prerequisites

- Node.js (v18 or higher)
- Solana wallet with funds
- RPC endpoint access

## Installation

```bash
git clone https://github.com/roswelly/pumpfun-mayhem-trading-bot.git
cd pumpfun-mayhem-trading-bot
npm install
```

## Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your settings:
   - `RPC_URL`: Your Solana RPC endpoint (default: mainnet-beta)
   - `PRIVATE_KEY`: Your wallet's private key (base64 encoded)

   To encode your private key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

## Usage

### Building the Project

```bash
npm install
npm run build
npm run dev
```

### Basic Example

```typescript
import { Connection, Keypair } from '@solana/web3.js';
import { MayhemBundler } from './bundler/mayhemBundler.js';

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
const keypair = Keypair.fromSecretKey(/* your secret key */);

const bundler = new MayhemBundler(connection, keypair);

const params = {
  name: 'My Mayhem Coin',
  symbol: 'MAYHEM',
  uri: 'https://example.com/metadata.json',
  mayhemMode: true,
  creator: keypair.publicKey,
  creatorKeypair: keypair,
};

const bundled = await bundler.createCoin(params);

const signature = await bundler.send(bundled, [keypair, bundled.mintKeypair]);

console.log('Coin created:', bundled.mint.toBase58());
console.log('Transaction:', signature);
```

### Error Handling

The bundler includes custom error types for better error handling:

```typescript
import { ValidationError, NetworkError, BundlerError } from './utils/errors.js';

try {
  const bundled = await bundler.createCoin(params);
  await bundler.send(bundled, signers);
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Validation error:', err.message);
  } else if (err instanceof NetworkError) {
    console.error('Network error:', err.message);
  } else if (err instanceof BundlerError) {
    console.error('Bundler error:', err.message);
  }
}
```

### Using the Example Script

```bash
npm run example:create
```

Set environment variables:
- `COIN_NAME`: Coin name
- `COIN_SYMBOL`: Coin symbol
- `METADATA_URI`: Metadata URI
- `MAYHEM_MODE`: Set to `false` to disable Mayhem Mode
- `SEND_TRANSACTION`: Set to `true` to actually send the transaction

## Mayhem Mode

When `mayhemMode: true`:
- Uses Token2022 program
- Creates 2B total token supply (1B for creator, 1B for AI agent)
- Uses Mayhem Mode fee recipient for protocol fees
- Enables AI trading agent for first 24 hours
- Proper account derivation for Mayhem State and SOL vault

### Mayhem Mode Details

According to [pump.fun documentation](https://pump.fun/docs/mayhem-mode):
- Can only be enabled during coin creation
- AI agent trades for the first 24 hours
- After 24 hours, unsold agent tokens are burned
- Uses different fee recipient: `GesfTA3X2arioaHp8bbKdjG9vJtskViWACZoYvxp4twS`

## API Reference

### MayhemBundler

#### Constructor
```typescript
new MayhemBundler(connection: Connection, feePayer: Keypair)
```

#### Methods

**createCoin(params: CoinParams): Promise<BundledCreation>**
- Creates a coin with optional Mayhem Mode support
- Validates input parameters
- Returns bundled transaction ready to send

**send(bundled: BundledCreation, signers: Keypair[]): Promise<string>**
- Sends the bundled transaction
- Returns transaction signature
- Throws `ValidationError` if no signers provided
- Throws `BundlerError` on transaction failure

### Types

**CoinParams**
```typescript
{
  name: string;           // Coin name (max 32 chars)
  symbol: string;         // Coin symbol (max 10 chars)
  uri: string;            // Metadata URI
  mayhemMode: boolean;     // Enable Mayhem Mode
  creator: PublicKey;     // Creator public key
  creatorKeypair: Keypair; // Creator keypair
}
```

**BundledCreation**
```typescript
{
  mint: PublicKey;
  mintKeypair: Keypair;
  bondingCurve: PublicKey;
  metadata: PublicKey;
  userTokenAccount: PublicKey;
  mayhemState?: PublicKey;
  transaction: Transaction;
}
```

## Security

⚠️ **Important**: Never commit your private keys or sensitive configuration to version control. Always use environment variables or secure configuration files that are excluded from git.

## Testing

Test on devnet before deploying to mainnet:

```typescript
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Disclaimer

This software is for educational purposes only. Trading cryptocurrencies involves substantial risk. Use at your own risk.

## Support

For issues and questions, please open an issue on GitHub.

## References

- [Mayhem Mode Documentation](https://pump.fun/docs/mayhem-mode)
- [Pump.fun Public Docs](https://github.com/pump-fun/pump-public-docs)
