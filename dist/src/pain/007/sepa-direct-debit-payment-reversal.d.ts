import type {
  Account,
  Agent,
  AtLeastOne,
  MandateInformation,
  Party,
  SEPALocalInstrument,
  SEPAReversalReason,
  SEPASequenceType,
} from '../../lib/types';
import { PaymentInitiation } from '../001/payment-initiation';
import type { SEPADirectDebitPaymentInitiation } from '../008/sepa-direct-debit-payment-initiation';
export interface OriginalMessageReference {
  msgId: string;
  msgNmId: string;
  createdDateTime: Date;
}
export interface OriginalTransactionReference {
  pmtInfId: string;
  endToEndId: string;
  instrId?: string;
  requestedCollectionDate: Date;
}
export interface SEPADirectDebitReversalTransaction {
  reversalId?: string;
  originalAmount: number;
  reversedAmount: number;
  currency: 'EUR';
  reason: SEPAReversalReason;
  additionalInfo?: string;
  originalReference: OriginalTransactionReference;
  originalTransaction: {
    amount: number;
    debtor: Party;
    debtorAccount: Account;
    debtorAgent?: Agent;
    mandate: MandateInformation;
  };
}
export interface SEPADirectDebitReversalInstructionGroup {
  paymentInformationId?: string;
  creditor: Party;
  creditorSchemeId: string;
  sequenceType: SEPASequenceType;
  localInstrument?: SEPALocalInstrument;
  reversals: AtLeastOne<SEPADirectDebitReversalTransaction>;
}
export interface SEPADirectDebitPaymentReversalConfig {
  initiatingParty: Party;
  messageId?: string;
  creationDate?: Date;
  originalMessage: OriginalMessageReference;
  reversalInstructions: AtLeastOne<SEPADirectDebitReversalInstructionGroup>;
}
export declare class SEPADirectDebitPaymentReversal extends PaymentInitiation {
  initiatingParty: Party;
  messageId: string;
  creationDate: Date;
  originalMessage: OriginalMessageReference;
  reversalInstructions: AtLeastOne<SEPADirectDebitReversalInstructionGroup>;
  private formattedReversedSum;
  private totalTransactionCount;
  get schemaId(): string;
  constructor(config: SEPADirectDebitPaymentReversalConfig);
  private countAllReversals;
  private sumAllReversedAmounts;
  private validate;
  private buildTxInf;
  serialize(): string;
  static fromXML(rawXml: string): SEPADirectDebitPaymentReversal;
  static fromOriginalInitiation(
    original: SEPADirectDebitPaymentInitiation,
    reversals: Array<{
      endToEndId: string;
      reversedAmount?: number;
      reason: SEPAReversalReason;
      reversalId?: string;
      additionalInfo?: string;
    }>,
    opts?: {
      messageId?: string;
      creationDate?: Date;
      initiatingParty?: Party;
    },
  ): SEPADirectDebitPaymentReversal;
}
