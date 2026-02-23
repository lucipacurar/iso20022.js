import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { get } from 'http';

export type ISO20022MessageTypeName = `${string}.${string}`;
export const ISO20022Messages: { [msg: string]: ISO20022MessageTypeName } = {
  CAMT_003: 'CAMT.003',
  CAMT_004: 'CAMT.004',
  CAMT_005: 'CAMT.005',
  CAMT_006: 'CAMT.006',
  CAMT_053: 'CAMT.053',

  PAIN_001: 'PAIN.001',
  PAIN_002: 'PAIN.002',
};

export interface GenericISO20022Message {
  /** serialize to XML string */
  serialize(): string;
  /** export to a json object that can then be serialized */
  toJSON(): any;
  readonly data: any;
}

export interface GenericISO20022MessageFactory<
  T extends GenericISO20022Message,
> {
  /** tells what messages are supported */
  supportedMessages(): ISO20022MessageTypeName[];
  fromXML(xml: string): T;
  fromJSON(json: string): T;
  new (data: any): T;
}

const ISO20022Implementations: Map<
  ISO20022MessageTypeName,
  GenericISO20022MessageFactory<GenericISO20022Message>
> = new Map();
export function registerISO20022Implementation(
  cl: GenericISO20022MessageFactory<GenericISO20022Message>,
) {
  cl.supportedMessages().forEach(msg => {
    ISO20022Implementations.set(msg, cl);
  });
}
export function getISO20022Implementation(
  type: ISO20022MessageTypeName,
): GenericISO20022MessageFactory<GenericISO20022Message> | undefined {
  return ISO20022Implementations.get(type);
}
export class XML {
  /**
   * Creates and configures the XML Parser
   *
   * @returns {XMLParser} A configured instance of XMLParser
   */
  static getParser(): XMLParser {
    return new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      /**
       * Disable automatic numeric parsing. ISO 20022 fields are semantically
       * strings (Max35Text, etc.). Numeric-looking values like AcctSvcrRef,
       * EndToEndId, NtryRef, and Cd must stay as strings to preserve leading
       * zeros and avoid precision loss on large numbers. Amounts are explicitly
       * converted to numbers downstream via parseAmountToMinorUnits.
       */
      parseTagValue: false,
    });
  }

  static getBuilder(): XMLBuilder {
    return new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
    });
  }
}
