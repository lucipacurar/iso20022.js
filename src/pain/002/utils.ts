import { parseAdditionalInformation } from '../../parseUtils';
import {
  type GroupStatusInformation,
  type PaymentStatus,
  PaymentStatusCode,
  type PaymentStatusInformation,
  type TransactionStatusInformation,
} from './types';

// NOTE: Consider not even using this switch statement.
const parseStatus = (status: string): PaymentStatus => {
  switch (status) {
    case PaymentStatusCode.Rejected:
      return PaymentStatusCode.Rejected;
    case PaymentStatusCode.PartiallyAccepted:
      return PaymentStatusCode.PartiallyAccepted;
    case PaymentStatusCode.Pending:
      return PaymentStatusCode.Pending;
    case PaymentStatusCode.Accepted:
      return PaymentStatusCode.Accepted;
    case PaymentStatusCode.AcceptedSettlementInProgress:
      return PaymentStatusCode.AcceptedSettlementInProgress;
    case PaymentStatusCode.AcceptedCreditSettlementCompleted:
      return PaymentStatusCode.AcceptedCreditSettlementCompleted;
    case PaymentStatusCode.AcceptedSettlementCompleted:
      return PaymentStatusCode.AcceptedSettlementCompleted;
    case PaymentStatusCode.AcceptedTechnicalValidation:
      return PaymentStatusCode.AcceptedTechnicalValidation;
    default:
      throw new Error(`Unknown status: ${status}`);
  }
};

export const parseGroupStatusInformation = (
  originalGroupInfAndStatus: any,
): GroupStatusInformation | null => {
  if (!Object.hasOwn(originalGroupInfAndStatus, 'GrpSts')) {
    return null;
  }
  return {
    type: 'group',
    originalMessageId: originalGroupInfAndStatus.OrgnlMsgId,
    status: parseStatus(originalGroupInfAndStatus.GrpSts),
    reason: {
      code: originalGroupInfAndStatus.StsRsnInf?.Rsn?.Cd,
      additionalInformation: parseAdditionalInformation(
        originalGroupInfAndStatus.StsRsnInf?.AddtlInf,
      ),
    },
  };
};

export const parsePaymentStatusInformations = (
  originalPaymentInfAndStatuses: any,
): PaymentStatusInformation[] =>
  originalPaymentInfAndStatuses
    .map((payment: any) => {
      if (!Object.hasOwn(payment, 'PmtInfSts')) {
        return null;
      }
      return {
        type: 'payment' as const,
        originalPaymentId: payment.OrgnlPmtInfId,
        status: parseStatus(payment.PmtInfSts),
        reason: {
          code: payment.StsRsnInf?.Rsn?.Cd,
          additionalInformation: parseAdditionalInformation(
            payment.StsRsnInf?.AddtlInf,
          ),
        },
      };
    })
    .filter((status: any) => status !== null);

export const parseTransactionStatusInformations = (
  allTxnsInfoAndStatuses: any[],
): TransactionStatusInformation[] => {
  const transactionStatuses = allTxnsInfoAndStatuses.map(
    (transaction: any) => ({
      type: 'transaction' as const,
      originalEndToEndId: transaction.OrgnlEndToEndId,
      status: parseStatus(transaction.TxSts),
      reason: {
        code: transaction.StsRsnInf?.Rsn?.Cd,
        additionalInformation: parseAdditionalInformation(
          transaction.StsRsnInf?.Rsn?.AddtlInf,
        ),
      },
    }),
  );

  return transactionStatuses;
};
