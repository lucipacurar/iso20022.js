import { XMLBuilder, XMLParser } from 'fast-xml-parser';

export type ISO20022MessageTypeName = `${string}.${string}`;
export const ISO20022Messages = {
  CAMT_003: 'CAMT.003',
  CAMT_004: 'CAMT.004',
  CAMT_005: 'CAMT.005',
  CAMT_006: 'CAMT.006',
  CAMT_052: 'CAMT.052',
  CAMT_053: 'CAMT.053',

  PAIN_001: 'PAIN.001',
  PAIN_002: 'PAIN.002',
} as const satisfies Record<string, ISO20022MessageTypeName>;

export const XMLNS_PREFIX = 'urn:iso:std:iso:20022:tech:xsd:';

export const ISO20022SchemaId = {
  PAIN_001_001_03: 'pain.001.001.03',
  PAIN_007_001_02: 'pain.007.001.02',
  PAIN_008_001_02: 'pain.008.001.02',
} as const;

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
/**
 * Creates and configures the XML Parser
 *
 * @returns {XMLParser} A configured instance of XMLParser
 */
export function getXmlParser(): XMLParser {
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

export function getXmlBuilder(): XMLBuilder {
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    format: true,
  });
}
