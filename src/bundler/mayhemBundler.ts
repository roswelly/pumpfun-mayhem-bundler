import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  createInitializeMint2Instruction,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
} from '@solana/spl-token';
import {
  BONDING_CURVE_PROGRAM_ID,
  MAYHEM_PROGRAM_ID,
  MAYHEM_FEE_RECIPIENT,
  TOKEN_2022_PROGRAM_ID,
  METADATA_PROGRAM_ID,
} from '../constants.js';
import {
  deriveBondingCurve,
  deriveMetadata,
  getAssociatedTokenAccount,
  deriveMayhemState,
  deriveMayhemSolVault,
  getMayhemFeeRecipientWSOLAccount,
} from '../utils/accounts.js';
import { BundlerError, NetworkError, ValidationError } from '../utils/errors.js';

export interface CoinParams {
  name: string;
  symbol: string;
  uri: string;
  mayhemMode: boolean;
  creator: PublicKey;
  creatorKeypair: Keypair;
}

export interface BundledCreation {
  mint: PublicKey;
  mintKeypair: Keypair;
  bondingCurve: PublicKey;
  metadata: PublicKey;
  userTokenAccount: PublicKey;
  mayhemState?: PublicKey;
  transaction: Transaction;
}

const TOKEN_DECIMALS = 6;
const CREATE_V2_DISCRIMINATOR = 1;

export class MayhemBundler {
  constructor(
    private readonly connection: Connection,
    private readonly feePayer: Keypair
  ) {}

  async createCoin(params: CoinParams): Promise<BundledCreation> {
    this.validateParams(params);

    const { name, symbol, uri, mayhemMode, creator, creatorKeypair } = params;

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    const [bondingCurve] = deriveBondingCurve(mint, TOKEN_2022_PROGRAM_ID);
    const [metadata] = deriveMetadata(mint);
    const userTokenAccount = getAssociatedTokenAccount(
      mint,
      creator,
      TOKEN_2022_PROGRAM_ID
    );

    const mayhemAccounts = mayhemMode
      ? this.getMayhemAccounts(mint)
      : undefined;

    let mintRent: number;
    let blockhash: string;

    try {
      [mintRent, { blockhash }] = await Promise.all([
        getMinimumBalanceForRentExemptMint(this.connection),
        this.connection.getLatestBlockhash(),
      ]);
    } catch (err) {
      throw new NetworkError('Failed to fetch network data', err as Error);
    }

    const tx = new Transaction();
    tx.feePayer = creator;
    tx.recentBlockhash = blockhash;

    tx.add(
      SystemProgram.createAccount({
        fromPubkey: creator,
        newAccountPubkey: mint,
        space: MINT_SIZE,
        lamports: mintRent,
        programId: TOKEN_2022_PROGRAM_ID,
      })
    );

    tx.add(
      createInitializeMint2Instruction(
        mint,
        TOKEN_DECIMALS,
        creator,
        null,
        TOKEN_2022_PROGRAM_ID
      )
    );

    tx.add(
      this.buildCreateV2Instruction({
        creator,
        mint,
        bondingCurve,
        metadata,
        userTokenAccount,
        mayhemAccounts,
        name,
        symbol,
        uri,
        mayhemMode,
      })
    );

    return {
      mint,
      mintKeypair,
      bondingCurve,
      metadata,
      userTokenAccount,
      mayhemState: mayhemAccounts?.state,
      transaction: tx,
    };
  }

  async send(bundled: BundledCreation, signers: Keypair[]): Promise<string> {
    if (signers.length === 0) {
      throw new ValidationError('At least one signer is required');
    }

    try {
      return await sendAndConfirmTransaction(
        this.connection,
        bundled.transaction,
        signers,
        {
          commitment: 'confirmed',
          skipPreflight: false,
        }
      );
    } catch (err) {
      if (err instanceof Error) {
        throw new BundlerError(`Transaction failed: ${err.message}`, err);
      }
      throw err;
    }
  }

  private validateParams(params: CoinParams): void {
    if (!params.name || params.name.trim().length === 0) {
      throw new ValidationError('Coin name is required');
    }
    if (!params.symbol || params.symbol.trim().length === 0) {
      throw new ValidationError('Coin symbol is required');
    }
    if (!params.uri || params.uri.trim().length === 0) {
      throw new ValidationError('Metadata URI is required');
    }
    if (params.name.length > 32) {
      throw new ValidationError('Coin name must be 32 characters or less');
    }
    if (params.symbol.length > 10) {
      throw new ValidationError('Coin symbol must be 10 characters or less');
    }
  }

  private getMayhemAccounts(mint: PublicKey) {
    const [state] = deriveMayhemState(mint);
    const [solVault] = deriveMayhemSolVault();
    const wsolAccount = getMayhemFeeRecipientWSOLAccount();

    return { state, solVault, wsolAccount };
  }

  private buildCreateV2Instruction(params: {
    creator: PublicKey;
    mint: PublicKey;
    bondingCurve: PublicKey;
    metadata: PublicKey;
    userTokenAccount: PublicKey;
    mayhemAccounts?: {
      state: PublicKey;
      solVault: PublicKey;
      wsolAccount: PublicKey;
    };
    name: string;
    symbol: string;
    uri: string;
    mayhemMode: boolean;
  }): TransactionInstruction {
    const accounts = [
      { pubkey: params.creator, isSigner: true, isWritable: true },
      { pubkey: params.mint, isSigner: true, isWritable: true },
      { pubkey: params.bondingCurve, isSigner: false, isWritable: true },
      { pubkey: params.metadata, isSigner: false, isWritable: true },
      {
        pubkey: params.userTokenAccount,
        isSigner: false,
        isWritable: true,
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    if (params.mayhemMode && params.mayhemAccounts) {
      accounts.push(
        { pubkey: MAYHEM_PROGRAM_ID, isSigner: false, isWritable: false },
        {
          pubkey: params.mayhemAccounts.state,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: params.mayhemAccounts.solVault,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: MAYHEM_FEE_RECIPIENT, isSigner: false, isWritable: true },
        {
          pubkey: params.mayhemAccounts.wsolAccount,
          isSigner: false,
          isWritable: true,
        }
      );
    }

    return new TransactionInstruction({
      programId: BONDING_CURVE_PROGRAM_ID,
      keys: accounts,
      data: this.encodeCreateV2Data({
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        mayhemMode: params.mayhemMode,
      }),
    });
  }

  private encodeCreateV2Data(params: {
    name: string;
    symbol: string;
    uri: string;
    mayhemMode: boolean;
  }): Buffer {
    const buffer = Buffer.alloc(1024);
    let offset = 0;

    buffer.writeUInt8(CREATE_V2_DISCRIMINATOR, offset++);
    buffer.writeUInt8(params.mayhemMode ? 1 : 0, offset++);

    offset = this.writeString(buffer, params.name, offset);
    offset = this.writeString(buffer, params.symbol, offset);
    offset = this.writeString(buffer, params.uri, offset);

    return buffer.slice(0, offset);
  }

  private writeString(buffer: Buffer, str: string, offset: number): number {
    const bytes = Buffer.from(str, 'utf-8');
    buffer.writeUInt16LE(bytes.length, offset);
    offset += 2;
    bytes.copy(buffer, offset);
    return offset + bytes.length;
  }
}
