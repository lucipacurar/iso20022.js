import { InvalidXmlError, InvalidXmlNamespaceError } from '../../errors';
import { formatMinorUnits } from '../../lib/currencies';
import {
  getXmlParser,
  ISO20022SchemaId,
  XMLNS_PREFIX,
} from '../../lib/interfaces';
import type {
  Account,
  Agent,
  AtLeastOne,
  MandateInformation,
  Party,
  SEPADirectDebitPaymentInstruction,
  SEPALocalInstrument,
  SEPAReversalReason,
  SEPASequenceType,
} from '../../lib/types';
import {
  parseAccount,
  parseAgent,
  parseAmountToMinorUnits,
  parseMandate,
} from '../../parseUtils';
import { generateId } from '../../utils/format';
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

export class SEPADirectDebitPaymentReversal extends PaymentInitiation {
  initiatingParty: Party;
  messageId: string;
  creationDate: Date;
  originalMessage: OriginalMessageReference;
  reversalInstructions: AtLeastOne<SEPADirectDebitReversalInstructionGroup>;
  private formattedReversedSum: string;
  private totalTransactionCount: number;

  get schemaId(): string {
    return ISO20022SchemaId.PAIN_007_001_02;
  }

  constructor(config: SEPADirectDebitPaymentReversalConfig) {
    super({ type: 'sepa' });
    this.initiatingParty = config.initiatingParty;
    this.originalMessage = config.originalMessage;
    this.reversalInstructions = config.reversalInstructions;
    this.messageId = config.messageId || generateId();
    this.creationDate = config.creationDate || new Date();

    for (const group of this.reversalInstructions) {
      group.paymentInformationId = group.paymentInformationId ?? generateId();
      for (const reversal of group.reversals) {
        reversal.reversalId = reversal.reversalId ?? generateId();
      }
    }

    this.totalTransactionCount = this.countAllReversals();
    this.formattedReversedSum = this.sumAllReversedAmounts();
    this.validate();
  }

  private countAllReversals(): number {
    return this.reversalInstructions.reduce(
      (total, group) => total + group.reversals.length,
      0,
    );
  }

  private sumAllReversedAmounts(): string {
    let totalAmount = 0;
    for (const group of this.reversalInstructions) {
      for (const reversal of group.reversals) {
        totalAmount += reversal.reversedAmount;
      }
    }
    return formatMinorUnits(totalAmount, 'EUR');
  }

