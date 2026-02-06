import { Party, SWIFTCreditPaymentInstruction } from '../../lib/types.js';
import { PaymentInitiation } from './payment-initiation';
type AtLeastOne<T> = [T, ...T[]];
/**
 * Configuration for SWIFT Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the payment.
 * @property {AtLeastOne<SWIFTCreditPaymentInstruction>} paymentInstructions - An array of payment instructions.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
export interface SWIFTCreditPaymentInitiationConfig {
    /** The party initiating the payment. */
    initiatingParty: Party;
    /** An array of payment instructions. */
    paymentInstructions: AtLeastOne<SWIFTCreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
}
/**
 * Represents a SWIFT Credit Payment v3 Initiation message (pain.001.001.03).
 * @class
 * @extends PaymentInitiation
 * @param {SWIFTCreditPaymentInitiationConfig} config - The configuration for the SWIFT Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new SWIFTCreditPaymentInitiation({
 *   ...
 * });
 * // Uploading to fiatwebservices.com
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = SWIFTCreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/sepacredit} for more information.
 */
export declare class SWIFTCreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    messageId: string;
    creationDate: Date;
    paymentInstructions: SWIFTCreditPaymentInstruction[];
    paymentInformationId: string;
    /**
     * Creates an instance of SWIFTCreditPaymentInitiation.
     * @param {SWIFTCreditPaymentInitiationConfig} config - The configuration object.
     */
    constructor(config: SWIFTCreditPaymentInitiationConfig);
    /**
     * Validates the payment initiation data has the information required to create a valid XML file.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If any creditor has incomplete address information.
     */
    private validate;
    /**
     * Generates payment information for a single payment instruction.
     * @param {SWIFTCreditPaymentInstruction} paymentInstruction - The payment instruction.
     * @returns {Object} The credit transfer object.
     */
    creditTransfer(paymentInstruction: SWIFTCreditPaymentInstruction): Record<string, any>;
    /**
     * Serializes the payment initiation to an XML string.
     * @returns {string} The XML representation of the payment initiation.
     */
    static fromXML(rawXml: string): SWIFTCreditPaymentInitiation;
    serialize(): string;
}
export {};
