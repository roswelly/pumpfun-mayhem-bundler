# Mayhem Mode Bundler

Implementation for creating PumpFun coins with Mayhem Mode enabled using the `create_v2` instruction.

## Overview

The Mayhem Bundler handles:
- Token2022 program integration
- Mayhem Mode account derivation
- Proper fee recipient configuration
- Transaction building and validation

## API

### MayhemBundler Class

**Constructor**
```typescript
new MayhemBundler(connection: Connection, feePayer: Keypair)
```

**Methods**

- `createCoin(params: CoinParams): Promise<BundledCreation>`
  - Creates a coin with optional Mayhem Mode support
  - Validates input parameters
  - Builds and returns transaction

- `send(bundled: BundledCreation, signers: Keypair[]): Promise<string>`
  - Sends the bundled transaction
  - Returns transaction signature
  - Validates signers before sending

## Account Derivation

The bundler derives all required accounts:
- Bonding Curve (Token2022-based)
- Metadata account
- User token account (Token2022)
- Mayhem State (if Mayhem Mode enabled)
- Mayhem SOL Vault
- Mayhem Fee Recipient WSOL account

## Mayhem Mode

According to [pump.fun documentation](https://pump.fun/docs/mayhem-mode):

- Mayhem Mode can only be enabled during coin creation
- Uses `create_v2` instruction with `mayhem_mode = true`
- Creates 2B total token supply (1B for creator, 1B for AI agent)
- AI agent trades for first 24 hours
- Uses different fee recipient: `GesfTA3X2arioaHp8bbKdjG9vJtskViWACZoYvxp4twS`
- Mayhem Program ID: `MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e`

## Account Structure

### Regular Coin (`mayhemMode = false`)
- Uses Token2022 program
- Standard fee recipient
- 1B token supply
- 9 accounts in instruction

### Mayhem Mode Coin (`mayhemMode = true`)
- Uses Token2022 program
- Mayhem fee recipient
- 2B token supply
- 14 accounts in instruction
- Additional accounts:
  - Mayhem Program
  - Mayhem State
  - Mayhem SOL Vault
  - Mayhem Fee Recipient
  - Mayhem Fee Recipient WSOL Account

## Usage Example

```typescript
const bundler = new MayhemBundler(connection, keypair);

const params = {
  name: 'My Coin',
  symbol: 'COIN',
  uri: 'https://example.com/metadata.json',
  mayhemMode: true,
  creator: keypair.publicKey,
  creatorKeypair: keypair,
};

const bundled = await bundler.createCoin(params);
const signature = await bundler.send(bundled, [keypair, bundled.mintKeypair]);
```

## Error Handling

The bundler throws custom error types:

- `ValidationError`: Invalid input parameters
- `NetworkError`: Network connection issues
- `BundlerError`: General bundler errors

```typescript
import { ValidationError, NetworkError, BundlerError } from '../utils/errors.js';

try {
  const bundled = await bundler.createCoin(params);
} catch (err) {
  if (err instanceof ValidationError) {
    // Handle validation error
  } else if (err instanceof NetworkError) {
    // Handle network error
  }
}
```

## Validation

The bundler validates:
- Coin name is required and ≤ 32 characters
- Coin symbol is required and ≤ 10 characters
- Metadata URI is required
- At least one signer is required for sending

## Important Notes

1. **Instruction Encoding**: The instruction encoding format may need adjustment based on the actual program IDL.

2. **Account Order**: The account order in the instruction must match the program's expectations.

3. **Testing**: Use devnet for testing before deploying to mainnet.

4. **Fee Recipient**: For Mayhem Mode coins, the fee recipient is automatically set correctly.

## References

- [Mayhem Mode Documentation](https://pump.fun/docs/mayhem-mode)
- [Pump.fun Public Docs](https://github.com/pump-fun/pump-public-docs)
