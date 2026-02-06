import { Balance, Entry, Statement, Transaction } from '../types';
import { Party, StructuredAddress } from '../../lib/types';
import { GenericISO20022Message, ISO20022MessageTypeName } from '../../lib/interfaces';
/**
 * Configuration interface for creating a CashManagementEndOfDayReport instance.
 */
interface CashManagementEndOfDayReportConfig {
    /** Unique identifier for the message */
    messageId: string;
    /** Date and time when the report was created */
    creationDate: Date;
    /** Recipient (party without bank and institution) receiving the report */
    recipient?: {
        id?: string;
        name?: string;
        address?: StructuredAddress;
    };
    /** Array of bank statements included in the report */
    statements: Statement[];
}
/**
 * Represents a Cash Management End of Day Report (CAMT.053.x).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from a CAMT.053 XML file.
 */
export declare class CashManagementEndOfDayReport implements GenericISO20022Message {
    private _messageId;
    private _creationDate;
    private _recipient?;
    private _statements;
    constructor(config: CashManagementEndOfDayReportConfig);
    static supportedMessages(): ISO20022MessageTypeName[];
    get data(): CashManagementEndOfDayReportConfig;
    static fromDocumentObject(obj: {
        Document: any;
    }): CashManagementEndOfDayReport;
    /**
     * Creates a CashManagementEndOfDayReport instance from a raw XML string.
     *
     * @param {string} rawXml - The raw XML string containing the CAMT.053 data.
     * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport.
     * @throws {Error} If the XML parsing fails or required data is missing.
     */
    static fromXML(rawXml: string): CashManagementEndOfDayReport;
    /**
     *
     * @param json - JSON string representing a CashManagementEndOfDayReport
     * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport
     * @throws {Error} If the JSON parsing fails or required data is missing.
     */
    static fromJSON(json: string): CashManagementEndOfDayReport;
    toJSON(): any;
    serialize(): string;
    /**
     * Retrieves all balances from all statements in the report.
     * @returns {Balance[]} An array of all balances across all statements.
     */
    get balances(): Balance[];
    /**
     * Retrieves all transactions from all statements in the report.
     * @returns {Transaction[]} An array of all transactions across all statements.
     */
    get transactions(): Transaction[];
    /**
     * Retrieves all entries from all statements in the report.
     * @returns {Entry[]} An array of all entries across all statements.
     */
    get entries(): Entry[];
    /**
     * Gets the unique identifier for the message.
     * @returns {string} The message ID.
     */
    get messageId(): string;
    /**
     * Gets the party receiving the report.
     * @returns {Party | undefined} The recipient party information, or undefined if no recipient is set.
     */
    get recipient(): Party | undefined;
    /**
     * Gets the date and time when the report was created.
     * @returns {Date} The creation date of the report.
     */
    get creationDate(): Date;
    /**
     * Gets all statements included in the report.
     * @returns {Statement[]} An array of all statements in the report.
     */
    get statements(): Statement[];
}
export {};
