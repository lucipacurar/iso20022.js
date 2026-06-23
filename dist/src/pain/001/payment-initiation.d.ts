import { XMLBuilder } from 'fast-xml-parser';
import type { Account, Agent, IBANAccount, MandateInformation, Party } from '../../lib/types';
/**
 * Abstract base class for ISO20022 payment initiation (PAIN) messages.
 * @abstract
 */
export declare abstract class PaymentInitiation {
    type: 'swift' | 'rtp' | 'sepa' | 'ach';
    constructor({ type }: {
        type: 'swift' | 'rtp' | 'sepa' | 'ach';
    });
    /**
     * The schema identifier for this message type (e.g. 'pain.007.001.02').
     */
    abstract get schemaId(): string;
    /**
     * Returns the full XML namespace URI for this message type
     * (e.g. 'urn:iso:std:iso:20022:tech:xsd:pain.007.001.02').
     */
    get namespace(): string;
    /**
     * Serializes the payment initiation to a string format.
     * @abstract
     * @returns {string} The serialized payment initiation.
     */
    abstract serialize(): string;
    /**
     * Formats a party's information according to ISO20022 standards.
     * @param {Party} party - The party's information.
     * @returns {Object} Formatted XML party information.
     */
    party(party: Party): any;
    /**
     * Formats an account according to ISO20022 standards.
     * This method handles both IBAN and non-IBAN accounts.
     *
     * @param {Account} account - The account to be formatted. Can be either an IBANAccount or a BaseAccount.
     * @returns {Object} An object representing the formatted account information.
     *                   For IBAN accounts, it returns an object with an IBAN identifier.
     *                   For non-IBAN accounts, it returns an object with an 'Other' identifier.
     *
     * @example
     * // For an IBAN account
     * account({ iban: 'DE89370400440532013000' })
     * // Returns: { Id: { IBAN: 'DE89370400440532013000' } }
     *
     * @example
     * // For a non-IBAN account
     * account({ accountNumber: '1234567890' })
     * // Returns: { Id: { Othr: { Id: '1234567890' } } }
     */
    account(account: Account): {
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
    /**
     * Formats an IBAN account according to ISO20022 standards.
     * @param {IBANAccount} account - The IBAN account information.
     * @returns {Object} Formatted XML IBAN account information.
     */
    internationalAccount(account: IBANAccount): {
        Id: {
            IBAN: string;
        };
    };
    /**
     * Formats an agent according to ISO20022 standards.
     * This method handles both BIC and ABA agents.
     *
     * @param {Agent} agent - The agent to be formatted. Can be either a BICAgent or an ABAAgent.
     * @returns {Object} An object representing the formatted agent information.
     *                   For BIC agents, it returns an object with a BIC identifier.
     *                   For ABA agents, it returns an object with clearing system member identification.
     *
     * @example
     * // For a BIC agent
     * agent({ bic: 'BOFAUS3NXXX' })
     * // Returns: { FinInstnId: { BIC: 'BOFAUS3NXXX' } }
     *
     * @example
     * // For an ABA agent
     * agent({ abaRoutingNumber: '026009593' })
     * // Returns: { FinInstnId: { ClrSysMmbId: { MmbId: '026009593' } } }
     */
    agent(agent: Agent): {
        FinInstnId: {
            ClrSysMmbId: {
                ClrSysId: {
                    Cd: string;
                };
                MmbId: string;
            };
            BIC?: undefined;
        };
    } | {
        FinInstnId: {
            BIC: string;
            ClrSysMmbId?: undefined;
        };
    };
    buildMandateRelatedInfo(mandate: MandateInformation): {
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
    buildCreditorSchemeId(schemeId: string): {
        Id: {
            PrvtId: {
                Othr: {
                    Id: string;
                    SchmeNm: {
                        Prtry: string;
                    };
                };
            };
        };
    };
    /**
     * Returns the string representation of the payment initiation.
     * @returns {string} The serialized payment initiation.
     */
    toString(): string;
    static getBuilder(): XMLBuilder;
}
