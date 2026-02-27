import type { ExternalCategoryPurpose, Party, SEPADirectDebitPaymentInstruction, SEPALocalInstrument, SEPASequenceType } from '../../lib/types';
import { PaymentInitiation } from '../001/payment-initiation';
type AtLeastOne<T> = [T, ...T[]];
/**
 * Represents a group of direct debit payment instructions for a single creditor (PmtInf block).
 *
 * @property {Party} creditor - The party collecting money from debtors.
 * @property {string} creditorSchemeId - The creditor's SEPA scheme identifier (e.g., "DE96ZZZ00000345986").
 * @property {AtLeastOne<SEPADirectDebitPaymentInstruction>} payments - An array containing at least one payment instruction for this creditor.
 * @property {Date} requestedCollectionDate - The date when funds should be collected from all debtors in this group.
 * @property {SEPASequenceType} sequenceType - Sequence type indicating the position in a series of direct debits (FRST, RCUR, OOFF, FNAL).
 * @property {SEPALocalInstrument} [localInstrument] - The SEPA direct debit scheme (CORE or B2B). Defaults to 'CORE'.
 * @property {ExternalCategoryPurpose} [categoryPurpose] - Optional category purpose code for this payment information block.
 * @property {boolean} [batchBooking] - Indicates whether transactions should be booked in batch. Defaults to false.
 */
export interface SEPADirectDebitPaymentInstructionGroup {
    /** The party collecting money from debtors. */
    creditor: Party;
    /** The creditor's SEPA scheme identifier. */
    creditorSchemeId: string;
    /** An array containing at least one direct debit instruction. */
    payments: AtLeastOne<SEPADirectDebitPaymentInstruction>;
    /** The date when funds should be collected from all debtors. */
    requestedCollectionDate: Date;
    /** Sequence type for all transactions in this group (FRST, RCUR, OOFF, FNAL). */
    sequenceType: SEPASequenceType;
    /** The SEPA direct debit scheme (CORE or B2B). Defaults to 'CORE'. */
    localInstrument?: SEPALocalInstrument;
    /** Optional category purpose code for this payment information block. */
    categoryPurpose?: ExternalCategoryPurpose;
    /** Indicates whether transactions should be booked in batch. Defaults to false. */
    batchBooking?: boolean;
}
/**
 * Configuration for SEPA Direct Debit Payment Initiation.
 *
 * @property {Party} initiatingParty - The top-level party initiating the message (used in GrpHdr).
 * @property {AtLeastOne<SEPADirectDebitPaymentInstructionGroup>} paymentInstructions - An array containing at least one payment instruction group.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
export interface SEPADirectDebitPaymentInitiationConfig {
    /** The top-level party initiating the message (used in GrpHdr). */
    initiatingParty: Party;
    /** An array containing at least one payment instruction group. */
    paymentInstructions: AtLeastOne<SEPADirectDebitPaymentInstructionGroup>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
}
/**
 * Represents a SEPA Direct Debit Payment Initiation.
 * This class handles the creation and serialization of SEPA direct debit messages
 * with multiple payment information blocks (multiple creditors) according to the ISO20022 pain.008 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPADirectDebitPaymentInitiationConfig} config - The configuration for the SEPA Direct Debit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA direct debit message
 * const payment = new SEPADirectDebitPaymentInitiation({
 *   initiatingParty: { name: 'Company Ltd', id: '12345' },
 *   paymentInstructions: [
 *     {
 *       creditor: creditor1,
 *       creditorSchemeId: 'DE96ZZZ00000345986',
 *       requestedCollectionDate: new Date('2025-11-22'),
 *       sequenceType: 'RCUR',
 *       payments: [debit1, debit2]
 *     }
 *   ]
 * });
 * ```
 */
export declare class SEPADirectDebitPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    messageId: string;
    creationDate: Date;
    paymentInstructions: AtLeastOne<SEPADirectDebitPaymentInstructionGroup>;
    private formattedPaymentSum;
    private totalTransactionCount;
    /**
     * Creates an instance of SEPADirectDebitPaymentInitiation.
     * @param {SEPADirectDebitPaymentInitiationConfig} config - The configuration object for the SEPA direct debit.
     */
    constructor(config: SEPADirectDebitPaymentInitiationConfig);
    /**
     * Counts the total number of transactions across all payment instruction groups.
     * @private
     * @returns {number} The total count of all transactions.
     */
    private countAllTransactions;
    /**
     * Calculates the sum of all payment instructions across all groups.
     * @private
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     */
    private sumAllPayments;
    /**
     * Validates the payment initiation data according to SEPA requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If any group's payment instructions have different currencies.
     */
    private validate;
    /**
     * Validates that all payment instructions in a group have the same currency (EUR).
     * @private
     * @param {AtLeastOne<SEPADirectDebitPaymentInstruction>} payments - Array of payment instructions.
     * @throws {Error} If payment instructions have different currencies.
     */
    private validateGroupInstructionsHaveSameCurrency;
    /**
     * Generates payment information for a single SEPA direct debit transfer instruction.
     * @param {SEPADirectDebitPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA direct debit specifications.
     */
    directDebitTransfer(instruction: SEPADirectDebitPaymentInstruction): {
        RmtInf?: {
            Ustrd: string;
        } | undefined;
        Dbtr: any;
        DbtrAcct: {
            Id: {
                IBAN: string;
            };
        } | {
            Id: {
                Othr: {
                    Id: string;
                };
            };
        };
        DbtrAgt?: {
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
            EndToEndId: string;
        };
        InstdAmt: {
            '#': string;
            '@Ccy': "EUR";
        };
        DrctDbtTx: {
            MndtRltdInf: {
                AmdmntInfDtls?: {
                    OrgnlCdtrSchmeId?: {
                        Id?: {
                            PrvtId: {
                                Othr: {
                                    Id: string;
                                    SchmeNm: {
                                        Prtry: string;
                                    };
                                };
                            };
                        } | undefined;
                        Nm?: string | undefined;
                    } | undefined;
                    OrgnlMndtId?: string | undefined;
                } | undefined;
                MndtId: string;
                DtOfSgntr: string;
                AmdmntInd: boolean;
            };
        };
    };
    /**
     * Serializes the SEPA direct debit initiation to an XML string.
     * @returns {string} The XML representation of the SEPA direct debit initiation.
     */
    serialize(): string;
    /**
     * Parses an XML string and creates a SEPADirectDebitPaymentInitiation instance.
     * Supports multiple PmtInf blocks in the XML document.
     * @param {string} rawXml - The XML string to parse.
     * @returns {SEPADirectDebitPaymentInitiation} A new instance created from the XML data.
     * @throws {InvalidXmlError} If the XML format is invalid.
     * @throws {InvalidXmlNamespaceError} If the namespace is not pain.008.
     */
    static fromXML(rawXml: string): SEPADirectDebitPaymentInitiation;
}
export {};
