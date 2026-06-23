import { parseAgent, parseAmountToMinorUnits } from '../src/parseUtils';

// TODO: Continue adding some testing for currencies that have a precision of NOT 2
describe('parseAmountToMinorUnits', () => {
  test('converts USD amount to minor units', () => {
    expect(parseAmountToMinorUnits(10.5, 'USD')).toBe(1050);
    expect(parseAmountToMinorUnits(0.01, 'USD')).toBe(1);
    expect(parseAmountToMinorUnits(100, 'USD')).toBe(10_000);
  });

  // Figure out why JPY has a precision of 2, instead of 0
  // Fix the precision by currency with the lib/currencies.ts
  test('converts JPY amount to minor units', () => {
    expect(parseAmountToMinorUnits(100_000, 'JPY')).toBe(100_000);
  });

  test('handles string input for amount', () => {
    expect(parseAmountToMinorUnits('10.50', 'USD')).toBe(1050);
  });

  test('uses USD as default currency', () => {
    expect(parseAmountToMinorUnits(10.5)).toBe(1050);
    expect(parseAmountToMinorUnits(0.01)).toBe(1);
  });
});

describe('parseAgent', () => {
  test('parses a BIC-only agent (legacy v02 spelling)', () => {
    expect(parseAgent({ FinInstnId: { BIC: 'GSCRUS30' } })).toEqual({
      bic: 'GSCRUS30',
    });
  });

  test('parses a BICFI-only agent (v04+ spelling)', () => {
    expect(parseAgent({ FinInstnId: { BICFI: 'BYLADEM1001' } })).toEqual({
      bic: 'BYLADEM1001',
    });
  });

  test('prefers BICFI when both BIC and BICFI are present', () => {
    expect(
      parseAgent({ FinInstnId: { BIC: 'OLDBIC00', BICFI: 'NEWBIC00' } }),
    ).toEqual({ bic: 'NEWBIC00' });
  });

  test('parses an Othr.Id-only agent as ABA routing number', () => {
    expect(parseAgent({ FinInstnId: { Othr: { Id: '021000021' } } })).toEqual({
      abaRoutingNumber: '021000021',
    });
  });

  test('parses a ClrSysMmbId.MmbId-only agent as ABA routing number', () => {
    expect(
      parseAgent({ FinInstnId: { ClrSysMmbId: { MmbId: '12030000' } } }),
    ).toEqual({ abaRoutingNumber: '12030000' });
  });

  test('does not throw on BICFI-only agent without ClrSysMmbId fallback', () => {
    expect(() =>
      parseAgent({ FinInstnId: { BICFI: 'BYLADEM1001' } }),
    ).not.toThrow();
  });

  test('throws a descriptive error when no recognizable identifier is present', () => {
    expect(() => parseAgent({ FinInstnId: {} })).toThrow(
      /Unable to parse agent/,
    );
  });
});
