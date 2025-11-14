import { Connection, Keypair } from '@solana/web3.js';
import { MayhemBundler } from './bundler/mayhemBundler.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const rpcUrl =
    process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'base64'));

  console.log('Wallet:', keypair.publicKey.toBase58());

  const bundler = new MayhemBundler(connection, keypair);

  const params = {
    name: 'My Mayhem Coin',
    symbol: 'MAYHEM',
    uri: 'https://example.com/metadata.json',
    mayhemMode: true,
    creator: keypair.publicKey,
    creatorKeypair: keypair,
  };

  try {
    const bundled = await bundler.createCoin(params);
    console.log('Mint:', bundled.mint.toBase58());
    console.log('Bonding Curve:', bundled.bondingCurve.toBase58());
    console.log('Metadata:', bundled.metadata.toBase58());
    if (bundled.mayhemState) {
      console.log('Mayhem State:', bundled.mayhemState.toBase58());
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MayhemBundler } from './bundler/mayhemBundler.js';
export * from './constants.js';
export * from './utils/accounts.js';