  private validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }

    for (const group of this.reversalInstructions) {
      if (group.paymentInformationId !== undefined) {
        if (group.paymentInformationId.length === 0) {
          throw new Error('paymentInformationId must not be empty');
        }
        if (group.paymentInformationId.length > 35) {
          throw new Error('paymentInformationId must not exceed 35 characters');
        }
      }

      const groupPmtInfId = group.reversals[0].originalReference.pmtInfId;
      for (const reversal of group.reversals) {
        if (reversal.originalReference.pmtInfId !== groupPmtInfId) {
          throw new Error(
            'All reversals in a group must share the same originalReference.pmtInfId',
          );
        }
      }

      for (const reversal of group.reversals) {
        if (reversal.reversalId !== undefined) {
          if (reversal.reversalId.length === 0) {
            throw new Error('reversalId must not be empty');
          }
          if (reversal.reversalId.length > 35) {
            throw new Error('reversalId must not exceed 35 characters');
          }
        }

        if (!reversal.originalReference.pmtInfId) {
          throw new Error('originalReference.pmtInfId is required');
        }
        if (reversal.originalReference.pmtInfId.length > 35) {
          throw new Error(
            'originalReference.pmtInfId must not exceed 35 characters',
          );
        }

        if (!reversal.originalReference.endToEndId) {
          throw new Error('originalReference.endToEndId is required');
        }
        if (reversal.originalReference.endToEndId.length > 35) {
          throw new Error(
            'originalReference.endToEndId must not exceed 35 characters',
          );
        }

        if (reversal.originalReference.instrId !== undefined) {
          if (reversal.originalReference.instrId.length === 0) {
            throw new Error('originalReference.instrId must not be empty');
          }
          if (reversal.originalReference.instrId.length > 35) {
            throw new Error(
              'originalReference.instrId must not exceed 35 characters',
            );
          }
        }

        if (reversal.reversedAmount <= 0) {
          throw new Error('reversedAmount must be greater than 0');
        }

        if (reversal.reversedAmount > reversal.originalAmount) {
          throw new Error('reversedAmount must not exceed originalAmount');
        }

        if (
          reversal.additionalInfo !== undefined &&
          reversal.additionalInfo.length > 105
        ) {
          throw new Error('additionalInfo must not exceed 105 characters');
        }
      }

      if (
        !group.reversals.every(r => r.currency === group.reversals[0].currency)
      ) {
        throw new Error(
          'All reversal currencies within a group must be the same.',
        );
      }
    }
  }

  private buildTxInf(
    reversal: SEPADirectDebitReversalTransaction,
    group: SEPADirectDebitReversalInstructionGroup,
  ) {
    const localInstrument = group.localInstrument || 'CORE';

    return {
      RvslId: reversal.reversalId,
      ...(reversal.originalReference.instrId && {
        OrgnlInstrId: reversal.originalReference.instrId,
      }),
      OrgnlEndToEndId: reversal.originalReference.endToEndId,
      OrgnlInstdAmt: {
        '#': formatMinorUnits(reversal.originalAmount, 'EUR'),
        '@Ccy': 'EUR',
      },
      RvsdInstdAmt: {
        '#': formatMinorUnits(reversal.reversedAmount, 'EUR'),
        '@Ccy': 'EUR',
      },
      RvslRsnInf: {
        Rsn: { Cd: reversal.reason },
        ...(reversal.additionalInfo && {
          AddtlInf: reversal.additionalInfo,
        }),
      },
      OrgnlTxRef: {
        Amt: {
          InstdAmt: {
            '#': formatMinorUnits(reversal.originalTransaction.amount, 'EUR'),
            '@Ccy': 'EUR',
          },
        },
        ReqdColltnDt: reversal.originalReference.requestedCollectionDate
          .toISOString()
          .split('T')[0],
        CdtrSchmeId: this.buildCreditorSchemeId(group.creditorSchemeId),
        PmtTpInf: {
          SvcLvl: { Cd: 'SEPA' },
          LclInstrm: { Cd: localInstrument },
          SeqTp: group.sequenceType,
        },
        PmtMtd: 'DD',
        MndtRltdInf: this.buildMandateRelatedInfo(
          reversal.originalTransaction.mandate,
        ),
        Dbtr: this.party(reversal.originalTransaction.debtor),
        DbtrAcct: this.account(reversal.originalTransaction.debtorAccount),
        ...(reversal.originalTransaction.debtorAgent && {
          DbtrAgt: this.agent(reversal.originalTransaction.debtorAgent),
        }),
        ...(group.creditor.agent && {
          CdtrAgt: this.agent(group.creditor.agent as Agent),
        }),
        Cdtr: this.party(group.creditor),
        CdtrAcct: this.account(group.creditor.account as Account),
      },
    };
  }

  serialize(): string {
    const builder = PaymentInitiation.getBuilder();

    const orgnlPmtInfAndRvslEntries = this.reversalInstructions.map(group => {
      const orgnlPmtInfId = group.reversals[0].originalReference.pmtInfId;
      const groupTxCount = group.reversals.length;
      const groupCtrlSum = formatMinorUnits(
        group.reversals.reduce((sum, r) => sum + r.reversedAmount, 0),
        'EUR',
      );

      return {
        OrgnlPmtInfId: orgnlPmtInfId,
        OrgnlNbOfTxs: groupTxCount.toString(),
        OrgnlCtrlSum: groupCtrlSum,
        PmtInfRvsl: 'false',
        TxInf: group.reversals.map(reversal =>
          this.buildTxInf(reversal, group),
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
        CstmrPmtRvsl: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.totalTransactionCount.toString(),
            CtrlSum: this.formattedReversedSum,
            GrpRvsl: 'false',
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
          OrgnlGrpInf: {
            OrgnlMsgId: this.originalMessage.msgId,
            OrgnlMsgNmId: this.originalMessage.msgNmId,
            OrgnlCreDtTm: this.originalMessage.createdDateTime.toISOString(),
          },
          OrgnlPmtInfAndRvsl: orgnlPmtInfAndRvslEntries,
        },
      },
    };

    return builder.build(xml);
  }

  static fromXML(rawXml: string): SEPADirectDebitPaymentReversal {
    const parser = getXmlParser();
    const xml = parser.parse(rawXml);

    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }

    const namespace = (xml.Document['@_xmlns'] ||
      xml.Document['@_Xmlns']) as string;
    if (!namespace.startsWith(`${XMLNS_PREFIX}pain.007`)) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.007 namespace');
    }

    const root = xml.Document.CstmrPmtRvsl;

    const messageId = root.GrpHdr.MsgId as string;
    const creationDate = new Date(root.GrpHdr.CreDtTm as string);

    const initiatingParty: Party = {
      name: root.GrpHdr.InitgPty?.Nm as string,
      id: root.GrpHdr.InitgPty?.Id?.OrgId?.Othr?.Id as string,
    };

    const originalMessage: OriginalMessageReference = {
      msgId: root.OrgnlGrpInf.OrgnlMsgId as string,
      msgNmId: root.OrgnlGrpInf.OrgnlMsgNmId as string,
      createdDateTime: new Date(root.OrgnlGrpInf.OrgnlCreDtTm as string),
    };

    const rawGroups = Array.isArray(root.OrgnlPmtInfAndRvsl)
      ? root.OrgnlPmtInfAndRvsl
      : [root.OrgnlPmtInfAndRvsl];

    const reversalInstructions = rawGroups.map((grp: any) => {
      const rawTxInf = Array.isArray(grp.TxInf) ? grp.TxInf : [grp.TxInf];

      const orgnlPmtInfId = grp.OrgnlPmtInfId?.toString() as string;

      let groupCreditor: Party | undefined;
      let groupCreditorSchemeId = '';
      let groupSequenceType: SEPASequenceType = 'RCUR';
      let groupLocalInstrument: SEPALocalInstrument = 'CORE';

      const reversals = rawTxInf.map((tx: any) => {
        const orgnlTxRef = tx.OrgnlTxRef;

        if (!groupCreditor && orgnlTxRef?.Cdtr) {
          groupCreditor = {
            name: orgnlTxRef.Cdtr.Nm as string,
            ...(orgnlTxRef.CdtrAgt && {
              agent: parseAgent(orgnlTxRef.CdtrAgt),
            }),
            ...(orgnlTxRef.CdtrAcct && {
              account: parseAccount(orgnlTxRef.CdtrAcct),
            }),
          };
          groupCreditorSchemeId =
            (orgnlTxRef.CdtrSchmeId?.Id?.PrvtId?.Othr?.Id as string) || '';
          groupSequenceType =
            (orgnlTxRef.PmtTpInf?.SeqTp as SEPASequenceType) || 'RCUR';
          groupLocalInstrument =
            (orgnlTxRef.PmtTpInf?.LclInstrm?.Cd as SEPALocalInstrument) ||
            'CORE';
        }

        return {
          ...(tx.RvslId && { reversalId: tx.RvslId.toString() as string }),
          originalAmount: parseAmountToMinorUnits(
            Number(tx.OrgnlInstdAmt['#text']),
            tx.OrgnlInstdAmt['@_Ccy'],
          ),
          reversedAmount: parseAmountToMinorUnits(
            Number(tx.RvsdInstdAmt['#text']),
            tx.RvsdInstdAmt['@_Ccy'],
          ),
          currency: 'EUR' as const,
          reason: tx.RvslRsnInf?.Rsn?.Cd as string,
          ...(tx.RvslRsnInf?.AddtlInf && {
            additionalInfo: tx.RvslRsnInf.AddtlInf.toString() as string,
          }),
          originalReference: {
            pmtInfId: orgnlPmtInfId,
            endToEndId: tx.OrgnlEndToEndId?.toString() as string,
            ...(tx.OrgnlInstrId && {
              instrId: tx.OrgnlInstrId.toString() as string,
            }),
            requestedCollectionDate: new Date(
              orgnlTxRef?.ReqdColltnDt as string,
            ),
          },
          originalTransaction: {
            amount: parseAmountToMinorUnits(
              Number(orgnlTxRef?.Amt?.InstdAmt['#text']),
              orgnlTxRef?.Amt?.InstdAmt['@_Ccy'],
            ),
            debtor: {
              name: orgnlTxRef?.Dbtr?.Nm as string,
            } as Party,
            debtorAccount: parseAccount(orgnlTxRef?.DbtrAcct),
            ...(orgnlTxRef?.DbtrAgt && {
              debtorAgent: parseAgent(orgnlTxRef.DbtrAgt),
            }),
            mandate: parseMandate(orgnlTxRef?.MndtRltdInf),
          },
        };
      }) as AtLeastOne<SEPADirectDebitReversalTransaction>;

      const paymentInformationId = grp.RvslPmtInfId?.toString() as
        | string
        | undefined;

      return {
        creditor: groupCreditor || ({ name: '' } as Party),
        creditorSchemeId: groupCreditorSchemeId,
        sequenceType: groupSequenceType,
        localInstrument: groupLocalInstrument,
        reversals,
        ...(paymentInformationId && { paymentInformationId }),
      };
    }) as AtLeastOne<SEPADirectDebitReversalInstructionGroup>;

    return new SEPADirectDebitPaymentReversal({
      messageId,
      creationDate,
      initiatingParty,
      originalMessage,
      reversalInstructions,
    });
  }

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
  ): SEPADirectDebitPaymentReversal {
    const lookup = new Map<
      string,
      {
        group: (typeof original.paymentInstructions)[number];
        instruction: SEPADirectDebitPaymentInstruction;
      }
    >();

    for (const group of original.paymentInstructions) {
      for (const instruction of group.payments) {
        const id = instruction.endToEndId || instruction.id;
        if (id) {
          lookup.set(id, { group, instruction });
        }
      }
    }

    const groupedReversals = new Map<
      (typeof original.paymentInstructions)[number],
      typeof reversals
    >();

    for (const rev of reversals) {
      const found = lookup.get(rev.endToEndId);
      if (!found) {
        throw new Error(
          `endToEndId '${rev.endToEndId}' not found in original payment initiation`,
        );
      }
      const existing = groupedReversals.get(found.group) || [];
      existing.push(rev);
      groupedReversals.set(found.group, existing);
    }

    const reversalInstructions: SEPADirectDebitReversalInstructionGroup[] = [];

    for (const [sourceGroup, revList] of groupedReversals) {
      const reversalTxs: SEPADirectDebitReversalTransaction[] = revList.map(
        rev => {
          const { instruction } = lookup.get(rev.endToEndId)!;
          return {
            ...(rev.reversalId && { reversalId: rev.reversalId }),
            originalAmount: instruction.amount,
            reversedAmount: rev.reversedAmount ?? instruction.amount,
            currency: 'EUR' as const,
            reason: rev.reason,
            ...(rev.additionalInfo && { additionalInfo: rev.additionalInfo }),
            originalReference: {
              pmtInfId: sourceGroup.paymentInformationId || '',
              endToEndId: instruction.endToEndId || instruction.id || '',
              ...(instruction.instrId && { instrId: instruction.instrId }),
              requestedCollectionDate: sourceGroup.requestedCollectionDate,
            },
            originalTransaction: {
              amount: instruction.amount,
              debtor: instruction.debtor,
              debtorAccount: instruction.debtor.account as Account,
              ...(instruction.debtor.agent && {
                debtorAgent: instruction.debtor.agent,
              }),
              mandate: instruction.mandate,
            },
          };
        },
      );

      reversalInstructions.push({
        creditor: sourceGroup.creditor,
        creditorSchemeId: sourceGroup.creditorSchemeId,
        sequenceType: sourceGroup.sequenceType,
        localInstrument: sourceGroup.localInstrument,
        reversals:
          reversalTxs as AtLeastOne<SEPADirectDebitReversalTransaction>,
      });
    }

    return new SEPADirectDebitPaymentReversal({
      ...(opts?.messageId && { messageId: opts.messageId }),
      ...(opts?.creationDate && { creationDate: opts.creationDate }),
      initiatingParty: opts?.initiatingParty || original.initiatingParty,
      originalMessage: {
        msgId: original.messageId,
        msgNmId: 'pain.008.001.02',
        createdDateTime: original.creationDate,
      },
      reversalInstructions:
        reversalInstructions as AtLeastOne<SEPADirectDebitReversalInstructionGroup>,
    });
  }
}
