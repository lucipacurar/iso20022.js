# Changelog

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
