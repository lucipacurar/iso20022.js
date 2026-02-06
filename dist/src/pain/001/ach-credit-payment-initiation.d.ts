import { ACHCreditPaymentInstruction, ACHLocalInstrument, Party } from '../../lib/types';
import { PaymentInitiation } from './payment-initiation';
type AtLeastOne<T> = [T, ...T[]];
/**
 * Configuration for ACH Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The party initiating the ACH credit transfer.
 * @property {AtLeastOne<ACHCreditPaymentInstruction>} paymentInstructions - Array containing at least one payment instruction for the ACH credit transfer.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
export interface ACHCreditPaymentInitiationConfig {
    /** The party initiating the ACH credit transfer. */
    initiatingParty: Party;
    /** Array containing at least one payment instruction for the ACH credit transfer. */
    paymentInstructions: AtLeastOne<ACHCreditPaymentInstruction>;
    /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
    messageId?: string;
    /** Optional creation date for the message. If not provided, current date will be used. */
    creationDate?: Date;
    /** Optional local instrument code for the ACH credit transfer. If not provided, 'CCD' (Corporate Credit or Debit) will be used. */
    localInstrument?: ACHLocalInstrument;
}
/**
 * Represents an ACH Credit Payment Initiation.
 * This class handles the creation and serialization of ACH credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {ACHCreditPaymentInitiationConfig} config - The configuration for the ACH Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new ACHCreditPaymentInitiation({
 *   initiatingParty: {
 *     name: 'John Doe Corporation',
 *     id: 'JOHNDOE99',
 *     account: {
 *       accountNumber: '0123456789'
 *     },
 *     agent: {
 *       abaRoutingNumber: '123456789',
 *     }
 *   },
 *   paymentInstructions: [{
 *     type: 'ach',
 *     direction: 'credit',
 *     amount: 1000,
 *     currency: 'USD',
 *     creditor: {
 *       name: 'John Doe Funding LLC',
 *       account: {
 *         accountNumber: '0123456789'
 *       },
 *       agent: {
 *         abaRoutingNumber: '0123456789'
 *       }
 *     }
 *   }]
 * });
 *
 * // Serializing to XML
 * const xml = payment.serialize();
 *
 * // Parsing from XML
 * const parsedPayment = ACHCreditPaymentInitiation.fromXML(xml);
 * ```
 */
export declare class ACHCreditPaymentInitiation extends PaymentInitiation {
    initiatingParty: Party;
    paymentInstructions: AtLeastOne<ACHCreditPaymentInstruction>;
    messageId: string;
    creationDate: Date;
    paymentInformationId: string;
    localInstrument: string;
    serviceLevel: string;
    instructionPriority: string;
    private formattedPaymentSum;
    constructor(config: ACHCreditPaymentInitiationConfig);
    /**
     * Calculates the sum of all payment instructions.
     * @private
     * @param {AtLeastOne<ACHCreditPaymentInstruction>} instructions - Array of payment instructions.
     * @returns {string} The total sum formatted as a string with 2 decimal places.
     * @throws {Error} If payment instructions have different currencies.
     */
    private sumPaymentInstructions;
    /**
     * Validates the payment initiation data according to ACH requirements.
     * @private
     * @throws {Error} If messageId exceeds 35 characters.
     * @throws {Error} If payment instructions have different currencies.
     * @throws {Error} If any creditor has incomplete information.
     */
    private validate;
    /**
     * Generates payment information for a single ACH credit transfer instruction.
     * @param {ACHCreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to ACH specifications.
     */
    creditTransfer(instruction: ACHCreditPaymentInstruction): {
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
            Tp: {
                Cd: string;
            };
            Ccy: "USD";
        };
        RmtInf: {
            Ustrd: string;
        } | undefined;
    };
    /**
     * Serializes the ACH credit transfer initiation to an XML string.
     * @returns {string} The XML representation of the ACH credit transfer initiation.
     */
    serialize(): string;
    /**
     * Creates an ACHCreditPaymentInitiation instance from an XML string.
     * @param {string} rawXml - The XML string to parse.
     * @returns {ACHCreditPaymentInitiation} A new ACHCreditPaymentInitiation instance.
     * @throws {InvalidXmlError} If the XML format is invalid.
     * @throws {InvalidXmlNamespaceError} If the XML namespace is invalid.
     * @throws {Error} If multiple payment information blocks are found.
     */
    static fromXML(rawXml: string): ACHCreditPaymentInitiation;
}
export {};
