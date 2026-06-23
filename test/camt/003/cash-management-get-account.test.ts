import { CashManagementGetAccount } from '../../../src/camt/003/cash-management-get-account';
import fs from 'node:fs';

describe('CashManagementGetAccount', () => {
  describe('from JSON', () => {
    it('should parse a valid CAMT.003 message with criteria on Account ID', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.003.sample1.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementGetAccount.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementGetAccount);
      expect(message.data.header.id).toBe('ABCDEFGHIXXX1202104120040297654321');
      expect(message.data.header.creationDateTime?.toISOString()).toBe(
        '2021-09-28T13:41:47.123Z',
      );
      expect(message.data.newCriteria).toBeDefined();
      const newCriteria = message.data.newCriteria!;
      expect(newCriteria.name).toBeUndefined();
      expect(newCriteria.searchCriteria.length).toEqual(1);
      const criteria = newCriteria.searchCriteria[0]!;
      expect(criteria.accountEqualTo).toBeDefined();
      const accountEqualTo = criteria.accountEqualTo;
      expect(accountEqualTo).toHaveProperty('id');
      if (accountEqualTo && 'id' in accountEqualTo) {
        // TypeScript type guard
        expect(accountEqualTo.id).toEqual('02345678943');
        expect(accountEqualTo.issuer).toEqual('AGRIFRPPXXX');
      }
      expect(criteria.currencyEqualTo).toEqual('USD');
      expect(criteria.balanceAsOfDateEqualTo).toEqual(new Date('2021-09-28'));

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementGetAccount.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        'ABCDEFGHIXXX1202104120040297654321',
      );
    });

    it('should round-trip a "does not contain" (NCTTxt) account criterion', () => {
      // Regression: the serialize-side regex used to strip `^((!(` instead of
      // `^((?!`, so the NCTTxt written to XML was truncated and the reparsed
      // regex was garbage.
      const message = new CashManagementGetAccount({
        header: { id: 'TEST-NCT-001' },
        newCriteria: {
          name: 'nct-test',
          searchCriteria: [{ accountRegExp: '^((?!ABC).)*$' }],
        },
      });
      const reparsed = CashManagementGetAccount.fromXML(message.serialize());
      expect(
        reparsed.data.newCriteria.searchCriteria[0]!.accountRegExp,
      ).toEqual('^((?!ABC).)*$');
    });
  });
});
