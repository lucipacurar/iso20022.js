import { Alpha2Country } from 'lib/countries';
import {
  SEPADirectDebitPaymentInitiation,
  SEPADirectDebitPaymentInitiationConfig,
  SEPADirectDebitPaymentInstructionGroup,
} from '../../../src/pain/008/sepa-direct-debit-payment-initiation';
import { SEPADirectDebitPaymentInstruction } from '../../../src/lib/types';

describe('SEPADirectDebitPaymentInitiation', () => {
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
    name: 'Dáel Muñiz',
    account: {
      iban: 'ES8201822200150201504058',
    },
    agent: {
      bic: 'BBVAESMMXXX',
    },
  };

  const basePayment: SEPADirectDebitPaymentInstruction = {
    type: 'sepa',
    direction: 'debit',
    amount: 1500,
    currency: 'EUR',
    debtor,
    mandate: {
      mandateId: 'MNDT-0001',
      dateOfSignature: new Date('2024-01-15'),
      amendmentIndicator: false,
    },
  };

  const makeGroup = (
    overrides: Partial<SEPADirectDebitPaymentInstructionGroup> = {},
    paymentOverrides: Partial<SEPADirectDebitPaymentInstruction> = {},
  ): SEPADirectDebitPaymentInstructionGroup => ({
    creditor,
    creditorSchemeId: 'DE96ZZZ00000345986',
    payments: [{ ...basePayment, ...paymentOverrides }],
    requestedCollectionDate: new Date('2026-05-01'),
    sequenceType: 'RCUR',
    ...overrides,
  });

  const makeConfig = (
    group: SEPADirectDebitPaymentInstructionGroup = makeGroup(),
  ): SEPADirectDebitPaymentInitiationConfig => ({
    initiatingParty,
    paymentInstructions: [group],
  });

  describe('paymentInformationId', () => {
    test('uses caller-provided value verbatim in <PmtInfId>', () => {
      const group = makeGroup({ paymentInformationId: 'CALLER-PMTINF-001' });
      const payment = new SEPADirectDebitPaymentInitiation(makeConfig(group));
      const xml = payment.serialize();
      expect(xml).toMatch(/<PmtInfId>CALLER-PMTINF-001<\/PmtInfId>/);
    });

    test('falls back to a generated UUID when omitted', () => {
      const payment = new SEPADirectDebitPaymentInitiation(makeConfig());
      const xml = payment.serialize();
      // generateId() produces a 32-char hex string (UUID v4 without hyphens).
      expect(xml).toMatch(/<PmtInfId>[0-9a-f]{32}<\/PmtInfId>/);
    });

    test('rejects values longer than 35 characters', () => {
      const group = makeGroup({ paymentInformationId: 'a'.repeat(36) });
      expect(() => new SEPADirectDebitPaymentInitiation(makeConfig(group)))
        .toThrow('paymentInformationId must not exceed 35 characters');
    });

    test('rejects empty string', () => {
      const group = makeGroup({ paymentInformationId: '' });
      expect(() => new SEPADirectDebitPaymentInitiation(makeConfig(group)))
        .toThrow('paymentInformationId must not be empty');
    });
  });

  describe('instrId', () => {
    test('emits <InstrId> and places it before <EndToEndId>', () => {
      const group = makeGroup({}, { instrId: 'CALLER-INSTR-001' });
      const payment = new SEPADirectDebitPaymentInitiation(makeConfig(group));
      const xml = payment.serialize();
      expect(xml).toMatch(/<InstrId>CALLER-INSTR-001<\/InstrId>/);
      const instrIdIdx = xml.indexOf('<InstrId>');
      const endToEndIdIdx = xml.indexOf('<EndToEndId>');
      expect(instrIdIdx).toBeGreaterThan(-1);
      expect(endToEndIdIdx).toBeGreaterThan(-1);
      expect(instrIdIdx).toBeLessThan(endToEndIdIdx);
    });

    test('emits no <InstrId> element when omitted', () => {
      const payment = new SEPADirectDebitPaymentInitiation(makeConfig());
      const xml = payment.serialize();
      expect(xml).not.toMatch(/<InstrId>/);
    });

    test('rejects values longer than 35 characters', () => {
      const group = makeGroup({}, { instrId: 'a'.repeat(36) });
      expect(() => new SEPADirectDebitPaymentInitiation(makeConfig(group)))
        .toThrow('instrId must not exceed 35 characters');
    });

    test('rejects empty string', () => {
      const group = makeGroup({}, { instrId: '' });
      expect(() => new SEPADirectDebitPaymentInitiation(makeConfig(group)))
        .toThrow('instrId must not be empty');
    });
  });

  describe('fromXML round-trip', () => {
    test('preserves caller-provided paymentInformationId and instrId', () => {
      const group = makeGroup(
        { paymentInformationId: 'CALLER-PMTINF-001' },
        { instrId: 'CALLER-INSTR-001' },
      );
      const original = new SEPADirectDebitPaymentInitiation(makeConfig(group));
      const xml = original.serialize();

      const parsed = SEPADirectDebitPaymentInitiation.fromXML(xml);
      expect(parsed.paymentInstructions[0].paymentInformationId).toBe(
        'CALLER-PMTINF-001',
      );
      expect(parsed.paymentInstructions[0].payments[0].instrId).toBe(
        'CALLER-INSTR-001',
      );
    });

    test('leaves instrId undefined when absent from source XML', () => {
      const original = new SEPADirectDebitPaymentInitiation(makeConfig());
      const parsed = SEPADirectDebitPaymentInitiation.fromXML(
        original.serialize(),
      );
      expect(parsed.paymentInstructions[0].payments[0].instrId).toBeUndefined();
    });
  });

  describe('backwards compatibility', () => {
    test('output with neither field set produces a generated PmtInfId and no InstrId', () => {
      const payment = new SEPADirectDebitPaymentInitiation(makeConfig());
      const xml = payment.serialize();
      expect(xml).toMatch(/<PmtInfId>[0-9a-f]{32}<\/PmtInfId>/);
      expect(xml).not.toMatch(/<InstrId>/);
    });
  });
});
