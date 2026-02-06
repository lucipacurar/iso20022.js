import { Party } from '../../lib/types';
import { StatusInformation, PaymentStatus, OriginalGroupInformation } from './types';
/**
 * Configuration interface for creating a PaymentStatusReport instance.
 */
interface PaymentStatusReportConfig {
    /** Unique identifier for the message */
    messageId: string;
    creationDate: Date;
    initatingParty: Party;
    originalGroupInformation: OriginalGroupInformation;
    statusInformations: StatusInformation[];
}
/**
 * Represents a Payment Status Report, containing information about the status of payments and transactions.
 */
export declare class PaymentStatusReport {
    private _messageId;
    private _creationDate;
    private _initatingParty;
    private _originalGroupInformation;
    private _statusInformations;
    /**
     * Creates a new PaymentStatusReport instance.
     * @param {PaymentStatusReportConfig} config - The configuration object for the PaymentStatusReport.
     */
    constructor(config: PaymentStatusReportConfig);
    /**
     * Creates a PaymentStatusReport instance from an XML string.
     * @param {string} rawXml - The raw XML string to parse.
     * @returns {PaymentStatusReport} A new PaymentStatusReport instance.
     */
    static fromXML(rawXml: string): PaymentStatusReport;
    /**
     * Gets the message ID of the Payment Status Report.
     * @returns {string} The message ID.
     */
    get messageId(): string;
    /**
     * Gets the creation date of the Payment Status Report.
     * @returns {Date} The creation date.
     */
    get creationDate(): Date;
    /**
     * Gets the initiating party of the Payment Status Report.
     * @returns {Party} The initiating party.
     */
    get initatingParty(): Party;
    /**
     * Gets the original message ID from the original group information.
     * @returns {string} The original message ID.
     */
    get originalMessageId(): string;
    /**
     * Gets all status information entries in the Payment Status Report.
     * @returns {StatusInformation[]} An array of StatusInformation objects.
     */
    get statusInformations(): StatusInformation[];
    /**
     * Gets the first status information entry in the Payment Status Report.
     * @returns {StatusInformation} The first StatusInformation object in the statuses array.
     */
    get firstStatusInformation(): StatusInformation;
    /**
     * Gets the original ID based on the type of the first status information.
     * @returns {string} The original ID, which could be the original message ID, payment ID, or end-to-end ID.
     */
    get originalId(): string;
    /**
     * Gets the status from the first status information entry.
     * @returns {PaymentStatus} The Status from the first status information.
     */
    get status(): PaymentStatus;
}
export {};
