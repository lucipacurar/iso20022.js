import { XMLBuilder, XMLParser } from 'fast-xml-parser';
export type ISO20022MessageTypeName = `${string}.${string}`;
export declare const ISO20022Messages: {
  [msg: string]: ISO20022MessageTypeName;
};
export declare const XMLNS_PREFIX = 'urn:iso:std:iso:20022:tech:xsd:';
export declare const ISO20022SchemaId: {
  readonly PAIN_001_001_03: 'pain.001.001.03';
  readonly PAIN_007_001_02: 'pain.007.001.02';
  readonly PAIN_008_001_02: 'pain.008.001.02';
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
export declare function registerISO20022Implementation(
  cl: GenericISO20022MessageFactory<GenericISO20022Message>,
): void;
export declare function getISO20022Implementation(
  type: ISO20022MessageTypeName,
): GenericISO20022MessageFactory<GenericISO20022Message> | undefined;
export declare class XML {
  /**
   * Creates and configures the XML Parser
   *
   * @returns {XMLParser} A configured instance of XMLParser
   */
  static getParser(): XMLParser;
  static getBuilder(): XMLBuilder;
}
