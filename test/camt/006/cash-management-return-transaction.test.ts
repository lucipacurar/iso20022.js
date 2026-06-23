import { CashManagementReturnTransaction } from '../../../src/camt/006/cash-management-return-transaction';
import fs from 'node:fs';

describe('CashManagementReturnAccount', () => {
  describe('from JSON', () => {
    it('should parse a valid CAMT.006 message with multiple Tx', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.006.sample1.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementReturnTransaction.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementReturnTransaction);
      expect(message.data.header.id).toBe('PTCDEFGHIXXX1202104120040299872243');
      expect(message.data.header.creationDateTime?.toISOString()).toBe(
        '2024-04-22T13:47:44.413Z',
      );
      expect(message.data.header.originalMessageHeader).toBeDefined();
      expect(message.data.header.originalMessageHeader?.id).toBe(
        'ABCDEFGHIXXX1202104120040297654321',
      );
      expect(message.data.reports).toHaveLength(2);
      expect(message.data.reports[0]!.paymentId).toBeDefined();
      expect(message.data.reports[0]!.paymentId?.endToEndId).toEqual(
        'E2E1242435245345',
      );
      expect(message.data.reports[0]!.paymentId?.currency).toEqual('EUR');
      expect(message.data.reports[0]!.paymentId?.amount).toEqual(9000); // 90.00 EUR
      expect(message.data.reports[0]!.report).toBeDefined();
      expect(message.data.reports[0]!.report?.status?.code).toEqual(
        'Sttlm:ACCC',
      );
      expect(message.data.reports[0]!.report?.debtor?.id).toEqual(
        '02345678941',
      );
      expect(message.data.reports[0]!.report?.debtorAgent).toBeDefined();
      const debtorAgent = message.data.reports[0]!.report?.debtorAgent;
      if (debtorAgent && 'bic' in debtorAgent) {
        expect(debtorAgent.bic).toEqual('AGRIFRPPXXX');
      }
      expect(message.data.reports[0]!.report?.creditor?.id).toEqual(
        '02345678943',
      );
      expect(message.data.reports[0]!.report?.creditorAgent).toBeDefined();
      const creditorAgent = message.data.reports[0]!.report?.creditorAgent;
      if (creditorAgent && 'bic' in creditorAgent) {
        expect(creditorAgent.bic).toEqual('BNPAFRPPXXX');
      }

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementReturnTransaction.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        'PTCDEFGHIXXX1202104120040299872243',
      );
    });

    it('should serialize with the camt.006 namespace (not camt.004)', () => {
      // Regression: serialize() and fromXML() both referenced camt.004, so the
      // self-round-trip above passed despite both sides being wrong. A
      // structural assertion on the emitted XML is the only way to catch this.
      const fileName = `${process.cwd()}/test/assets/camt/camt.006.sample1.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const xml = CashManagementReturnTransaction.fromJSON(rawJson).serialize();
      expect(xml).toContain('urn:iso:std:iso:20022:tech:xsd:camt.006.001.');
      expect(xml).not.toContain('camt.004');
    });

    it('should round-trip a proprietary (Prtry) status code', () => {
      // Regression: parse code lookup used `sts.Cd?.Prtly` (typo) instead of
      // `Prtry`, so proprietary status codes were silently dropped on parse.
      const message = new CashManagementReturnTransaction({
        header: { id: 'TEST-PRTRY-001' },
        reports: [
          {
            paymentId: {
              currency: 'EUR',
              amount: 10_000,
              endToEndId: 'E2E-PRTRY-1',
            },
            report: {
              status: { code: 'Prtry:CUSTOM_CODE' },
              debtor: { id: 'D1' },
              debtorAgent: { bic: 'AGRIFRPPXXX' },
              creditor: { id: 'C1' },
              creditorAgent: { bic: 'BNPAFRPPXXX' },
            },
          },
        ],
      });
      const reparsed = CashManagementReturnTransaction.fromXML(
        message.serialize(),
      );
      expect(reparsed.data.reports[0]!.report?.status?.code).toEqual(
        'Prtry:CUSTOM_CODE',
      );
    });
  });
});
