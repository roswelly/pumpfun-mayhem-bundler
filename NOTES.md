# Implementation Notes

## Important Considerations

### Instruction Encoding

The `encodeCreateV2Instruction` method in `src/bundler/mayhemBundler.ts` uses a placeholder format for encoding the instruction data. The actual encoding format depends on the pump.fun program's IDL (Interface Definition Language).

**You may need to:**
1. Obtain the actual program IDL from pump.fun
2. Use a library like `@coral-xyz/anchor` to properly encode instructions
3. Or manually encode based on the program's instruction layout

### Account Order

The account order in the `create_v2` instruction must match exactly what the program expects. Refer to the [pump.fun public docs](https://github.com/pump-fun/pump-public-docs) for the exact account layout.

According to the documentation:
- Account 0: Creator/Payer
- Account 1: Mint
- Account 2: Bonding Curve (fee recipient for mayhem mode)
- Account 3: Metadata
- Account 4: User Token Account
- Account 5: System Program
- Account 6: Token Program (Token2022)
- Account 7: Rent Sysvar
- Account 8: Metadata Program
- Accounts 9-13: Mayhem Mode specific accounts (if enabled)

### Testing

Before deploying to mainnet:
1. Test on devnet first
2. Verify account derivations are correct
3. Test with `isMayhemMode: false` first
4. Then test with `isMayhemMode: true`

### Fee Recipient

For Mayhem Mode coins:
- Bonding Curve: Account index 2 should be Mayhem fee recipient
- Pump Swap: Account index 10 should be Mayhem fee recipient
- Protocol Fee Token Account (Pump Swap): Account index 11 should be WSOL account of Mayhem fee recipient

Current Mayhem Fee Recipient: `GesfTA3X2arioaHp8bbKdjG9vJtskViWACZoYvxp4twS`

### Token2022 vs Legacy Token Program

All coins created with `create_v2` use Token2022 program, regardless of Mayhem Mode status. The legacy `create` instruction uses the old token program and cannot enable Mayhem Mode.

### Mayhem Mode Details

- Can only be enabled during coin creation (via `create_v2`)
- Creates 2B total token supply (1B for creator, 1B for AI agent)
- AI agent trades for first 24 hours
- After 24 hours, unsold agent tokens are burned
- Uses different fee recipient for protocol fees

## Next Steps

1. **Get Program IDL**: Obtain the actual IDL from pump.fun to properly encode instructions
2. **Test on Devnet**: Use devnet programs to test before mainnet
3. **Verify Account Derivation**: Ensure all PDAs are derived correctly
4. **Add Error Handling**: Add comprehensive error handling for edge cases
5. **Add Logging**: Add detailed logging for debugging

## References

- [Mayhem Mode Documentation](https://pump.fun/docs/mayhem-mode)
- [Pump.fun Public Docs](https://github.com/pump-fun/pump-public-docs)
- [Solana Token2022 Program](https://spl.solana.com/token-2022)

