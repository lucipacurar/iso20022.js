import { Party, RTPCreditPaymentInstruction } from '../../lib/types';
import { PaymentInitiation } from './payment-initiation';
type AtLeastOne<T> = [T, ...T[]];
/**
 * Configuration for RTP Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the RTP credit transfer.
 * @property {AtLeastOne<RTPCreditPaymentInstruction>} paymentInstructions - Array containing at least one payment instruction for the RTP credit transfer.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
export interface RTPCreditPaymentInitiationConfig {
    /** The party initiating the RTP credit transfer. */
    initiatingParty: Party;
    /** Array containing at least one payment instruction for the RTP credit transfer. */
    paymentInstructions: AtLeastOne<RTPCreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
}
/**
 * Represents a RTP Credit Payment Initiation.
 * This class handles the creation and serialization of RTP credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {RTPCreditPaymentInitiationConfig} config - The configuration for the RTP Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new RTPCreditPaymentInitiation({
 *   ...
 * });
 * // Uploading to fiatwebservices.com
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = RTPCreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/rtpcredit} for more information.
 */
export declare class RTPCreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    paymentInstructions: AtLeastOne<RTPCreditPaymentInstruction>;
    messageId: string;
    creationDate: Date;
    paymentInformationId: string;
    private formattedPaymentSum;
    constructor(config: RTPCreditPaymentInitiationConfig);
    /**
     * Calculates the sum of all payment instructions.
     * @private
     * @param {AtLeastOne<RTPCreditPaymentInstruction>} instructions - Array of payment instructions.
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     * @throws {Error} If payment instructions have different currencies.
     */
    private sumPaymentInstructions;
    /**
     * Validates the payment initiation data according to SEPA requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If payment instructions have different currencies.
     * @throws {Error} If any creditor has incomplete address information.
     */
    private validate;
    /**
     * Generates payment information for a single SEPA credit transfer instruction.
     * @param {RTPCreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA specifications.
     */
    creditTransfer(instruction: RTPCreditPaymentInstruction): {
        PmtId: {
            InstrId: string;
            EndToEndId: string;
        };
        Amt: {
            InstdAmt: {
                '#': string;
                '@Ccy': "USD";
            };
        };
        CdtrAgt: {
            FinInstnId: {
                BIC: string;
                ClrSysMmbId?: undefined;
            };
        } | {
            FinInstnId: {
                ClrSysMmbId: {
                    ClrSysId: {
                        Cd: string;
                    };
                    MmbId: string;
                };
                BIC?: undefined;
            };
        };
        Cdtr: any;
        CdtrAcct: {
            Id: {
                Othr: {
                    Id: string;
                };
            };
        };
        RmtInf: {
            Ustrd: string;
        } | undefined;
    };
    /**
     * Serializes the RTP credit transfer initiation to an XML string.
     * @returns {string} The XML representation of the RTP credit transfer initiation.
     */
    serialize(): string;
    static fromXML(rawXml: string): RTPCreditPaymentInitiation;
}
export {};
