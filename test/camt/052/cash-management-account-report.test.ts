import { CashManagementAccountReport } from '../../../src/camt/052/cash-management-account-report';
import fs from 'node:fs';

describe('CashManagementAccountReport', () => {
  describe('CAMT.052.001.08 with BICFI agents', () => {
    const filePath = `${process.cwd()}/test/assets/camt/camt.052.v08.bicfi.xml`;
    let report: CashManagementAccountReport;

    beforeAll(() => {
      const xml = fs.readFileSync(filePath, 'utf8');
      report = CashManagementAccountReport.fromXML(xml);
    });

    it('parses without throwing', () => {
      expect(report).toBeInstanceOf(CashManagementAccountReport);
      expect(report.messageId).toBe('MSG-V08-0001');
    });

    it('parses the servicer agent from BICFI', () => {
      const statement = report.statements[0]!;
      expect(statement.agent).toEqual({ bic: 'BANKDEFFXXX' });
    });

    it('parses entries and balances', () => {
      expect(report.statements.length).toBe(1);
      expect(report.balances.length).toBe(2);
      expect(report.entries.length).toBe(2);
      expect(report.transactions.length).toBe(2);
    });

    it('parses a debtor agent with only BICFI', () => {
      const credit = report.transactions.find(
        t => t.remittanceInformation === 'Sample remittance credit',
      );
      expect(credit).toBeDefined();
      expect(credit?.debtor?.agent).toEqual({ bic: 'BANKDEFFXXX' });
    });

    it('parses a creditor agent with only BICFI', () => {
      const debit = report.transactions.find(
        t => t.remittanceInformation === 'Sample remittance debit',
      );
      expect(debit).toBeDefined();
      expect(debit?.creditor?.agent).toEqual({ bic: 'OTHRDEFFXXX' });
    });

    it('parses debtor name from Pty wrapper', () => {
      const credit = report.transactions.find(
        t => t.remittanceInformation === 'Sample remittance credit',
      );
      expect(credit?.debtor?.name).toBe('Sample Debtor');
    });

    it('parses creditor name from Pty wrapper', () => {
      const debit = report.transactions.find(
        t => t.remittanceInformation === 'Sample remittance debit',
      );
      expect(debit?.creditor?.name).toBe('Sample Creditor');
    });
  });
});
