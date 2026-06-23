# Changelog

## 0.4.0

### Changed

- XML parser/builder access moved from the `XML` static class to standalone `getXmlParser()` / `getXmlBuilder()` functions (the `XML` class was never part of the public exports).
- Renamed the message factory method `fromDocumentOject` to `fromDocumentObject` across all CAMT message classes (typo fix).

### Fixed

- Removed a stray `import { get } from 'http'` in `lib/interfaces.ts` that pulled Node's `http` module into the bundle and broke ESM/browser builds.
- Fixed a broken bare-specifier import in `parseUtils.ts` (`'lib/types'` → `'./lib/types'`).
- Fixed the CAMT.003 "does not contain" (`NCTTxt`) account-criterion regex so round-tripping is correct.
- CAMT.004/005/006 parsing cleanup and an updated `camt.006.sample1.out.xml` fixture.

### Internal

- `ISO20022Messages` is now typed `as const satisfies Record<string, ISO20022MessageTypeName>` for precise literal types.
- SEPA direct debit reversal (pain.007) fixes and refactoring.
- TypeScript hygiene throughout (`import type` separation, `const` over `let`, explicit braces).
- Added CAMT.003 and CAMT.006 round-trip tests.

## 0.3.0

### New

- `SEPADirectDebitPaymentReversal` class (pain.007.001.02) for creditor-initiated SEPA direct debit reversals.
- Supported reversal reason codes: `DUPL`, `TECH`, `FRAD`, `CUTA`, `AM05`, `AC04`, `MS02`, `MS03` via `SEPAReversalReasonCode`.
- Full and partial reversals with validation (`reversedAmount` must not exceed `originalAmount`).
- `fromOriginalInitiation()` factory for drift-proof reversal generation from a `SEPADirectDebitPaymentInitiation` instance.
- `fromXML()` parser for pain.007.001.02 messages.
- `AtLeastOne<T>` promoted to a public exported type.
- Bundled pain.007.001.02 and pain.008.001.02 XSD schemas.

### Internal

- `buildMandateRelatedInfo()` and `buildCreditorSchemeId()` extracted to `PaymentInitiation` base class (non-breaking).
- `parseMandate()` extracted to shared `parseUtils.ts`.
- XSD validation tests for both pain.007 and pain.008.
