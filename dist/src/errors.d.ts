/**
 * Base error class for all ISO 20022 related errors in the library.
 * Extends the native Error class with proper stack trace capture.
 */
export declare class Iso20022JsError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when XML parsing or validation fails.
 * This error indicates that the provided XML is malformed or does not conform to expected structure.
 */
export declare class InvalidXmlError extends Iso20022JsError {
    constructor(message: string);
}
/**
 * Error thrown when XML namespace validation fails.
 * This error indicates that the XML document contains invalid or missing required ISO 20022 namespaces.
 */
export declare class InvalidXmlNamespaceError extends Iso20022JsError {
    constructor(message: string);
}
export declare class InvalidStructureError extends Iso20022JsError {
    constructor(message: string);
}
