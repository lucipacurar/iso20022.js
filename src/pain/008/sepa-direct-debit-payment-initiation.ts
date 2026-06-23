import { InvalidXmlError, InvalidXmlNamespaceError } from '../../errors';
import { type Currency, formatMinorUnits } from '../../lib/currencies';
import {
  getXmlParser,
  ISO20022SchemaId,
  XMLNS_PREFIX,
} from '../../lib/interfaces';
import type {
  Account,
  Agent,
  AtLeastOne,
  ExternalCategoryPurpose,
  Party,
  SEPADirectDebitPaymentInstruction,
  SEPALocalInstrument,
  SEPASequenceType,
} from '../../lib/types';
import {
  parseAccount,
  parseAgent,
  parseAmountToMinorUnits,
  parseMandate,
} from '../../parseUtils';
import { generateId, sanitize } from '../../utils/format';
import { PaymentInitiation } from '../001/payment-initiation';

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
  /**
   * Optional override for `<PmtInfId>`. When omitted, a UUID is generated.
   * Max 35 characters. Required to echo as `OrgnlPmtInfId` in pain.007 reversals.
   */
  paymentInformationId?: string;
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
export class SEPADirectDebitPaymentInitiation extends PaymentInitiation {
  initiatingParty: Party;
  messageId: string;
  creationDate: Date;
  paymentInstructions: AtLeastOne<SEPADirectDebitPaymentInstructionGroup>;
  private formattedPaymentSum: string;
  private totalTransactionCount: number;

  get schemaId(): string {
    return ISO20022SchemaId.PAIN_008_001_02;
  }

  /**
   * Creates an instance of SEPADirectDebitPaymentInitiation.
   * @param {SEPADirectDebitPaymentInitiationConfig} config - The configuration object for the SEPA direct debit.
   */
  constructor(config: SEPADirectDebitPaymentInitiationConfig) {
    super({ type: 'sepa' });
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId = config.messageId || generateId();
    this.creationDate = config.creationDate || new Date();
    this.totalTransactionCount = this.countAllTransactions();
    this.formattedPaymentSum = this.sumAllPayments();
    this.validate();
  }

  /**
   * Counts the total number of transactions across all payment instruction groups.
   * @private
   * @returns {number} The total count of all transactions.
   */
  private countAllTransactions(): number {
    return this.paymentInstructions.reduce(
      (total, group) => total + group.payments.length,
      0,
    );
  }

  /**
   * Calculates the sum of all payment instructions across all groups.
   * @private
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   */
  private sumAllPayments(): string {
    let totalAmount = 0;
    let currency: Currency | null = null;

    for (const group of this.paymentInstructions) {
      for (const payment of group.payments) {
        if (currency === null) {
          currency = payment.currency;
        }
        totalAmount += payment.amount;
      }
    }

    if (currency === null) {
      throw new Error('No payments found');
    }

    return formatMinorUnits(totalAmount, currency);
  }

