import { PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import {
  BONDING_CURVE_PROGRAM_ID,
  BONDING_CURVE_SEED,
  METADATA_SEED,
  METADATA_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID as TOKEN_2022,
  WSOL_MINT,
  MAYHEM_PROGRAM_ID,
  MAYHEM_FEE_RECIPIENT,
} from '../constants.js';

export function deriveBondingCurve(
  mint: PublicKey,
  tokenProgram: PublicKey = TOKEN_2022
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer(), tokenProgram.toBuffer()],
    BONDING_CURVE_PROGRAM_ID
  );
}

export function deriveMetadata(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(METADATA_SEED),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
}

export function getAssociatedTokenAccount(
  mint: PublicKey,
  owner: PublicKey,
  tokenProgram: PublicKey = TOKEN_2022
): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, false, tokenProgram);
}

export function deriveMayhemState(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('mayhem-state'),
      mint.toBuffer(),
      MAYHEM_PROGRAM_ID.toBuffer(),
    ],
    MAYHEM_PROGRAM_ID
  );
}

export function deriveMayhemSolVault(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('sol-vault'), MAYHEM_PROGRAM_ID.toBuffer()],
    MAYHEM_PROGRAM_ID
  );
}

export function getMayhemFeeRecipientWSOLAccount(): PublicKey {
  return getAssociatedTokenAddressSync(
    WSOL_MINT,
    MAYHEM_FEE_RECIPIENT,
    false,
    TOKEN_PROGRAM_ID
  );
}
