chore(security): add standardized crypto helpers

- Move/enhance phone encryption into `lib/crypto` (AES-GCM)
- Provide CommonJS wrapper for `encryptPhone`/`decryptPhone`
- Update `utils/security.js` to delegate to `lib/crypto`
