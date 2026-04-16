import type {
  ExternalCategoryPurpose,
  Party,
  SEPACreditPaymentInstruction,
} from '../../lib/types';
import { PaymentInitiation } from './payment-initiation';
type AtLeastOne<T> = [T, ...T[]];
/**
 * Represents a group of payment instructions for a single debtor (PmtInf block).
 *
 * @property {Party} initiatingParty - The party (debtor) for this specific payment information block.
 * @property {AtLeastOne<SEPACreditPaymentInstruction>} payments - An array containing at least one payment instruction for this debtor.
 * @property {ExternalCategoryPurpose} [categoryPurpose] - Optional category purpose code for this payment information block.
 */
export interface SEPAMultiCreditPaymentInstructionGroup {
  /** The party (debtor) for this specific payment information block. */
  initiatingParty: Party;
  /** An array containing at least one payment instruction for this debtor. */
  payments: AtLeastOne<SEPACreditPaymentInstruction>;
  /** Optional category purpose code for this payment information block. */
  categoryPurpose?: ExternalCategoryPurpose;
  /** Indicates whether transactions should be booked in batch. Defaults to false. */
  batchBooking?: boolean;
}
/**
 * Configuration for SEPA Multi Credit Payment Initiation.
 *
 * @property {Party} initiatingParty - The top-level party initiating the message (used in GrpHdr).
 * @property {AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>} paymentInstructions - An array containing at least one payment instruction group.
 * @property {string} [messageId] - Optional unique identifier for the message. If not provided, a UUID will be generated.
 * @property {Date} [creationDate] - Optional creation date for the message. If not provided, current date will be used.
 */
export interface SEPAMultiCreditPaymentInitiationConfig {
  /** The top-level party initiating the message (used in GrpHdr). */
  initiatingParty: Party;
  /** An array containing at least one payment instruction group. */
  paymentInstructions: AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>;
  /** Optional unique identifier for the message. If not provided, a UUID will be generated. */
  messageId?: string;
  /** Optional creation date for the message. If not provided, current date will be used. */
  creationDate?: Date;
}
/**
 * Represents a SEPA Multi Credit Payment Initiation.
 * This class handles the creation and serialization of SEPA credit transfer messages
 * with multiple payment information blocks (multiple debtors) according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPAMultiCreditPaymentInitiationConfig} config - The configuration for the SEPA Multi Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA multi-payment message
 * const payment = new SEPAMultiCreditPaymentInitiation({
 *   initiatingParty: { name: 'Company Ltd', id: '12345' },
 *   paymentInstructions: [
 *     {
 *       initiatingParty: debtor1,
 *       payments: [payment1, payment2]
 *     },
 *     {
 *       initiatingParty: debtor2,
 *       payments: [payment3]
 *     }
 *   ]
 * });
 * ```
 */
export declare class SEPAMultiCreditPaymentInitiation extends PaymentInitiation {
  initiatingParty: Party;
  messageId: string;
  creationDate: Date;
  paymentInstructions: AtLeastOne<SEPAMultiCreditPaymentInstructionGroup>;
  private formattedPaymentSum;
  private totalTransactionCount;
  get schemaId(): string;
  /**
   * Creates an instance of SEPAMultiCreditPaymentInitiation.
   * @param {SEPAMultiCreditPaymentInitiationConfig} config - The configuration object for the SEPA multi credit transfer.
   */
  constructor(config: SEPAMultiCreditPaymentInitiationConfig);
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
   * Validates that all payment instructions in a group have the same currency.
   * @private
   * @param {AtLeastOne<SEPACreditPaymentInstruction>} payments - Array of payment instructions.
   * @throws {Error} If payment instructions have different currencies.
   */
  private validateGroupInstructionsHaveSameCurrency;
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
      Ccy: 'EUR';
    };
    RmtInf:
      | {
          Ustrd: string;
        }
      | undefined;
    CdtrAgt?:
      | {
          FinInstnId: {
            BIC: string;
            ClrSysMmbId?: undefined;
          };
        }
      | {
          FinInstnId: {
            ClrSysMmbId: {
              ClrSysId: {
                Cd: string;
              };
              MmbId: string;
            };
            BIC?: undefined;
          };
        }
      | undefined;
    PmtId: {
      InstrId: string;
      EndToEndId: string;
    };
    Amt: {
      InstdAmt: {
        '#': string;
        '@Ccy': 'EUR';
      };
    };
  };
  /**
   * Serializes the SEPA multi credit transfer initiation to an XML string.
   * @returns {string} The XML representation of the SEPA multi credit transfer initiation.
   */
  serialize(): string;
  /**
   * Parses an XML string and creates a SEPAMultiCreditPaymentInitiation instance.
   * Supports multiple PmtInf blocks in the XML document.
   * @param {string} rawXml - The XML string to parse.
   * @returns {SEPAMultiCreditPaymentInitiation} A new instance created from the XML data.
   * @throws {InvalidXmlError} If the XML format is invalid.
   * @throws {InvalidXmlNamespaceError} If the namespace is not pain.001.001.03.
   */
  static fromXML(rawXml: string): SEPAMultiCreditPaymentInitiation;
}
export {};