  /**
   * Validates the payment initiation data according to SEPA requirements.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If any group's payment instructions have different currencies.
   */
  private validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }

    for (const group of this.paymentInstructions) {
      if (group.paymentInformationId !== undefined) {
        if (group.paymentInformationId.length === 0) {
          throw new Error('paymentInformationId must not be empty');
        }
        if (group.paymentInformationId.length > 35) {
          throw new Error('paymentInformationId must not exceed 35 characters');
        }
      }

      for (const payment of group.payments) {
        if (payment.instrId !== undefined) {
          if (payment.instrId.length === 0) {
            throw new Error('instrId must not be empty');
          }
          if (payment.instrId.length > 35) {
            throw new Error('instrId must not exceed 35 characters');
          }
        }
      }

      this.validateGroupInstructionsHaveSameCurrency(group.payments);
    }
  }

  /**
   * Validates that all payment instructions in a group have the same currency (EUR).
   * @private
   * @param {AtLeastOne<SEPADirectDebitPaymentInstruction>} payments - Array of payment instructions.
   * @throws {Error} If payment instructions have different currencies.
   */
  private validateGroupInstructionsHaveSameCurrency(
    payments: AtLeastOne<SEPADirectDebitPaymentInstruction>,
  ) {
    if (!payments.every(i => i.currency === payments[0].currency)) {
      throw new Error(
        'In order to calculate the payment instructions sum, all payment instruction currencies within a group must be the same.',
      );
    }
  }

  /**
   * Generates payment information for a single SEPA direct debit transfer instruction.
   * @param {SEPADirectDebitPaymentInstruction} instruction - The payment instruction.
   * @returns {Object} The payment information object formatted according to SEPA direct debit specifications.
   */
  directDebitTransfer(instruction: SEPADirectDebitPaymentInstruction) {
    const endToEndId = sanitize(
      instruction.endToEndId || instruction.id || generateId(),
      35,
    );
    return {
      PmtId: {
        ...(instruction.instrId && {
          InstrId: instruction.instrId,
        }),
        EndToEndId: endToEndId,
      },
      InstdAmt: {
        '#': formatMinorUnits(instruction.amount, instruction.currency),
        '@Ccy': instruction.currency,
      },
      DrctDbtTx: {
        MndtRltdInf: this.buildMandateRelatedInfo(instruction.mandate),
      },
      ...(instruction.debtor.agent && {
        DbtrAgt: this.agent(instruction.debtor.agent as Agent),
      }),
      Dbtr: this.party(instruction.debtor as Party),
      DbtrAcct: this.account(instruction.debtor.account as Account),
      ...(instruction.remittanceInformation && {
        RmtInf: {
          Ustrd: instruction.remittanceInformation,
        },
      }),
    };
  }

  /**
   * Serializes the SEPA direct debit initiation to an XML string.
   * @returns {string} The XML representation of the SEPA direct debit initiation.
   */
  serialize(): string {
    const builder = PaymentInitiation.getBuilder();

    // Generate one PmtInf entry per creditor group
    const paymentInfoEntries = this.paymentInstructions.map(group => {
      const pmtInfId = group.paymentInformationId ?? generateId();
      const localInstrument = group.localInstrument || 'CORE';
      const batchBooking =
        group.batchBooking === undefined ? false : group.batchBooking;

      // Calculate sum for this group
      let groupSum = 0;
      for (const payment of group.payments) {
        groupSum += payment.amount;
      }
      const groupCtrlSum = formatMinorUnits(groupSum, 'EUR');

      return {
        PmtInfId: pmtInfId,
        PmtMtd: 'DD',
        BtchBookg: batchBooking,
        NbOfTxs: group.payments.length.toString(),
        CtrlSum: groupCtrlSum,
        PmtTpInf: {
          SvcLvl: { Cd: 'SEPA' },
          LclInstrm: { Cd: localInstrument },
          SeqTp: group.sequenceType,
          ...(group.categoryPurpose && {
            CtgyPurp: { Cd: group.categoryPurpose },
          }),
        },
        ReqdColltnDt: group.requestedCollectionDate.toISOString().split('T')[0],
        Cdtr: this.party(group.creditor),
        CdtrAcct: this.account(group.creditor.account as Account),
        ...(group.creditor.agent && {
          CdtrAgt: this.agent(group.creditor.agent as Agent),
        }),
        ChrgBr: 'SLEV',
        CdtrSchmeId: this.buildCreditorSchemeId(group.creditorSchemeId),
        DrctDbtTxInf: group.payments.map(payment =>
          this.directDebitTransfer(payment),
        ),
      };
    });

    const xml = {
      '?xml': {
        '@version': '1.0',
        '@encoding': 'UTF-8',
      },
      Document: {
        '@xmlns': this.namespace,
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        '@xsi:schemaLocation': `${this.namespace} ${this.schemaId}.xsd`,
        CstmrDrctDbtInitn: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.totalTransactionCount.toString(),
            CtrlSum: this.formattedPaymentSum,
            InitgPty: {
              Nm: this.initiatingParty.name,
              ...(this.initiatingParty.id && {
                Id: {
                  OrgId: {
                    Othr: {
                      Id: this.initiatingParty.id,
                    },
                  },
                },
              }),
            },
          },
          PmtInf: paymentInfoEntries,
        },
      },
    };

    return builder.build(xml);
  }

  /**
   * Parses an XML string and creates a SEPADirectDebitPaymentInitiation instance.
   * Supports multiple PmtInf blocks in the XML document.
   * @param {string} rawXml - The XML string to parse.
   * @returns {SEPADirectDebitPaymentInitiation} A new instance created from the XML data.
   * @throws {InvalidXmlError} If the XML format is invalid.
   * @throws {InvalidXmlNamespaceError} If the namespace is not pain.008.
   */
  static fromXML(rawXml: string): SEPADirectDebitPaymentInitiation {
    const parser = getXmlParser();
    const xml = parser.parse(rawXml);

    // Validate XML structure
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }

    // Validate namespace
    const namespace = (xml.Document['@_xmlns'] ||
      xml.Document['@_Xmlns']) as string;
    if (!namespace.startsWith(`${XMLNS_PREFIX}pain.008`)) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.008 namespace');
    }

    // Extract GrpHdr data
    const messageId = xml.Document.CstmrDrctDbtInitn.GrpHdr.MsgId as string;
    const creationDate = new Date(
      xml.Document.CstmrDrctDbtInitn.GrpHdr.CreDtTm as string,
    );

    // Extract top-level initiating party from GrpHdr
    const topLevelInitiatingParty: Party = {
      name: xml.Document.CstmrDrctDbtInitn.GrpHdr.InitgPty.Nm as string,
      id: xml.Document.CstmrDrctDbtInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr
        ?.Id as string,
    };

    // Normalize PmtInf to array (handle both single object and array cases)
    const rawPmtInf = Array.isArray(xml.Document.CstmrDrctDbtInitn.PmtInf)
      ? xml.Document.CstmrDrctDbtInitn.PmtInf
      : [xml.Document.CstmrDrctDbtInitn.PmtInf];

    // Map each PmtInf to SEPADirectDebitPaymentInstructionGroup
    const paymentInstructions = rawPmtInf.map((pmtInf: any) => {
      // Extract creditor info as the group's collecting party
      const groupCreditor: Party = {
        name: pmtInf.Cdtr.Nm as string,
        id: pmtInf.Cdtr.Id?.OrgId?.Othr?.Id as string,
        agent: parseAgent(pmtInf.CdtrAgt),
        account: parseAccount(pmtInf.CdtrAcct),
      };

      // Extract creditor scheme ID
      const creditorSchemeId =
        (pmtInf.CdtrSchmeId?.Id?.PrvtId?.Othr?.Id as string) || '';

      // Extract optional category purpose
      const categoryPurpose = pmtInf.PmtTpInf?.CtgyPurp?.Cd as
        | ExternalCategoryPurpose
        | undefined;

      // Extract local instrument (CORE or B2B)
      const localInstrument =
        (pmtInf.PmtTpInf?.LclInstrm?.Cd as SEPALocalInstrument) || 'CORE';

      // Extract sequence type from PmtInf level
      const sequenceType =
        (pmtInf.PmtTpInf?.SeqTp as SEPASequenceType) || 'RCUR';

      // Extract requested collection date
      const requestedCollectionDate = new Date(pmtInf.ReqdColltnDt as string);

      // Extract batch booking
      const batchBooking =
        pmtInf.BtchBookg === 'true' || pmtInf.BtchBookg === true;

      // Normalize DrctDbtTxInf to array
      const rawInstructions = Array.isArray(pmtInf.DrctDbtTxInf)
        ? pmtInf.DrctDbtTxInf
        : [pmtInf.DrctDbtTxInf];

      // Parse each DrctDbtTxInf to SEPADirectDebitPaymentInstruction
      const payments = rawInstructions.map((inst: any) => {
        const currency = inst.InstdAmt['@_Ccy'] as Currency;
        const amount = parseAmountToMinorUnits(
          Number(inst.InstdAmt['#text']),
          currency,
        );

        const mandate = parseMandate(inst.DrctDbtTx?.MndtRltdInf);

        return {
          ...(inst.PmtId?.InstrId && {
            instrId: inst.PmtId.InstrId.toString() as string,
          }),
          ...(inst.PmtId.EndToEndId && {
            endToEndId: inst.PmtId.EndToEndId.toString() as string,
          }),
          type: 'sepa' as const,
          direction: 'debit' as const,
          amount,
          currency,
          debtor: {
            name: inst.Dbtr?.Nm as string,
            agent: parseAgent(inst.DbtrAgt),
            account: parseAccount(inst.DbtrAcct),
          },
          mandate,
          ...(inst.RmtInf?.Ustrd && {
            remittanceInformation: inst.RmtInf.Ustrd.toString() as string,
          }),
        };
      }) as AtLeastOne<SEPADirectDebitPaymentInstruction>;

      const paymentInformationId = pmtInf.PmtInfId?.toString() as
        | string
        | undefined;

      return {
        creditor: groupCreditor,
        creditorSchemeId,
        payments,
        requestedCollectionDate,
        sequenceType,
        localInstrument,
        ...(categoryPurpose && { categoryPurpose }),
        batchBooking,
        ...(paymentInformationId && { paymentInformationId }),
      };
    }) as AtLeastOne<SEPADirectDebitPaymentInstructionGroup>;

    // Return new instance
    return new SEPADirectDebitPaymentInitiation({
      messageId,
      creationDate,
      initiatingParty: topLevelInitiatingParty,
      paymentInstructions,
    });
  }
}
