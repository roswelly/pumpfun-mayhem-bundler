import { Connection, Keypair } from '@solana/web3.js';
import { MayhemBundler } from '../src/bundler/mayhemBundler.js';
import { BundlerError, NetworkError, ValidationError } from '../src/utils/errors.js';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const MIN_BALANCE_SOL = 0.1;

function loadKeypair(): Keypair {
  if (process.env.PRIVATE_KEY) {
    const bytes = Buffer.from(process.env.PRIVATE_KEY, 'base64');
    return Keypair.fromSecretKey(bytes);
  }

  if (process.env.KEYPAIR_PATH) {
    const data = JSON.parse(fs.readFileSync(process.env.KEYPAIR_PATH, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(data));
  }

  throw new Error('PRIVATE_KEY or KEYPAIR_PATH must be set');
}

async function checkBalance(connection: Connection, pubkey: Keypair['publicKey']) {
  const balance = await connection.getBalance(pubkey);
  const sol = balance / 1e9;

  if (sol < MIN_BALANCE_SOL) {
    console.warn(`Low balance: ${sol.toFixed(4)} SOL (minimum: ${MIN_BALANCE_SOL} SOL)`);
  }

  return sol;
}

async function createMayhemCoin() {
  const rpcUrl =
    process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  const keypair = loadKeypair();
  console.log('Wallet:', keypair.publicKey.toBase58());

  const balance = await checkBalance(connection, keypair.publicKey);
  console.log('Balance:', balance.toFixed(4), 'SOL');

  const bundler = new MayhemBundler(connection, keypair);

  const params = {
    name: process.env.COIN_NAME || 'My Mayhem Coin',
    symbol: process.env.COIN_SYMBOL || 'MAYHEM',
    uri: process.env.METADATA_URI || 'https://example.com/metadata.json',
    mayhemMode: process.env.MAYHEM_MODE !== 'false',
    creator: keypair.publicKey,
    creatorKeypair: keypair,
  };

  try {
    console.log('\nCreating coin...');
    console.log('Name:', params.name);
    console.log('Symbol:', params.symbol);
    console.log('Mayhem Mode:', params.mayhemMode);

    const bundled = await bundler.createCoin(params);

    console.log('\nCoin created:');
    console.log('Mint:', bundled.mint.toBase58());
    console.log('Bonding Curve:', bundled.bondingCurve.toBase58());
    console.log('Metadata:', bundled.metadata.toBase58());
    if (bundled.mayhemState) {
      console.log('Mayhem State:', bundled.mayhemState.toBase58());
    }

    if (process.env.SEND_TRANSACTION === 'true') {
      console.log('\nSending transaction...');
      const signature = await bundler.send(bundled, [
        keypair,
        bundled.mintKeypair,
      ]);
      console.log('Signature:', signature);
      console.log('Explorer:', `https://solscan.io/tx/${signature}`);
    } else {
      const size = bundled.transaction
        .serialize({ requireAllSignatures: false })
        .length;
      console.log('\nTransaction prepared (not sent)');
      console.log('Size:', size, 'bytes');
      console.log('Set SEND_TRANSACTION=true to send');
    }
  } catch (err) {
    if (err instanceof ValidationError) {
      console.error('Validation error:', err.message);
    } else if (err instanceof NetworkError) {
      console.error('Network error:', err.message);
      if (err.cause) {
        console.error('Cause:', err.cause.message);
      }
    } else if (err instanceof BundlerError) {
      console.error('Bundler error:', err.message);
    } else {
      console.error('Unexpected error:', err);
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createMayhemCoin().catch(console.error);
}
