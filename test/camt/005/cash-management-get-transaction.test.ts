import { CashManagementGetTransaction } from '../../../src/camt/005/cash-management-get-transaction';
import fs from 'node:fs';

describe('CashManagementGetTransaction', () => {
  describe('from JSON', () => {
    it('should parse a valid CAMT.005 message with criteria on MsgId', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.005.sample1.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementGetTransaction.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementGetTransaction);
      expect(message.data.header.id).toBe('ABCDEFGHIXXX1202104120040299876543');
      expect(message.data.header.creationDateTime?.toISOString()).toBe(
        '2021-09-28T13:42:47.123Z',
      );
      expect(message.data.newCriteria).toBeDefined();
      const newCriteria = message.data.newCriteria!;
      expect(newCriteria.name).toBeUndefined();
      expect(newCriteria.searchCriteria.length).toBe(1);
      const criteria = newCriteria.searchCriteria[0]!;
      expect(criteria.type).toBe('PmtSch.MsgId');
      expect(criteria.msgIdsEqualTo).toEqual([
        'FXCDEFGHIXXX1202104120040291234567',
        'ABCDEFGHIXXX1202104120040291234588',
      ]);

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementGetTransaction.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        'ABCDEFGHIXXX1202104120040299876543',
      );
    });
    it('should parse a valid CAMT.005 message with criteria on Dates', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.005.sample2.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementGetTransaction.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementGetTransaction);
      expect(message.data.header.id).toBe('ABCDEFGHIXXX1202104120040299876543');
      expect(message.data.header.creationDateTime).toBeUndefined();
      expect(message.data.newCriteria).toBeDefined();
      const newCriteria = message.data.newCriteria!;
      expect(newCriteria.name).toBeUndefined();
      expect(newCriteria.searchCriteria.length).toBe(1);
      const criteria = newCriteria.searchCriteria[0]!;
      expect(criteria.type).toBe('PmtSch.ReqdExctnDt');
      expect(criteria.dateEqualTo).toEqual(new Date('2021-10-01'));

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementGetTransaction.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        'ABCDEFGHIXXX1202104120040299876543',
      );
    });
    it('should parse a valid CAMT.005 message with criteria on End to End Id', () => {
      const fileName = `${process.cwd()}/test/assets/camt/camt.005.sample3.json`;
      const rawJson = fs.readFileSync(fileName, 'utf-8');
      const message = CashManagementGetTransaction.fromJSON(rawJson);
      expect(message).toBeInstanceOf(CashManagementGetTransaction);
      expect(message.data.header.id).toBe('ABCDEFGHIXXX1202104120040299876543');
      expect(message.data.header.creationDateTime).toBeUndefined();
      expect(message.data.newCriteria).toBeDefined();
      const newCriteria = message.data.newCriteria!;
      expect(newCriteria.name).toBeUndefined();
      expect(newCriteria.searchCriteria.length).toBe(1);
      const criteria = newCriteria.searchCriteria[0]!;
      expect(criteria.type).toBe('PmtSch.PmtId.LngBizId.EndToEndId');
      expect(criteria.endToEndIdEqualTo).toEqual([
        'FXCDEFGHIXXX1202104120040291234567',
        'ABCDEFGHIXXX1202104120040291234588',
      ]);

      // generate XML and re-parse
      const xml = message.serialize();
      fs.writeFileSync(fileName.replace('.json', '.out.xml'), xml, 'utf8');
      const reparsedMessage = CashManagementGetTransaction.fromXML(xml);
      expect(reparsedMessage.data.header.id).toBe(
        'ABCDEFGHIXXX1202104120040299876543',
      );
    });
  });
});
