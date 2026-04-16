import { ExternalCategoryPurpose, Party, SEPACreditPaymentInstruction } from '../../lib/types';
import { PaymentInitiation } from './payment-initiation';
type AtLeastOne<T> = [T, ...T[]];
/**
 * Configuration for SEPA Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the SEPA credit transfer.
 * @property {AtLeastOne<SEPACreditPaymentInstruction>} paymentInstructions - An array containing at least one payment instruction for SEPA credit transfer.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 * @property {ExternalCategoryPurpose} [categoryPurpose] - Optional category purpose code following ISO20022 ExternalCategoryPurpose1Code standard.
 */
export interface SEPACreditPaymentInitiationConfig {
    /** The party initiating the SEPA credit transfer. */
    initiatingParty: Party;
    /** An array containing at least one payment instruction for SEPA credit transfer. */
    paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
    /** Optional category purpose code following ISO20022 ExternalCategoryPurpose1Code standard */
    categoryPurpose?: ExternalCategoryPurpose;
}
/**
 * Represents a SEPA Credit Payment Initiation.
 * This class handles the creation and serialization of SEPA credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPACreditPaymentInitiationConfig} config - The configuration for the SEPA Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA payment message
 * const payment = new SEPACreditPaymentInitiation({
 *   // configuration options
 * });
 * // Uploading the payment
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = SEPACreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/sepacredit} for more information.
 */
export declare class SEPACreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    messageId: string;
    creationDate: Date;
    paymentInstructions: AtLeastOne<SEPACreditPaymentInstruction>;
    paymentInformationId: string;
    categoryPurpose?: ExternalCategoryPurpose;
    private formattedPaymentSum;
    get schemaId(): string;
    /**
     * Creates an instance of SEPACreditPaymentInitiation.
     * @param {SEPACreditPaymentInitiationConfig} config - The configuration object for the SEPA credit transfer.
     */
    constructor(config: SEPACreditPaymentInitiationConfig);
    /**
     * Calculates the sum of all payment instructions.
     * @private
     * @param {AtLeastOne<SEPACreditPaymentInstruction>} instructions - Array of payment instructions.
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
    private validateAllInstructionsHaveSameCurrency;
    /**
     * Generates payment information for a single SEPA credit transfer instruction.
     * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA specifications.
     */
    creditTransfer(instruction: SEPACreditPaymentInstruction): {
        Cdtr: any;
        CdtrAcct: {
            Id: {
                IBAN: string;
            };
            Ccy: "EUR";
        };
        RmtInf: {
            Ustrd: string;
        } | undefined;
        CdtrAgt?: {
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
        } | undefined;
        PmtId: {
            InstrId: string;
            EndToEndId: string;
        };
        Amt: {
            InstdAmt: {
                '#': string;
                '@Ccy': "EUR";
            };
        };
    };
    /**
     * Serializes the SEPA credit transfer initiation to an XML string.
     * @returns {string} The XML representation of the SEPA credit transfer initiation.
     */
    serialize(): string;
    static fromXML(rawXml: string): SEPACreditPaymentInitiation;
}
export {};
