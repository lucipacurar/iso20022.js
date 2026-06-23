import type { Alpha2Country } from '../../../src/lib/countries';
import type { SEPADirectDebitPaymentInstruction } from '../../../src/lib/types';
import {
  SEPADirectDebitPaymentReversal,
  type SEPADirectDebitPaymentReversalConfig,
  type SEPADirectDebitReversalInstructionGroup,
  type SEPADirectDebitReversalTransaction,
} from '../../../src/pain/007/sepa-direct-debit-payment-reversal';
import {
  SEPADirectDebitPaymentInitiation,
  type SEPADirectDebitPaymentInstructionGroup,
} from '../../../src/pain/008/sepa-direct-debit-payment-initiation';
import { validateAgainstXsd } from '../../helpers/xsd';

const XSD_PATH = `${process.cwd()}/schemas/pain/pain.007.001.02.xsd`;

describe('SEPADirectDebitPaymentReversal', () => {
  const initiatingParty = {
    name: 'Electrical',
    id: 'ELECTRIC',
    account: {
      iban: 'DE89370400440532013000',
    },
    agent: {
      bic: 'COBADEFFXXX',
      bankAddress: {
        country: 'DE' as Alpha2Country,
      },
    },
  };

  const creditor = {
    name: 'Creditor Co',
    account: {
      iban: 'DE89370400440532013000',
    },
    agent: {
      bic: 'COBADEFFXXX',
    },
  };

  const debtor = {
    name: 'Dael Muniz',
    account: {
      iban: 'ES8201822200150201504058',
    },
    agent: {
      bic: 'BBVAESMMXXX',
    },
  };

  const makeReversalTx = (
    overrides: Partial<SEPADirectDebitReversalTransaction> = {},
  ): SEPADirectDebitReversalTransaction => ({
    reversalId: 'RVSL-TX-001',
    originalAmount: 1500,
    reversedAmount: 1500,
    currency: 'EUR',
    reason: 'DUPL',
    originalReference: {
      pmtInfId: 'ORIG-PMTINF-001',
      endToEndId: 'ORIG-E2E-001',
      requestedCollectionDate: new Date('2026-05-01'),
    },
    originalTransaction: {
      amount: 1500,
      debtor,
      debtorAccount: { iban: 'ES8201822200150201504058' },
      debtorAgent: { bic: 'BBVAESMMXXX' },
      mandate: {
        mandateId: 'MNDT-0001',
        dateOfSignature: new Date('2024-01-15'),
        amendmentIndicator: false,
      },
    },
    ...overrides,
  });

  const makeGroup = (
    overrides: Partial<SEPADirectDebitReversalInstructionGroup> = {},
    txOverrides: Partial<SEPADirectDebitReversalTransaction> = {},
  ): SEPADirectDebitReversalInstructionGroup => ({
    paymentInformationId: 'RVSL-PMTINF-001',
    creditor,
    creditorSchemeId: 'DE96ZZZ00000345986',
    sequenceType: 'RCUR',
    reversals: [makeReversalTx(txOverrides)],
    ...overrides,
  });

  const makeConfig = (
    group: SEPADirectDebitReversalInstructionGroup = makeGroup(),
  ): SEPADirectDebitPaymentReversalConfig => ({
    messageId: 'MSG-RVSL-001',
    creationDate: new Date('2026-04-15T10:00:00.000Z'),
    initiatingParty,
    originalMessage: {
      msgId: 'ORIG-MSG-001',
      msgNmId: 'pain.008.001.02',
      createdDateTime: new Date('2026-04-10T08:00:00.000Z'),
    },
    reversalInstructions: [group],
  });

  describe('serialize', () => {
    test('produces valid pain.007.001.02 XML structure', () => {
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig());
      const xml = reversal.serialize();

      expect(xml).toMatch(/<CstmrPmtRvsl>/);
      expect(xml).toMatch(/<OrgnlGrpInf>/);
      expect(xml).toMatch(/<OrgnlMsgId>ORIG-MSG-001<\/OrgnlMsgId>/);
      expect(xml).toMatch(/<OrgnlMsgNmId>pain\.008\.001\.02<\/OrgnlMsgNmId>/);
      expect(xml).toMatch(/<OrgnlPmtInfAndRvsl>/);
      expect(xml).toMatch(/<OrgnlPmtInfId>ORIG-PMTINF-001<\/OrgnlPmtInfId>/);
      expect(xml).not.toMatch(/<RvslPmtInfId>/);
      expect(xml).toMatch(/<GrpRvsl>false<\/GrpRvsl>/);
      expect(xml).toMatch(/<PmtInfRvsl>false<\/PmtInfRvsl>/);
      expect(xml).toMatch(/<OrgnlNbOfTxs>1<\/OrgnlNbOfTxs>/);
      expect(xml).toMatch(/<OrgnlCtrlSum>15\.00<\/OrgnlCtrlSum>/);
      expect(xml).toMatch(/<TxInf>/);
      expect(xml).toMatch(/<RvslId>RVSL-TX-001<\/RvslId>/);
      expect(xml).toMatch(/<OrgnlEndToEndId>ORIG-E2E-001<\/OrgnlEndToEndId>/);
    });

    test('emits OrgnlInstrId when originalReference.instrId is provided', () => {
      const group = makeGroup(
        {},
        {
          originalReference: {
            pmtInfId: 'ORIG-PMTINF-001',
            endToEndId: 'ORIG-E2E-001',
            instrId: 'ORIG-INSTR-001',
            requestedCollectionDate: new Date('2026-05-01'),
          },
        },
      );
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig(group));
      const xml = reversal.serialize();

      expect(xml).toMatch(/<OrgnlInstrId>ORIG-INSTR-001<\/OrgnlInstrId>/);
      const instrIdIdx = xml.indexOf('<OrgnlInstrId>');
      const endToEndIdIdx = xml.indexOf('<OrgnlEndToEndId>');
      expect(instrIdIdx).toBeLessThan(endToEndIdIdx);
    });

    test('omits OrgnlInstrId when not provided', () => {
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig());
      const xml = reversal.serialize();
      expect(xml).not.toMatch(/<OrgnlInstrId>/);
    });

    test('emits correct amounts for partial reversal', () => {
      const group = makeGroup(
        {},
        {
          originalAmount: 1500,
          reversedAmount: 750,
          originalTransaction: {
            amount: 1500,
            debtor,
            debtorAccount: { iban: 'ES8201822200150201504058' },
            debtorAgent: { bic: 'BBVAESMMXXX' },
            mandate: {
              mandateId: 'MNDT-0001',
              dateOfSignature: new Date('2024-01-15'),
              amendmentIndicator: false,
            },
          },
        },
      );
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig(group));
      const xml = reversal.serialize();

      expect(xml).toMatch(/<OrgnlInstdAmt Ccy="EUR">15\.00<\/OrgnlInstdAmt>/);
      expect(xml).toMatch(/<RvsdInstdAmt Ccy="EUR">7\.50<\/RvsdInstdAmt>/);
    });

    test('emits creditor and debtor inside OrgnlTxRef', () => {
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig());
      const xml = reversal.serialize();

      const orgnlTxRefIdx = xml.indexOf('<OrgnlTxRef>');
      const cdtrIdx = xml.indexOf('<Cdtr>', orgnlTxRefIdx);
      const dbtrIdx = xml.indexOf('<Dbtr>', orgnlTxRefIdx);
      const mndtIdx = xml.indexOf('<MndtRltdInf>', orgnlTxRefIdx);

      expect(cdtrIdx).toBeGreaterThan(orgnlTxRefIdx);
      expect(dbtrIdx).toBeGreaterThan(orgnlTxRefIdx);
      expect(mndtIdx).toBeGreaterThan(orgnlTxRefIdx);
    });

    test('includes PmtTpInf and PmtMtd inside OrgnlTxRef', () => {
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig());
      const xml = reversal.serialize();

      const orgnlTxRefIdx = xml.indexOf('<OrgnlTxRef>');
      expect(xml.indexOf('<PmtMtd>DD</PmtMtd>', orgnlTxRefIdx)).toBeGreaterThan(
        orgnlTxRefIdx,
      );
      expect(xml.indexOf('<SvcLvl>', orgnlTxRefIdx)).toBeGreaterThan(
        orgnlTxRefIdx,
      );
      expect(xml.indexOf('<SeqTp>RCUR</SeqTp>', orgnlTxRefIdx)).toBeGreaterThan(
        orgnlTxRefIdx,
      );
    });
  });

  describe('reason codes', () => {
    const codes = [
      'DUPL',
      'TECH',
      'FRAD',
      'CUTA',
      'AM05',
      'AC04',
      'MS02',
      'MS03',
    ] as const;

    for (const code of codes) {
      test(`emits correct <Rsn><Cd> for ${code}`, () => {
        const group = makeGroup({}, { reason: code });
        const reversal = new SEPADirectDebitPaymentReversal(makeConfig(group));
        const xml = reversal.serialize();
        expect(xml).toMatch(new RegExp(`<Cd>${code}</Cd>`));
      });
    }
  });

  describe('multiple reversals and groups', () => {
    test('handles multiple reversals in one group', () => {
      const tx1 = makeReversalTx({
        reversalId: 'RVSL-1',
        originalReference: {
          pmtInfId: 'ORIG-PMTINF-001',
          endToEndId: 'E2E-001',
          requestedCollectionDate: new Date('2026-05-01'),
        },
      });
      const tx2 = makeReversalTx({
        reversalId: 'RVSL-2',
        originalReference: {
          pmtInfId: 'ORIG-PMTINF-001',
          endToEndId: 'E2E-002',
          requestedCollectionDate: new Date('2026-05-01'),
        },
      });
      const group = makeGroup({ reversals: [tx1, tx2] });
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig(group));
      const xml = reversal.serialize();

      expect(xml).toMatch(/<RvslId>RVSL-1<\/RvslId>/);
      expect(xml).toMatch(/<RvslId>RVSL-2<\/RvslId>/);
      expect(xml).toMatch(/<NbOfTxs>2<\/NbOfTxs>/);
    });

    test('handles multiple groups in one message', () => {
      const group1 = makeGroup({
        paymentInformationId: 'RVSL-GRP-1',
      });
      const group2 = makeGroup(
        {
          paymentInformationId: 'RVSL-GRP-2',
          creditor: {
            name: 'Other Creditor',
            account: { iban: 'DE11520513735120710131' },
            agent: { bic: 'INGDDEFFXXX' },
          },
        },
        {
          reversalId: 'RVSL-TX-002',
          originalReference: {
            pmtInfId: 'ORIG-PMTINF-002',
            endToEndId: 'ORIG-E2E-002',
            requestedCollectionDate: new Date('2026-06-01'),
          },
        },
      );
      const config = makeConfig(group1);
      config.reversalInstructions = [group1, group2];
      const reversal = new SEPADirectDebitPaymentReversal(config);
      const xml = reversal.serialize();

      expect(xml).toMatch(/<OrgnlPmtInfId>ORIG-PMTINF-001<\/OrgnlPmtInfId>/);
      expect(xml).toMatch(/<OrgnlPmtInfId>ORIG-PMTINF-002<\/OrgnlPmtInfId>/);
      expect(xml).not.toMatch(/<RvslPmtInfId>/);
      expect(xml).toMatch(/<NbOfTxs>2<\/NbOfTxs>/);
    });
  });

  describe('reversalId', () => {
    test('uses caller-provided reversalId verbatim', () => {
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig());
      const xml = reversal.serialize();
      expect(xml).toMatch(/<RvslId>RVSL-TX-001<\/RvslId>/);
    });

    test('falls back to a generated UUID when omitted', () => {
      const group = makeGroup({}, { reversalId: undefined });
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig(group));
      const xml = reversal.serialize();
      expect(xml).toMatch(/<RvslId>[0-9a-f]{32}<\/RvslId>/);
    });
  });

  describe('validation', () => {
    test('rejects over-reversal', () => {
      const group = makeGroup(
        {},
        {
          originalAmount: 1000,
          reversedAmount: 1500,
        },
      );
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow('reversedAmount must not exceed originalAmount');
    });

    test('rejects reversedAmount of 0', () => {
      const group = makeGroup({}, { reversedAmount: 0 });
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow('reversedAmount must be greater than 0');
    });

    test('rejects missing originalReference.pmtInfId', () => {
      const group = makeGroup(
        {},
        {
          originalReference: {
            pmtInfId: '',
            endToEndId: 'E2E-001',
            requestedCollectionDate: new Date('2026-05-01'),
          },
        },
      );
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow('originalReference.pmtInfId is required');
    });

    test('rejects missing originalReference.endToEndId', () => {
      const group = makeGroup(
        {},
        {
          originalReference: {
            pmtInfId: 'PMTINF-001',
            endToEndId: '',
            requestedCollectionDate: new Date('2026-05-01'),
          },
        },
      );
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow('originalReference.endToEndId is required');
    });

    test('rejects messageId longer than 35 characters', () => {
      const config = makeConfig();
      config.messageId = 'a'.repeat(36);
      expect(() => new SEPADirectDebitPaymentReversal(config)).toThrow(
        'messageId must not exceed 35 characters',
      );
    });

    test('rejects reversalId longer than 35 characters', () => {
      const group = makeGroup({}, { reversalId: 'a'.repeat(36) });
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow('reversalId must not exceed 35 characters');
    });

    test('rejects paymentInformationId longer than 35 characters', () => {
      const group = makeGroup({ paymentInformationId: 'a'.repeat(36) });
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow('paymentInformationId must not exceed 35 characters');
    });

    test('rejects additionalInfo longer than 105 characters', () => {
      const group = makeGroup({}, { additionalInfo: 'a'.repeat(106) });
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow('additionalInfo must not exceed 105 characters');
    });

    test('rejects mismatched pmtInfId within a group', () => {
      const tx1 = makeReversalTx({
        originalReference: {
          pmtInfId: 'PMTINF-A',
          endToEndId: 'E2E-001',
          requestedCollectionDate: new Date('2026-05-01'),
        },
      });
      const tx2 = makeReversalTx({
        originalReference: {
          pmtInfId: 'PMTINF-B',
          endToEndId: 'E2E-002',
          requestedCollectionDate: new Date('2026-05-01'),
        },
      });
      const group = makeGroup({ reversals: [tx1, tx2] });
      expect(
        () => new SEPADirectDebitPaymentReversal(makeConfig(group)),
      ).toThrow(
        'All reversals in a group must share the same originalReference.pmtInfId',
      );
    });
  });

  describe('fromXML round-trip', () => {
    test('full-amount reversal round-trip preserves all fields', () => {
      const original = new SEPADirectDebitPaymentReversal(makeConfig());
      const xml = original.serialize();
      const parsed = SEPADirectDebitPaymentReversal.fromXML(xml);

      expect(parsed.messageId).toBe('MSG-RVSL-001');
      expect(parsed.originalMessage.msgId).toBe('ORIG-MSG-001');
      expect(parsed.originalMessage.msgNmId).toBe('pain.008.001.02');
      expect(parsed.reversalInstructions).toHaveLength(1);

      const group = parsed.reversalInstructions[0];
      // paymentInformationId is no longer round-tripped through XML — the EPC
      // SDD reversal IG has no field for it. The constructor regenerates one.
      expect(typeof group.paymentInformationId).toBe('string');
      expect(group.paymentInformationId).not.toBe('RVSL-PMTINF-001');
      expect(group.creditorSchemeId).toBe('DE96ZZZ00000345986');
      expect(group.sequenceType).toBe('RCUR');

      const tx = group.reversals[0];
      expect(tx.reversalId).toBe('RVSL-TX-001');
      expect(tx.originalAmount).toBe(1500);
      expect(tx.reversedAmount).toBe(1500);
      expect(tx.reason).toBe('DUPL');
      expect(tx.originalReference.pmtInfId).toBe('ORIG-PMTINF-001');
      expect(tx.originalReference.endToEndId).toBe('ORIG-E2E-001');
      expect(tx.originalTransaction.mandate.mandateId).toBe('MNDT-0001');
    });

    test('partial-amount reversal round-trip', () => {
      const group = makeGroup(
        {},
        {
          originalAmount: 1500,
          reversedAmount: 750,
          originalTransaction: {
            amount: 1500,
            debtor,
            debtorAccount: { iban: 'ES8201822200150201504058' },
            debtorAgent: { bic: 'BBVAESMMXXX' },
            mandate: {
              mandateId: 'MNDT-0001',
              dateOfSignature: new Date('2024-01-15'),
              amendmentIndicator: false,
            },
          },
        },
      );
      const original = new SEPADirectDebitPaymentReversal(makeConfig(group));
      const parsed = SEPADirectDebitPaymentReversal.fromXML(
        original.serialize(),
      );

      expect(parsed.reversalInstructions[0].reversals[0].originalAmount).toBe(
        1500,
      );
      expect(parsed.reversalInstructions[0].reversals[0].reversedAmount).toBe(
        750,
      );
    });
  });

  describe('fromOriginalInitiation', () => {
    const makeOriginalPayment = () => {
      const payment: SEPADirectDebitPaymentInstruction = {
        type: 'sepa',
        direction: 'debit',
        amount: 1500,
        currency: 'EUR',
        endToEndId: 'E2E-ORIG-001',
        instrId: 'INSTR-ORIG-001',
        debtor,
        mandate: {
          mandateId: 'MNDT-0001',
          dateOfSignature: new Date('2024-01-15'),
          amendmentIndicator: false,
        },
      };

      const group: SEPADirectDebitPaymentInstructionGroup = {
        creditor,
        creditorSchemeId: 'DE96ZZZ00000345986',
        payments: [payment],
        requestedCollectionDate: new Date('2026-05-01'),
        sequenceType: 'RCUR',
        paymentInformationId: 'ORIG-PMTINF-001',
      };

      return new SEPADirectDebitPaymentInitiation({
        initiatingParty,
        paymentInstructions: [group],
        messageId: 'ORIG-MSG-001',
        creationDate: new Date('2026-04-10T08:00:00.000Z'),
      });
    };

    test('creates a reversal from an original pain.008', () => {
      const original = makeOriginalPayment();
      const reversal = SEPADirectDebitPaymentReversal.fromOriginalInitiation(
        original,
        [{ endToEndId: 'E2E-ORIG-001', reason: 'DUPL' }],
      );

      const xml = reversal.serialize();
      expect(xml).toMatch(/<OrgnlMsgId>ORIG-MSG-001<\/OrgnlMsgId>/);
      expect(xml).toMatch(/<OrgnlPmtInfId>ORIG-PMTINF-001<\/OrgnlPmtInfId>/);
      expect(xml).toMatch(/<OrgnlEndToEndId>E2E-ORIG-001<\/OrgnlEndToEndId>/);
      expect(xml).toMatch(/<OrgnlInstrId>INSTR-ORIG-001<\/OrgnlInstrId>/);
      expect(xml).toMatch(/<Cd>DUPL<\/Cd>/);

      const group = reversal.reversalInstructions[0];
      expect(group.reversals[0].originalAmount).toBe(1500);
      expect(group.reversals[0].reversedAmount).toBe(1500);
    });

    test('supports partial reversal via reversedAmount', () => {
      const original = makeOriginalPayment();
      const reversal = SEPADirectDebitPaymentReversal.fromOriginalInitiation(
        original,
        [{ endToEndId: 'E2E-ORIG-001', reason: 'AM05', reversedAmount: 750 }],
      );

      expect(reversal.reversalInstructions[0].reversals[0].reversedAmount).toBe(
        750,
      );
      expect(reversal.reversalInstructions[0].reversals[0].originalAmount).toBe(
        1500,
      );
    });

    test('throws when endToEndId is not found in original', () => {
      const original = makeOriginalPayment();
      expect(() =>
        SEPADirectDebitPaymentReversal.fromOriginalInitiation(original, [
          { endToEndId: 'NONEXISTENT', reason: 'DUPL' },
        ]),
      ).toThrow(
        "endToEndId 'NONEXISTENT' not found in original payment initiation",
      );
    });

    test('copies debtor/mandate blocks from original pain.008', () => {
      const original = makeOriginalPayment();
      const reversal = SEPADirectDebitPaymentReversal.fromOriginalInitiation(
        original,
        [{ endToEndId: 'E2E-ORIG-001', reason: 'DUPL' }],
      );
      const xml = reversal.serialize();

      expect(xml).toMatch(/<Nm>Dael Muniz<\/Nm>/);
      expect(xml).toMatch(/<IBAN>ES8201822200150201504058<\/IBAN>/);
      expect(xml).toMatch(/<BIC>BBVAESMMXXX<\/BIC>/);
      expect(xml).toMatch(/<MndtId>MNDT-0001<\/MndtId>/);
    });
  });

  describe('XSD validation', () => {
    test('serialized XML validates against pain.007.001.02 XSD', () => {
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig());
      const xml = reversal.serialize();
      expect(() => validateAgainstXsd(xml, XSD_PATH)).not.toThrow();
    });

    test('partial reversal validates against XSD', () => {
      const group = makeGroup(
        {},
        {
          originalAmount: 1500,
          reversedAmount: 750,
          originalTransaction: {
            amount: 1500,
            debtor,
            debtorAccount: { iban: 'ES8201822200150201504058' },
            debtorAgent: { bic: 'BBVAESMMXXX' },
            mandate: {
              mandateId: 'MNDT-0001',
              dateOfSignature: new Date('2024-01-15'),
              amendmentIndicator: false,
            },
          },
        },
      );
      const reversal = new SEPADirectDebitPaymentReversal(makeConfig(group));
      const xml = reversal.serialize();
      expect(() => validateAgainstXsd(xml, XSD_PATH)).not.toThrow();
    });

    test('multi-group message validates against XSD', () => {
      const group1 = makeGroup();
      const group2 = makeGroup(
        {
          paymentInformationId: 'RVSL-GRP-2',
        },
        {
          reversalId: 'RVSL-TX-002',
          originalReference: {
            pmtInfId: 'ORIG-PMTINF-002',
            endToEndId: 'ORIG-E2E-002',
            requestedCollectionDate: new Date('2026-06-01'),
          },
        },
      );
      const config = makeConfig(group1);
      config.reversalInstructions = [group1, group2];
      const reversal = new SEPADirectDebitPaymentReversal(config);
      const xml = reversal.serialize();
      expect(() => validateAgainstXsd(xml, XSD_PATH)).not.toThrow();
    });
  });
});
