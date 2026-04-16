'use strict';

var decimal_js = require('decimal.js');
var node_crypto = require('node:crypto');

function getCurrencyPrecision(currency) {
  switch (currency) {
    case 'BHD': // Bahraini Dinar
    case 'IQD': // Iraqi Dinar
    case 'JOD': // Jordanian Dinar
    case 'KWD': // Kuwaiti Dinar
    case 'LYD': // Libyan Dinar
    case 'OMR': // Omani Rial
    case 'TND': // Tunisian Dinar
      return 3;
    case 'CLF': // Unidad de Fomento (Chile)
      return 4;
    case 'BIF': // Burundian Franc
    case 'BYN': // Belarusian Ruble
    case 'CVE': // Cape Verdean Escudo
    case 'DJF': // Djiboutian Franc
    case 'GNF': // Guinean Franc
    case 'ISK': // Icelandic Krona
    case 'JPY': // Japanese Yen
    case 'KMF': // Comorian Franc
    case 'KRW': // South Korean Won
    case 'PYG': // Paraguayan Guarani
    case 'RWF': // Rwandan Franc
    case 'UGX': // Ugandan Shilling
    case 'UYI': // Uruguayan Peso (Indexed Units)
    case 'VND': // Vietnamese Dong
    case 'VUV': // Vanuatu Vatu
    case 'XAF': // Central African CFA Franc
    case 'XOF': // West African CFA Franc
    case 'XPF': // CFP Franc
      return 0;
    default:
      return 2; // Default to 2 decimal places for most currencies
  }
}
function formatMinorUnits(amount, currency) {
  const precision = getCurrencyPrecision(currency);
  return new decimal_js.Decimal(amount)
    .div(new decimal_js.Decimal(10).pow(precision))
    .toFixed(precision);
}
function minorUnitsToNumber(amount, currency) {
  const precision = getCurrencyPrecision(currency);
  return new decimal_js.Decimal(amount)
    .div(new decimal_js.Decimal(10).pow(precision))
    .toNumber();
}

const nameStartChar =
  ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const nameChar = nameStartChar + '\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
const nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*';
const regexName = new RegExp('^' + nameRegexp + '$');

function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}

const isName = function (string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === 'undefined');
};

function isExist(v) {
  return typeof v !== 'undefined';
}

/**
 * Dangerous property names that could lead to prototype pollution or security issues
 */
const DANGEROUS_PROPERTY_NAMES = [
  // '__proto__',
  // 'constructor',
  // 'prototype',
  'hasOwnProperty',
  'toString',
  'valueOf',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
];

const criticalProperties = ['__proto__', 'constructor', 'prototype'];

const defaultOptions$2 = {
  allowBooleanAttributes: false, //A tag can have attributes without any value
  unpairedTags: [],
};

//const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions$2, options);

  //xmlData = xmlData.replace(/(\r\n|\n|\r)/gm,"");//make it single line
  //xmlData = xmlData.replace(/(^\s*<\?xml.*?\?>)/g,"");//Remove XML starting tag
  //xmlData = xmlData.replace(/(<!DOCTYPE[\s\w\"\.\/\-\:]+(\[.*\])*\s*>)/g,"");//Remove DOCTYPE
  const tags = [];
  let tagFound = false;

  //indicates that the root tag has been closed (aka. depth 0 has been reached)
  let reachedRoot = false;

  if (xmlData[0] === '\ufeff') {
    // check for byte order mark (BOM)
    xmlData = xmlData.substr(1);
  }

  for (let i = 0; i < xmlData.length; i++) {
    if (xmlData[i] === '<' && xmlData[i + 1] === '?') {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err) return i;
    } else if (xmlData[i] === '<') {
      //starting of tag
      //read until you reach to '>' avoiding any '>' in attribute value
      let tagStartPos = i;
      i++;

      if (xmlData[i] === '!') {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === '/') {
          //closing tag
          closingTag = true;
          i++;
        }
        //read tagname
        let tagName = '';
        for (
          ;
          i < xmlData.length &&
          xmlData[i] !== '>' &&
          xmlData[i] !== ' ' &&
          xmlData[i] !== '\t' &&
          xmlData[i] !== '\n' &&
          xmlData[i] !== '\r';
          i++
        ) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        //console.log(tagName);

        if (tagName[tagName.length - 1] === '/') {
          //self closing tag without attributes
          tagName = tagName.substring(0, tagName.length - 1);
          //continue;
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject(
            'InvalidTag',
            msg,
            getLineNumberForPosition(xmlData, i),
          );
        }

        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject(
            'InvalidAttr',
            "Attributes for '" + tagName + "' have open quote.",
            getLineNumberForPosition(xmlData, i),
          );
        }
        let attrStr = result.value;
        i = result.index;

        if (attrStr[attrStr.length - 1] === '/') {
          //self closing tag
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
            //continue; //text may presents after self closing tag
          } else {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(
              isValid.err.code,
              isValid.err.msg,
              getLineNumberForPosition(
                xmlData,
                attrStrStart + isValid.err.line,
              ),
            );
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject(
              'InvalidTag',
              "Closing tag '" + tagName + "' doesn't have proper closing.",
              getLineNumberForPosition(xmlData, i),
            );
          } else if (attrStr.trim().length > 0) {
            return getErrorObject(
              'InvalidTag',
              "Closing tag '" +
                tagName +
                "' can't have attributes or invalid starting.",
              getLineNumberForPosition(xmlData, tagStartPos),
            );
          } else if (tags.length === 0) {
            return getErrorObject(
              'InvalidTag',
              "Closing tag '" + tagName + "' has not been opened.",
              getLineNumberForPosition(xmlData, tagStartPos),
            );
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject(
                'InvalidTag',
                "Expected closing tag '" +
                  otg.tagName +
                  "' (opened in line " +
                  openPos.line +
                  ', col ' +
                  openPos.col +
                  ") instead of closing tag '" +
                  tagName +
                  "'.",
                getLineNumberForPosition(xmlData, tagStartPos),
              );
            }

            //when there are no more tags, we reached the root level.
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            //the result from the nested function returns the position of the error within the attribute
            //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
            //this gives us the absolute index in the entire xml, which we can use to find the line at last
            return getErrorObject(
              isValid.err.code,
              isValid.err.msg,
              getLineNumberForPosition(
                xmlData,
                i - attrStr.length + isValid.err.line,
              ),
            );
          }

          //if the root level has been reached before ...
          if (reachedRoot === true) {
            return getErrorObject(
              'InvalidXml',
              'Multiple possible root nodes found.',
              getLineNumberForPosition(xmlData, i),
            );
          } else if (options.unpairedTags.indexOf(tagName) !== -1);
          else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }

        //skip tag text value
        //It may include comments and CDATA value
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            if (xmlData[i + 1] === '!') {
              //comment or CADATA
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === '?') {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else {
              break;
            }
          } else if (xmlData[i] === '&') {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject(
                'InvalidChar',
                "char '&' is not expected.",
                getLineNumberForPosition(xmlData, i),
              );
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject(
                'InvalidXml',
                'Extra text at the end',
                getLineNumberForPosition(xmlData, i),
              );
            }
          }
        } //end of reading tag text value
        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject(
        'InvalidChar',
        "char '" + xmlData[i] + "' is not expected.",
        getLineNumberForPosition(xmlData, i),
      );
    }
  }

  if (!tagFound) {
    return getErrorObject('InvalidXml', 'Start tag expected.', 1);
  } else if (tags.length == 1) {
    return getErrorObject(
      'InvalidTag',
      "Unclosed tag '" + tags[0].tagName + "'.",
      getLineNumberForPosition(xmlData, tags[0].tagStartPos),
    );
  } else if (tags.length > 0) {
    return getErrorObject(
      'InvalidXml',
      "Invalid '" +
        JSON.stringify(
          tags.map(t => t.tagName),
          null,
          4,
        ).replace(/\r?\n/g, '') +
        "' found.",
      { line: 1, col: 1 },
    );
  }

  return true;
}
function isWhiteSpace(char) {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}
/**
 * Read Processing insstructions and skip
 * @param {*} xmlData
 * @param {*} i
 */
function readPI(xmlData, i) {
  const start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == '?' || xmlData[i] == ' ') {
      //tagname
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === 'xml') {
        return getErrorObject(
          'InvalidXml',
          'XML declaration allowed only at the start of the document.',
          getLineNumberForPosition(xmlData, i),
        );
      } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
        //check if valid attribut string
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}

function readCommentAndCDATA(xmlData, i) {
  if (
    xmlData.length > i + 5 &&
    xmlData[i + 1] === '-' &&
    xmlData[i + 2] === '-'
  ) {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (
        xmlData[i] === '-' &&
        xmlData[i + 1] === '-' &&
        xmlData[i + 2] === '>'
      ) {
        i += 2;
        break;
      }
    }
  } else if (
    xmlData.length > i + 8 &&
    xmlData[i + 1] === 'D' &&
    xmlData[i + 2] === 'O' &&
    xmlData[i + 3] === 'C' &&
    xmlData[i + 4] === 'T' &&
    xmlData[i + 5] === 'Y' &&
    xmlData[i + 6] === 'P' &&
    xmlData[i + 7] === 'E'
  ) {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === '<') {
        angleBracketsCount++;
      } else if (xmlData[i] === '>') {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (
    xmlData.length > i + 9 &&
    xmlData[i + 1] === '[' &&
    xmlData[i + 2] === 'C' &&
    xmlData[i + 3] === 'D' &&
    xmlData[i + 4] === 'A' &&
    xmlData[i + 5] === 'T' &&
    xmlData[i + 6] === 'A' &&
    xmlData[i + 7] === '['
  ) {
    for (i += 8; i < xmlData.length; i++) {
      if (
        xmlData[i] === ']' &&
        xmlData[i + 1] === ']' &&
        xmlData[i + 2] === '>'
      ) {
        i += 2;
        break;
      }
    }
  }

  return i;
}

const doubleQuote = '"';
const singleQuote = "'";

/**
 * Keep reading xmlData until '<' is found outside the attribute value.
 * @param {string} xmlData
 * @param {number} i
 */
function readAttributeStr(xmlData, i) {
  let attrStr = '';
  let startChar = '';
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === '') {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]);
      else {
        startChar = '';
      }
    } else if (xmlData[i] === '>') {
      if (startChar === '') {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== '') {
    return false;
  }

  return {
    value: attrStr,
    index: i,
    tagClosed: tagClosed,
  };
}

/**
 * Select all the attributes whether valid or invalid.
 */
const validAttrStrRegxp = new RegExp(
  '(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?',
  'g',
);

//attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr, options) {
  //console.log("start:"+attrStr+":end");

  //if(attrStr.trim().length === 0) return true; //empty string

  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};

  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return getErrorObject(
        'InvalidAttr',
        "Attribute '" + matches[i][2] + "' has no space in starting.",
        getPositionFromMatch(matches[i]),
      );
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject(
        'InvalidAttr',
        "Attribute '" + matches[i][2] + "' is without value.",
        getPositionFromMatch(matches[i]),
      );
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return getErrorObject(
        'InvalidAttr',
        "boolean attribute '" + matches[i][2] + "' is not allowed.",
        getPositionFromMatch(matches[i]),
      );
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject(
        'InvalidAttr',
        "Attribute '" + attrName + "' is an invalid name.",
        getPositionFromMatch(matches[i]),
      );
    }
    if (!Object.prototype.hasOwnProperty.call(attrNames, attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return getErrorObject(
        'InvalidAttr',
        "Attribute '" + attrName + "' is repeated.",
        getPositionFromMatch(matches[i]),
      );
    }
  }

  return true;
}

function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === 'x') {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ';') return i;
    if (!xmlData[i].match(re)) break;
  }
  return -1;
}

function validateAmpersand(xmlData, i) {
  // https://www.w3.org/TR/xml/#dt-charref
  i++;
  if (xmlData[i] === ';') return -1;
  if (xmlData[i] === '#') {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20) continue;
    if (xmlData[i] === ';') break;
    return -1;
  }
  return i;
}

function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code: code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col,
    },
  };
}

function validateAttrName(attrName) {
  return isName(attrName);
}

// const startsWithXML = /^xml/i;

function validateTagName(tagname) {
  return isName(tagname) /* && !tagname.match(startsWithXML) */;
}

//this function returns the line number for the character at the given index
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,

    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1,
  };
}

//this function returns the position of the first character of match within attrStr
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

const defaultOnDangerousProperty = name => {
  if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
    return '__' + name;
  }
  return name;
};

const defaultOptions$1 = {
  preserveOrder: false,
  attributeNamePrefix: '@_',
  attributesGroupName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  removeNSPrefix: false, // remove NS from tag name or attribute name if true
  allowBooleanAttributes: false, //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true, //Trim string values of tag and attributes
  cdataPropName: false,
  numberParseOptions: {
    hex: true,
    leadingZeros: true,
    eNotation: true,
  },
  tagValueProcessor: function (tagName, val) {
    return val;
  },
  attributeValueProcessor: function (attrName, val) {
    return val;
  },
  stopNodes: [], //nested tags will not be parsed even for errors
  alwaysCreateTextNode: false,
  isArray: () => false,
  commentPropName: false,
  unpairedTags: [],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: false,
  transformAttributeName: false,
  updateTag: function (tagName, jPath, attrs) {
    return tagName;
  },
  // skipEmptyListItem: false
  captureMetaData: false,
  maxNestedTags: 100,
  strictReservedNames: true,
  jPath: true, // if true, pass jPath string to callbacks; if false, pass matcher instance
  onDangerousProperty: defaultOnDangerousProperty,
};

/**
 * Validates that a property name is safe to use
 * @param {string} propertyName - The property name to validate
 * @param {string} optionName - The option field name (for error message)
 * @throws {Error} If property name is dangerous
 */
function validatePropertyName(propertyName, optionName) {
  if (typeof propertyName !== 'string') {
    return; // Only validate string property names
  }

  const normalized = propertyName.toLowerCase();
  if (
    DANGEROUS_PROPERTY_NAMES.some(
      dangerous => normalized === dangerous.toLowerCase(),
    )
  ) {
    throw new Error(
      `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`,
    );
  }

  if (
    criticalProperties.some(dangerous => normalized === dangerous.toLowerCase())
  ) {
    throw new Error(
      `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`,
    );
  }
}

/**
 * Normalizes processEntities option for backward compatibility
 * @param {boolean|object} value
 * @returns {object} Always returns normalized object
 */
function normalizeProcessEntities(value) {
  // Boolean backward compatibility
  if (typeof value === 'boolean') {
    return {
      enabled: value, // true or false
      maxEntitySize: 10000,
      maxExpansionDepth: 10,
      maxTotalExpansions: 1000,
      maxExpandedLength: 100000,
      maxEntityCount: 100,
      allowedTags: null,
      tagFilter: null,
    };
  }

  // Object config - merge with defaults
  if (typeof value === 'object' && value !== null) {
    return {
      enabled: value.enabled !== false,
      maxEntitySize: Math.max(1, value.maxEntitySize ?? 10000),
      maxExpansionDepth: Math.max(1, value.maxExpansionDepth ?? 10000),
      maxTotalExpansions: Math.max(1, value.maxTotalExpansions ?? Infinity),
      maxExpandedLength: Math.max(1, value.maxExpandedLength ?? 100000),
      maxEntityCount: Math.max(1, value.maxEntityCount ?? 1000),
      allowedTags: value.allowedTags ?? null,
      tagFilter: value.tagFilter ?? null,
    };
  }

  // Default to enabled with limits
  return normalizeProcessEntities(true);
}

const buildOptions = function (options) {
  const built = Object.assign({}, defaultOptions$1, options);

  // Validate property names to prevent prototype pollution
  const propertyNameOptions = [
    { value: built.attributeNamePrefix, name: 'attributeNamePrefix' },
    { value: built.attributesGroupName, name: 'attributesGroupName' },
    { value: built.textNodeName, name: 'textNodeName' },
    { value: built.cdataPropName, name: 'cdataPropName' },
    { value: built.commentPropName, name: 'commentPropName' },
  ];

  for (const { value, name } of propertyNameOptions) {
    if (value) {
      validatePropertyName(value, name);
    }
  }

  if (built.onDangerousProperty === null) {
    built.onDangerousProperty = defaultOnDangerousProperty;
  }

  // Always normalize processEntities for backward compatibility and validation
  built.processEntities = normalizeProcessEntities(built.processEntities);
  built.unpairedTagsSet = new Set(built.unpairedTags);
  // Convert old-style stopNodes for backward compatibility
  if (built.stopNodes && Array.isArray(built.stopNodes)) {
    built.stopNodes = built.stopNodes.map(node => {
      if (typeof node === 'string' && node.startsWith('*.')) {
        // Old syntax: *.tagname meant "tagname anywhere"
        // Convert to new syntax: ..tagname
        return '..' + node.substring(2);
      }
      return node;
    });
  }
  //console.debug(built.processEntities)
  return built;
};

let METADATA_SYMBOL$1;

if (typeof Symbol !== 'function') {
  METADATA_SYMBOL$1 = '@@xmlMetadata';
} else {
  METADATA_SYMBOL$1 = Symbol('XML Node Metadata');
}

class XmlNode {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = []; //nested tags, text, cdata, comments in order
    this[':@'] = Object.create(null); //attributes map
  }
  add(key, val) {
    // this.child.push( {name : key, val: val, isCdata: isCdata });
    if (key === '__proto__') key = '#__proto__';
    this.child.push({ [key]: val });
  }
  addChild(node, startIndex) {
    if (node.tagname === '__proto__') node.tagname = '#__proto__';
    if (node[':@'] && Object.keys(node[':@']).length > 0) {
      this.child.push({ [node.tagname]: node.child, [':@']: node[':@'] });
    } else {
      this.child.push({ [node.tagname]: node.child });
    }
    // if requested, add the startIndex
    if (startIndex !== undefined) {
      // Note: for now we just overwrite the metadata. If we had more complex metadata,
      // we might need to do an object append here:  metadata = { ...metadata, startIndex }
      this.child[this.child.length - 1][METADATA_SYMBOL$1] = { startIndex };
    }
  }
  /** symbol used for metadata */
  static getMetaDataSymbol() {
    return METADATA_SYMBOL$1;
  }
}

class DocTypeReader {
  constructor(options) {
    this.suppressValidationErr = !options;
    this.options = options;
  }

  readDocType(xmlData, i) {
    const entities = Object.create(null);
    let entityCount = 0;

    if (
      xmlData[i + 3] === 'O' &&
      xmlData[i + 4] === 'C' &&
      xmlData[i + 5] === 'T' &&
      xmlData[i + 6] === 'Y' &&
      xmlData[i + 7] === 'P' &&
      xmlData[i + 8] === 'E'
    ) {
      i = i + 9;
      let angleBracketsCount = 1;
      let hasBody = false,
        comment = false;
      let exp = '';
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === '<' && !comment) {
          //Determine the tag type
          if (hasBody && hasSeq(xmlData, '!ENTITY', i)) {
            i += 7;
            let entityName, val;
            [entityName, val, i] = this.readEntityExp(
              xmlData,
              i + 1,
              this.suppressValidationErr,
            );
            if (val.indexOf('&') === -1) {
              //Parameter entities are not supported
              if (
                this.options.enabled !== false &&
                this.options.maxEntityCount != null &&
                entityCount >= this.options.maxEntityCount
              ) {
                throw new Error(
                  `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`,
                );
              }
              //const escaped = entityName.replace(/[.\-+*:]/g, '\\.');
              const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              entities[entityName] = {
                regx: RegExp(`&${escaped};`, 'g'),
                val: val,
              };
              entityCount++;
            }
          } else if (hasBody && hasSeq(xmlData, '!ELEMENT', i)) {
            i += 8; //Not supported
            const { index } = this.readElementExp(xmlData, i + 1);
            i = index;
          } else if (hasBody && hasSeq(xmlData, '!ATTLIST', i)) {
            i += 8; //Not supported
            // const {index} = this.readAttlistExp(xmlData,i+1);
            // i = index;
          } else if (hasBody && hasSeq(xmlData, '!NOTATION', i)) {
            i += 9; //Not supported
            const { index } = this.readNotationExp(
              xmlData,
              i + 1,
              this.suppressValidationErr,
            );
            i = index;
          } else if (hasSeq(xmlData, '!--', i)) comment = true;
          else throw new Error(`Invalid DOCTYPE`);

          angleBracketsCount++;
          exp = '';
        } else if (xmlData[i] === '>') {
          //Read tag content
          if (comment) {
            if (xmlData[i - 1] === '-' && xmlData[i - 2] === '-') {
              comment = false;
              angleBracketsCount--;
            }
          } else {
            angleBracketsCount--;
          }
          if (angleBracketsCount === 0) {
            break;
          }
        } else if (xmlData[i] === '[') {
          hasBody = true;
        } else {
          exp += xmlData[i];
        }
      }
      if (angleBracketsCount !== 0) {
        throw new Error(`Unclosed DOCTYPE`);
      }
    } else {
      throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return { entities, i };
  }
  readEntityExp(xmlData, i) {
    //External entities are not supported
    //    <!ENTITY ext SYSTEM "http://normal-website.com" >

    //Parameter entities are not supported
    //    <!ENTITY entityname "&anotherElement;">

    //Internal entities are supported
    //    <!ENTITY entityname "replacement text">

    // Skip leading whitespace after <!ENTITY
    i = skipWhitespace(xmlData, i);

    // Read entity name
    const startIndex = i;
    while (
      i < xmlData.length &&
      !/\s/.test(xmlData[i]) &&
      xmlData[i] !== '"' &&
      xmlData[i] !== "'"
    ) {
      i++;
    }
    let entityName = xmlData.substring(startIndex, i);

    validateEntityName$1(entityName);

    // Skip whitespace after entity name
    i = skipWhitespace(xmlData, i);

    // Check for unsupported constructs (external entities or parameter entities)
    if (!this.suppressValidationErr) {
      if (xmlData.substring(i, i + 6).toUpperCase() === 'SYSTEM') {
        throw new Error('External entities are not supported');
      } else if (xmlData[i] === '%') {
        throw new Error('Parameter entities are not supported');
      }
    }

    // Read entity value (internal entity)
    let entityValue = '';
    [i, entityValue] = this.readIdentifierVal(xmlData, i, 'entity');

    // Validate entity size
    if (
      this.options.enabled !== false &&
      this.options.maxEntitySize != null &&
      entityValue.length > this.options.maxEntitySize
    ) {
      throw new Error(
        `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`,
      );
    }

    i--;
    return [entityName, entityValue, i];
  }

  readNotationExp(xmlData, i) {
    // Skip leading whitespace after <!NOTATION
    i = skipWhitespace(xmlData, i);

    // Read notation name

    const startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let notationName = xmlData.substring(startIndex, i);

    !this.suppressValidationErr && validateEntityName$1(notationName);

    // Skip whitespace after notation name
    i = skipWhitespace(xmlData, i);

    // Check identifier type (SYSTEM or PUBLIC)
    const identifierType = xmlData.substring(i, i + 6).toUpperCase();
    if (
      !this.suppressValidationErr &&
      identifierType !== 'SYSTEM' &&
      identifierType !== 'PUBLIC'
    ) {
      throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
    }
    i += identifierType.length;

    // Skip whitespace after identifier type
    i = skipWhitespace(xmlData, i);

    // Read public identifier (if PUBLIC)
    let publicIdentifier = null;
    let systemIdentifier = null;

    if (identifierType === 'PUBLIC') {
      [i, publicIdentifier] = this.readIdentifierVal(
        xmlData,
        i,
        'publicIdentifier',
      );

      // Skip whitespace after public identifier
      i = skipWhitespace(xmlData, i);

      // Optionally read system identifier
      if (xmlData[i] === '"' || xmlData[i] === "'") {
        [i, systemIdentifier] = this.readIdentifierVal(
          xmlData,
          i,
          'systemIdentifier',
        );
      }
    } else if (identifierType === 'SYSTEM') {
      // Read system identifier (mandatory for SYSTEM)
      [i, systemIdentifier] = this.readIdentifierVal(
        xmlData,
        i,
        'systemIdentifier',
      );

      if (!this.suppressValidationErr && !systemIdentifier) {
        throw new Error(
          'Missing mandatory system identifier for SYSTEM notation',
        );
      }
    }

    return { notationName, publicIdentifier, systemIdentifier, index: --i };
  }

  readIdentifierVal(xmlData, i, type) {
    let identifierVal = '';
    const startChar = xmlData[i];
    if (startChar !== '"' && startChar !== "'") {
      throw new Error(`Expected quoted string, found "${startChar}"`);
    }
    i++;

    const startIndex = i;
    while (i < xmlData.length && xmlData[i] !== startChar) {
      i++;
    }
    identifierVal = xmlData.substring(startIndex, i);

    if (xmlData[i] !== startChar) {
      throw new Error(`Unterminated ${type} value`);
    }
    i++;
    return [i, identifierVal];
  }

  readElementExp(xmlData, i) {
    // <!ELEMENT br EMPTY>
    // <!ELEMENT div ANY>
    // <!ELEMENT title (#PCDATA)>
    // <!ELEMENT book (title, author+)>
    // <!ELEMENT name (content-model)>

    // Skip leading whitespace after <!ELEMENT
    i = skipWhitespace(xmlData, i);

    // Read element name
    const startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let elementName = xmlData.substring(startIndex, i);

    // Validate element name
    if (!this.suppressValidationErr && !isName(elementName)) {
      throw new Error(`Invalid element name: "${elementName}"`);
    }

    // Skip whitespace after element name
    i = skipWhitespace(xmlData, i);
    let contentModel = '';
    // Expect '(' to start content model
    if (xmlData[i] === 'E' && hasSeq(xmlData, 'MPTY', i)) i += 4;
    else if (xmlData[i] === 'A' && hasSeq(xmlData, 'NY', i)) i += 2;
    else if (xmlData[i] === '(') {
      i++; // Move past '('

      // Read content model
      const startIndex = i;
      while (i < xmlData.length && xmlData[i] !== ')') {
        i++;
      }
      contentModel = xmlData.substring(startIndex, i);

      if (xmlData[i] !== ')') {
        throw new Error('Unterminated content model');
      }
    } else if (!this.suppressValidationErr) {
      throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
    }

    return {
      elementName,
      contentModel: contentModel.trim(),
      index: i,
    };
  }

  readAttlistExp(xmlData, i) {
    // Skip leading whitespace after <!ATTLIST
    i = skipWhitespace(xmlData, i);

    // Read element name
    let startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let elementName = xmlData.substring(startIndex, i);

    // Validate element name
    validateEntityName$1(elementName);

    // Skip whitespace after element name
    i = skipWhitespace(xmlData, i);

    // Read attribute name
    startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let attributeName = xmlData.substring(startIndex, i);

    // Validate attribute name
    if (!validateEntityName$1(attributeName)) {
      throw new Error(`Invalid attribute name: "${attributeName}"`);
    }

    // Skip whitespace after attribute name
    i = skipWhitespace(xmlData, i);

    // Read attribute type
    let attributeType = '';
    if (xmlData.substring(i, i + 8).toUpperCase() === 'NOTATION') {
      attributeType = 'NOTATION';
      i += 8; // Move past "NOTATION"

      // Skip whitespace after "NOTATION"
      i = skipWhitespace(xmlData, i);

      // Expect '(' to start the list of notations
      if (xmlData[i] !== '(') {
        throw new Error(`Expected '(', found "${xmlData[i]}"`);
      }
      i++; // Move past '('

      // Read the list of allowed notations
      let allowedNotations = [];
      while (i < xmlData.length && xmlData[i] !== ')') {
        const startIndex = i;
        while (i < xmlData.length && xmlData[i] !== '|' && xmlData[i] !== ')') {
          i++;
        }
        let notation = xmlData.substring(startIndex, i);

        // Validate notation name
        notation = notation.trim();
        if (!validateEntityName$1(notation)) {
          throw new Error(`Invalid notation name: "${notation}"`);
        }

        allowedNotations.push(notation);

        // Skip '|' separator or exit loop
        if (xmlData[i] === '|') {
          i++; // Move past '|'
          i = skipWhitespace(xmlData, i); // Skip optional whitespace after '|'
        }
      }

      if (xmlData[i] !== ')') {
        throw new Error('Unterminated list of notations');
      }
      i++; // Move past ')'

      // Store the allowed notations as part of the attribute type
      attributeType += ' (' + allowedNotations.join('|') + ')';
    } else {
      // Handle simple types (e.g., CDATA, ID, IDREF, etc.)
      const startIndex = i;
      while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        i++;
      }
      attributeType += xmlData.substring(startIndex, i);

      // Validate simple attribute type
      const validTypes = [
        'CDATA',
        'ID',
        'IDREF',
        'IDREFS',
        'ENTITY',
        'ENTITIES',
        'NMTOKEN',
        'NMTOKENS',
      ];
      if (
        !this.suppressValidationErr &&
        !validTypes.includes(attributeType.toUpperCase())
      ) {
        throw new Error(`Invalid attribute type: "${attributeType}"`);
      }
    }

    // Skip whitespace after attribute type
    i = skipWhitespace(xmlData, i);

    // Read default value
    let defaultValue = '';
    if (xmlData.substring(i, i + 8).toUpperCase() === '#REQUIRED') {
      defaultValue = '#REQUIRED';
      i += 8;
    } else if (xmlData.substring(i, i + 7).toUpperCase() === '#IMPLIED') {
      defaultValue = '#IMPLIED';
      i += 7;
    } else {
      [i, defaultValue] = this.readIdentifierVal(xmlData, i, 'ATTLIST');
    }

    return {
      elementName,
      attributeName,
      attributeType,
      defaultValue,
      index: i,
    };
  }
}

const skipWhitespace = (data, index) => {
  while (index < data.length && /\s/.test(data[index])) {
    index++;
  }
  return index;
};

function hasSeq(data, seq, i) {
  for (let j = 0; j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1]) return false;
  }
  return true;
}

function validateEntityName$1(name) {
  if (isName(name)) return name;
  else throw new Error(`Invalid entity name ${name}`);
}

const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
// const octRegex = /^0x[a-z0-9]+/;
// const binRegex = /0x[a-z0-9]+/;

const consider = {
  hex: true,
  // oct: false,
  leadingZeros: true,
  decimalPoint: '\.',
  eNotation: true,
  //skipLike: /regex/,
  infinity: 'original', // "null", "infinity" (Infinity type), "string" ("Infinity" (the string literal))
};

function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== 'string') return str;

  let trimmedStr = str.trim();

  if (trimmedStr.length === 0) return str;
  else if (options.skipLike !== undefined && options.skipLike.test(trimmedStr))
    return str;
  else if (trimmedStr === '0') return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
    // }else if (options.oct && octRegex.test(str)) {
    //     return Number.parseInt(val, 8);
  } else if (!isFinite(trimmedStr)) {
    //Infinity
    return handleInfinity(str, Number(trimmedStr), options);
  } else if (trimmedStr.includes('e') || trimmedStr.includes('E')) {
    //eNotation
    return resolveEnotation(str, trimmedStr, options);
    // }else if (options.parseBin && binRegex.test(str)) {
    //     return Number.parseInt(val, 2);
  } else {
    //separate negative sign, leading zeros, and rest number
    const match = numRegex.exec(trimmedStr);
    // +00.123 => [ , '+', '00', '.123', ..
    if (match) {
      const sign = match[1] || '';
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
      const decimalAdjacentToLeadingZeros = sign // 0., -00., 000.
        ? str[leadingZeros.length + 1] === '.'
        : str[leadingZeros.length] === '.';

      //trim ending zeros for floating number
      if (
        !options.leadingZeros && //leading zeros are not allowed
        (leadingZeros.length > 1 ||
          (leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros))
      ) {
        // 00, 00.3, +03.24, 03, 03.24
        return str;
      } else {
        //no leading zeros or leading zeros are allowed
        const num = Number(trimmedStr);
        const parsedStr = String(num);

        if (num === 0) return num;
        if (parsedStr.search(/[eE]/) !== -1) {
          //given number is long and parsed to eNotation
          if (options.eNotation) return num;
          else return str;
        } else if (trimmedStr.indexOf('.') !== -1) {
          //floating number
          if (parsedStr === '0')
            return num; //0.0
          else if (parsedStr === numTrimmedByZeros)
            return num; //0.456. 0.79000
          else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
          else return str;
        }

        let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
        if (leadingZeros) {
          // -009 => -9
          return n === parsedStr || sign + n === parsedStr ? num : str;
        } else {
          // +9
          return n === parsedStr || n === sign + parsedStr ? num : str;
        }
      }
    } else {
      //non-numeric string
      return str;
    }
  }
}

const eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation) return str;
  const notation = trimmedStr.match(eNotationRegx);
  if (notation) {
    let sign = notation[1] || '';
    const eChar = notation[3].indexOf('e') === -1 ? 'E' : 'e';
    const leadingZeros = notation[2];
    const eAdjacentToLeadingZeros = sign // 0E.
      ? str[leadingZeros.length + 1] === eChar
      : str[leadingZeros.length] === eChar;

    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
    else if (
      leadingZeros.length === 1 &&
      (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)
    ) {
      return Number(trimmedStr);
    } else if (leadingZeros.length > 0) {
      // Has leading zeros — only accept if leadingZeros option allows it
      if (options.leadingZeros && !eAdjacentToLeadingZeros) {
        trimmedStr = (notation[1] || '') + notation[3];
        return Number(trimmedStr);
      } else return str;
    } else {
      // No leading zeros — always valid e-notation, parse it
      return Number(trimmedStr);
    }
  } else {
    return str;
  }
}

/**
 *
 * @param {string} numStr without leading zeros
 * @returns
 */
function trimZeros(numStr) {
  if (numStr && numStr.indexOf('.') !== -1) {
    //float
    numStr = numStr.replace(/0+$/, ''); //remove ending zeros
    if (numStr === '.') numStr = '0';
    else if (numStr[0] === '.') numStr = '0' + numStr;
    else if (numStr[numStr.length - 1] === '.')
      numStr = numStr.substring(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}

function parse_int(numStr, base) {
  //polyfill
  if (parseInt) return parseInt(numStr, base);
  else if (Number.parseInt) return Number.parseInt(numStr, base);
  else if (window && window.parseInt) return window.parseInt(numStr, base);
  else
    throw new Error(
      'parseInt, Number.parseInt, window.parseInt are not supported',
    );
}

/**
 * Handle infinite values based on user option
 * @param {string} str - original input string
 * @param {number} num - parsed number (Infinity or -Infinity)
 * @param {object} options - user options
 * @returns {string|number|null} based on infinity option
 */
function handleInfinity(str, num, options) {
  const isPositive = num === Infinity;

  switch (options.infinity.toLowerCase()) {
    case 'null':
      return null;
    case 'infinity':
      return num; // Return Infinity or -Infinity
    case 'string':
      return isPositive ? 'Infinity' : '-Infinity';
    case 'original':
    default:
      return str; // Return original string like "1e1000"
  }
}

function getIgnoreAttributesFn$1(ignoreAttributes) {
  if (typeof ignoreAttributes === 'function') {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return attrName => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === 'string' && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

/**
 * Expression - Parses and stores a tag pattern expression
 *
 * Patterns are parsed once and stored in an optimized structure for fast matching.
 *
 * @example
 * const expr = new Expression("root.users.user");
 * const expr2 = new Expression("..user[id]:first");
 * const expr3 = new Expression("root/users/user", { separator: '/' });
 */
class Expression {
  /**
   * Create a new Expression
   * @param {string} pattern - Pattern string (e.g., "root.users.user", "..user[id]")
   * @param {Object} options - Configuration options
   * @param {string} options.separator - Path separator (default: '.')
   */
  constructor(pattern, options = {}, data) {
    this.pattern = pattern;
    this.separator = options.separator || '.';
    this.segments = this._parse(pattern);
    this.data = data;
    // Cache expensive checks for performance (O(1) instead of O(n))
    this._hasDeepWildcard = this.segments.some(
      seg => seg.type === 'deep-wildcard',
    );
    this._hasAttributeCondition = this.segments.some(
      seg => seg.attrName !== undefined,
    );
    this._hasPositionSelector = this.segments.some(
      seg => seg.position !== undefined,
    );
  }

  /**
   * Parse pattern string into segments
   * @private
   * @param {string} pattern - Pattern to parse
   * @returns {Array} Array of segment objects
   */
  _parse(pattern) {
    const segments = [];

    // Split by separator but handle ".." specially
    let i = 0;
    let currentPart = '';

    while (i < pattern.length) {
      if (pattern[i] === this.separator) {
        // Check if next char is also separator (deep wildcard)
        if (i + 1 < pattern.length && pattern[i + 1] === this.separator) {
          // Flush current part if any
          if (currentPart.trim()) {
            segments.push(this._parseSegment(currentPart.trim()));
            currentPart = '';
          }
          // Add deep wildcard
          segments.push({ type: 'deep-wildcard' });
          i += 2; // Skip both separators
        } else {
          // Regular separator
          if (currentPart.trim()) {
            segments.push(this._parseSegment(currentPart.trim()));
          }
          currentPart = '';
          i++;
        }
      } else {
        currentPart += pattern[i];
        i++;
      }
    }

    // Flush remaining part
    if (currentPart.trim()) {
      segments.push(this._parseSegment(currentPart.trim()));
    }

    return segments;
  }

  /**
   * Parse a single segment
   * @private
   * @param {string} part - Segment string (e.g., "user", "ns::user", "user[id]", "ns::user:first")
   * @returns {Object} Segment object
   */
  _parseSegment(part) {
    const segment = { type: 'tag' };

    // NEW NAMESPACE SYNTAX (v2.0):
    // ============================
    // Namespace uses DOUBLE colon (::)
    // Position uses SINGLE colon (:)
    //
    // Examples:
    //   "user"              → tag
    //   "user:first"        → tag + position
    //   "user[id]"          → tag + attribute
    //   "user[id]:first"    → tag + attribute + position
    //   "ns::user"          → namespace + tag
    //   "ns::user:first"    → namespace + tag + position
    //   "ns::user[id]"      → namespace + tag + attribute
    //   "ns::user[id]:first" → namespace + tag + attribute + position
    //   "ns::first"         → namespace + tag named "first" (NO ambiguity!)
    //
    // This eliminates all ambiguity:
    //   :: = namespace separator
    //   :  = position selector
    //   [] = attributes

    // Step 1: Extract brackets [attr] or [attr=value]
    let bracketContent = null;
    let withoutBrackets = part;

    const bracketMatch = part.match(/^([^\[]+)(\[[^\]]*\])(.*)$/);
    if (bracketMatch) {
      withoutBrackets = bracketMatch[1] + bracketMatch[3];
      if (bracketMatch[2]) {
        const content = bracketMatch[2].slice(1, -1);
        if (content) {
          bracketContent = content;
        }
      }
    }

    // Step 2: Check for namespace (double colon ::)
    let namespace = undefined;
    let tagAndPosition = withoutBrackets;

    if (withoutBrackets.includes('::')) {
      const nsIndex = withoutBrackets.indexOf('::');
      namespace = withoutBrackets.substring(0, nsIndex).trim();
      tagAndPosition = withoutBrackets.substring(nsIndex + 2).trim(); // Skip ::

      if (!namespace) {
        throw new Error(`Invalid namespace in pattern: ${part}`);
      }
    }

    // Step 3: Parse tag and position (single colon :)
    let tag = undefined;
    let positionMatch = null;

    if (tagAndPosition.includes(':')) {
      const colonIndex = tagAndPosition.lastIndexOf(':'); // Use last colon for position
      const tagPart = tagAndPosition.substring(0, colonIndex).trim();
      const posPart = tagAndPosition.substring(colonIndex + 1).trim();

      // Verify position is a valid keyword
      const isPositionKeyword =
        ['first', 'last', 'odd', 'even'].includes(posPart) ||
        /^nth\(\d+\)$/.test(posPart);

      if (isPositionKeyword) {
        tag = tagPart;
        positionMatch = posPart;
      } else {
        // Not a valid position keyword, treat whole thing as tag
        tag = tagAndPosition;
      }
    } else {
      tag = tagAndPosition;
    }

    if (!tag) {
      throw new Error(`Invalid segment pattern: ${part}`);
    }

    segment.tag = tag;
    if (namespace) {
      segment.namespace = namespace;
    }

    // Step 4: Parse attributes
    if (bracketContent) {
      if (bracketContent.includes('=')) {
        const eqIndex = bracketContent.indexOf('=');
        segment.attrName = bracketContent.substring(0, eqIndex).trim();
        segment.attrValue = bracketContent.substring(eqIndex + 1).trim();
      } else {
        segment.attrName = bracketContent.trim();
      }
    }

    // Step 5: Parse position selector
    if (positionMatch) {
      const nthMatch = positionMatch.match(/^nth\((\d+)\)$/);
      if (nthMatch) {
        segment.position = 'nth';
        segment.positionValue = parseInt(nthMatch[1], 10);
      } else {
        segment.position = positionMatch;
      }
    }

    return segment;
  }

  /**
   * Get the number of segments
   * @returns {number}
   */
  get length() {
    return this.segments.length;
  }

  /**
   * Check if expression contains deep wildcard
   * @returns {boolean}
   */
  hasDeepWildcard() {
    return this._hasDeepWildcard;
  }

  /**
   * Check if expression has attribute conditions
   * @returns {boolean}
   */
  hasAttributeCondition() {
    return this._hasAttributeCondition;
  }

  /**
   * Check if expression has position selectors
   * @returns {boolean}
   */
  hasPositionSelector() {
    return this._hasPositionSelector;
  }

  /**
   * Get string representation
   * @returns {string}
   */
  toString() {
    return this.pattern;
  }
}

/**
 * ExpressionSet - An indexed collection of Expressions for efficient bulk matching
 *
 * Instead of iterating all expressions on every tag, ExpressionSet pre-indexes
 * them at insertion time by depth and terminal tag name. At match time, only
 * the relevant bucket is evaluated — typically reducing checks from O(E) to O(1)
 * lookup plus O(small bucket) matches.
 *
 * Three buckets are maintained:
 *  - `_byDepthAndTag`  — exact depth + exact tag name  (tightest, used first)
 *  - `_wildcardByDepth` — exact depth + wildcard tag `*` (depth-matched only)
 *  - `_deepWildcards`  — expressions containing `..`  (cannot be depth-indexed)
 *
 * @example
 * import { Expression, ExpressionSet } from 'fast-xml-tagger';
 *
 * // Build once at config time
 * const stopNodes = new ExpressionSet();
 * stopNodes.add(new Expression('root.users.user'));
 * stopNodes.add(new Expression('root.config.setting'));
 * stopNodes.add(new Expression('..script'));
 *
 * // Query on every tag — hot path
 * if (stopNodes.matchesAny(matcher)) { ... }
 */
class ExpressionSet {
  constructor() {
    /** @type {Map<string, import('./Expression.js').default[]>} depth:tag → expressions */
    this._byDepthAndTag = new Map();

    /** @type {Map<number, import('./Expression.js').default[]>} depth → wildcard-tag expressions */
    this._wildcardByDepth = new Map();

    /** @type {import('./Expression.js').default[]} expressions containing deep wildcard (..) */
    this._deepWildcards = [];

    /** @type {Set<string>} pattern strings already added — used for deduplication */
    this._patterns = new Set();

    /** @type {boolean} whether the set is sealed against further additions */
    this._sealed = false;
  }

  /**
   * Add an Expression to the set.
   * Duplicate patterns (same pattern string) are silently ignored.
   *
   * @param {import('./Expression.js').default} expression - A pre-constructed Expression instance
   * @returns {this} for chaining
   * @throws {TypeError} if called after seal()
   *
   * @example
   * set.add(new Expression('root.users.user'));
   * set.add(new Expression('..script'));
   */
  add(expression) {
    if (this._sealed) {
      throw new TypeError(
        'ExpressionSet is sealed. Create a new ExpressionSet to add more expressions.',
      );
    }

    // Deduplicate by pattern string
    if (this._patterns.has(expression.pattern)) return this;
    this._patterns.add(expression.pattern);

    if (expression.hasDeepWildcard()) {
      this._deepWildcards.push(expression);
      return this;
    }

    const depth = expression.length;
    const lastSeg = expression.segments[expression.segments.length - 1];
    const tag = lastSeg?.tag;

    if (!tag || tag === '*') {
      // Can index by depth but not by tag
      if (!this._wildcardByDepth.has(depth))
        this._wildcardByDepth.set(depth, []);
      this._wildcardByDepth.get(depth).push(expression);
    } else {
      // Tightest bucket: depth + tag
      const key = `${depth}:${tag}`;
      if (!this._byDepthAndTag.has(key)) this._byDepthAndTag.set(key, []);
      this._byDepthAndTag.get(key).push(expression);
    }

    return this;
  }

  /**
   * Add multiple expressions at once.
   *
   * @param {import('./Expression.js').default[]} expressions - Array of Expression instances
   * @returns {this} for chaining
   *
   * @example
   * set.addAll([
   *   new Expression('root.users.user'),
   *   new Expression('root.config.setting'),
   * ]);
   */
  addAll(expressions) {
    for (const expr of expressions) this.add(expr);
    return this;
  }

  /**
   * Check whether a pattern string is already present in the set.
   *
   * @param {import('./Expression.js').default} expression
   * @returns {boolean}
   */
  has(expression) {
    return this._patterns.has(expression.pattern);
  }

  /**
   * Number of expressions in the set.
   * @type {number}
   */
  get size() {
    return this._patterns.size;
  }

  /**
   * Seal the set against further modifications.
   * Useful to prevent accidental mutations after config is built.
   * Calling add() or addAll() on a sealed set throws a TypeError.
   *
   * @returns {this}
   */
  seal() {
    this._sealed = true;
    return this;
  }

  /**
   * Whether the set has been sealed.
   * @type {boolean}
   */
  get isSealed() {
    return this._sealed;
  }

  /**
   * Test whether the matcher's current path matches any expression in the set.
   *
   * Evaluation order (cheapest → most expensive):
   *  1. Exact depth + tag bucket  — O(1) lookup, typically 0–2 expressions
   *  2. Depth-only wildcard bucket — O(1) lookup, rare
   *  3. Deep-wildcard list         — always checked, but usually small
   *
   * @param {import('./Matcher.js').default} matcher - Matcher instance (or readOnly view)
   * @returns {boolean} true if any expression matches the current path
   *
   * @example
   * if (stopNodes.matchesAny(matcher)) {
   *   // handle stop node
   * }
   */
  matchesAny(matcher) {
    return this.findMatch(matcher) !== null;
  }
  /**
   * Find and return the first Expression that matches the matcher's current path.
   *
   * Uses the same evaluation order as matchesAny (cheapest → most expensive):
   *  1. Exact depth + tag bucket
   *  2. Depth-only wildcard bucket
   *  3. Deep-wildcard list
   *
   * @param {import('./Matcher.js').default} matcher - Matcher instance (or readOnly view)
   * @returns {import('./Expression.js').default | null} the first matching Expression, or null
   *
   * @example
   * const expr = stopNodes.findMatch(matcher);
   * if (expr) {
   *   // access expr.config, expr.pattern, etc.
   * }
   */
  findMatch(matcher) {
    const depth = matcher.getDepth();
    const tag = matcher.getCurrentTag();

    // 1. Tightest bucket — most expressions live here
    const exactKey = `${depth}:${tag}`;
    const exactBucket = this._byDepthAndTag.get(exactKey);
    if (exactBucket) {
      for (let i = 0; i < exactBucket.length; i++) {
        if (matcher.matches(exactBucket[i])) return exactBucket[i];
      }
    }

    // 2. Depth-matched wildcard-tag expressions
    const wildcardBucket = this._wildcardByDepth.get(depth);
    if (wildcardBucket) {
      for (let i = 0; i < wildcardBucket.length; i++) {
        if (matcher.matches(wildcardBucket[i])) return wildcardBucket[i];
      }
    }

    // 3. Deep wildcards — cannot be pre-filtered by depth or tag
    for (let i = 0; i < this._deepWildcards.length; i++) {
      if (matcher.matches(this._deepWildcards[i]))
        return this._deepWildcards[i];
    }

    return null;
  }
}

/**
 * MatcherView - A lightweight read-only view over a Matcher's internal state.
 *
 * Created once by Matcher and reused across all callbacks. Holds a direct
 * reference to the parent Matcher so it always reflects current parser state
 * with zero copying or freezing overhead.
 *
 * Users receive this via {@link Matcher#readOnly} or directly from parser
 * callbacks. It exposes all query and matching methods but has no mutation
 * methods — misuse is caught at the TypeScript level rather than at runtime.
 *
 * @example
 * const matcher = new Matcher();
 * const view = matcher.readOnly();
 *
 * matcher.push("root", {});
 * view.getCurrentTag(); // "root"
 * view.getDepth();      // 1
 */
class MatcherView {
  /**
   * @param {Matcher} matcher - The parent Matcher instance to read from.
   */
  constructor(matcher) {
    this._matcher = matcher;
  }

  /**
   * Get the path separator used by the parent matcher.
   * @returns {string}
   */
  get separator() {
    return this._matcher.separator;
  }

  /**
   * Get current tag name.
   * @returns {string|undefined}
   */
  getCurrentTag() {
    const path = this._matcher.path;
    return path.length > 0 ? path[path.length - 1].tag : undefined;
  }

  /**
   * Get current namespace.
   * @returns {string|undefined}
   */
  getCurrentNamespace() {
    const path = this._matcher.path;
    return path.length > 0 ? path[path.length - 1].namespace : undefined;
  }

  /**
   * Get current node's attribute value.
   * @param {string} attrName
   * @returns {*}
   */
  getAttrValue(attrName) {
    const path = this._matcher.path;
    if (path.length === 0) return undefined;
    return path[path.length - 1].values?.[attrName];
  }

  /**
   * Check if current node has an attribute.
   * @param {string} attrName
   * @returns {boolean}
   */
  hasAttr(attrName) {
    const path = this._matcher.path;
    if (path.length === 0) return false;
    const current = path[path.length - 1];
    return current.values !== undefined && attrName in current.values;
  }

  /**
   * Get current node's sibling position (child index in parent).
   * @returns {number}
   */
  getPosition() {
    const path = this._matcher.path;
    if (path.length === 0) return -1;
    return path[path.length - 1].position ?? 0;
  }

  /**
   * Get current node's repeat counter (occurrence count of this tag name).
   * @returns {number}
   */
  getCounter() {
    const path = this._matcher.path;
    if (path.length === 0) return -1;
    return path[path.length - 1].counter ?? 0;
  }

  /**
   * Get current node's sibling index (alias for getPosition).
   * @returns {number}
   * @deprecated Use getPosition() or getCounter() instead
   */
  getIndex() {
    return this.getPosition();
  }

  /**
   * Get current path depth.
   * @returns {number}
   */
  getDepth() {
    return this._matcher.path.length;
  }

  /**
   * Get path as string.
   * @param {string} [separator] - Optional separator (uses default if not provided)
   * @param {boolean} [includeNamespace=true]
   * @returns {string}
   */
  toString(separator, includeNamespace = true) {
    return this._matcher.toString(separator, includeNamespace);
  }

  /**
   * Get path as array of tag names.
   * @returns {string[]}
   */
  toArray() {
    return this._matcher.path.map(n => n.tag);
  }

  /**
   * Match current path against an Expression.
   * @param {Expression} expression
   * @returns {boolean}
   */
  matches(expression) {
    return this._matcher.matches(expression);
  }

  /**
   * Match any expression in the given set against the current path.
   * @param {ExpressionSet} exprSet
   * @returns {boolean}
   */
  matchesAny(exprSet) {
    return exprSet.matchesAny(this._matcher);
  }
}

/**
 * Matcher - Tracks current path in XML/JSON tree and matches against Expressions.
 *
 * The matcher maintains a stack of nodes representing the current path from root to
 * current tag. It only stores attribute values for the current (top) node to minimize
 * memory usage. Sibling tracking is used to auto-calculate position and counter.
 *
 * Use {@link Matcher#readOnly} to obtain a {@link MatcherView} safe to pass to
 * user callbacks — it always reflects current state with no Proxy overhead.
 *
 * @example
 * const matcher = new Matcher();
 * matcher.push("root", {});
 * matcher.push("users", {});
 * matcher.push("user", { id: "123", type: "admin" });
 *
 * const expr = new Expression("root.users.user");
 * matcher.matches(expr); // true
 */
class Matcher {
  /**
   * Create a new Matcher.
   * @param {Object} [options={}]
   * @param {string} [options.separator='.'] - Default path separator
   */
  constructor(options = {}) {
    this.separator = options.separator || '.';
    this.path = [];
    this.siblingStacks = [];
    // Each path node: { tag, values, position, counter, namespace? }
    // values only present for current (last) node
    // Each siblingStacks entry: Map<tagName, count> tracking occurrences at each level
    this._pathStringCache = null;
    this._view = new MatcherView(this);
  }

  /**
   * Push a new tag onto the path.
   * @param {string} tagName
   * @param {Object|null} [attrValues=null]
   * @param {string|null} [namespace=null]
   */
  push(tagName, attrValues = null, namespace = null) {
    this._pathStringCache = null;

    // Remove values from previous current node (now becoming ancestor)
    if (this.path.length > 0) {
      this.path[this.path.length - 1].values = undefined;
    }

    // Get or create sibling tracking for current level
    const currentLevel = this.path.length;
    if (!this.siblingStacks[currentLevel]) {
      this.siblingStacks[currentLevel] = new Map();
    }

    const siblings = this.siblingStacks[currentLevel];

    // Create a unique key for sibling tracking that includes namespace
    const siblingKey = namespace ? `${namespace}:${tagName}` : tagName;

    // Calculate counter (how many times this tag appeared at this level)
    const counter = siblings.get(siblingKey) || 0;

    // Calculate position (total children at this level so far)
    let position = 0;
    for (const count of siblings.values()) {
      position += count;
    }

    // Update sibling count for this tag
    siblings.set(siblingKey, counter + 1);

    // Create new node
    const node = {
      tag: tagName,
      position: position,
      counter: counter,
    };

    if (namespace !== null && namespace !== undefined) {
      node.namespace = namespace;
    }

    if (attrValues !== null && attrValues !== undefined) {
      node.values = attrValues;
    }

    this.path.push(node);
  }

  /**
   * Pop the last tag from the path.
   * @returns {Object|undefined} The popped node
   */
  pop() {
    if (this.path.length === 0) return undefined;
    this._pathStringCache = null;

    const node = this.path.pop();

    if (this.siblingStacks.length > this.path.length + 1) {
      this.siblingStacks.length = this.path.length + 1;
    }

    return node;
  }

  /**
   * Update current node's attribute values.
   * Useful when attributes are parsed after push.
   * @param {Object} attrValues
   */
  updateCurrent(attrValues) {
    if (this.path.length > 0) {
      const current = this.path[this.path.length - 1];
      if (attrValues !== null && attrValues !== undefined) {
        current.values = attrValues;
      }
    }
  }

  /**
   * Get current tag name.
   * @returns {string|undefined}
   */
  getCurrentTag() {
    return this.path.length > 0
      ? this.path[this.path.length - 1].tag
      : undefined;
  }

  /**
   * Get current namespace.
   * @returns {string|undefined}
   */
  getCurrentNamespace() {
    return this.path.length > 0
      ? this.path[this.path.length - 1].namespace
      : undefined;
  }

  /**
   * Get current node's attribute value.
   * @param {string} attrName
   * @returns {*}
   */
  getAttrValue(attrName) {
    if (this.path.length === 0) return undefined;
    return this.path[this.path.length - 1].values?.[attrName];
  }

  /**
   * Check if current node has an attribute.
   * @param {string} attrName
   * @returns {boolean}
   */
  hasAttr(attrName) {
    if (this.path.length === 0) return false;
    const current = this.path[this.path.length - 1];
    return current.values !== undefined && attrName in current.values;
  }

  /**
   * Get current node's sibling position (child index in parent).
   * @returns {number}
   */
  getPosition() {
    if (this.path.length === 0) return -1;
    return this.path[this.path.length - 1].position ?? 0;
  }

  /**
   * Get current node's repeat counter (occurrence count of this tag name).
   * @returns {number}
   */
  getCounter() {
    if (this.path.length === 0) return -1;
    return this.path[this.path.length - 1].counter ?? 0;
  }

  /**
   * Get current node's sibling index (alias for getPosition).
   * @returns {number}
   * @deprecated Use getPosition() or getCounter() instead
   */
  getIndex() {
    return this.getPosition();
  }

  /**
   * Get current path depth.
   * @returns {number}
   */
  getDepth() {
    return this.path.length;
  }

  /**
   * Get path as string.
   * @param {string} [separator] - Optional separator (uses default if not provided)
   * @param {boolean} [includeNamespace=true]
   * @returns {string}
   */
  toString(separator, includeNamespace = true) {
    const sep = separator || this.separator;
    const isDefault = sep === this.separator && includeNamespace === true;

    if (isDefault) {
      if (this._pathStringCache !== null) {
        return this._pathStringCache;
      }
      const result = this.path
        .map(n => (n.namespace ? `${n.namespace}:${n.tag}` : n.tag))
        .join(sep);
      this._pathStringCache = result;
      return result;
    }

    return this.path
      .map(n =>
        includeNamespace && n.namespace ? `${n.namespace}:${n.tag}` : n.tag,
      )
      .join(sep);
  }

  /**
   * Get path as array of tag names.
   * @returns {string[]}
   */
  toArray() {
    return this.path.map(n => n.tag);
  }

  /**
   * Reset the path to empty.
   */
  reset() {
    this._pathStringCache = null;
    this.path = [];
    this.siblingStacks = [];
  }

  /**
   * Match current path against an Expression.
   * @param {Expression} expression
   * @returns {boolean}
   */
  matches(expression) {
    const segments = expression.segments;

    if (segments.length === 0) {
      return false;
    }

    if (expression.hasDeepWildcard()) {
      return this._matchWithDeepWildcard(segments);
    }

    return this._matchSimple(segments);
  }

  /**
   * @private
   */
  _matchSimple(segments) {
    if (this.path.length !== segments.length) {
      return false;
    }

    for (let i = 0; i < segments.length; i++) {
      if (
        !this._matchSegment(
          segments[i],
          this.path[i],
          i === this.path.length - 1,
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * @private
   */
  _matchWithDeepWildcard(segments) {
    let pathIdx = this.path.length - 1;
    let segIdx = segments.length - 1;

    while (segIdx >= 0 && pathIdx >= 0) {
      const segment = segments[segIdx];

      if (segment.type === 'deep-wildcard') {
        segIdx--;

        if (segIdx < 0) {
          return true;
        }

        const nextSeg = segments[segIdx];
        let found = false;

        for (let i = pathIdx; i >= 0; i--) {
          if (
            this._matchSegment(
              nextSeg,
              this.path[i],
              i === this.path.length - 1,
            )
          ) {
            pathIdx = i - 1;
            segIdx--;
            found = true;
            break;
          }
        }

        if (!found) {
          return false;
        }
      } else {
        if (
          !this._matchSegment(
            segment,
            this.path[pathIdx],
            pathIdx === this.path.length - 1,
          )
        ) {
          return false;
        }
        pathIdx--;
        segIdx--;
      }
    }

    return segIdx < 0;
  }

  /**
   * @private
   */
  _matchSegment(segment, node, isCurrentNode) {
    if (segment.tag !== '*' && segment.tag !== node.tag) {
      return false;
    }

    if (segment.namespace !== undefined) {
      if (segment.namespace !== '*' && segment.namespace !== node.namespace) {
        return false;
      }
    }

    if (segment.attrName !== undefined) {
      if (!isCurrentNode) {
        return false;
      }

      if (!node.values || !(segment.attrName in node.values)) {
        return false;
      }

      if (segment.attrValue !== undefined) {
        if (
          String(node.values[segment.attrName]) !== String(segment.attrValue)
        ) {
          return false;
        }
      }
    }

    if (segment.position !== undefined) {
      if (!isCurrentNode) {
        return false;
      }

      const counter = node.counter ?? 0;

      if (segment.position === 'first' && counter !== 0) {
        return false;
      } else if (segment.position === 'odd' && counter % 2 !== 1) {
        return false;
      } else if (segment.position === 'even' && counter % 2 !== 0) {
        return false;
      } else if (
        segment.position === 'nth' &&
        counter !== segment.positionValue
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Match any expression in the given set against the current path.
   * @param {ExpressionSet} exprSet
   * @returns {boolean}
   */
  matchesAny(exprSet) {
    return exprSet.matchesAny(this);
  }

  /**
   * Create a snapshot of current state.
   * @returns {Object}
   */
  snapshot() {
    return {
      path: this.path.map(node => ({ ...node })),
      siblingStacks: this.siblingStacks.map(map => new Map(map)),
    };
  }

  /**
   * Restore state from snapshot.
   * @param {Object} snapshot
   */
  restore(snapshot) {
    this._pathStringCache = null;
    this.path = snapshot.path.map(node => ({ ...node }));
    this.siblingStacks = snapshot.siblingStacks.map(map => new Map(map));
  }

  /**
   * Return the read-only {@link MatcherView} for this matcher.
   *
   * The same instance is returned on every call — no allocation occurs.
   * It always reflects the current parser state and is safe to pass to
   * user callbacks without risk of accidental mutation.
   *
   * @returns {MatcherView}
   *
   * @example
   * const view = matcher.readOnly();
   * // pass view to callbacks — it stays in sync automatically
   * view.matches(expr);       // ✓
   * view.getCurrentTag();     // ✓
   * // view.push(...)         // ✗ method does not exist — caught by TypeScript
   */
  readOnly() {
    return this._view;
  }
}

// ---------------------------------------------------------------------------
// Built-in entity tables
// ---------------------------------------------------------------------------

/**
 * Standard XML entities — always processed after external/system so they
 * cannot be overridden by DOCTYPE, and &amp; is deferred to its own final pass.
 *
 * Each entry: { regex: RegExp, val: string }
 */
const DEFAULT_XML_ENTITIES = {
  apos: { regex: /&(apos|#0*39|#x0*27);/g, val: "'" },
  gt: { regex: /&(gt|#0*62|#x0*3[Ee]);/g, val: '>' },
  lt: { regex: /&(lt|#0*60|#x0*3[Cc]);/g, val: '<' },
  quot: { regex: /&(quot|#0*34|#x0*22);/g, val: '"' },
};

/** &amp; — always expanded last to avoid double-expansion. */
const AMP_ENTITY = { regex: /&(amp|#0*38|#x0*26);/g, val: '&' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SPECIAL_CHARS = new Set('!?\\\\/[]$%{}^&*()<>|+');

/**
 * Validate that an entity name contains no regex-special or otherwise
 * dangerous characters.
 * @param {string} name
 * @returns {string} the name, unchanged
 * @throws {Error} on invalid characters
 */
function validateEntityName(name) {
  for (const ch of name) {
    if (SPECIAL_CHARS.has(ch)) {
      throw new Error(
        `[EntityReplacer] Invalid character '${ch}' in entity name: "${name}"`,
      );
    }
  }
  return name;
}

/**
 * Escape a string for use inside a RegExp character class / alternation.
 */
function escapeForRegex(str) {
  return str.replace(/[.\-+*:]/g, '\\$&');
}

/**
 * Resolve a constructor option to an entity table (plain object) or null.
 */
function resolveTable(option, builtIn, enabledByDefault = false) {
  if (option === false || option === null) return null;
  if (option === true) return builtIn;
  if (option === undefined) return enabledByDefault ? builtIn : null;
  if (typeof option === 'object') return option;
  return null;
}

/**
 * Convert a category name or array of names into a Set<string>.
 */
function resolveApplyLimitsTo(spec) {
  if (spec === 'all') return 'all';
  if (typeof spec === 'string') return new Set([spec]);
  if (Array.isArray(spec)) return new Set(spec);
  return new Set(['external']);
}

/**
 * Build an entries array from a raw map of name → string|{regex,val}.
 * Skips string values that contain '&' (recursive expansion risk).
 * Normalises DocTypeReader's `regx` spelling to `regex`.
 *
 * @param {object} map
 * @returns {Array<[string, {regex: RegExp, val: string}]>}
 */
function buildEntries(map) {
  const entries = [];
  for (const key of Object.keys(map)) {
    const raw = map[key];
    if (typeof raw === 'object' && raw !== null && raw.val !== undefined) {
      // Accept pre-built { regex, val } or DocTypeReader's { regx, val }
      entries.push([key, { regex: raw.regex ?? raw.regx, val: raw.val }]);
    } else if (typeof raw === 'string') {
      if (raw.indexOf('&') !== -1) continue; // skip — would cause recursive expansion
      validateEntityName(key);
      entries.push([
        key,
        {
          regex: new RegExp('&' + escapeForRegex(key) + ';', 'g'),
          val: raw,
        },
      ]);
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// EntityReplacer
// ---------------------------------------------------------------------------

/**
 * Standalone, zero-dependency entity replacer for XML/HTML content.
 *
 * Entity categories:
 *  - **persistent external** — configured once, survive across documents.
 *    Set via `setExternalEntities()` or built up via `addExternalEntity()`.
 *  - **input / runtime** — DOCTYPE entities for the *current* document only.
 *    Injected via `addInputEntities()`. Wiped on every `getInstance()` call
 *    so they never leak between documents.
 *
 * Replacement order (fixed):
 *   1. persistent external
 *   2. input / runtime  (DOCTYPE)
 *   3. system           (named entity groups)
 *   4. default          (lt / gt / apos / quot)
 *   5. amp              (&amp; final pass)
 *
 * @example
 * const replacer = new EntityReplacer({ default: true, system: COMMON_HTML });
 * replacer.setExternalEntities({ brand: 'Acme' });
 *
 * // Builder factory calls getInstance() before each document:
 * const instance = replacer.getInstance();
 * // Builder calls addInputEntities() if DOCTYPE entities are present:
 * instance.addInputEntities({ version: '1.0' });
 * instance.replace('&brand; v&version; &lt;'); // 'Acme v1.0 <'
 */
class EntityReplacer {
  /**
   * @param {object} [options]
   * @param {boolean|object|null} [options.default=true]
   * @param {boolean|object|null} [options.amp=true]
   * @param {boolean|object|null} [options.system=false]
   * @param {number}              [options.maxTotalExpansions=0]
   * @param {number}              [options.maxExpandedLength=0]
   * @param {'external'|'all'|string[]} [options.applyLimitsTo='external']
   * @param {((resolved: string, original: string) => string)|null} [options.postCheck=null]
   */
  constructor(options = {}) {
    // Immutable config resolved at construction
    this._defaultTable = resolveTable(
      options.default,
      DEFAULT_XML_ENTITIES,
      true,
    );
    this._systemTable = resolveTable(options.system, null, false);
    this._ampEnabled = options.amp !== false && options.amp !== null;

    this._maxTotalExpansions = options.maxTotalExpansions || 0;
    this._maxExpandedLength = options.maxExpandedLength || 0;
    this._applyLimitsTo = resolveApplyLimitsTo(
      options.applyLimitsTo ?? 'external',
    );
    this._postCheck =
      typeof options.postCheck === 'function' ? options.postCheck : r => r;

    // Pre-computed category limit flags
    this._limitExternal =
      this._applyLimitsTo === 'all' ||
      (this._applyLimitsTo instanceof Set &&
        this._applyLimitsTo.has('external'));
    this._limitSystem =
      this._applyLimitsTo === 'all' ||
      (this._applyLimitsTo instanceof Set && this._applyLimitsTo.has('system'));
    this._limitDefault =
      this._applyLimitsTo === 'all' ||
      (this._applyLimitsTo instanceof Set &&
        this._applyLimitsTo.has('default'));

    // Frozen immutable entry arrays
    this._defaultEntries = this._defaultTable
      ? Object.entries(this._defaultTable)
      : [];
    this._systemEntries = this._systemTable
      ? Object.entries(this._systemTable)
      : [];

    // Persistent external entities — survive across documents
    /** @type {Array<[string, {regex: RegExp, val: string}]>} */
    this._persistentEntries = [];

    // Input / runtime entities — current document only, reset per getInstance()
    /** @type {Array<[string, {regex: RegExp, val: string}]>} */
    this._inputEntries = [];

    // Per-document counters — reset in getInstance()
    this._totalExpansions = 0;
    this._expandedLength = 0;
  }

  // -------------------------------------------------------------------------
  // Persistent external entity registration (survives across documents)
  // -------------------------------------------------------------------------

  /**
   * Replace the full set of persistent external entities.
   * These are never wiped between documents.
   *
   * @param {Record<string, string | { regex: RegExp, val: string | Function }>} map
   */
  setExternalEntities(map) {
    this._persistentEntries = buildEntries(map);
  }

  /**
   * Add a single persistent external entity without disturbing existing ones.
   *
   * @param {string} key   — bare entity name, e.g. `'copy'`
   * @param {string} value — replacement string, e.g. `'©'`
   */
  addExternalEntity(key, value) {
    validateEntityName(key);
    if (typeof value === 'string' && value.indexOf('&') === -1) {
      this._persistentEntries.push([
        key,
        {
          regex: new RegExp('&' + escapeForRegex(key) + ';', 'g'),
          val: value,
        },
      ]);
    }
  }

  // -------------------------------------------------------------------------
  // Input / runtime entity registration (per document)
  // -------------------------------------------------------------------------

  /**
   * Inject DOCTYPE (input/runtime) entities for the current document.
   * These are stored separately from persistent entities and wiped on the
   * next `getInstance()` call so they never leak into subsequent documents.
   *
   * Also resets per-document expansion counters.
   *
   * @param {Record<string, string | { regx?: RegExp, regex?: RegExp, val: string | Function }>} map
   */
  addInputEntities(map) {
    this._totalExpansions = 0;
    this._expandedLength = 0;
    this._inputEntries = buildEntries(map);
  }

  // -------------------------------------------------------------------------
  // getInstance — builder factory integration point
  // -------------------------------------------------------------------------

  /**
   * Reset all per-document state (input entities + expansion counters) and
   * return `this`.
   *
   * The builder factory calls this each time it creates a new builder instance
   * so DOCTYPE entities from a previous document are never carried over.
   *
   */
  reset() {
    this._inputEntries = [];
    this._totalExpansions = 0;
    this._expandedLength = 0;
  }

  // -------------------------------------------------------------------------
  // Primary API
  // -------------------------------------------------------------------------

  /**
   * Replace all entity references in `str`.
   *
   * Processing order:
   *   1. persistent external
   *   2. input / runtime  (DOCTYPE)
   *   3. system
   *   4. default (lt/gt/apos/quot)
   *   5. amp
   *   6. postCheck hook
   *
   * @param {string} str
   * @returns {string}
   */
  replace(str) {
    if (typeof str !== 'string' || str.length === 0) return str;
    if (str.indexOf('&') === -1) return str; // fast path

    const original = str;

    // 1. Persistent external entities
    if (this._persistentEntries.length > 0) {
      str = this._applyEntries(
        str,
        this._persistentEntries,
        this._limitExternal,
      );
    }

    // 2. Input / runtime entities (DOCTYPE)
    if (this._inputEntries.length > 0 && str.indexOf('&') !== -1) {
      str = this._applyEntries(str, this._inputEntries, this._limitExternal);
    }

    // 3. Default XML entities (lt / gt / apos / quot)
    if (this._defaultEntries.length > 0 && str.indexOf('&') !== -1) {
      str = this._applyEntries(str, this._defaultEntries, this._limitDefault);
    }

    // 4. System (named groups)
    if (this._systemEntries.length > 0 && str.indexOf('&') !== -1) {
      str = this._applyEntries(str, this._systemEntries, this._limitSystem);
    }

    // 5. &amp; — always last
    if (this._ampEnabled && str.indexOf('&') !== -1) {
      str = str.replace(AMP_ENTITY.regex, AMP_ENTITY.val);
    }

    // 6. postCheck
    str = this._postCheck(str, original);

    return str;
  }

  /**
   *
   * @param {string} val
   * @returns
   */
  parse(val) {
    return this.replace(val);
  }
  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  _applyEntries(str, entries, track) {
    const limitExpansions = track && this._maxTotalExpansions > 0;
    const limitLength = track && this._maxExpandedLength > 0;
    const trackAny = limitExpansions || limitLength;

    for (let i = 0; i < entries.length; i++) {
      if (str.indexOf('&') === -1) break;

      const entity = entries[i][1];

      if (!trackAny) {
        str = str.replace(entity.regex, entity.val);
        continue;
      }

      if (limitExpansions && !limitLength) {
        let count = 0;
        str = str.replace(entity.regex, (...args) => {
          count++;
          return typeof entity.val === 'function'
            ? entity.val(...args)
            : entity.val;
        });
        if (count > 0) {
          this._totalExpansions += count;
          if (this._totalExpansions > this._maxTotalExpansions) {
            throw new Error(
              `[EntityReplacer] Entity expansion count limit exceeded: ` +
                `${this._totalExpansions} > ${this._maxTotalExpansions}`,
            );
          }
        }
      } else if (limitLength && !limitExpansions) {
        const before = str.length;
        str = str.replace(entity.regex, entity.val);
        const delta = str.length - before;
        if (delta > 0) {
          this._expandedLength += delta;
          if (this._expandedLength > this._maxExpandedLength) {
            throw new Error(
              `[EntityReplacer] Expanded content length limit exceeded: ` +
                `${this._expandedLength} > ${this._maxExpandedLength}`,
            );
          }
        }
      } else {
        const before = str.length;
        let count = 0;
        str = str.replace(entity.regex, (...args) => {
          count++;
          return typeof entity.val === 'function'
            ? entity.val(...args)
            : entity.val;
        });
        if (count > 0) {
          this._totalExpansions += count;
          if (this._totalExpansions > this._maxTotalExpansions) {
            throw new Error(
              `[EntityReplacer] Entity expansion count limit exceeded: ` +
                `${this._totalExpansions} > ${this._maxTotalExpansions}`,
            );
          }
        }
        const delta = str.length - before;
        if (delta > 0) {
          this._expandedLength += delta;
          if (this._expandedLength > this._maxExpandedLength) {
            throw new Error(
              `[EntityReplacer] Expanded content length limit exceeded: ` +
                `${this._expandedLength} > ${this._maxExpandedLength}`,
            );
          }
        }
      }
    }
    return str;
  }
}

// ---------------------------------------------------------------------------
// Named entity groups — importable separately and freely composable.
// All groups are plain objects; no magic, no classes.
// ---------------------------------------------------------------------------

/**
 * ~20 most commonly needed HTML named entities.
 * @type {Record<string, { regex: RegExp, val: string | ((m: string, s: string) => string) }>}
 */
const COMMON_HTML = {
  nbsp: { regex: /&(nbsp|#0*160|#x0*[Aa]0);/g, val: '\u00a0' },
  copy: { regex: /&(copy|#0*169|#x0*[Aa]9);/g, val: '\u00a9' },
  reg: { regex: /&(reg|#0*174|#x0*[Aa][Ee]);/g, val: '\u00ae' },
  trade: { regex: /&(trade|#0*8482|#x0*2122);/g, val: '\u2122' },
  mdash: { regex: /&(mdash|#0*8212|#x0*2014);/g, val: '\u2014' },
  ndash: { regex: /&(ndash|#0*8211|#x0*2013);/g, val: '\u2013' },
  hellip: { regex: /&(hellip|#0*8230|#x0*2026);/g, val: '\u2026' },
  laquo: { regex: /&(laquo|#0*171|#x0*[Aa][Bb]);/g, val: '\u00ab' },
  raquo: { regex: /&(raquo|#0*187|#x0*[Bb][Bb]);/g, val: '\u00bb' },
  lsquo: { regex: /&(lsquo|#0*8216|#x0*2018);/g, val: '\u2018' },
  rsquo: { regex: /&(rsquo|#0*8217|#x0*2019);/g, val: '\u2019' },
  ldquo: { regex: /&(ldquo|#0*8220|#x0*201[Cc]);/g, val: '\u201c' },
  rdquo: { regex: /&(rdquo|#0*8221|#x0*201[Dd]);/g, val: '\u201d' },
  bull: { regex: /&(bull|#0*8226|#x0*2022);/g, val: '\u2022' },
  para: { regex: /&(para|#0*182|#x0*[Bb]6);/g, val: '\u00b6' },
  sect: { regex: /&(sect|#0*167|#x0*[Aa]7);/g, val: '\u00a7' },
  deg: { regex: /&(deg|#0*176|#x0*[Bb]0);/g, val: '\u00b0' },
  frac12: { regex: /&(frac12|#0*189|#x0*[Bb][Dd]);/g, val: '\u00bd' },
  frac14: { regex: /&(frac14|#0*188|#x0*[Bb][Cc]);/g, val: '\u00bc' },
  frac34: { regex: /&(frac34|#0*190|#x0*[Bb][Ee]);/g, val: '\u00be' },
  inr: { regex: /&(inr|#0*8377);/g, val: '₹' },
};

/**
 * Currency symbol entities.
 */
const CURRENCY_ENTITIES = {
  cent: { regex: /&(cent|#0*162|#x0*[Aa]2);/g, val: '\u00a2' },
  pound: { regex: /&(pound|#0*163|#x0*[Aa]3);/g, val: '\u00a3' },
  yen: { regex: /&(yen|#0*165|#x0*[Aa]5);/g, val: '\u00a5' },
  euro: { regex: /&(euro|#0*8364|#x0*20[Aa][Cc]);/g, val: '\u20ac' },
  inr: { regex: /&(inr|#0*8377|#x0*20[Bb]9);/g, val: '\u20b9' },
  curren: { regex: /&(curren|#0*164|#x0*[Aa]4);/g, val: '\u00a4' },
  fnof: { regex: /&(fnof|#0*402|#x0*192);/g, val: '\u0192' },
};

/**
 * Numeric character references — decimal &#NNN; and hex &#xHH;
 * These are function-replacers; they expand any valid code point.
 */
const NUMERIC_ENTITIES = {
  num_dec: {
    regex: /&#0*([0-9]{1,7});/g,
    val: (_, s) => fromCodePoint(s, 10, '&#'),
  },
  num_hex: {
    regex: /&#x0*([0-9a-fA-F]{1,6});/g,
    val: (_, s) => fromCodePoint(s, 16, '&#x'),
  },
};

function fromCodePoint(str, base, prefix) {
  const codePoint = Number.parseInt(str, base);

  if (codePoint >= 0 && codePoint <= 0x10ffff) {
    return String.fromCodePoint(codePoint);
  } else {
    return prefix + str + ';';
  }
}

// const regx =
//   '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'
//   .replace(/NAME/g, util.nameRegexp);

//const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
//const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");

// Helper functions for attribute and namespace handling

/**
 * Extract raw attributes (without prefix) from prefixed attribute map
 * @param {object} prefixedAttrs - Attributes with prefix from buildAttributesMap
 * @param {object} options - Parser options containing attributeNamePrefix
 * @returns {object} Raw attributes for matcher
 */
function extractRawAttributes(prefixedAttrs, options) {
  if (!prefixedAttrs) return {};

  // Handle attributesGroupName option
  const attrs = options.attributesGroupName
    ? prefixedAttrs[options.attributesGroupName]
    : prefixedAttrs;

  if (!attrs) return {};

  const rawAttrs = {};
  for (const key in attrs) {
    // Remove the attribute prefix to get raw name
    if (key.startsWith(options.attributeNamePrefix)) {
      const rawName = key.substring(options.attributeNamePrefix.length);
      rawAttrs[rawName] = attrs[key];
    } else {
      // Attribute without prefix (shouldn't normally happen, but be safe)
      rawAttrs[key] = attrs[key];
    }
  }
  return rawAttrs;
}

/**
 * Extract namespace from raw tag name
 * @param {string} rawTagName - Tag name possibly with namespace (e.g., "soap:Envelope")
 * @returns {string|undefined} Namespace or undefined
 */
function extractNamespace(rawTagName) {
  if (!rawTagName || typeof rawTagName !== 'string') return undefined;

  const colonIndex = rawTagName.indexOf(':');
  if (colonIndex !== -1 && colonIndex > 0) {
    const ns = rawTagName.substring(0, colonIndex);
    // Don't treat xmlns as a namespace
    if (ns !== 'xmlns') {
      return ns;
    }
  }
  return undefined;
}

class OrderedObjParser {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue$1;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn$1(
      this.options.ignoreAttributes,
    );
    this.entityExpansionCount = 0;
    this.currentExpandedLength = 0;

    this.entityReplacer = new EntityReplacer({
      default: true,
      // amp:     true,
      system: this.options.htmlEntities
        ? { ...COMMON_HTML, ...NUMERIC_ENTITIES, ...CURRENCY_ENTITIES }
        : {},
      maxTotalExpansions: this.options.processEntities.maxTotalExpansions,
      maxExpandedLength: this.options.processEntities.maxExpandedLength,
      applyLimitsTo: 'all',
      //postCheck: resolved => resolved
    });

    // Initialize path matcher for path-expression-matcher
    this.matcher = new Matcher();

    // Live read-only proxy of matcher — PEM creates and caches this internally.
    // All user callbacks receive this instead of the mutable matcher.
    this.readonlyMatcher = this.matcher.readOnly();

    // Flag to track if current node is a stop node (optimization)
    this.isCurrentNodeStopNode = false;

    // Pre-compile stopNodes expressions
    this.stopNodeExpressionsSet = new ExpressionSet();
    const stopNodesOpts = this.options.stopNodes;
    if (stopNodesOpts && stopNodesOpts.length > 0) {
      for (let i = 0; i < stopNodesOpts.length; i++) {
        const stopNodeExp = stopNodesOpts[i];
        if (typeof stopNodeExp === 'string') {
          // Convert string to Expression object
          this.stopNodeExpressionsSet.add(new Expression(stopNodeExp));
        } else if (stopNodeExp instanceof Expression) {
          // Already an Expression object
          this.stopNodeExpressionsSet.add(stopNodeExp);
        }
      }
      this.stopNodeExpressionsSet.seal();
    }
  }
}

/**
 * @param {string} val
 * @param {string} tagName
 * @param {string|Matcher} jPath - jPath string or Matcher instance based on options.jPath
 * @param {boolean} dontTrim
 * @param {boolean} hasAttributes
 * @param {boolean} isLeafNode
 * @param {boolean} escapeEntities
 */
function parseTextData(
  val,
  tagName,
  jPath,
  dontTrim,
  hasAttributes,
  isLeafNode,
  escapeEntities,
) {
  const options = this.options;
  if (val !== undefined) {
    if (options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);

      // Pass jPath string or matcher based on options.jPath setting
      const jPathOrMatcher = options.jPath ? jPath.toString() : jPath;
      const newval = options.tagValueProcessor(
        tagName,
        val,
        jPathOrMatcher,
        hasAttributes,
        isLeafNode,
      );
      if (newval === null || newval === undefined) {
        //don't parse
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        //overwrite
        return newval;
      } else if (options.trimValues) {
        return parseValue(
          val,
          options.parseTagValue,
          options.numberParseOptions,
        );
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(
            val,
            options.parseTagValue,
            options.numberParseOptions,
          );
        } else {
          return val;
        }
      }
    }
  }
}

function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(':');
    const prefix = tagname.charAt(0) === '/' ? '/' : '';
    if (tags[0] === 'xmlns') {
      return '';
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}

//TODO: change regex to capture NS
//const attrsRegx = new RegExp("([\\w\\-\\.\\:]+)\\s*=\\s*(['\"])((.|\n)*?)\\2","gm");
const attrsRegx = new RegExp(
  '([^\\s=]+)\\s*(=\\s*([\'"])([\\s\\S]*?)\\3)?',
  'gm',
);

function buildAttributesMap(attrStr, jPath, tagName) {
  const options = this.options;
  if (options.ignoreAttributes !== true && typeof attrStr === 'string') {
    // attrStr = attrStr.replace(/\r?\n/g, ' ');
    //attrStr = attrStr || attrStr.trim();

    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length; //don't make it inline
    const attrs = {};

    // Pre-process values once: trim + entity replacement
    // Reused in both matcher update and second pass
    const processedVals = new Array(len);
    let hasRawAttrs = false;
    const rawAttrsForMatcher = {};

    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      const oldVal = matches[i][4];

      if (attrName.length && oldVal !== undefined) {
        let val = oldVal;
        if (options.trimValues) val = val.trim();
        val = this.replaceEntitiesValue(val, tagName, this.readonlyMatcher);
        processedVals[i] = val;

        rawAttrsForMatcher[attrName] = val;
        hasRawAttrs = true;
      }
    }

    // Update matcher ONCE before second pass, if applicable
    if (hasRawAttrs && typeof jPath === 'object' && jPath.updateCurrent) {
      jPath.updateCurrent(rawAttrsForMatcher);
    }

    // Hoist toString() once — path doesn't change during attribute processing
    const jPathStr = options.jPath ? jPath.toString() : this.readonlyMatcher;

    // Second pass: apply processors, build final attrs
    let hasAttrs = false;
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);

      if (this.ignoreAttributesFn(attrName, jPathStr)) continue;

      let aName = options.attributeNamePrefix + attrName;

      if (attrName.length) {
        if (options.transformAttributeName) {
          aName = options.transformAttributeName(aName);
        }
        aName = sanitizeName(aName, options);

        if (matches[i][4] !== undefined) {
          // Reuse already-processed value — no double entity replacement
          const oldVal = processedVals[i];

          const newVal = options.attributeValueProcessor(
            attrName,
            oldVal,
            jPathStr,
          );
          if (newVal === null || newVal === undefined) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(
              oldVal,
              options.parseAttributeValue,
              options.numberParseOptions,
            );
          }
          hasAttrs = true;
        } else if (options.allowBooleanAttributes) {
          attrs[aName] = true;
          hasAttrs = true;
        }
      }
    }

    if (!hasAttrs) return;

    if (options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
const parseXml = function (xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, '\n'); //TODO: remove this line
  const xmlObj = new XmlNode('!xml');
  let currentNode = xmlObj;
  let textData = '';

  // Reset matcher for new document
  this.matcher.reset();

  // Reset entity expansion counters for this document
  this.entityExpansionCount = 0;
  this.currentExpandedLength = 0;
  const options = this.options;
  const docTypeReader = new DocTypeReader(options.processEntities);
  const xmlLen = xmlData.length;
  for (let i = 0; i < xmlLen; i++) {
    //for each char in XML data
    const ch = xmlData[i];
    if (ch === '<') {
      // const nextIndex = i+1;
      // const _2ndChar = xmlData[nextIndex];
      const c1 = xmlData.charCodeAt(i + 1);
      if (c1 === 47) {
        //Closing Tag '/'
        const closeIndex = findClosingIndex(
          xmlData,
          '>',
          i,
          'Closing Tag is not closed.',
        );
        let tagName = xmlData.substring(i + 2, closeIndex).trim();

        if (options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(':');
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }

        tagName = transformTagName(
          options.transformTagName,
          tagName,
          '',
          options,
        ).tagName;

        if (currentNode) {
          textData = this.saveTextToParentTag(
            textData,
            currentNode,
            this.readonlyMatcher,
          );
        }

        //check if last tag of nested tag was unpaired tag
        const lastTagName = this.matcher.getCurrentTag();
        if (tagName && options.unpairedTagsSet.has(tagName)) {
          throw new Error(
            `Unpaired tag can not be used as closing tag: </${tagName}>`,
          );
        }
        if (lastTagName && options.unpairedTagsSet.has(lastTagName)) {
          // Pop the unpaired tag
          this.matcher.pop();
          this.tagsNodeStack.pop();
        }
        // Pop the closing tag
        this.matcher.pop();
        this.isCurrentNodeStopNode = false; // Reset flag when closing tag

        currentNode = this.tagsNodeStack.pop(); //avoid recursion, set the parent tag scope
        textData = '';
        i = closeIndex;
      } else if (c1 === 63) {
        //'?'

        let tagData = readTagExp(xmlData, i, false, '?>');
        if (!tagData) throw new Error('Pi Tag is not closed.');

        textData = this.saveTextToParentTag(
          textData,
          currentNode,
          this.readonlyMatcher,
        );
        if (
          (options.ignoreDeclaration && tagData.tagName === '?xml') ||
          options.ignorePiTags
        );
        else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(options.textNodeName, '');

          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[':@'] = this.buildAttributesMap(
              tagData.tagExp,
              this.matcher,
              tagData.tagName,
            );
          }
          this.addChild(currentNode, childNode, this.readonlyMatcher, i);
        }

        i = tagData.closeIndex + 1;
      } else if (
        c1 === 33 &&
        xmlData.charCodeAt(i + 2) === 45 &&
        xmlData.charCodeAt(i + 3) === 45
      ) {
        //'!--'
        const endIndex = findClosingIndex(
          xmlData,
          '-->',
          i + 4,
          'Comment is not closed.',
        );
        if (options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);

          textData = this.saveTextToParentTag(
            textData,
            currentNode,
            this.readonlyMatcher,
          );

          currentNode.add(options.commentPropName, [
            { [options.textNodeName]: comment },
          ]);
        }
        i = endIndex;
      } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 68) {
        //'!D'
        const result = docTypeReader.readDocType(xmlData, i);
        this.entityReplacer.addInputEntities(result.entities);
        i = result.i;
      } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 91) {
        // '!['
        const closeIndex =
          findClosingIndex(xmlData, ']]>', i, 'CDATA is not closed.') - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);

        textData = this.saveTextToParentTag(
          textData,
          currentNode,
          this.readonlyMatcher,
        );

        let val = this.parseTextData(
          tagExp,
          currentNode.tagname,
          this.readonlyMatcher,
          true,
          false,
          true,
          true,
        );
        if (val == undefined) val = '';

        //cdata should be set even if it is 0 length string
        if (options.cdataPropName) {
          currentNode.add(options.cdataPropName, [
            { [options.textNodeName]: tagExp },
          ]);
        } else {
          currentNode.add(options.textNodeName, val);
        }

        i = closeIndex + 2;
      } else {
        //Opening tag
        let result = readTagExp(xmlData, i, options.removeNSPrefix);

        // Safety check: readTagExp can return undefined
        if (!result) {
          // Log context for debugging
          const context = xmlData.substring(
            Math.max(0, i - 50),
            Math.min(xmlLen, i + 50),
          );
          throw new Error(
            `readTagExp returned undefined at position ${i}. Context: "${context}"`,
          );
        }

        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;

        ({ tagName, tagExp } = transformTagName(
          options.transformTagName,
          tagName,
          tagExp,
          options,
        ));

        if (
          options.strictReservedNames &&
          (tagName === options.commentPropName ||
            tagName === options.cdataPropName ||
            tagName === options.textNodeName ||
            tagName === options.attributesGroupName)
        ) {
          throw new Error(`Invalid tag name: ${tagName}`);
        }

        //save text as child node
        if (currentNode && textData) {
          if (currentNode.tagname !== '!xml') {
            //when nested tag is found
            textData = this.saveTextToParentTag(
              textData,
              currentNode,
              this.readonlyMatcher,
              false,
            );
          }
        }

        //check if last tag was unpaired tag
        const lastTag = currentNode;
        if (lastTag && options.unpairedTagsSet.has(lastTag.tagname)) {
          currentNode = this.tagsNodeStack.pop();
          this.matcher.pop();
        }

        // Clean up self-closing syntax BEFORE processing attributes
        // This is where tagExp gets the trailing / removed
        let isSelfClosing = false;
        if (
          tagExp.length > 0 &&
          tagExp.lastIndexOf('/') === tagExp.length - 1
        ) {
          isSelfClosing = true;
          if (tagName[tagName.length - 1] === '/') {
            tagName = tagName.substr(0, tagName.length - 1);
            tagExp = tagName;
          } else {
            tagExp = tagExp.substr(0, tagExp.length - 1);
          }

          // Re-check attrExpPresent after cleaning
          attrExpPresent = tagName !== tagExp;
        }

        // Now process attributes with CLEAN tagExp (no trailing /)
        let prefixedAttrs = null;
        let namespace = undefined;

        // Extract namespace from rawTagName
        namespace = extractNamespace(rawTagName);

        // Push tag to matcher FIRST (with empty attrs for now) so callbacks see correct path
        if (tagName !== xmlObj.tagname) {
          this.matcher.push(tagName, {}, namespace);
        }

        // Now build attributes - callbacks will see correct matcher state
        if (tagName !== tagExp && attrExpPresent) {
          // Build attributes (returns prefixed attributes for the tree)
          // Note: buildAttributesMap now internally updates the matcher with raw attributes
          prefixedAttrs = this.buildAttributesMap(
            tagExp,
            this.matcher,
            tagName,
          );

          if (prefixedAttrs) {
            // Extract raw attributes (without prefix) for our use
            extractRawAttributes(prefixedAttrs, options);
          }
        }

        // Now check if this is a stop node (after attributes are set)
        if (tagName !== xmlObj.tagname) {
          this.isCurrentNodeStopNode = this.isItStopNode();
        }

        const startIndex = i;
        if (this.isCurrentNodeStopNode) {
          let tagContent = '';

          // For self-closing tags, content is empty
          if (isSelfClosing) {
            i = result.closeIndex;
          }
          //unpaired tag
          else if (options.unpairedTagsSet.has(tagName)) {
            i = result.closeIndex;
          }
          //normal tag
          else {
            //read until closing tag is found
            const result = this.readStopNodeData(
              xmlData,
              rawTagName,
              closeIndex + 1,
            );
            if (!result) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result.i;
            tagContent = result.tagContent;
          }

          const childNode = new XmlNode(tagName);

          if (prefixedAttrs) {
            childNode[':@'] = prefixedAttrs;
          }

          // For stop nodes, store raw content as-is without any processing
          childNode.add(options.textNodeName, tagContent);

          this.matcher.pop(); // Pop the stop node tag
          this.isCurrentNodeStopNode = false; // Reset flag

          this.addChild(
            currentNode,
            childNode,
            this.readonlyMatcher,
            startIndex,
          );
        } else {
          //selfClosing tag
          if (isSelfClosing) {
            ({ tagName, tagExp } = transformTagName(
              options.transformTagName,
              tagName,
              tagExp,
              options,
            ));

            const childNode = new XmlNode(tagName);
            if (prefixedAttrs) {
              childNode[':@'] = prefixedAttrs;
            }
            this.addChild(
              currentNode,
              childNode,
              this.readonlyMatcher,
              startIndex,
            );
            this.matcher.pop(); // Pop self-closing tag
            this.isCurrentNodeStopNode = false; // Reset flag
          } else if (options.unpairedTagsSet.has(tagName)) {
            //unpaired tag
            const childNode = new XmlNode(tagName);
            if (prefixedAttrs) {
              childNode[':@'] = prefixedAttrs;
            }
            this.addChild(
              currentNode,
              childNode,
              this.readonlyMatcher,
              startIndex,
            );
            this.matcher.pop(); // Pop unpaired tag
            this.isCurrentNodeStopNode = false; // Reset flag
            i = result.closeIndex;
            // Continue to next iteration without changing currentNode
            continue;
          }
          //opening tag
          else {
            const childNode = new XmlNode(tagName);
            if (this.tagsNodeStack.length > options.maxNestedTags) {
              throw new Error('Maximum nested tags exceeded');
            }
            this.tagsNodeStack.push(currentNode);

            if (prefixedAttrs) {
              childNode[':@'] = prefixedAttrs;
            }
            this.addChild(
              currentNode,
              childNode,
              this.readonlyMatcher,
              startIndex,
            );
            currentNode = childNode;
          }
          textData = '';
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};

function addChild(currentNode, childNode, matcher, startIndex) {
  // unset startIndex if not requested
  if (!this.options.captureMetaData) startIndex = undefined;

  // Pass jPath string or matcher based on options.jPath setting
  const jPathOrMatcher = this.options.jPath ? matcher.toString() : matcher;
  const result = this.options.updateTag(
    childNode.tagname,
    jPathOrMatcher,
    childNode[':@'],
  );
  if (result === false);
  else if (typeof result === 'string') {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}

/**
 * @param {object} val - Entity object with regex and val properties
 * @param {string} tagName - Tag name
 * @param {string|Matcher} jPath - jPath string or Matcher instance based on options.jPath
 */
function replaceEntitiesValue$1(val, tagName, jPath) {
  const entityConfig = this.options.processEntities;

  if (!entityConfig || !entityConfig.enabled) {
    return val;
  }

  // Check if tag is allowed to contain entities
  if (entityConfig.allowedTags) {
    const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
    const allowed = Array.isArray(entityConfig.allowedTags)
      ? entityConfig.allowedTags.includes(tagName)
      : entityConfig.allowedTags(tagName, jPathOrMatcher);

    if (!allowed) {
      return val;
    }
  }

  // Apply custom tag filter if provided
  if (entityConfig.tagFilter) {
    const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
    if (!entityConfig.tagFilter(tagName, jPathOrMatcher)) {
      return val; // Skip based on custom filter
    }
  }

  return this.entityReplacer.replace(val);
}

function saveTextToParentTag(textData, parentNode, matcher, isLeafNode) {
  if (textData) {
    //store previously collected data as textNode
    if (isLeafNode === undefined) isLeafNode = parentNode.child.length === 0;

    textData = this.parseTextData(
      textData,
      parentNode.tagname,
      matcher,
      false,
      parentNode[':@'] ? Object.keys(parentNode[':@']).length !== 0 : false,
      isLeafNode,
    );

    if (textData !== undefined && textData !== '')
      parentNode.add(this.options.textNodeName, textData);
    textData = '';
  }
  return textData;
}

/**
 * @param {Array<Expression>} stopNodeExpressions - Array of compiled Expression objects
 * @param {Matcher} matcher - Current path matcher
 */
function isItStopNode() {
  if (this.stopNodeExpressionsSet.size === 0) return false;

  return this.matcher.matchesAny(this.stopNodeExpressionsSet);
}

/**
 * Returns the tag Expression and where it is ending handling single-double quotes situation
 * @param {string} xmlData
 * @param {number} i starting index
 * @returns
 */
function tagExpWithClosingIndex(xmlData, i, closingChar = '>') {
  let attrBoundary = 0;
  const chars = [];
  const len = xmlData.length;
  const closeCode0 = closingChar.charCodeAt(0);
  const closeCode1 = closingChar.length > 1 ? closingChar.charCodeAt(1) : -1;

  for (let index = i; index < len; index++) {
    const code = xmlData.charCodeAt(index);

    if (attrBoundary) {
      if (code === attrBoundary) attrBoundary = 0;
    } else if (code === 34 || code === 39) {
      // " or '
      attrBoundary = code;
    } else if (code === closeCode0) {
      if (closeCode1 !== -1) {
        if (xmlData.charCodeAt(index + 1) === closeCode1) {
          return { data: String.fromCharCode(...chars), index };
        }
      } else {
        return { data: String.fromCharCode(...chars), index };
      }
    } else if (code === 9) {
      // \t
      chars.push(32); // space
      continue;
    }

    chars.push(code);
  }
}

function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}

function findClosingChar(xmlData, char, i, errMsg) {
  const closingIndex = xmlData.indexOf(char, i);
  if (closingIndex === -1) throw new Error(errMsg);
  return closingIndex; // no offset needed
}

function readTagExp(xmlData, i, removeNSPrefix, closingChar = '>') {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    //separate tag name and attributes expression
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }

  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(':');
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }

  return {
    tagName: tagName,
    tagExp: tagExp,
    closeIndex: closeIndex,
    attrExpPresent: attrExpPresent,
    rawTagName: rawTagName,
  };
}
/**
 * find paired tag for a stop node
 * @param {string} xmlData
 * @param {string} tagName
 * @param {number} i
 */
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  // Starting at 1 since we already have an open tag
  let openTagCount = 1;

  const xmllen = xmlData.length;
  for (; i < xmllen; i++) {
    if (xmlData[i] === '<') {
      const c1 = xmlData.charCodeAt(i + 1);
      if (c1 === 47) {
        //close tag '/'
        const closeIndex = findClosingChar(
          xmlData,
          '>',
          i,
          `${tagName} is not closed`,
        );
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex,
            };
          }
        }
        i = closeIndex;
      } else if (c1 === 63) {
        //?
        const closeIndex = findClosingIndex(
          xmlData,
          '?>',
          i + 1,
          'StopNode is not closed.',
        );
        i = closeIndex;
      } else if (
        c1 === 33 &&
        xmlData.charCodeAt(i + 2) === 45 &&
        xmlData.charCodeAt(i + 3) === 45
      ) {
        // '!--'
        const closeIndex = findClosingIndex(
          xmlData,
          '-->',
          i + 3,
          'StopNode is not closed.',
        );
        i = closeIndex;
      } else if (c1 === 33 && xmlData.charCodeAt(i + 2) === 91) {
        // '!['
        const closeIndex =
          findClosingIndex(xmlData, ']]>', i, 'StopNode is not closed.') - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, '>');

        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (
            openTagName === tagName &&
            tagData.tagExp[tagData.tagExp.length - 1] !== '/'
          ) {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  } //end for loop
}

function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === 'string') {
    //console.log(options)
    const newval = val.trim();
    if (newval === 'true') return true;
    else if (newval === 'false') return false;
    else return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return '';
    }
  }
}

function transformTagName(fn, tagName, tagExp, options) {
  if (fn) {
    const newTagName = fn(tagName);
    if (tagExp === tagName) {
      tagExp = newTagName;
    }
    tagName = newTagName;
  }
  tagName = sanitizeName(tagName, options);
  return { tagName, tagExp };
}

function sanitizeName(name, options) {
  if (criticalProperties.includes(name)) {
    throw new Error(
      `[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`,
    );
  } else if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
    return options.onDangerousProperty(name);
  }
  return name;
}

const METADATA_SYMBOL = XmlNode.getMetaDataSymbol();

/**
 * Helper function to strip attribute prefix from attribute map
 * @param {object} attrs - Attributes with prefix (e.g., {"@_class": "code"})
 * @param {string} prefix - Attribute prefix to remove (e.g., "@_")
 * @returns {object} Attributes without prefix (e.g., {"class": "code"})
 */
function stripAttributePrefix(attrs, prefix) {
  if (!attrs || typeof attrs !== 'object') return {};
  if (!prefix) return attrs;

  const rawAttrs = {};
  for (const key in attrs) {
    if (key.startsWith(prefix)) {
      const rawName = key.substring(prefix.length);
      rawAttrs[rawName] = attrs[key];
    } else {
      // Attribute without prefix (shouldn't normally happen, but be safe)
      rawAttrs[key] = attrs[key];
    }
  }
  return rawAttrs;
}

/**
 *
 * @param {array} node
 * @param {any} options
 * @param {Matcher} matcher - Path matcher instance
 * @returns
 */
function prettify(node, options, matcher, readonlyMatcher) {
  return compress(node, options, matcher, readonlyMatcher);
}

/**
 * @param {array} arr
 * @param {object} options
 * @param {Matcher} matcher - Path matcher instance
 * @returns object
 */
function compress(arr, options, matcher, readonlyMatcher) {
  let text;
  const compressedObj = {}; //This is intended to be a plain object
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName$1(tagObj);

    // Push current property to matcher WITH RAW ATTRIBUTES (no prefix)
    if (property !== undefined && property !== options.textNodeName) {
      const rawAttrs = stripAttributePrefix(
        tagObj[':@'] || {},
        options.attributeNamePrefix,
      );
      matcher.push(property, rawAttrs);
    }

    if (property === options.textNodeName) {
      if (text === undefined) text = tagObj[property];
      else text += '' + tagObj[property];
    } else if (property === undefined) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, matcher, readonlyMatcher);
      const isLeaf = isLeafTag(val, options);

      if (tagObj[':@']) {
        assignAttributes(val, tagObj[':@'], readonlyMatcher, options);
      } else if (
        Object.keys(val).length === 1 &&
        val[options.textNodeName] !== undefined &&
        !options.alwaysCreateTextNode
      ) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode) val[options.textNodeName] = '';
        else val = '';
      }

      if (
        tagObj[METADATA_SYMBOL] !== undefined &&
        typeof val === 'object' &&
        val !== null
      ) {
        val[METADATA_SYMBOL] = tagObj[METADATA_SYMBOL]; // copy over metadata
      }

      if (
        compressedObj[property] !== undefined &&
        Object.prototype.hasOwnProperty.call(compressedObj, property)
      ) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        //TODO: if a node is not an array, then check if it should be an array
        //also determine if it is a leaf node

        // Pass jPath string or readonlyMatcher based on options.jPath setting
        const jPathOrMatcher = options.jPath
          ? readonlyMatcher.toString()
          : readonlyMatcher;
        if (options.isArray(property, jPathOrMatcher, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }

      // Pop property from matcher after processing
      if (property !== undefined && property !== options.textNodeName) {
        matcher.pop();
      }
    }
  }
  // if(text && text.length > 0) compressedObj[options.textNodeName] = text;
  if (typeof text === 'string') {
    if (text.length > 0) compressedObj[options.textNodeName] = text;
  } else if (text !== undefined) compressedObj[options.textNodeName] = text;

  return compressedObj;
}

function propName$1(obj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== ':@') return key;
  }
}

function assignAttributes(obj, attrMap, readonlyMatcher, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length; //don't make it inline
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i]; // This is the PREFIXED name (e.g., "@_class")

      // Strip prefix for matcher path (for isArray callback)
      const rawAttrName = atrrName.startsWith(options.attributeNamePrefix)
        ? atrrName.substring(options.attributeNamePrefix.length)
        : atrrName;

      // For attributes, we need to create a temporary path
      // Pass jPath string or matcher based on options.jPath setting
      const jPathOrMatcher = options.jPath
        ? readonlyMatcher.toString() + '.' + rawAttrName
        : readonlyMatcher;

      if (options.isArray(atrrName, jPathOrMatcher, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}

function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;

  if (propCount === 0) {
    return true;
  }

  if (
    propCount === 1 &&
    (obj[textNodeName] ||
      typeof obj[textNodeName] === 'boolean' ||
      obj[textNodeName] === 0)
  ) {
    return true;
  }

  return false;
}

class XMLParser {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  /**
   * Parse XML dats to JS object
   * @param {string|Uint8Array} xmlData
   * @param {boolean|Object} validationOption
   */
  parse(xmlData, validationOption) {
    if (typeof xmlData !== 'string' && xmlData.toString) {
      xmlData = xmlData.toString();
    } else if (typeof xmlData !== 'string') {
      throw new Error('XML data is accepted in String or Bytes[] form.');
    }

    if (validationOption) {
      if (validationOption === true) validationOption = {}; //validate with default options

      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.entityReplacer.setExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === undefined)
      return orderedResult;
    else
      return prettify(
        orderedResult,
        this.options,
        orderedObjParser.matcher,
        orderedObjParser.readonlyMatcher,
      );
  }

  /**
   * Add Entity which is not by default supported by this library
   * @param {string} key
   * @param {string} value
   */
  addEntity(key, value) {
    if (value.indexOf('&') !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf('&') !== -1 || key.indexOf(';') !== -1) {
      throw new Error(
        "An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'",
      );
    } else if (value === '&') {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }

  /**
   * Returns a Symbol that can be used to access the metadata
   * property on a node.
   *
   * If Symbol is not available in the environment, an ordinary property is used
   * and the name of the property is here returned.
   *
   * The XMLMetaData property is only present when `captureMetaData`
   * is true in the options.
   */
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
}

const EOL = '\n';

/**
 *
 * @param {array} jArray
 * @param {any} options
 * @returns
 */
function toXml(jArray, options) {
  let indentation = '';
  if (options.format && options.indentBy.length > 0) {
    indentation = EOL;
  }

  // Pre-compile stopNode expressions for pattern matching
  const stopNodeExpressions = [];
  if (options.stopNodes && Array.isArray(options.stopNodes)) {
    for (let i = 0; i < options.stopNodes.length; i++) {
      const node = options.stopNodes[i];
      if (typeof node === 'string') {
        stopNodeExpressions.push(new Expression(node));
      } else if (node instanceof Expression) {
        stopNodeExpressions.push(node);
      }
    }
  }

  // Initialize matcher for path tracking
  const matcher = new Matcher();

  return arrToStr(jArray, options, indentation, matcher, stopNodeExpressions);
}

function arrToStr(arr, options, indentation, matcher, stopNodeExpressions) {
  let xmlStr = '';
  let isPreviousElementTag = false;

  if (options.maxNestedTags && matcher.getDepth() > options.maxNestedTags) {
    throw new Error('Maximum nested tags exceeded');
  }

  if (!Array.isArray(arr)) {
    // Non-array values (e.g. string tag values) should be treated as text content
    if (arr !== undefined && arr !== null) {
      let text = arr.toString();
      text = replaceEntitiesValue(text, options);
      return text;
    }
    return '';
  }

  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const tagName = propName(tagObj);
    if (tagName === undefined) continue;

    // Extract attributes from ":@" property
    const attrValues = extractAttributeValues(tagObj[':@'], options);

    // Push tag to matcher WITH attributes
    matcher.push(tagName, attrValues);

    // Check if this is a stop node using Expression matching
    const isStopNode = checkStopNode(matcher, stopNodeExpressions);

    if (tagName === options.textNodeName) {
      let tagText = tagObj[tagName];
      if (!isStopNode) {
        tagText = options.tagValueProcessor(tagName, tagText);
        tagText = replaceEntitiesValue(tagText, options);
      }
      if (isPreviousElementTag) {
        xmlStr += indentation;
      }
      xmlStr += tagText;
      isPreviousElementTag = false;
      matcher.pop();
      continue;
    } else if (tagName === options.cdataPropName) {
      if (isPreviousElementTag) {
        xmlStr += indentation;
      }
      xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
      isPreviousElementTag = false;
      matcher.pop();
      continue;
    } else if (tagName === options.commentPropName) {
      xmlStr +=
        indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
      isPreviousElementTag = true;
      matcher.pop();
      continue;
    } else if (tagName[0] === '?') {
      const attStr = attr_to_str(tagObj[':@'], options, isStopNode);
      const tempInd = tagName === '?xml' ? '' : indentation;
      let piTextNodeName = tagObj[tagName][0][options.textNodeName];
      piTextNodeName = piTextNodeName.length !== 0 ? ' ' + piTextNodeName : ''; //remove extra spacing
      xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr}?>`;
      isPreviousElementTag = true;
      matcher.pop();
      continue;
    }

    let newIdentation = indentation;
    if (newIdentation !== '') {
      newIdentation += options.indentBy;
    }

    // Pass isStopNode to attr_to_str so attributes are also not processed for stopNodes
    const attStr = attr_to_str(tagObj[':@'], options, isStopNode);
    const tagStart = indentation + `<${tagName}${attStr}`;

    // If this is a stopNode, get raw content without processing
    let tagValue;
    if (isStopNode) {
      tagValue = getRawContent(tagObj[tagName], options);
    } else {
      tagValue = arrToStr(
        tagObj[tagName],
        options,
        newIdentation,
        matcher,
        stopNodeExpressions,
      );
    }

    if (options.unpairedTags.indexOf(tagName) !== -1) {
      if (options.suppressUnpairedNode) xmlStr += tagStart + '>';
      else xmlStr += tagStart + '/>';
    } else if (
      (!tagValue || tagValue.length === 0) &&
      options.suppressEmptyNode
    ) {
      xmlStr += tagStart + '/>';
    } else if (tagValue && tagValue.endsWith('>')) {
      xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
    } else {
      xmlStr += tagStart + '>';
      if (
        tagValue &&
        indentation !== '' &&
        (tagValue.includes('/>') || tagValue.includes('</'))
      ) {
        xmlStr += indentation + options.indentBy + tagValue + indentation;
      } else {
        xmlStr += tagValue;
      }
      xmlStr += `</${tagName}>`;
    }
    isPreviousElementTag = true;

    // Pop tag from matcher
    matcher.pop();
  }

  return xmlStr;
}

/**
 * Extract attribute values from the ":@" object and return as plain object
 * for passing to matcher.push()
 */
function extractAttributeValues(attrMap, options) {
  if (!attrMap || options.ignoreAttributes) return null;

  const attrValues = {};
  let hasAttrs = false;

  for (let attr in attrMap) {
    if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
    // Remove the attribute prefix to get clean attribute name
    const cleanAttrName = attr.startsWith(options.attributeNamePrefix)
      ? attr.substr(options.attributeNamePrefix.length)
      : attr;
    attrValues[cleanAttrName] = attrMap[attr];
    hasAttrs = true;
  }

  return hasAttrs ? attrValues : null;
}

/**
 * Extract raw content from a stopNode without any processing
 * This preserves the content exactly as-is, including special characters
 */
function getRawContent(arr, options) {
  if (!Array.isArray(arr)) {
    // Non-array values return as-is
    if (arr !== undefined && arr !== null) {
      return arr.toString();
    }
    return '';
  }

  let content = '';
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const tagName = propName(item);

    if (tagName === options.textNodeName) {
      // Raw text content - NO processing, NO entity replacement
      content += item[tagName];
    } else if (tagName === options.cdataPropName) {
      // CDATA content
      content += item[tagName][0][options.textNodeName];
    } else if (tagName === options.commentPropName) {
      // Comment content
      content += item[tagName][0][options.textNodeName];
    } else if (tagName && tagName[0] === '?') {
      // Processing instruction - skip for stopNodes
      continue;
    } else if (tagName) {
      // Nested tags within stopNode
      // Recursively get raw content and reconstruct the tag
      // For stopNodes, we don't process attributes either
      const attStr = attr_to_str_raw(item[':@'], options);
      const nestedContent = getRawContent(item[tagName], options);

      if (!nestedContent || nestedContent.length === 0) {
        content += `<${tagName}${attStr}/>`;
      } else {
        content += `<${tagName}${attStr}>${nestedContent}</${tagName}>`;
      }
    }
  }
  return content;
}

/**
 * Build attribute string for stopNodes - NO entity replacement
 */
function attr_to_str_raw(attrMap, options) {
  let attrStr = '';
  if (attrMap && !options.ignoreAttributes) {
    for (let attr in attrMap) {
      if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
      // For stopNodes, use raw value without processing
      let attrVal = attrMap[attr];
      if (attrVal === true && options.suppressBooleanAttributes) {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
      } else {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
      }
    }
  }
  return attrStr;
}

function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (key !== ':@') return key;
  }
}

function attr_to_str(attrMap, options, isStopNode) {
  let attrStr = '';
  if (attrMap && !options.ignoreAttributes) {
    for (let attr in attrMap) {
      if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
      let attrVal;

      if (isStopNode) {
        // For stopNodes, use raw value without any processing
        attrVal = attrMap[attr];
      } else {
        // Normal processing: apply attributeValueProcessor and entity replacement
        attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
        attrVal = replaceEntitiesValue(attrVal, options);
      }

      if (attrVal === true && options.suppressBooleanAttributes) {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
      } else {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
      }
    }
  }
  return attrStr;
}

function checkStopNode(matcher, stopNodeExpressions) {
  if (!stopNodeExpressions || stopNodeExpressions.length === 0) return false;

  for (let i = 0; i < stopNodeExpressions.length; i++) {
    if (matcher.matches(stopNodeExpressions[i])) {
      return true;
    }
  }
  return false;
}

function replaceEntitiesValue(textValue, options) {
  if (textValue && textValue.length > 0 && options.processEntities) {
    for (let i = 0; i < options.entities.length; i++) {
      const entity = options.entities[i];
      textValue = textValue.replace(entity.regex, entity.val);
    }
  }
  return textValue;
}

function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === 'function') {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return attrName => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === 'string' && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

const defaultOptions = {
  attributeNamePrefix: '@_',
  attributesGroupName: false,
  textNodeName: '#text',
  ignoreAttributes: true,
  cdataPropName: false,
  format: false,
  indentBy: '  ',
  suppressEmptyNode: false,
  suppressUnpairedNode: true,
  suppressBooleanAttributes: true,
  tagValueProcessor: function (key, a) {
    return a;
  },
  attributeValueProcessor: function (attrName, a) {
    return a;
  },
  preserveOrder: false,
  commentPropName: false,
  unpairedTags: [],
  entities: [
    { regex: new RegExp('&', 'g'), val: '&amp;' }, //it must be on top
    { regex: new RegExp('>', 'g'), val: '&gt;' },
    { regex: new RegExp('<', 'g'), val: '&lt;' },
    { regex: new RegExp("\'", 'g'), val: '&apos;' },
    { regex: new RegExp('"', 'g'), val: '&quot;' },
  ],
  processEntities: true,
  stopNodes: [],
  // transformTagName: false,
  // transformAttributeName: false,
  oneListGroup: false,
  maxNestedTags: 100,
  jPath: true, // When true, callbacks receive string jPath; when false, receive Matcher instance
};

function Builder(options) {
  this.options = Object.assign({}, defaultOptions, options);

  // Convert old-style stopNodes for backward compatibility
  // Old syntax: "*.tag" meant "tag anywhere in tree"
  // New syntax: "..tag" means "tag anywhere in tree"
  if (this.options.stopNodes && Array.isArray(this.options.stopNodes)) {
    this.options.stopNodes = this.options.stopNodes.map(node => {
      if (typeof node === 'string' && node.startsWith('*.')) {
        // Convert old wildcard syntax to deep wildcard
        return '..' + node.substring(2);
      }
      return node;
    });
  }

  // Pre-compile stopNode expressions for pattern matching
  this.stopNodeExpressions = [];
  if (this.options.stopNodes && Array.isArray(this.options.stopNodes)) {
    for (let i = 0; i < this.options.stopNodes.length; i++) {
      const node = this.options.stopNodes[i];
      if (typeof node === 'string') {
        this.stopNodeExpressions.push(new Expression(node));
      } else if (node instanceof Expression) {
        this.stopNodeExpressions.push(node);
      }
    }
  }

  if (
    this.options.ignoreAttributes === true ||
    this.options.attributesGroupName
  ) {
    this.isAttribute = function (/*a*/) {
      return false;
    };
  } else {
    this.ignoreAttributesFn = getIgnoreAttributesFn(
      this.options.ignoreAttributes,
    );
    this.attrPrefixLen = this.options.attributeNamePrefix.length;
    this.isAttribute = isAttribute;
  }

  this.processTextOrObjNode = processTextOrObjNode;

  if (this.options.format) {
    this.indentate = indentate;
    this.tagEndChar = '>\n';
    this.newLine = '\n';
  } else {
    this.indentate = function () {
      return '';
    };
    this.tagEndChar = '>';
    this.newLine = '';
  }
}

Builder.prototype.build = function (jObj) {
  if (this.options.preserveOrder) {
    return toXml(jObj, this.options);
  } else {
    if (
      Array.isArray(jObj) &&
      this.options.arrayNodeName &&
      this.options.arrayNodeName.length > 1
    ) {
      jObj = {
        [this.options.arrayNodeName]: jObj,
      };
    }
    // Initialize matcher for path tracking
    const matcher = new Matcher();
    return this.j2x(jObj, 0, matcher).val;
  }
};

Builder.prototype.j2x = function (jObj, level, matcher) {
  let attrStr = '';
  let val = '';
  if (
    this.options.maxNestedTags &&
    matcher.getDepth() >= this.options.maxNestedTags
  ) {
    throw new Error('Maximum nested tags exceeded');
  }
  // Get jPath based on option: string for backward compatibility, or Matcher for new features
  const jPath = this.options.jPath ? matcher.toString() : matcher;

  // Check if current node is a stopNode (will be used for attribute encoding)
  const isCurrentStopNode = this.checkStopNode(matcher);

  for (let key in jObj) {
    if (!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
    if (typeof jObj[key] === 'undefined') {
      // supress undefined node only if it is not an attribute
      if (this.isAttribute(key)) {
        val += '';
      }
    } else if (jObj[key] === null) {
      // null attribute should be ignored by the attribute list, but should not cause the tag closing
      if (this.isAttribute(key)) {
        val += '';
      } else if (key === this.options.cdataPropName) {
        val += '';
      } else if (key[0] === '?') {
        val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
      } else {
        val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
      }
      // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
    } else if (jObj[key] instanceof Date) {
      val += this.buildTextValNode(jObj[key], key, '', level, matcher);
    } else if (typeof jObj[key] !== 'object') {
      //premitive type
      const attr = this.isAttribute(key);
      if (attr && !this.ignoreAttributesFn(attr, jPath)) {
        attrStr += this.buildAttrPairStr(
          attr,
          '' + jObj[key],
          isCurrentStopNode,
        );
      } else if (!attr) {
        //tag value
        if (key === this.options.textNodeName) {
          let newval = this.options.tagValueProcessor(key, '' + jObj[key]);
          val += this.replaceEntitiesValue(newval);
        } else {
          // Check if this is a stopNode before building
          matcher.push(key);
          const isStopNode = this.checkStopNode(matcher);
          matcher.pop();

          if (isStopNode) {
            // Build as raw content without encoding
            const textValue = '' + jObj[key];
            if (textValue === '') {
              val +=
                this.indentate(level) +
                '<' +
                key +
                this.closeTag(key) +
                this.tagEndChar;
            } else {
              val +=
                this.indentate(level) +
                '<' +
                key +
                '>' +
                textValue +
                '</' +
                key +
                this.tagEndChar;
            }
          } else {
            val += this.buildTextValNode(jObj[key], key, '', level, matcher);
          }
        }
      }
    } else if (Array.isArray(jObj[key])) {
      //repeated nodes
      const arrLen = jObj[key].length;
      let listTagVal = '';
      let listTagAttr = '';
      for (let j = 0; j < arrLen; j++) {
        const item = jObj[key][j];
        if (typeof item === 'undefined');
        else if (item === null) {
          if (key[0] === '?')
            val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
          else val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
          // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
        } else if (typeof item === 'object') {
          if (this.options.oneListGroup) {
            // Push tag to matcher before recursive call
            matcher.push(key);
            const result = this.j2x(item, level + 1, matcher);
            // Pop tag from matcher after recursive call
            matcher.pop();

            listTagVal += result.val;
            if (
              this.options.attributesGroupName &&
              item.hasOwnProperty(this.options.attributesGroupName)
            ) {
              listTagAttr += result.attrStr;
            }
          } else {
            listTagVal += this.processTextOrObjNode(item, key, level, matcher);
          }
        } else {
          if (this.options.oneListGroup) {
            let textValue = this.options.tagValueProcessor(key, item);
            textValue = this.replaceEntitiesValue(textValue);
            listTagVal += textValue;
          } else {
            // Check if this is a stopNode before building
            matcher.push(key);
            const isStopNode = this.checkStopNode(matcher);
            matcher.pop();

            if (isStopNode) {
              // Build as raw content without encoding
              const textValue = '' + item;
              if (textValue === '') {
                listTagVal +=
                  this.indentate(level) +
                  '<' +
                  key +
                  this.closeTag(key) +
                  this.tagEndChar;
              } else {
                listTagVal +=
                  this.indentate(level) +
                  '<' +
                  key +
                  '>' +
                  textValue +
                  '</' +
                  key +
                  this.tagEndChar;
              }
            } else {
              listTagVal += this.buildTextValNode(
                item,
                key,
                '',
                level,
                matcher,
              );
            }
          }
        }
      }
      if (this.options.oneListGroup) {
        listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
      }
      val += listTagVal;
    } else {
      //nested node
      if (
        this.options.attributesGroupName &&
        key === this.options.attributesGroupName
      ) {
        const Ks = Object.keys(jObj[key]);
        const L = Ks.length;
        for (let j = 0; j < L; j++) {
          attrStr += this.buildAttrPairStr(
            Ks[j],
            '' + jObj[key][Ks[j]],
            isCurrentStopNode,
          );
        }
      } else {
        val += this.processTextOrObjNode(jObj[key], key, level, matcher);
      }
    }
  }
  return { attrStr: attrStr, val: val };
};

Builder.prototype.buildAttrPairStr = function (attrName, val, isStopNode) {
  if (!isStopNode) {
    val = this.options.attributeValueProcessor(attrName, '' + val);
    val = this.replaceEntitiesValue(val);
  }
  if (this.options.suppressBooleanAttributes && val === 'true') {
    return ' ' + attrName;
  } else return ' ' + attrName + '="' + val + '"';
};

function processTextOrObjNode(object, key, level, matcher) {
  // Extract attributes to pass to matcher
  const attrValues = this.extractAttributes(object);

  // Push tag to matcher before recursion WITH attributes
  matcher.push(key, attrValues);

  // Check if this entire node is a stopNode
  const isStopNode = this.checkStopNode(matcher);

  if (isStopNode) {
    // For stopNodes, build raw content without entity encoding
    const rawContent = this.buildRawContent(object);
    const attrStr = this.buildAttributesForStopNode(object);
    matcher.pop();
    return this.buildObjectNode(rawContent, key, attrStr, level);
  }

  const result = this.j2x(object, level + 1, matcher);
  // Pop tag from matcher after recursion
  matcher.pop();

  if (
    object[this.options.textNodeName] !== undefined &&
    Object.keys(object).length === 1
  ) {
    return this.buildTextValNode(
      object[this.options.textNodeName],
      key,
      result.attrStr,
      level,
      matcher,
    );
  } else {
    return this.buildObjectNode(result.val, key, result.attrStr, level);
  }
}

// Helper method to extract attributes from an object
Builder.prototype.extractAttributes = function (obj) {
  if (!obj || typeof obj !== 'object') return null;

  const attrValues = {};
  let hasAttrs = false;

  // Check for attributesGroupName (when attributes are grouped)
  if (
    this.options.attributesGroupName &&
    obj[this.options.attributesGroupName]
  ) {
    const attrGroup = obj[this.options.attributesGroupName];
    for (let attrKey in attrGroup) {
      if (!Object.prototype.hasOwnProperty.call(attrGroup, attrKey)) continue;
      // Remove attribute prefix if present
      const cleanKey = attrKey.startsWith(this.options.attributeNamePrefix)
        ? attrKey.substring(this.options.attributeNamePrefix.length)
        : attrKey;
      attrValues[cleanKey] = attrGroup[attrKey];
      hasAttrs = true;
    }
  } else {
    // Look for individual attributes (prefixed with attributeNamePrefix)
    for (let key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const attr = this.isAttribute(key);
      if (attr) {
        attrValues[attr] = obj[key];
        hasAttrs = true;
      }
    }
  }

  return hasAttrs ? attrValues : null;
};

// Build raw content for stopNode without entity encoding
Builder.prototype.buildRawContent = function (obj) {
  if (typeof obj === 'string') {
    return obj; // Already a string, return as-is
  }

  if (typeof obj !== 'object' || obj === null) {
    return String(obj);
  }

  // Check if this is a stopNode data from parser: { "#text": "raw xml", "@_attr": "val" }
  if (obj[this.options.textNodeName] !== undefined) {
    return obj[this.options.textNodeName]; // Return raw text without encoding
  }

  // Build raw XML from nested structure
  let content = '';

  for (let key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    // Skip attributes
    if (this.isAttribute(key)) continue;
    if (
      this.options.attributesGroupName &&
      key === this.options.attributesGroupName
    )
      continue;

    const value = obj[key];

    if (key === this.options.textNodeName) {
      content += value; // Raw text
    } else if (Array.isArray(value)) {
      // Array of same tag
      for (let item of value) {
        if (typeof item === 'string' || typeof item === 'number') {
          content += `<${key}>${item}</${key}>`;
        } else if (typeof item === 'object' && item !== null) {
          const nestedContent = this.buildRawContent(item);
          const nestedAttrs = this.buildAttributesForStopNode(item);
          if (nestedContent === '') {
            content += `<${key}${nestedAttrs}/>`;
          } else {
            content += `<${key}${nestedAttrs}>${nestedContent}</${key}>`;
          }
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Nested object
      const nestedContent = this.buildRawContent(value);
      const nestedAttrs = this.buildAttributesForStopNode(value);
      if (nestedContent === '') {
        content += `<${key}${nestedAttrs}/>`;
      } else {
        content += `<${key}${nestedAttrs}>${nestedContent}</${key}>`;
      }
    } else {
      // Primitive value
      content += `<${key}>${value}</${key}>`;
    }
  }

  return content;
};

// Build attribute string for stopNode (no entity encoding)
Builder.prototype.buildAttributesForStopNode = function (obj) {
  if (!obj || typeof obj !== 'object') return '';

  let attrStr = '';

  // Check for attributesGroupName (when attributes are grouped)
  if (
    this.options.attributesGroupName &&
    obj[this.options.attributesGroupName]
  ) {
    const attrGroup = obj[this.options.attributesGroupName];
    for (let attrKey in attrGroup) {
      if (!Object.prototype.hasOwnProperty.call(attrGroup, attrKey)) continue;
      const cleanKey = attrKey.startsWith(this.options.attributeNamePrefix)
        ? attrKey.substring(this.options.attributeNamePrefix.length)
        : attrKey;
      const val = attrGroup[attrKey];
      if (val === true && this.options.suppressBooleanAttributes) {
        attrStr += ' ' + cleanKey;
      } else {
        attrStr += ' ' + cleanKey + '="' + val + '"'; // No encoding for stopNode
      }
    }
  } else {
    // Look for individual attributes
    for (let key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const attr = this.isAttribute(key);
      if (attr) {
        const val = obj[key];
        if (val === true && this.options.suppressBooleanAttributes) {
          attrStr += ' ' + attr;
        } else {
          attrStr += ' ' + attr + '="' + val + '"'; // No encoding for stopNode
        }
      }
    }
  }

  return attrStr;
};

Builder.prototype.buildObjectNode = function (val, key, attrStr, level) {
  if (val === '') {
    if (key[0] === '?')
      return (
        this.indentate(level) + '<' + key + attrStr + '?' + this.tagEndChar
      );
    else {
      return (
        this.indentate(level) +
        '<' +
        key +
        attrStr +
        this.closeTag(key) +
        this.tagEndChar
      );
    }
  } else {
    let tagEndExp = '</' + key + this.tagEndChar;
    let piClosingChar = '';

    if (key[0] === '?') {
      piClosingChar = '?';
      tagEndExp = '';
    }

    // attrStr is an empty string in case the attribute came as undefined or null
    if ((attrStr || attrStr === '') && val.indexOf('<') === -1) {
      return (
        this.indentate(level) +
        '<' +
        key +
        attrStr +
        piClosingChar +
        '>' +
        val +
        tagEndExp
      );
    } else if (
      this.options.commentPropName !== false &&
      key === this.options.commentPropName &&
      piClosingChar.length === 0
    ) {
      return this.indentate(level) + `<!--${val}-->` + this.newLine;
    } else {
      return (
        this.indentate(level) +
        '<' +
        key +
        attrStr +
        piClosingChar +
        this.tagEndChar +
        val +
        this.indentate(level) +
        tagEndExp
      );
    }
  }
};

Builder.prototype.closeTag = function (key) {
  let closeTag = '';
  if (this.options.unpairedTags.indexOf(key) !== -1) {
    //unpaired
    if (!this.options.suppressUnpairedNode) closeTag = '/';
  } else if (this.options.suppressEmptyNode) {
    //empty
    closeTag = '/';
  } else {
    closeTag = `></${key}`;
  }
  return closeTag;
};

Builder.prototype.checkStopNode = function (matcher) {
  if (!this.stopNodeExpressions || this.stopNodeExpressions.length === 0)
    return false;

  for (let i = 0; i < this.stopNodeExpressions.length; i++) {
    if (matcher.matches(this.stopNodeExpressions[i])) {
      return true;
    }
  }
  return false;
};

Builder.prototype.buildTextValNode = function (
  val,
  key,
  attrStr,
  level,
  matcher,
) {
  if (
    this.options.cdataPropName !== false &&
    key === this.options.cdataPropName
  ) {
    return this.indentate(level) + `<![CDATA[${val}]]>` + this.newLine;
  } else if (
    this.options.commentPropName !== false &&
    key === this.options.commentPropName
  ) {
    return this.indentate(level) + `<!--${val}-->` + this.newLine;
  } else if (key[0] === '?') {
    //PI tag
    return this.indentate(level) + '<' + key + attrStr + '?' + this.tagEndChar;
  } else {
    // Normal processing: apply tagValueProcessor and entity replacement
    let textValue = this.options.tagValueProcessor(key, val);
    textValue = this.replaceEntitiesValue(textValue);

    if (textValue === '') {
      return (
        this.indentate(level) +
        '<' +
        key +
        attrStr +
        this.closeTag(key) +
        this.tagEndChar
      );
    } else {
      return (
        this.indentate(level) +
        '<' +
        key +
        attrStr +
        '>' +
        textValue +
        '</' +
        key +
        this.tagEndChar
      );
    }
  }
};

Builder.prototype.replaceEntitiesValue = function (textValue) {
  if (textValue && textValue.length > 0 && this.options.processEntities) {
    for (let i = 0; i < this.options.entities.length; i++) {
      const entity = this.options.entities[i];
      textValue = textValue.replace(entity.regex, entity.val);
    }
  }
  return textValue;
};

function indentate(level) {
  return this.options.indentBy.repeat(level);
}

function isAttribute(name /*, options*/) {
  if (
    name.startsWith(this.options.attributeNamePrefix) &&
    name !== this.options.textNodeName
  ) {
    return name.substr(this.attrPrefixLen);
  } else {
    return false;
  }
}

const ISO20022Messages = {
  CAMT_003: 'CAMT.003',
  CAMT_004: 'CAMT.004',
  CAMT_005: 'CAMT.005',
  CAMT_006: 'CAMT.006',
  CAMT_052: 'CAMT.052',
  CAMT_053: 'CAMT.053',
};
const XMLNS_PREFIX = 'urn:iso:std:iso:20022:tech:xsd:';
const ISO20022SchemaId = {
  PAIN_001_001_03: 'pain.001.001.03',
  PAIN_007_001_02: 'pain.007.001.02',
  PAIN_008_001_02: 'pain.008.001.02',
};
const ISO20022Implementations = new Map();
function registerISO20022Implementation(cl) {
  cl.supportedMessages().forEach(msg => {
    ISO20022Implementations.set(msg, cl);
  });
}
function getISO20022Implementation(type) {
  return ISO20022Implementations.get(type);
}
class XML {
  /**
   * Creates and configures the XML Parser
   *
   * @returns {XMLParser} A configured instance of XMLParser
   */
  static getParser() {
    return new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      /**
       * Disable automatic numeric parsing. ISO 20022 fields are semantically
       * strings (Max35Text, etc.). Numeric-looking values like AcctSvcrRef,
       * EndToEndId, NtryRef, and Cd must stay as strings to preserve leading
       * zeros and avoid precision loss on large numbers. Amounts are explicitly
       * converted to numbers downstream via parseAmountToMinorUnits.
       */
      parseTagValue: false,
    });
  }
  static getBuilder() {
    return new Builder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
    });
  }
}

/**
 * Base error class for all ISO 20022 related errors in the library.
 * Extends the native Error class with proper stack trace capture.
 */
class Iso20022JsError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
/**
 * Error thrown when XML parsing or validation fails.
 * This error indicates that the provided XML is malformed or does not conform to expected structure.
 */
class InvalidXmlError extends Iso20022JsError {
  constructor(message) {
    super(message);
  }
}
/**
 * Error thrown when XML namespace validation fails.
 * This error indicates that the XML document contains invalid or missing required ISO 20022 namespaces.
 */
class InvalidXmlNamespaceError extends Iso20022JsError {
  constructor(message) {
    super(message);
  }
}
class InvalidStructureError extends Iso20022JsError {
  constructor(message) {
    super(message);
  }
}

const parseAccount = account => {
  // Return just IBAN if it exists, else detailed local account details
  if (account.Id.IBAN) {
    return {
      iban: account.Id.IBAN,
    };
  }
  // TODO: Add support for .Tp.Cd and .Tp.Prtry
  return {
    ...(account.Id?.Othr?.Id && { accountNumber: String(account.Id.Othr.Id) }),
    ...(account.Nm && { name: account.Nm }),
    ...(account.Ccy && { currency: account.Ccy }),
  };
};
const exportAccount = account => {
  const obj = {};
  if (account.iban) {
    obj.Id = { IBAN: account.iban };
  } else {
    obj.Id = {
      Othr: {
        Id: account.accountNumber,
      },
    };
    obj.Ccy = account.currency;
    obj.Nm = account.name;
  }
  return obj;
};
const parseAccountIdentification = accountId => {
  if (accountId.IBAN) {
    return {
      iban: accountId.IBAN,
    };
  } else {
    return {
      id: accountId.Othr?.Id,
      schemeName: accountId.Othr?.SchmeNm?.Cd || accountId.Othr?.SchmeNm?.Prtry,
      issuer: accountId.Othr?.Issr,
    };
  }
};
const exportAccountIdentification = accountId => {
  if (accountId.iban) {
    return { IBAN: accountId.iban };
  } else {
    const obj = {
      Othr: {
        Id: accountId.id,
      },
    };
    if (accountId.schemeName) {
      obj.Othr.SchmeNm = {
        Cd: accountId.schemeName,
      }; // TODO: Add support for Prtry scheme name
    }
    if (accountId.issuer) {
      obj.Othr.Issr = accountId.issuer;
    }
    return obj;
  }
};
// TODO: Add both BIC and ABA routing numbers at the same time
const parseAgent = agent => {
  const bic = agent.FinInstnId.BICFI || agent.FinInstnId.BIC;
  if (bic) {
    return { bic };
  }
  const aba = agent.FinInstnId.Othr?.Id || agent.FinInstnId.ClrSysMmbId?.MmbId;
  if (aba != null) {
    return { abaRoutingNumber: String(aba) };
  }
  throw new Error(
    'Unable to parse agent: no BIC, BICFI, Othr.Id, or ClrSysMmbId.MmbId present',
  );
};
const parseMandate = mandateInfo => {
  return {
    mandateId: mandateInfo?.MndtId,
    dateOfSignature: new Date(mandateInfo?.DtOfSgntr),
    amendmentIndicator:
      mandateInfo?.AmdmntInd === 'true' || mandateInfo?.AmdmntInd === true,
    ...(mandateInfo?.AmdmntInd &&
      mandateInfo?.AmdmntInfDtls && {
        amendmentInformation: {
          ...(mandateInfo.AmdmntInfDtls.OrgnlMndtId && {
            originalMandateId: mandateInfo.AmdmntInfDtls.OrgnlMndtId,
          }),
          ...(mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId && {
            originalCreditorSchemeId: {
              ...(mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId.Nm && {
                name: mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId.Nm,
              }),
              ...(mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId.Id?.PrvtId?.Othr
                ?.Id && {
                id: mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId.Id.PrvtId.Othr
                  .Id,
              }),
            },
          }),
        },
      }),
  };
};
const exportAgent = agent => {
  const obj = {
    FinInstnId: {},
  };
  if (agent.bic) {
    obj.FinInstnId.BIC = agent.bic;
  } else if (agent.abaRoutingNumber) {
    obj.FinInstnId.Othr = { Id: agent.abaRoutingNumber };
  }
  return obj;
};
// Parse raw decimal currency data into integer minor units.
const parseAmountToMinorUnits = (rawAmount, currency = 'USD') => {
  const precision = getCurrencyPrecision(currency);
  // Decimal.js guards against JS float parsing errors (e.g. 0.29 * 100).
  return new decimal_js.Decimal(rawAmount)
    .mul(new decimal_js.Decimal(10).pow(precision))
    .toNumber();
};
const exportAmountToString = (amount, currency = 'USD') => {
  return formatMinorUnits(amount, currency);
};
const parseDate = dateElement => {
  // Find the date element, which can be DtTm or Dt
  const date = dateElement.DtTm || dateElement.Dt || dateElement;
  return new Date(date);
};
const parseParty = party => {
  return {
    id: party.Id?.OrgId?.Othr?.Id,
    name: party.Nm,
  };
};
const parseRecipient = recipient => {
  return {
    id: recipient.Id?.OrgId?.Othr?.Id,
    name: recipient.Nm,
  };
};
const exportRecipient = recipient => {
  return {
    Id: recipient.id ? { OrgId: { Othr: { Id: recipient.id } } } : undefined,
    Nm: recipient.name,
  };
};
// Standardize into a single string
const parseAdditionalInformation = additionalInformation => {
  if (!additionalInformation) {
    return undefined;
  }
  if (Array.isArray(additionalInformation)) {
    return additionalInformation.join('\n');
  } else {
    return additionalInformation;
  }
};
const parseMessageHeader = rawHeader => {
  return {
    id: rawHeader.MsgId,
    creationDateTime: rawHeader.CreDtTm
      ? parseDate(rawHeader.CreDtTm)
      : undefined,
    queryName: rawHeader.QueryNm,
    requestType:
      rawHeader.ReqTp?.PmtCtrl ||
      rawHeader.ReqTp?.Enqry ||
      rawHeader.ReqTp?.Prtry,
    originalMessageHeader: rawHeader.OrgnlBizQry
      ? parseMessageHeader(rawHeader.OrgnlBizQry)
      : undefined,
  };
};
const exportMessageHeader = header => {
  const obj = {
    MsgId: header.id,
    CreDtTm: header.creationDateTime?.toISOString(),
  };
  if (header.originalMessageHeader) {
    obj.OrgnlMsgHdr = exportMessageHeader(header.originalMessageHeader);
  }
  if (header.requestType) {
    obj.ReqTp = { Prtry: header.requestType }; // TODO: Add support for PmtCtrl and Enqry types
  }
  if (header.queryName) {
    obj.QueryNm = header.queryName;
  }
  return obj;
};

const sanitize = (value, length) => {
  return value.slice(0, length);
};
const generateId = () => {
  return node_crypto.randomUUID().replace(/-/g, '');
};

/**
 * Abstract base class for ISO20022 payment initiation (PAIN) messages.
 * @abstract
 */
class PaymentInitiation {
  type;
  constructor({ type }) {
    this.type = type;
  }
  /**
   * Returns the full XML namespace URI for this message type
   * (e.g. 'urn:iso:std:iso:20022:tech:xsd:pain.007.001.02').
   */
  get namespace() {
    return `${XMLNS_PREFIX}${this.schemaId}`;
  }
  /**
   * Formats a party's information according to ISO20022 standards.
   * @param {Party} party - The party's information.
   * @returns {Object} Formatted XML party information.
   */
  party(party) {
    const result = {
      Nm: party.name,
    };
    // Only include address information if it exists
    if (party.address) {
      result.PstlAdr = {
        StrtNm: party.address.streetName,
        BldgNb: party.address.buildingNumber,
        PstCd: party.address.postalCode,
        TwnNm: party.address.townName,
        CtrySubDvsn: party.address.countrySubDivision,
        Ctry: party.address.country,
      };
    }
    return result;
  }
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
  account(account) {
    if (account.iban) {
      return this.internationalAccount(account);
    }
    return {
      Id: {
        Othr: {
          Id: account.accountNumber,
        },
      },
    };
  }
  /**
   * Formats an IBAN account according to ISO20022 standards.
   * @param {IBANAccount} account - The IBAN account information.
   * @returns {Object} Formatted XML IBAN account information.
   */
  internationalAccount(account) {
    return {
      Id: {
        IBAN: account.iban,
      },
    };
  }
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
  agent(agent) {
    if (agent.bic !== undefined) {
      return {
        FinInstnId: {
          BIC: agent.bic,
        },
      };
    } else {
      return {
        FinInstnId: {
          ClrSysMmbId: {
            ClrSysId: {
              Cd: 'USABA',
            },
            MmbId: agent.abaRoutingNumber,
          },
        },
      };
    }
  }
  buildMandateRelatedInfo(mandate) {
    return {
      MndtId: mandate.mandateId,
      DtOfSgntr: mandate.dateOfSignature.toISOString().split('T')[0],
      AmdmntInd: mandate.amendmentIndicator,
      ...(mandate.amendmentIndicator &&
        mandate.amendmentInformation && {
          AmdmntInfDtls: {
            ...(mandate.amendmentInformation.originalMandateId && {
              OrgnlMndtId: mandate.amendmentInformation.originalMandateId,
            }),
            ...(mandate.amendmentInformation.originalCreditorSchemeId && {
              OrgnlCdtrSchmeId: {
                ...(mandate.amendmentInformation.originalCreditorSchemeId
                  .name && {
                  Nm: mandate.amendmentInformation.originalCreditorSchemeId
                    .name,
                }),
                ...(mandate.amendmentInformation.originalCreditorSchemeId
                  .id && {
                  Id: {
                    PrvtId: {
                      Othr: {
                        Id: mandate.amendmentInformation
                          .originalCreditorSchemeId.id,
                        SchmeNm: { Prtry: 'SEPA' },
                      },
                    },
                  },
                }),
              },
            }),
          },
        }),
    };
  }
  buildCreditorSchemeId(schemeId) {
    return {
      Id: {
        PrvtId: {
          Othr: {
            Id: schemeId,
            SchmeNm: { Prtry: 'SEPA' },
          },
        },
      },
    };
  }
  /**
   * Returns the string representation of the payment initiation.
   * @returns {string} The serialized payment initiation.
   */
  toString() {
    return this.serialize();
  }
  static getBuilder() {
    return new Builder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#',
      format: true,
    });
  }
}

/**
 * Represents a SWIFT Credit Payment v3 Initiation message (pain.001.001.03).
 * @class
 * @extends PaymentInitiation
 * @param {SWIFTCreditPaymentInitiationConfig} config - The configuration for the SWIFT Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new SWIFTCreditPaymentInitiation({
 *   ...
 * });
 * // Uploading to fiatwebservices.com
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = SWIFTCreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/sepacredit} for more information.
 */
class SWIFTCreditPaymentInitiation extends PaymentInitiation {
  initiatingParty;
  messageId;
  creationDate;
  paymentInstructions;
  paymentInformationId;
  get schemaId() {
    return ISO20022SchemaId.PAIN_001_001_03;
  }
  /**
   * Creates an instance of SWIFTCreditPaymentInitiation.
   * @param {SWIFTCreditPaymentInitiationConfig} config - The configuration object.
   */
  constructor(config) {
    super({ type: 'swift' });
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId = config.messageId || generateId();
    this.creationDate = config.creationDate || new Date();
    this.paymentInformationId = generateId();
    this.validate();
  }
  /**
   * Validates the payment initiation data has the information required to create a valid XML file.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If any creditor has incomplete address information.
   */
  validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }
    // Validate that all creditors have complete addresses
    // According to spec, the country is required for all addresses
    const creditorWithIncompleteAddress = this.paymentInstructions.find(
      instruction => {
        const address = instruction.creditor.address;
        return !address || !address.country;
      },
    );
    if (creditorWithIncompleteAddress) {
      throw new Error(
        'All creditors must have complete addresses (street name, building number, postal code, town name, and country)',
      );
    }
    // Add more validation as needed
  }
  /**
   * Generates payment information for a single payment instruction.
   * @param {SWIFTCreditPaymentInstruction} paymentInstruction - The payment instruction.
   * @returns {Object} The credit transfer object.
   */
  creditTransfer(paymentInstruction) {
    const paymentInstructionId = sanitize(
      paymentInstruction.id || generateId(),
      35,
    );
    const amount = minorUnitsToNumber(
      paymentInstruction.amount,
      paymentInstruction.currency,
    );
    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: paymentInstructionId,
      },
      Amt: {
        InstdAmt: {
          '#': amount,
          '@Ccy': paymentInstruction.currency,
        },
      },
      // TODO: Add support for intermediary bank information
      // This is necessary when the SWIFT Payment needs to be routed through multiple banks in order to reach the recipient
      // intermediaryBanks will probably need to be an array of BICAgents. There needs to be an easy way to get this information for users
      CdtrAgt: this.agent(paymentInstruction.creditor.agent),
      Cdtr: this.party(paymentInstruction.creditor),
      CdtrAcct: this.internationalAccount(paymentInstruction.creditor.account),
      RmtInf: paymentInstruction.remittanceInformation
        ? {
            Ustrd: paymentInstruction.remittanceInformation,
          }
        : undefined,
    };
  }
  /**
   * Serializes the payment initiation to an XML string.
   * @returns {string} The XML representation of the payment initiation.
   */
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (!namespace.startsWith(`${XMLNS_PREFIX}pain.001.001`)) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
    }
    const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
    const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
    // Parse and validate accounts
    // Create base initiating party
    const baseInitiatingParty = {
      name: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm,
      id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr?.Id,
      account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
      agent: {
        bic: xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt?.FinInstnId?.BIC,
      },
    };
    const rawInstructions = Array.isArray(
      xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf,
    )
      ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
      : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
    const paymentInstructions = rawInstructions.map(inst => {
      const currency = inst.Amt.InstdAmt['@_Ccy'];
      const amount = parseAmountToMinorUnits(
        Number(inst.Amt.InstdAmt['#text']),
        currency,
      );
      // Create base creditor party
      const creditor = {
        name: inst.Cdtr.Nm,
        agent: {
          bic: inst.CdtrAgt?.FinInstnId?.BIC,
        },
        account:
          inst.CdtrAcct?.Id?.IBAN || inst.CdtrAcct?.Id?.Othr?.Id
            ? parseAccount(inst.CdtrAcct)
            : undefined,
        address: {
          streetName: inst.Cdtr.PstlAdr.StrtNm,
          buildingNumber: inst.Cdtr.PstlAdr.BldgNb,
          postalCode: inst.Cdtr.PstlAdr.PstCd,
          townName: inst.Cdtr.PstlAdr.TwnNm,
          countrySubDivision: inst.Cdtr.PstlAdr.CtrySubDvsn,
          country: inst.Cdtr.PstlAdr.Ctry,
        },
      };
      // Return instruction with validated data
      return {
        type: 'swift',
        direction: 'credit',
        ...(inst.PmtId.InstrId && { id: inst.PmtId.InstrId.toString() }),
        ...(inst.PmtId.EndToEndId && {
          endToEndId: inst.PmtId.EndToEndId.toString(),
        }),
        amount,
        currency,
        creditor,
      };
    });
    return new SWIFTCreditPaymentInitiation({
      messageId,
      creationDate,
      initiatingParty: baseInitiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
  serialize() {
    const builder = PaymentInitiation.getBuilder();
    const xml = {
      '?xml': {
        '@version': '1.0',
        '@encoding': 'UTF-8',
      },
      Document: {
        '@xmlns': this.namespace,
        CstmrCdtTrfInitn: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.paymentInstructions.length.toString(),
            InitgPty: {
              Nm: this.initiatingParty.name,
              Id: {
                OrgId: {
                  Othr: {
                    Id: this.initiatingParty.id,
                  },
                },
              },
            },
          },
          PmtInf: {
            PmtInfId: this.paymentInformationId,
            PmtMtd: 'TRF',
            BtchBookg: 'false',
            PmtTpInf: {
              InstrPrty: 'NORM',
              SvcLvl: {
                Cd: 'URGP',
              },
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T')[0], // TODO: Check time zone eventually
            Dbtr: this.party(this.initiatingParty),
            DbtrAcct: this.account(this.initiatingParty.account),
            DbtrAgt: this.agent(this.initiatingParty.agent),
            ChrgBr: 'SHAR',
            CdtTrfTxInf: this.paymentInstructions.map(p =>
              this.creditTransfer(p),
            ),
          },
        },
      },
    };
    return builder.build(xml);
  }
}

/**
 * Represents a SEPA Credit Payment Initiation.
 * This class handles the creation and serialization of SEPA credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {SEPACreditPaymentInitiationConfig} config - The configuration for the SEPA Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a SEPA payment message
 * const payment = new SEPACreditPaymentInitiation({
 *   // configuration options
 * });
 * // Uploading the payment
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = SEPACreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/sepacredit} for more information.
 */
class SEPACreditPaymentInitiation extends PaymentInitiation {
  initiatingParty;
  messageId;
  creationDate;
  paymentInstructions;
  paymentInformationId;
  categoryPurpose;
  formattedPaymentSum;
  get schemaId() {
    return ISO20022SchemaId.PAIN_001_001_03;
  }
  /**
   * Creates an instance of SEPACreditPaymentInitiation.
   * @param {SEPACreditPaymentInitiationConfig} config - The configuration object for the SEPA credit transfer.
   */
  constructor(config) {
    super({ type: 'sepa' });
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId = config.messageId || generateId();
    this.creationDate = config.creationDate || new Date();
    this.formattedPaymentSum = this.sumPaymentInstructions(
      this.paymentInstructions,
    );
    this.paymentInformationId = generateId();
    this.categoryPurpose = config.categoryPurpose;
    this.validate();
  }
  // NOTE: Does not work with different currencies. In the meantime we will use a guard.
  // TODO: Figure out what to do with different currencies
  /**
   * Calculates the sum of all payment instructions.
   * @private
   * @param {AtLeastOne<SEPACreditPaymentInstruction>} instructions - Array of payment instructions.
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   * @throws {Error} If payment instructions have different currencies.
   */
  sumPaymentInstructions(instructions) {
    this.validateAllInstructionsHaveSameCurrency();
    const total = instructions.reduce((acc, i) => acc + i.amount, 0);
    return formatMinorUnits(total, instructions[0].currency);
  }
  /**
   * Validates the payment initiation data according to SEPA requirements.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If payment instructions have different currencies.
   * @throws {Error} If any creditor has incomplete address information.
   */
  validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }
    this.validateAllInstructionsHaveSameCurrency();
  }
  // Validates that all payment instructions have the same currency
  // TODO: Remove this when we figure out how to run sumPaymentInstructions safely
  validateAllInstructionsHaveSameCurrency() {
    if (
      !this.paymentInstructions.every(i => {
        return i.currency === this.paymentInstructions[0].currency;
      })
    ) {
      throw new Error(
        'In order to calculate the payment instructions sum, all payment instruction currencies must be the same.',
      );
    }
  }
  /**
   * Generates payment information for a single SEPA credit transfer instruction.
   * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
   * @returns {Object} The payment information object formatted according to SEPA specifications.
   */
  creditTransfer(instruction) {
    const paymentInstructionId = sanitize(instruction.id || generateId(), 35);
    const endToEndId = sanitize(
      instruction.endToEndId || instruction.id || generateId(),
      35,
    );
    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: endToEndId,
      },
      Amt: {
        InstdAmt: {
          '#': formatMinorUnits(instruction.amount, instruction.currency),
          '@Ccy': instruction.currency,
        },
      },
      ...(instruction.creditor.agent && {
        CdtrAgt: this.agent(instruction.creditor.agent),
      }),
      Cdtr: this.party(instruction.creditor),
      CdtrAcct: {
        Id: { IBAN: instruction.creditor.account.iban },
        Ccy: instruction.currency,
      },
      RmtInf: instruction.remittanceInformation
        ? {
            Ustrd: instruction.remittanceInformation,
          }
        : undefined,
    };
  }
  /**
   * Serializes the SEPA credit transfer initiation to an XML string.
   * @returns {string} The XML representation of the SEPA credit transfer initiation.
   */
  serialize() {
    const builder = PaymentInitiation.getBuilder();
    const xml = {
      '?xml': {
        '@version': '1.0',
        '@encoding': 'UTF-8',
      },
      Document: {
        '@xmlns': this.namespace,
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        CstmrCdtTrfInitn: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.paymentInstructions.length.toString(),
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
          PmtInf: {
            PmtInfId: this.paymentInformationId,
            PmtMtd: 'TRF',
            NbOfTxs: this.paymentInstructions.length.toString(),
            CtrlSum: this.formattedPaymentSum,
            PmtTpInf: {
              SvcLvl: { Cd: 'SEPA' },
              ...(this.categoryPurpose && {
                CtgyPurp: { Cd: this.categoryPurpose },
              }),
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T').at(0),
            Dbtr: this.party(this.initiatingParty),
            DbtrAcct: this.account(this.initiatingParty.account),
            ...(this.initiatingParty.agent && {
              DbtrAgt: this.agent(this.initiatingParty.agent),
            }),
            ChrgBr: 'SLEV',
            // payments[]
            CdtTrfTxInf: this.paymentInstructions.map(p =>
              this.creditTransfer(p),
            ),
          },
        },
      },
    };
    return builder.build(xml);
  }
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (
      !namespace.startsWith(
        `${XMLNS_PREFIX}${ISO20022SchemaId.PAIN_001_001_03}`,
      )
    ) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
    }
    const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
    const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
    if (Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf)) {
      throw new Error('Multiple PmtInf is not supported');
    }
    // Assuming we have one PmtInf / one Debtor, we can hack together this information from InitgPty / Dbtr
    const initiatingParty = {
      name:
        xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm ||
        xml.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
      id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId.Othr.Id,
      agent: parseAgent(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt),
      account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
    };
    const rawInstructions = Array.isArray(
      xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf,
    )
      ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
      : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
    const paymentInstructions = rawInstructions.map(inst => {
      const currency = inst.Amt.InstdAmt['@_Ccy'];
      const amount = parseAmountToMinorUnits(
        Number(inst.Amt.InstdAmt['#text']),
        currency,
      );
      const rawPostalAddress = inst.Cdtr.PstlAdr;
      return {
        ...(inst.PmtId.InstrId && {
          id: inst.PmtId.InstrId.toString(),
        }),
        ...(inst.PmtId.EndToEndId && {
          endToEndId: inst.PmtId.EndToEndId.toString(),
        }),
        type: 'sepa',
        direction: 'credit',
        amount: amount,
        currency: currency,
        creditor: {
          name: inst.Cdtr?.Nm,
          agent: parseAgent(inst.CdtrAgt),
          account: parseAccount(inst.CdtrAcct),
          ...(rawPostalAddress &&
          (rawPostalAddress.StreetName ||
            rawPostalAddress.BldgNb ||
            rawPostalAddress.PstlCd ||
            rawPostalAddress.TwnNm ||
            rawPostalAddress.Ctry)
            ? {
                address: {
                  ...(rawPostalAddress.StrtNm && {
                    streetName: rawPostalAddress.StrtNm.toString(),
                  }),
                  ...(rawPostalAddress.BldgNb && {
                    buildingNumber: rawPostalAddress.BldgNb.toString(),
                  }),
                  ...(rawPostalAddress.TwnNm && {
                    townName: rawPostalAddress.TwnNm.toString(),
                  }),
                  ...(rawPostalAddress.CtrySubDvsn && {
                    countrySubDivision: rawPostalAddress.CtrySubDvsn.toString(),
                  }),
                  ...(rawPostalAddress.PstCd && {
                    postalCode: rawPostalAddress.PstCd.toString(),
                  }),
                  ...(rawPostalAddress.Ctry && {
                    country: rawPostalAddress.Ctry,
                  }),
                },
              }
            : {}),
        },
        ...(inst.RmtInf?.Ustrd && {
          remittanceInformation: inst.RmtInf.Ustrd.toString(),
        }),
      };
    });
    return new SEPACreditPaymentInitiation({
      messageId: messageId,
      creationDate: creationDate,
      initiatingParty: initiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
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
class SEPAMultiCreditPaymentInitiation extends PaymentInitiation {
  initiatingParty;
  messageId;
  creationDate;
  paymentInstructions;
  formattedPaymentSum;
  totalTransactionCount;
  get schemaId() {
    return ISO20022SchemaId.PAIN_001_001_03;
  }
  /**
   * Creates an instance of SEPAMultiCreditPaymentInitiation.
   * @param {SEPAMultiCreditPaymentInitiationConfig} config - The configuration object for the SEPA multi credit transfer.
   */
  constructor(config) {
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
  countAllTransactions() {
    return this.paymentInstructions.reduce((total, group) => {
      return total + group.payments.length;
    }, 0);
  }
  /**
   * Calculates the sum of all payment instructions across all groups.
   * @private
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   */
  sumAllPayments() {
    let totalAmount = 0;
    let currency = null;
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
  validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }
    // Validate each group has same currency within its payments
    for (const group of this.paymentInstructions) {
      this.validateGroupInstructionsHaveSameCurrency(group.payments);
    }
  }
  /**
   * Validates that all payment instructions in a group have the same currency.
   * @private
   * @param {AtLeastOne<SEPACreditPaymentInstruction>} payments - Array of payment instructions.
   * @throws {Error} If payment instructions have different currencies.
   */
  validateGroupInstructionsHaveSameCurrency(payments) {
    if (
      !payments.every(i => {
        return i.currency === payments[0].currency;
      })
    ) {
      throw new Error(
        'In order to calculate the payment instructions sum, all payment instruction currencies within a group must be the same.',
      );
    }
  }
  /**
   * Generates payment information for a single SEPA credit transfer instruction.
   * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
   * @returns {Object} The payment information object formatted according to SEPA specifications.
   */
  creditTransfer(instruction) {
    const paymentInstructionId = sanitize(instruction.id || generateId(), 35);
    const endToEndId = sanitize(
      instruction.endToEndId || instruction.id || generateId(),
      35,
    );
    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: endToEndId,
      },
      Amt: {
        InstdAmt: {
          '#': formatMinorUnits(instruction.amount, instruction.currency),
          '@Ccy': instruction.currency,
        },
      },
      ...(instruction.creditor.agent && {
        CdtrAgt: this.agent(instruction.creditor.agent),
      }),
      Cdtr: this.party(instruction.creditor),
      CdtrAcct: {
        Id: { IBAN: instruction.creditor.account.iban },
        Ccy: instruction.currency,
      },
      RmtInf: instruction.remittanceInformation
        ? {
            Ustrd: instruction.remittanceInformation,
          }
        : undefined,
    };
  }
  /**
   * Serializes the SEPA multi credit transfer initiation to an XML string.
   * @returns {string} The XML representation of the SEPA multi credit transfer initiation.
   */
  serialize() {
    const builder = PaymentInitiation.getBuilder();
    // Generate one PmtInf entry per individual payment
    const paymentInfoEntries = this.paymentInstructions.flatMap(group => {
      return group.payments.map(payment => {
        const pmtInfId = generateId();
        const requestedExecutionDate =
          payment.requestedPaymentExecutionDate || new Date();
        const batchBooking =
          group.batchBooking !== undefined ? group.batchBooking : false;
        return {
          PmtInfId: pmtInfId,
          PmtMtd: 'TRF',
          BtchBookg: batchBooking,
          NbOfTxs: '1',
          CtrlSum: formatMinorUnits(payment.amount, payment.currency),
          PmtTpInf: {
            SvcLvl: { Cd: 'SEPA' },
            ...(group.categoryPurpose && {
              CtgyPurp: { Cd: group.categoryPurpose },
            }),
          },
          ReqdExctnDt: requestedExecutionDate.toISOString().split('T')[0],
          Dbtr: this.party(group.initiatingParty),
          DbtrAcct: this.account(group.initiatingParty.account),
          DbtrAgt: this.agent(group.initiatingParty.agent),
          ChrgBr: 'SLEV',
          CdtTrfTxInf: this.creditTransfer(payment),
        };
      });
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
        CstmrCdtTrfInitn: {
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
   * Parses an XML string and creates a SEPAMultiCreditPaymentInitiation instance.
   * Supports multiple PmtInf blocks in the XML document.
   * @param {string} rawXml - The XML string to parse.
   * @returns {SEPAMultiCreditPaymentInitiation} A new instance created from the XML data.
   * @throws {InvalidXmlError} If the XML format is invalid.
   * @throws {InvalidXmlNamespaceError} If the namespace is not pain.001.001.03.
   */
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    // Validate XML structure
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    // Validate namespace
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (
      !namespace.startsWith(
        `${XMLNS_PREFIX}${ISO20022SchemaId.PAIN_001_001_03}`,
      )
    ) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
    }
    // Extract GrpHdr data
    const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
    const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
    // Extract top-level initiating party from GrpHdr
    const topLevelInitiatingParty = {
      name: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm,
      id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr?.Id,
    };
    // Normalize PmtInf to array (handle both single object and array cases)
    const rawPmtInf = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf)
      ? xml.Document.CstmrCdtTrfInitn.PmtInf
      : [xml.Document.CstmrCdtTrfInitn.PmtInf];
    // Map each PmtInf to SEPAMultiCreditPaymentInstructionGroup
    const paymentInstructions = rawPmtInf.map(pmtInf => {
      // Extract debtor info as the group's initiating party
      const groupInitiatingParty = {
        name: pmtInf.Dbtr.Nm,
        id: pmtInf.Dbtr.Id?.OrgId?.Othr?.Id,
        agent: parseAgent(pmtInf.DbtrAgt),
        account: parseAccount(pmtInf.DbtrAcct),
      };
      // Extract optional category purpose
      const categoryPurpose = pmtInf.PmtTpInf?.CtgyPurp?.Cd;
      // Extract requested execution date
      const requestedExecutionDate = pmtInf.ReqdExctnDt
        ? new Date(pmtInf.ReqdExctnDt)
        : undefined;
      // Normalize CdtTrfTxInf to array
      const rawInstructions = Array.isArray(pmtInf.CdtTrfTxInf)
        ? pmtInf.CdtTrfTxInf
        : [pmtInf.CdtTrfTxInf];
      // Parse each CdtTrfTxInf to SEPACreditPaymentInstruction
      const payments = rawInstructions.map(inst => {
        const currency = inst.Amt.InstdAmt['@_Ccy'];
        const amount = parseAmountToMinorUnits(
          Number(inst.Amt.InstdAmt['#text']),
          currency,
        );
        const rawPostalAddress = inst.Cdtr.PstlAdr;
        return {
          ...(inst.PmtId.InstrId && {
            id: inst.PmtId.InstrId.toString(),
          }),
          ...(inst.PmtId.EndToEndId && {
            endToEndId: inst.PmtId.EndToEndId.toString(),
          }),
          type: 'sepa',
          direction: 'credit',
          amount: amount,
          currency: currency,
          ...(requestedExecutionDate && {
            requestedPaymentExecutionDate: requestedExecutionDate,
          }),
          creditor: {
            name: inst.Cdtr?.Nm,
            agent: parseAgent(inst.CdtrAgt),
            account: parseAccount(inst.CdtrAcct),
            ...(rawPostalAddress &&
            (rawPostalAddress.StrtNm ||
              rawPostalAddress.BldgNb ||
              rawPostalAddress.PstCd ||
              rawPostalAddress.TwnNm ||
              rawPostalAddress.Ctry)
              ? {
                  address: {
                    ...(rawPostalAddress.StrtNm && {
                      streetName: rawPostalAddress.StrtNm.toString(),
                    }),
                    ...(rawPostalAddress.BldgNb && {
                      buildingNumber: rawPostalAddress.BldgNb.toString(),
                    }),
                    ...(rawPostalAddress.TwnNm && {
                      townName: rawPostalAddress.TwnNm.toString(),
                    }),
                    ...(rawPostalAddress.CtrySubDvsn && {
                      countrySubDivision:
                        rawPostalAddress.CtrySubDvsn.toString(),
                    }),
                    ...(rawPostalAddress.PstCd && {
                      postalCode: rawPostalAddress.PstCd.toString(),
                    }),
                    ...(rawPostalAddress.Ctry && {
                      country: rawPostalAddress.Ctry,
                    }),
                  },
                }
              : {}),
          },
          ...(inst.RmtInf?.Ustrd && {
            remittanceInformation: inst.RmtInf.Ustrd.toString(),
          }),
        };
      });
      // Extract batch booking
      const batchBooking =
        pmtInf.BtchBookg === 'true' || pmtInf.BtchBookg === true;
      return {
        initiatingParty: groupInitiatingParty,
        payments: payments,
        ...(categoryPurpose && { categoryPurpose }),
        batchBooking: batchBooking,
      };
    });
    // Return new instance
    return new SEPAMultiCreditPaymentInitiation({
      messageId: messageId,
      creationDate: creationDate,
      initiatingParty: topLevelInitiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
}

/**
 * Represents a RTP Credit Payment Initiation.
 * This class handles the creation and serialization of RTP credit transfer messages
 * according to the ISO20022 standard.
 * @class
 * @extends PaymentInitiation
 * @param {RTPCreditPaymentInitiationConfig} config - The configuration for the RTP Credit Payment Initiation message.
 * @example
 * ```typescript
 * // Creating a payment message
 * const payment = new RTPCreditPaymentInitiation({
 *   ...
 * });
 * // Uploading to fiatwebservices.com
 * client.paymentTransfers.create(payment);
 * // Parsing from XML
 * const xml = '<xml>...</xml>';
 * const parsedTransfer = RTPCreditPaymentInitiation.fromXML(xml);
 * ```
 * @see {@link https://docs.iso20022js.com/pain/rtpcredit} for more information.
 */
class RTPCreditPaymentInitiation extends PaymentInitiation {
  initiatingParty;
  paymentInstructions;
  messageId;
  creationDate;
  paymentInformationId;
  formattedPaymentSum;
  get schemaId() {
    return ISO20022SchemaId.PAIN_001_001_03;
  }
  constructor(config) {
    super({ type: 'rtp' });
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId = config.messageId || generateId();
    this.creationDate = config.creationDate || new Date();
    this.paymentInformationId = generateId();
    this.formattedPaymentSum = this.sumPaymentInstructions(
      this.paymentInstructions,
    );
    this.validate();
  }
  /**
   * Calculates the sum of all payment instructions.
   * @private
   * @param {AtLeastOne<RTPCreditPaymentInstruction>} instructions - Array of payment instructions.
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   * @throws {Error} If payment instructions have different currencies.
   */
  sumPaymentInstructions(instructions) {
    const total = instructions.reduce((acc, i) => acc + i.amount, 0);
    return formatMinorUnits(total, instructions[0].currency);
  }
  /**
   * Validates the payment initiation data according to SEPA requirements.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If payment instructions have different currencies.
   * @throws {Error} If any creditor has incomplete address information.
   */
  validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }
  }
  /**
   * Generates payment information for a single SEPA credit transfer instruction.
   * @param {RTPCreditPaymentInstruction} instruction - The payment instruction.
   * @returns {Object} The payment information object formatted according to SEPA specifications.
   */
  creditTransfer(instruction) {
    const paymentInstructionId = sanitize(instruction.id || generateId(), 35);
    const endToEndId = sanitize(
      instruction.endToEndId || instruction.id || generateId(),
      35,
    );
    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: endToEndId,
      },
      Amt: {
        InstdAmt: {
          '#': formatMinorUnits(instruction.amount, instruction.currency),
          '@Ccy': instruction.currency,
        },
      },
      CdtrAgt: this.agent(instruction.creditor.agent),
      Cdtr: this.party(instruction.creditor),
      CdtrAcct: {
        Id: {
          Othr: {
            Id: instruction.creditor.account.accountNumber,
          },
        },
      },
      RmtInf: instruction.remittanceInformation
        ? {
            Ustrd: instruction.remittanceInformation,
          }
        : undefined,
    };
  }
  /**
   * Serializes the RTP credit transfer initiation to an XML string.
   * @returns {string} The XML representation of the RTP credit transfer initiation.
   */
  serialize() {
    const builder = PaymentInitiation.getBuilder();
    const xml = {
      '?xml': {
        '@version': '1.0',
        '@encoding': 'UTF-8',
      },
      Document: {
        '@xmlns': this.namespace,
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        CstmrCdtTrfInitn: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.paymentInstructions.length.toString(),
            CtrlSum: this.formattedPaymentSum,
            InitgPty: {
              Nm: this.initiatingParty.name,
              Id: {
                OrgId: {
                  Othr: {
                    Id: this.initiatingParty.id,
                  },
                },
              },
            },
          },
          PmtInf: {
            PmtInfId: this.paymentInformationId,
            PmtMtd: 'TRF',
            NbOfTxs: this.paymentInstructions.length.toString(),
            CtrlSum: this.formattedPaymentSum,
            PmtTpInf: {
              SvcLvl: { Cd: 'URNS' },
              LclInstrm: { Prtry: 'RTP' },
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T').at(0),
            Dbtr: this.party(this.initiatingParty),
            DbtrAcct: this.account(this.initiatingParty.account),
            DbtrAgt: this.agent(this.initiatingParty.agent),
            ChrgBr: 'SLEV',
            // payments[]
            CdtTrfTxInf: this.paymentInstructions.map(p =>
              this.creditTransfer(p),
            ),
          },
        },
      },
    };
    return builder.build(xml);
  }
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (
      !namespace.startsWith(
        `${XMLNS_PREFIX}${ISO20022SchemaId.PAIN_001_001_03}`,
      )
    ) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
    }
    const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
    const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
    if (Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf)) {
      throw new Error('Multiple PmtInf is not supported');
    }
    // Assuming we have one PmtInf / one Debtor, we can hack together this information from InitgPty / Dbtr
    const initiatingParty = {
      name:
        xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm ||
        xml.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
      id:
        xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.Othr?.Id ||
        xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.BICOrBEI,
      agent: parseAgent(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt),
      account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
    };
    const rawInstructions = Array.isArray(
      xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf,
    )
      ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
      : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
    const paymentInstructions = rawInstructions.map(inst => {
      const currency = inst.Amt.InstdAmt['@_Ccy'];
      const amount = parseAmountToMinorUnits(
        Number(inst.Amt.InstdAmt['#text']),
        currency,
      );
      const rawPostalAddress = inst.Cdtr.PstlAdr;
      return {
        ...(inst.PmtId.InstrId && {
          id: inst.PmtId.InstrId.toString(),
        }),
        ...(inst.PmtId.EndToEndId && {
          endToEndId: inst.PmtId.EndToEndId.toString(),
        }),
        type: 'sepa',
        direction: 'credit',
        amount: amount,
        currency: currency,
        creditor: {
          name: inst.Cdtr?.Nm,
          agent: parseAgent(inst.CdtrAgt),
          account: parseAccount(inst.CdtrAcct),
          ...(rawPostalAddress &&
          (rawPostalAddress.StreetName ||
            rawPostalAddress.BldgNb ||
            rawPostalAddress.PstlCd ||
            rawPostalAddress.TwnNm ||
            rawPostalAddress.Ctry)
            ? {
                address: {
                  ...(rawPostalAddress.StrtNm && {
                    streetName: rawPostalAddress.StrtNm.toString(),
                  }),
                  ...(rawPostalAddress.BldgNb && {
                    buildingNumber: rawPostalAddress.BldgNb.toString(),
                  }),
                  ...(rawPostalAddress.TwnNm && {
                    townName: rawPostalAddress.TwnNm.toString(),
                  }),
                  ...(rawPostalAddress.CtrySubDvsn && {
                    countrySubDivision: rawPostalAddress.CtrySubDvsn.toString(),
                  }),
                  ...(rawPostalAddress.PstCd && {
                    postalCode: rawPostalAddress.PstCd.toString(),
                  }),
                  ...(rawPostalAddress.Ctry && {
                    country: rawPostalAddress.Ctry,
                  }),
                },
              }
            : {}),
        },
        ...(inst.RmtInf?.Ustrd && {
          remittanceInformation: inst.RmtInf.Ustrd.toString(),
        }),
      };
    });
    return new RTPCreditPaymentInitiation({
      messageId: messageId,
      creationDate: creationDate,
      initiatingParty: initiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
}

/*
 * Represents a SEPA credit payment instruction, extending the base PaymentInstruction.
 */
/**
 * Category purpose codes as defined in ISO 20022 ExternalCategoryPurpose1Code.
 * @see {@link https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets}
 */
/**
 * ACH Local Instrument Codes as defined in NACHA standards.
 * These codes identify the specific type of ACH transaction.
 */
const ACHLocalInstrumentCode = {
  /** Corporate Credit or Debit */
  CorporateCreditDebit: 'CCD',
  /** Prearranged Payment and Deposit */
  PrearrangedPaymentDeposit: 'PPD',
  /** Internet-Initiated Entry */
  InternetInitiated: 'WEB',
  /** Telephone-Initiated Entry */
  TelephoneInitiated: 'TEL',
  /** Point-of-Purchase Entry */
  PointOfPurchase: 'POP',
  /** Accounts Receivable Entry */
  AccountsReceivable: 'ARC',
  /** Back Office Conversion */
  BackOfficeConversion: 'BOC',
  /** Represented Check Entry */
  RepresentedCheck: 'RCK',
};
const ACHLocalInstrumentCodeDescriptionMap = {
  CCD: 'Corporate Credit or Debit',
  PPD: 'Prearranged Payment and Deposit',
  WEB: 'Internet-Initiated Entry',
  TEL: 'Telephone-Initiated Entry',
  POP: 'Point-of-Purchase Entry',
  ARC: 'Accounts Receivable Entry',
  BOC: 'Back Office Conversion',
  RCK: 'Represented Check Entry',
};
const SEPAReversalReasonCode = {
  Duplication: 'DUPL',
  TechnicalProblem: 'TECH',
  FraudulentOriginal: 'FRAD',
  CutOffTime: 'CUTA',
  AmountDiffers: 'AM05',
  InvalidDebtorAccount: 'AC04',
  NotSpecifiedCustomerGenerated: 'MS02',
  NotSpecifiedAgentGenerated: 'MS03',
};

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
class ACHCreditPaymentInitiation extends PaymentInitiation {
  initiatingParty;
  paymentInstructions;
  messageId;
  creationDate;
  paymentInformationId;
  localInstrument;
  serviceLevel;
  instructionPriority;
  formattedPaymentSum;
  get schemaId() {
    return ISO20022SchemaId.PAIN_001_001_03;
  }
  constructor(config) {
    super({ type: 'ach' });
    this.initiatingParty = config.initiatingParty;
    this.paymentInstructions = config.paymentInstructions;
    this.messageId = config.messageId || generateId();
    this.creationDate = config.creationDate || new Date();
    this.paymentInformationId = generateId();
    this.localInstrument =
      config.localInstrument || ACHLocalInstrumentCode.CorporateCreditDebit;
    this.serviceLevel = 'NURG'; // Normal Urgency
    this.instructionPriority = 'NORM'; // Normal Priority
    this.formattedPaymentSum = this.sumPaymentInstructions(
      this.paymentInstructions,
    );
    this.validate();
  }
  /**
   * Calculates the sum of all payment instructions.
   * @private
   * @param {AtLeastOne<ACHCreditPaymentInstruction>} instructions - Array of payment instructions.
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   * @throws {Error} If payment instructions have different currencies.
   */
  sumPaymentInstructions(instructions) {
    const total = instructions.reduce((acc, i) => acc + i.amount, 0);
    return formatMinorUnits(total, instructions[0].currency);
  }
  /**
   * Validates the payment initiation data according to ACH requirements.
   * @private
   * @throws {Error} If messageId exceeds 35 characters.
   * @throws {Error} If payment instructions have different currencies.
   * @throws {Error} If any creditor has incomplete information.
   */
  validate() {
    if (this.messageId.length > 35) {
      throw new Error('messageId must not exceed 35 characters');
    }
    // Ensure all payment instructions have USD as currency
    for (const instruction of this.paymentInstructions) {
      if (instruction.currency !== 'USD') {
        throw new Error('ACH payments must use USD as currency');
      }
    }
  }
  /**
   * Generates payment information for a single ACH credit transfer instruction.
   * @param {ACHCreditPaymentInstruction} instruction - The payment instruction.
   * @returns {Object} The payment information object formatted according to ACH specifications.
   */
  creditTransfer(instruction) {
    const paymentInstructionId = sanitize(instruction.id || generateId(), 35);
    const endToEndId = sanitize(
      instruction.endToEndId || instruction.id || generateId(),
      35,
    );
    return {
      PmtId: {
        InstrId: paymentInstructionId,
        EndToEndId: endToEndId,
      },
      Amt: {
        InstdAmt: {
          '#': formatMinorUnits(instruction.amount, instruction.currency),
          '@Ccy': instruction.currency,
        },
      },
      CdtrAgt: this.agent(instruction.creditor.agent),
      Cdtr: this.party(instruction.creditor),
      CdtrAcct: {
        Id: {
          Othr: {
            Id: instruction.creditor.account.accountNumber,
          },
        },
        Tp: {
          Cd: 'CACC',
        },
        Ccy: instruction.currency,
      },
      RmtInf: instruction.remittanceInformation
        ? {
            Ustrd: instruction.remittanceInformation,
          }
        : undefined,
    };
  }
  /**
   * Serializes the ACH credit transfer initiation to an XML string.
   * @returns {string} The XML representation of the ACH credit transfer initiation.
   */
  serialize() {
    const builder = PaymentInitiation.getBuilder();
    const xml = {
      '?xml': {
        '@version': '1.0',
        '@encoding': 'UTF-8',
      },
      Document: {
        '@xmlns': this.namespace,
        '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        CstmrCdtTrfInitn: {
          GrpHdr: {
            MsgId: this.messageId,
            CreDtTm: this.creationDate.toISOString(),
            NbOfTxs: this.paymentInstructions.length.toString(),
            CtrlSum: this.formattedPaymentSum,
            InitgPty: {
              Nm: this.initiatingParty.name,
              Id: {
                OrgId: {
                  BICOrBEI: this.initiatingParty.id,
                },
              },
            },
          },
          PmtInf: {
            PmtInfId: this.paymentInformationId,
            PmtMtd: 'TRF',
            BtchBookg: false,
            NbOfTxs: this.paymentInstructions.length.toString(),
            CtrlSum: this.formattedPaymentSum,
            PmtTpInf: {
              InstrPrty: this.instructionPriority,
              SvcLvl: { Cd: this.serviceLevel },
              LclInstrm: { Prtry: this.localInstrument },
            },
            ReqdExctnDt: this.creationDate.toISOString().split('T')[0],
            Dbtr: this.party(this.initiatingParty),
            DbtrAcct: this.account(this.initiatingParty.account),
            DbtrAgt: this.agent(this.initiatingParty.agent),
            ChrgBr: 'SHAR',
            // payments[]
            CdtTrfTxInf: this.paymentInstructions.map(p =>
              this.creditTransfer(p),
            ),
          },
        },
      },
    };
    return builder.build(xml);
  }
  /**
   * Creates an ACHCreditPaymentInitiation instance from an XML string.
   * @param {string} rawXml - The XML string to parse.
   * @returns {ACHCreditPaymentInitiation} A new ACHCreditPaymentInitiation instance.
   * @throws {InvalidXmlError} If the XML format is invalid.
   * @throws {InvalidXmlNamespaceError} If the XML namespace is invalid.
   * @throws {Error} If multiple payment information blocks are found.
   */
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (
      !namespace.startsWith(
        `${XMLNS_PREFIX}${ISO20022SchemaId.PAIN_001_001_03}`,
      )
    ) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
    }
    const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
    const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
    if (Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf)) {
      throw new Error('Multiple PmtInf is not supported');
    }
    // Extract payment type information
    xml.Document.CstmrCdtTrfInitn.PmtInf.PmtTpInf;
    // Assuming we have one PmtInf / one Debtor, we can hack together this information from InitgPty / Dbtr
    const initiatingParty = {
      name:
        xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm ||
        xml.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
      id:
        xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.BICOrBEI ||
        xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.Othr?.Id,
      agent: parseAgent(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt),
      account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
    };
    const rawInstructions = Array.isArray(
      xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf,
    )
      ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
      : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
    const paymentInstructions = rawInstructions.map(inst => {
      const currency = inst.Amt.InstdAmt['@_Ccy'];
      const amount = parseAmountToMinorUnits(
        Number(inst.Amt.InstdAmt['#text']),
        currency,
      );
      const rawPostalAddress = inst.Cdtr.PstlAdr;
      return {
        ...(inst.PmtId.InstrId && {
          id: inst.PmtId.InstrId.toString(),
        }),
        ...(inst.PmtId.EndToEndId && {
          endToEndId: inst.PmtId.EndToEndId.toString(),
        }),
        type: 'ach',
        direction: 'credit',
        amount: amount,
        currency: currency,
        creditor: {
          name: inst.Cdtr?.Nm,
          agent: parseAgent(inst.CdtrAgt),
          account: parseAccount(inst.CdtrAcct),
          ...(rawPostalAddress &&
          (rawPostalAddress.StrtNm ||
            rawPostalAddress.BldgNb ||
            rawPostalAddress.PstCd ||
            rawPostalAddress.TwnNm ||
            rawPostalAddress.Ctry)
            ? {
                address: {
                  ...(rawPostalAddress.StrtNm && {
                    streetName: rawPostalAddress.StrtNm.toString(),
                  }),
                  ...(rawPostalAddress.BldgNb && {
                    buildingNumber: rawPostalAddress.BldgNb.toString(),
                  }),
                  ...(rawPostalAddress.TwnNm && {
                    townName: rawPostalAddress.TwnNm.toString(),
                  }),
                  ...(rawPostalAddress.CtrySubDvsn && {
                    countrySubDivision: rawPostalAddress.CtrySubDvsn.toString(),
                  }),
                  ...(rawPostalAddress.PstCd && {
                    postalCode: rawPostalAddress.PstCd.toString(),
                  }),
                  ...(rawPostalAddress.Ctry && {
                    country: rawPostalAddress.Ctry,
                  }),
                },
              }
            : {}),
        },
        ...(inst.RmtInf?.Ustrd && {
          remittanceInformation: inst.RmtInf.Ustrd.toString(),
        }),
      };
    });
    return new ACHCreditPaymentInitiation({
      messageId: messageId,
      creationDate: creationDate,
      initiatingParty: initiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
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
class SEPADirectDebitPaymentInitiation extends PaymentInitiation {
  initiatingParty;
  messageId;
  creationDate;
  paymentInstructions;
  formattedPaymentSum;
  totalTransactionCount;
  get schemaId() {
    return ISO20022SchemaId.PAIN_008_001_02;
  }
  /**
   * Creates an instance of SEPADirectDebitPaymentInitiation.
   * @param {SEPADirectDebitPaymentInitiationConfig} config - The configuration object for the SEPA direct debit.
   */
  constructor(config) {
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
  countAllTransactions() {
    return this.paymentInstructions.reduce((total, group) => {
      return total + group.payments.length;
    }, 0);
  }
  /**
   * Calculates the sum of all payment instructions across all groups.
   * @private
   * @returns {string} The total sum formatted as a string with 2 decimal places.
   */
  sumAllPayments() {
    let totalAmount = 0;
    let currency = null;
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
  validate() {
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
  validateGroupInstructionsHaveSameCurrency(payments) {
    if (
      !payments.every(i => {
        return i.currency === payments[0].currency;
      })
    ) {
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
  directDebitTransfer(instruction) {
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
        DbtrAgt: this.agent(instruction.debtor.agent),
      }),
      Dbtr: this.party(instruction.debtor),
      DbtrAcct: this.account(instruction.debtor.account),
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
  serialize() {
    const builder = PaymentInitiation.getBuilder();
    // Generate one PmtInf entry per creditor group
    const paymentInfoEntries = this.paymentInstructions.map(group => {
      const pmtInfId = group.paymentInformationId ?? generateId();
      const localInstrument = group.localInstrument || 'CORE';
      const batchBooking =
        group.batchBooking !== undefined ? group.batchBooking : false;
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
        CdtrAcct: this.account(group.creditor.account),
        ...(group.creditor.agent && {
          CdtrAgt: this.agent(group.creditor.agent),
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
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    // Validate XML structure
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    // Validate namespace
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (!namespace.startsWith(`${XMLNS_PREFIX}pain.008`)) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.008 namespace');
    }
    // Extract GrpHdr data
    const messageId = xml.Document.CstmrDrctDbtInitn.GrpHdr.MsgId;
    const creationDate = new Date(
      xml.Document.CstmrDrctDbtInitn.GrpHdr.CreDtTm,
    );
    // Extract top-level initiating party from GrpHdr
    const topLevelInitiatingParty = {
      name: xml.Document.CstmrDrctDbtInitn.GrpHdr.InitgPty.Nm,
      id: xml.Document.CstmrDrctDbtInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr?.Id,
    };
    // Normalize PmtInf to array (handle both single object and array cases)
    const rawPmtInf = Array.isArray(xml.Document.CstmrDrctDbtInitn.PmtInf)
      ? xml.Document.CstmrDrctDbtInitn.PmtInf
      : [xml.Document.CstmrDrctDbtInitn.PmtInf];
    // Map each PmtInf to SEPADirectDebitPaymentInstructionGroup
    const paymentInstructions = rawPmtInf.map(pmtInf => {
      // Extract creditor info as the group's collecting party
      const groupCreditor = {
        name: pmtInf.Cdtr.Nm,
        id: pmtInf.Cdtr.Id?.OrgId?.Othr?.Id,
        agent: parseAgent(pmtInf.CdtrAgt),
        account: parseAccount(pmtInf.CdtrAcct),
      };
      // Extract creditor scheme ID
      const creditorSchemeId = pmtInf.CdtrSchmeId?.Id?.PrvtId?.Othr?.Id || '';
      // Extract optional category purpose
      const categoryPurpose = pmtInf.PmtTpInf?.CtgyPurp?.Cd;
      // Extract local instrument (CORE or B2B)
      const localInstrument = pmtInf.PmtTpInf?.LclInstrm?.Cd || 'CORE';
      // Extract sequence type from PmtInf level
      const sequenceType = pmtInf.PmtTpInf?.SeqTp || 'RCUR';
      // Extract requested collection date
      const requestedCollectionDate = new Date(pmtInf.ReqdColltnDt);
      // Extract batch booking
      const batchBooking =
        pmtInf.BtchBookg === 'true' || pmtInf.BtchBookg === true;
      // Normalize DrctDbtTxInf to array
      const rawInstructions = Array.isArray(pmtInf.DrctDbtTxInf)
        ? pmtInf.DrctDbtTxInf
        : [pmtInf.DrctDbtTxInf];
      // Parse each DrctDbtTxInf to SEPADirectDebitPaymentInstruction
      const payments = rawInstructions.map(inst => {
        const currency = inst.InstdAmt['@_Ccy'];
        const amount = parseAmountToMinorUnits(
          Number(inst.InstdAmt['#text']),
          currency,
        );
        const mandate = parseMandate(inst.DrctDbtTx?.MndtRltdInf);
        return {
          ...(inst.PmtId?.InstrId && {
            instrId: inst.PmtId.InstrId.toString(),
          }),
          ...(inst.PmtId.EndToEndId && {
            endToEndId: inst.PmtId.EndToEndId.toString(),
          }),
          type: 'sepa',
          direction: 'debit',
          amount: amount,
          currency: currency,
          debtor: {
            name: inst.Dbtr?.Nm,
            agent: parseAgent(inst.DbtrAgt),
            account: parseAccount(inst.DbtrAcct),
          },
          mandate: mandate,
          ...(inst.RmtInf?.Ustrd && {
            remittanceInformation: inst.RmtInf.Ustrd.toString(),
          }),
        };
      });
      const paymentInformationId = pmtInf.PmtInfId?.toString();
      return {
        creditor: groupCreditor,
        creditorSchemeId: creditorSchemeId,
        payments: payments,
        requestedCollectionDate: requestedCollectionDate,
        sequenceType: sequenceType,
        localInstrument: localInstrument,
        ...(categoryPurpose && { categoryPurpose }),
        batchBooking: batchBooking,
        ...(paymentInformationId && { paymentInformationId }),
      };
    });
    // Return new instance
    return new SEPADirectDebitPaymentInitiation({
      messageId: messageId,
      creationDate: creationDate,
      initiatingParty: topLevelInitiatingParty,
      paymentInstructions: paymentInstructions,
    });
  }
}

class CashManagementGetAccount {
  _data;
  constructor(data) {
    this._data = data;
  }
  get data() {
    return this._data;
  }
  static supportedMessages() {
    return [ISO20022Messages.CAMT_003];
  }
  static fromDocumentOject(doc) {
    const rawHeader = doc.Document?.GetAcct?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError(
        'Invalid CAMT.003 document: missing MsgHdr',
      );
    }
    const header = parseMessageHeader(rawHeader);
    const newCrit = doc.Document?.GetAcct?.AcctQryDef?.AcctCrit?.NewCrit;
    if (!newCrit) {
      throw new InvalidStructureError(
        'Invalid CAMT.003 document: missing GetAcct.AcctQryDef.AcctCrit.NewCrit',
      );
    }
    const name = newCrit.NewQryNm;
    let searchCriteria = [];
    let rawCriterias = newCrit.SchCrit;
    if (!Array.isArray(rawCriterias)) {
      rawCriterias = [rawCriterias];
    }
    rawCriterias = rawCriterias.filter(c => !!c);
    if (rawCriterias.length === 0) {
      throw new InvalidStructureError(
        'Invalid CAMT.003 document: missing search criteria',
      );
    }
    for (const rawCriterium of rawCriterias) {
      const crit = {};
      // search on Ids, only one criterium supported for now
      if (rawCriterium.AcctId) {
        if (
          Array.isArray(rawCriterium.AcctId) &&
          rawCriterium.AcctId.length > 1
        ) {
          throw new InvalidStructureError(
            'Invalid CAMT.003 document: multiple AcctId criterium not supported',
          );
        }
        const acctId = Array.isArray(rawCriterium.AcctId)
          ? rawCriterium.AcctId[0]
          : rawCriterium.AcctId;
        if (acctId.CTTxt) {
          crit.accountRegExp = `.*${acctId.CTTxt}.*`; // contains
        } else if (acctId.NCTTxt) {
          crit.accountRegExp = `^((?!${acctId.NCTTxt}).)*$`; // does not contain
        } else if (acctId.EQ) {
          crit.accountEqualTo = parseAccountIdentification(acctId.EQ);
        }
      }
      // search on currency
      if (rawCriterium.Ccy) {
        if (Array.isArray(rawCriterium.Ccy) && rawCriterium.Ccy.length > 1) {
          throw new InvalidStructureError(
            'Invalid CAMT.003 document: multiple Ccy criterium not supported',
          );
        }
        const ccy = Array.isArray(rawCriterium.Ccy)
          ? rawCriterium.Ccy[0]
          : rawCriterium.Ccy;
        crit.currencyEqualTo = ccy;
      }
      // search on balance as of date
      if (rawCriterium.Bal) {
        if (Array.isArray(rawCriterium.Bal) && rawCriterium.Bal.length > 1) {
          throw new InvalidStructureError(
            'Invalid CAMT.003 document: multiple Bal criterium not supported',
          );
        }
        const bal = Array.isArray(rawCriterium.Bal)
          ? rawCriterium.Bal[0]
          : rawCriterium.Bal;
        if (bal?.ValDt && Array.isArray(bal.ValDt) && bal.ValDt.length > 1) {
          throw new InvalidStructureError(
            'Invalid CAMT.003 document: multiple ValDt criterium not supported',
          );
        }
        const valDt = Array.isArray(bal?.ValDt) ? bal.ValDt[0] : bal?.ValDt;
        if (valDt?.Dt?.EQDt) {
          crit.balanceAsOfDateEqualTo = parseDate(valDt.Dt.EQDt);
        }
      }
      searchCriteria.push(crit);
    }
    return new CashManagementGetAccount({
      header,
      newCriteria: {
        name,
        searchCriteria,
      },
    });
  }
  static fromXML(xml) {
    const parser = XML.getParser();
    const doc = parser.parse(xml);
    if (!doc.Document) {
      throw new Error('Invalid XML format');
    }
    const namespace = doc.Document['@_xmlns'] || doc.Document['@_Xmlns'];
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.003.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.003 namespace');
    }
    return CashManagementGetAccount.fromDocumentOject(doc);
  }
  static fromJSON(json) {
    const obj = JSON.parse(json);
    if (!obj.Document) {
      throw new Error('Invalid JSON format');
    }
    return CashManagementGetAccount.fromDocumentOject(obj);
  }
  serialize() {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.003.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    return builder.build(obj);
  }
  toJSON() {
    // we should not have to serialize but we do it for consistency
    const Document = {
      GetAcct: {
        MsgHdr: exportMessageHeader(this._data.header),
        AcctQryDef: {
          AcctCrit: {
            NewCrit: {
              NewQryNm: this._data.newCriteria?.name,
              SchCrit: this._data.newCriteria?.searchCriteria.map(c => {
                const obj = {};
                if (c.accountRegExp) {
                  if (
                    c.accountRegExp.startsWith('.*') &&
                    c.accountRegExp.endsWith('.*')
                  ) {
                    obj.AcctId = {
                      CTTxt: c.accountRegExp
                        .replace(/^\.\*/, '')
                        .replace(/\.\*$/, ''),
                    }; // contains
                  } else if (
                    c.accountRegExp.startsWith('^((?!') &&
                    c.accountRegExp.endsWith(').)*$')
                  ) {
                    obj.AcctId = {
                      NCTTxt: c.accountRegExp
                        .replace(/^\^\(\(\!\(/, '')
                        .replace(/\)\.\)\*\$$/, ''),
                    }; // does not contain
                  }
                } else if (c.accountEqualTo) {
                  obj.AcctId = {
                    EQ: exportAccountIdentification(c.accountEqualTo),
                  };
                }
                if (c.currencyEqualTo) {
                  obj.Ccy = [c.currencyEqualTo];
                }
                if (c.balanceAsOfDateEqualTo) {
                  obj.Bal = [
                    {
                      ValDt: [
                        {
                          Dt: {
                            EQDt: c.balanceAsOfDateEqualTo
                              .toISOString()
                              .slice(0, 10),
                          },
                        },
                      ],
                    },
                  ];
                }
                return obj;
              }),
            },
          },
        },
      },
    };
    return { Document };
  }
}
registerISO20022Implementation(CashManagementGetAccount);

const parseStatement = stmt => {
  const id = stmt.Id.toString();
  const electronicSequenceNumber = stmt.ElctrncSeqNb
    ? Number(stmt.ElctrncSeqNb)
    : undefined;
  const legalSequenceNumber = stmt.LglSeqNb ? Number(stmt.LglSeqNb) : undefined;
  const creationDate = new Date(stmt.CreDtTm);
  let fromDate;
  let toDate;
  if (stmt.FrToDt) {
    fromDate = new Date(stmt.FrToDt.FrDtTm);
    toDate = new Date(stmt.FrToDt.ToDtTm);
  }
  // Txn Summaries
  const numOfEntries =
    stmt.TxsSummry?.TtlNtries.NbOfNtries != null
      ? Number(stmt.TxsSummry.TtlNtries.NbOfNtries)
      : undefined;
  const sumOfEntries =
    stmt.TxsSummry?.TtlNtries.Sum != null
      ? Number(stmt.TxsSummry.TtlNtries.Sum)
      : undefined;
  const rawNetAmountOfEntries = stmt.TxsSummry?.TtlNtries.TtlNetNtryAmt;
  let netAmountOfEntries;
  // No currency information, default to USD
  if (rawNetAmountOfEntries) {
    netAmountOfEntries = parseAmountToMinorUnits(rawNetAmountOfEntries);
  }
  const numOfCreditEntries =
    stmt.TxsSummry?.TtlCdtNtries.NbOfNtries != null
      ? Number(stmt.TxsSummry.TtlCdtNtries.NbOfNtries)
      : undefined;
  const sumOfCreditEntries =
    stmt.TxsSummry?.TtlCdtNtries.Sum != null
      ? Number(stmt.TxsSummry.TtlCdtNtries.Sum)
      : undefined;
  const numOfDebitEntries =
    stmt.TxsSummry?.TtlDbtNtries.NbOfNtries != null
      ? Number(stmt.TxsSummry.TtlDbtNtries.NbOfNtries)
      : undefined;
  const sumOfDebitEntries =
    stmt.TxsSummry?.TtlDbtNtries.Sum != null
      ? Number(stmt.TxsSummry.TtlDbtNtries.Sum)
      : undefined;
  // Get account information
  // TODO: Save account types here
  const account = parseAccount(stmt.Acct);
  const agent = stmt.Acct.Svcr ? parseAgent(stmt.Acct.Svcr) : undefined;
  let balances = [];
  if (Array.isArray(stmt.Bal)) {
    balances = stmt.Bal.map(parseBalance);
  } else if (stmt.Bal) {
    balances = [parseBalance(stmt.Bal)];
  }
  let entries = [];
  if (Array.isArray(stmt.Ntry)) {
    entries = stmt.Ntry.map(parseEntry);
  } else if (stmt.Ntry) {
    entries = [parseEntry(stmt.Ntry)];
  }
  return {
    id,
    electronicSequenceNumber,
    legalSequenceNumber,
    creationDate,
    fromDate,
    toDate,
    account,
    agent,
    numOfEntries,
    sumOfEntries,
    netAmountOfEntries,
    numOfCreditEntries,
    sumOfCreditEntries,
    numOfDebitEntries,
    sumOfDebitEntries,
    balances,
    entries,
  };
};
const exportStatement = stmt => {
  const obj = {
    Id: stmt.id,
    ElctrncSeqNb: stmt.electronicSequenceNumber,
    LglSeqNb: stmt.legalSequenceNumber,
    CreDtTm: stmt.creationDate.toISOString(),
    FrToDt:
      stmt.fromDate && stmt.toDate
        ? {
            FrDtTm: stmt.fromDate.toISOString().slice(0, 10),
            ToDtTm: stmt.toDate.toISOString().slice(0, 10),
          }
        : undefined,
    TxsSummry: {
      TtlNtries: {
        NbOfNtries: stmt.numOfEntries,
        Sum: stmt.sumOfEntries,
        TtlNetNtryAmt: stmt.netAmountOfEntries
          ? exportAmountToString(
              stmt.netAmountOfEntries,
              stmt.balances[0]?.currency,
            )
          : undefined,
      },
      TtlCdtNtries: {
        NbOfNtries: stmt.numOfCreditEntries,
        Sum: stmt.sumOfCreditEntries,
      },
      TtlDbtNtries: {
        NbOfNtries: stmt.numOfDebitEntries,
        Sum: stmt.sumOfDebitEntries,
      },
    },
    Acct: {
      ...exportAccount(stmt.account),
      Svcr: stmt.agent ? exportAgent(stmt.agent) : undefined,
    },
    Bal: stmt.balances.map(bal => exportBalance(bal)),
    Ntry: stmt.entries.map(entry => exportEntry(entry)),
  };
  return obj;
};
const parseBalance = balance => {
  const rawAmount = balance.Amt['#text'];
  const currency = balance.Amt['@_Ccy'];
  const amount = parseAmountToMinorUnits(rawAmount, currency);
  const creditDebitIndicator =
    balance.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const type = balance.Tp.CdOrPrtry.Cd;
  const date = parseDate(balance.Dt);
  return {
    date,
    amount,
    currency,
    creditDebitIndicator,
    type,
  };
};
const exportBalance = balance => {
  const obj = {
    Amt: {
      '#text': exportAmountToString(balance.amount, balance.currency),
      '@_Ccy': balance.currency,
    },
    CdtDbtInd: balance.creditDebitIndicator === 'credit' ? 'CRDT' : 'DBIT',
    Tp: {
      CdOrPrtry: {
        Cd: balance.type,
      },
    },
    Dt: {
      DtTm: balance.date.toISOString(),
    },
  };
  return obj;
};
const parseBalanceReport = (currency, balance) => {
  const rawAmount = balance.Amt;
  const amount = parseAmountToMinorUnits(rawAmount, currency);
  const creditDebitIndicator =
    balance.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const type = balance.Tp?.Cd || balance.Tp?.Prtry;
  const valueDate = parseDate(balance.ValDt?.Dt);
  const processingDate = parseDate(balance.PrcgDt?.DtTm);
  return {
    amount,
    creditDebitIndicator,
    type,
    valueDate,
    processingDate,
  };
};
const exportBalanceReport = (currency, balance) => {
  const obj = {
    Amt: exportAmountToString(balance.amount, currency),
    CdtDbtInd: balance.creditDebitIndicator === 'credit' ? 'CRDT' : 'DBIT',
    Tp: {
      Cd: balance.type, // TODO add Prtry handling
    },
    ValDt: {
      Dt: balance.valueDate?.toISOString().slice(0, 10),
    },
    PrcgDt: {
      DtTm: balance.processingDate?.toISOString(),
    },
  };
  return obj;
};
const parseEntry = entry => {
  const referenceId = entry.NtryRef;
  const creditDebitIndicator = entry.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
  const bookingDate = parseDate(entry.BookgDt);
  const reversal = entry.RvslInd === true || entry.RvslInd === 'true';
  const rawAmount = entry.Amt['#text'];
  const currency = entry.Amt['@_Ccy'];
  const amount = parseAmountToMinorUnits(rawAmount, currency);
  const proprietaryCode = entry.BkTxCd.Prtry?.Cd;
  const additionalInformation = parseAdditionalInformation(entry.AddtlNtryInf);
  const accountServicerReferenceId = entry.AcctSvcrRef;
  const bankTransactionCode = parseBankTransactionCode(entry.BkTxCd);
  // Currently, we flatten entry details into a list of TransactionDetails
  let rawEntryDetails = entry.NtryDtls || [];
  if (!Array.isArray(rawEntryDetails)) {
    rawEntryDetails = [rawEntryDetails];
  }
  const transactions = rawEntryDetails
    .map(rawDetail => {
      // Get list of transaction details, even if it's singleton
      let transactionDetails = rawDetail.TxDtls || [];
      if (!Array.isArray(transactionDetails)) {
        transactionDetails = [transactionDetails];
      }
      return transactionDetails.map(parseTransactionDetail);
    })
    .flat();
  return {
    referenceId,
    creditDebitIndicator,
    bookingDate,
    reversal,
    amount,
    currency,
    proprietaryCode,
    transactions,
    additionalInformation,
    accountServicerReferenceId,
    bankTransactionCode,
  };
};
const exportEntry = entry => {
  const obj = {
    NtryRef: entry.referenceId,
    CdtDbtInd: entry.creditDebitIndicator === 'credit' ? 'CRDT' : 'DBIT',
    BookgDt: {
      DtTm: entry.bookingDate.toISOString(),
    },
    RvslInd: entry.reversal,
    Amt: {
      '#text': exportAmountToString(entry.amount, entry.currency),
      '@_Ccy': entry.currency,
    },
    BkTxCd: exportBankTransactionCode(
      entry.bankTransactionCode,
      entry.proprietaryCode,
    ),
    AddtlNtryInf: entry.additionalInformation,
    AcctSvcrRef: entry.accountServicerReferenceId,
    NtryDtls: entry.transactions.map(tx => ({
      TxDtls: exportTransactionDetails(tx),
    })),
  };
  return obj;
};
const parseTransactionDetail = transactionDetail => {
  const messageId = transactionDetail.Refs?.MsgId;
  const accountServicerReferenceId = transactionDetail.Refs?.AcctSvcrRef;
  const paymentInformationId = transactionDetail.Refs?.PmtInfId;
  const remittanceInformation = transactionDetail.RmtInf?.Ustrd;
  const proprietaryPurpose = transactionDetail.Purp?.Prtry;
  const returnReason = transactionDetail.RtrInf?.Rsn;
  const returnAdditionalInformation = transactionDetail.RtrInf?.AddtlInf;
  const endToEndId = transactionDetail.Refs?.EndToEndId;
  // Get Debtor information if 'Dbtr' is present
  let debtor;
  let debtorName;
  let debtorAccount;
  let debtorAgent;
  if (transactionDetail.RltdPties?.Dbtr) {
    debtorName =
      transactionDetail.RltdPties.Dbtr.Nm ??
      transactionDetail.RltdPties.Dbtr.Pty?.Nm;
  }
  if (transactionDetail.RltdPties?.DbtrAcct) {
    debtorAccount = parseAccount(transactionDetail.RltdPties.DbtrAcct);
  }
  if (transactionDetail.RltdAgts?.DbtrAgt) {
    debtorAgent = parseAgent(transactionDetail.RltdAgts.DbtrAgt);
  }
  if (debtorName || debtorAccount || debtorAgent) {
    debtor = {
      name: debtorName,
      account: debtorAccount,
      agent: debtorAgent,
    };
  }
  // Get Creditor information if 'Cdtr' is presentt
  let creditor;
  let creditorName;
  let creditorAccount;
  let creditorAgent;
  if (transactionDetail.RltdPties?.Cdtr) {
    creditorName =
      transactionDetail.RltdPties.Cdtr.Nm ??
      transactionDetail.RltdPties.Cdtr.Pty?.Nm;
  }
  if (transactionDetail.RltdPties?.CdtrAcct) {
    creditorAccount = parseAccount(transactionDetail.RltdPties.CdtrAcct);
  }
  if (transactionDetail.RltdAgts?.CdtrAgt) {
    creditorAgent = parseAgent(transactionDetail.RltdAgts.CdtrAgt);
  }
  if (creditorName || creditorAccount || creditorAgent) {
    creditor = {
      name: creditorName,
      account: creditorAccount,
      agent: creditorAgent,
    };
  }
  return {
    messageId,
    accountServicerReferenceId,
    endToEndId,
    paymentInformationId,
    remittanceInformation,
    proprietaryPurpose,
    returnReason,
    returnAdditionalInformation,
    debtor,
    creditor,
  };
};
const exportTransactionDetails = tx => {
  const obj = {
    Refs: {
      MsgId: tx.messageId,
      AcctSvcrRef: tx.accountServicerReferenceId,
      PmtInfId: tx.paymentInformationId,
      EndToEndId: tx.endToEndId,
    },
    RmtInf: {
      Ustrd: tx.remittanceInformation,
    },
    Purp: {
      Prtry: tx.proprietaryPurpose,
    },
    RtrInf: {
      Rsn: tx.returnReason,
      AddtlInf: tx.returnAdditionalInformation,
    },
  };
  if (tx.debtor) {
    obj.RltdPties = {
      ...obj.RltdPties,
      Dbtr: {
        Nm: tx.debtor.name,
      },
      DbtrAcct: tx.debtor.account
        ? exportAccount(tx.debtor.account)
        : undefined,
    };
    obj.RltdAgts = {
      DbtrAgt: tx.debtor.agent ? exportAgent(tx.debtor.agent) : undefined,
    };
  }
  if (tx.creditor) {
    obj.RltdPties = {
      ...obj.RltdPties,
      Cdtr: {
        Nm: tx.creditor.name,
      },
      CdtrAcct: tx.creditor.account
        ? exportAccount(tx.creditor.account)
        : undefined,
    };
    obj.RltdAgts = {
      CdtrAgt: tx.creditor.agent ? exportAgent(tx.creditor.agent) : undefined,
    };
  }
  return obj;
};
const parseBankTransactionCode = transactionCode => {
  const domainCode = transactionCode?.Domn?.Cd;
  const domainFamilyCode = transactionCode?.Domn?.Fmly?.Cd;
  const domainSubFamilyCode = transactionCode?.Domn?.Fmly?.SubFmlyCd;
  const proprietaryCode = transactionCode.Prtry?.Cd;
  const proprietaryCodeIssuer = transactionCode.Prtry?.Issr;
  return {
    domainCode,
    domainFamilyCode,
    domainSubFamilyCode,
    proprietaryCode,
    proprietaryCodeIssuer,
  };
};
const exportBankTransactionCode = (bankTransactionCode, proprietaryCode) => {
  const obj = {};
  if (proprietaryCode) {
    obj.Prtry = { Cd: proprietaryCode };
  }
  if (bankTransactionCode) {
    obj.Domn = {
      Cd: bankTransactionCode.domainCode,
      Fmly: {
        Cd: bankTransactionCode.domainFamilyCode,
        SubFmlyCd: bankTransactionCode.domainSubFamilyCode,
      },
    };
    if (bankTransactionCode.proprietaryCode) {
      obj.Prtry = {
        Cd: bankTransactionCode.proprietaryCode,
        Issr: bankTransactionCode.proprietaryCodeIssuer,
      };
    }
  }
  return obj;
};
const parseBusinessError = bizErr => {
  const code = bizErr.Err?.Cd || bizErr.Err?.Prtry || 'UKNW';
  const description = bizErr.Desc;
  return {
    code,
    description,
  };
};
const exportBusinessError = bizErr => {
  const obj = {
    Err: {
      Cd: bizErr.code, // TODO: Add Prtry handling
    },
    Desc: bizErr.description,
  };
  return obj;
};

class CashManagementReturnAccount {
  _data;
  constructor(data) {
    this._data = data;
  }
  get data() {
    return this._data;
  }
  static supportedMessages() {
    return [ISO20022Messages.CAMT_004];
  }
  static fromDocumentOject(doc) {
    const rawHeader = doc.Document?.RtrAcct?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError(
        'Invalid CAMT.004 document: missing MsgHdr',
      );
    }
    const header = parseMessageHeader(rawHeader);
    // interpret the report
    let rawReports = doc.Document?.RtrAcct?.RptOrErr?.AcctRpt;
    if (!Array.isArray(rawReports)) rawReports = [rawReports];
    rawReports = rawReports.filter(r => !!r); // remove null/undefined
    const reports = rawReports.map(r => {
      const accountId = parseAccountIdentification(r.AcctId);
      let report = undefined;
      let error = undefined;
      if (r.AcctOrErr?.Acct) {
        // report
        if (!r.AcctOrErr.Acct.Ccy) {
          throw new InvalidStructureError(
            'Invalid CAMT.004 document: missing Ccy in Acct',
          );
        }
        let rawMulBal = r.AcctOrErr.Acct.MulBal;
        if (!Array.isArray(rawMulBal)) rawMulBal = [rawMulBal];
        rawMulBal = rawMulBal.filter(b => !!b);
        report = {
          currency: r.AcctOrErr.Acct.Ccy,
          name: r.AcctOrErr.Acct.Nm,
          type: r.AcctOrErr.Acct.Tp?.Cd || r.AcctOrErr.Acct.Tp?.Prtry,
          balances: rawMulBal.map(bal =>
            parseBalanceReport(r.AcctOrErr.Acct.Ccy, bal),
          ),
        };
        if (report.balances.length === 0) {
          throw new InvalidStructureError(
            'Invalid CAMT.004 document: missing MulBal in Acct',
          );
        }
      } else if (r.AcctOrErr?.BizErr) {
        // business error
        error = parseBusinessError(r.AcctOrErr.BizErr);
      } else {
        throw new InvalidStructureError(
          'Invalid CAMT.004 document: missing AcctOrErr',
        );
      }
      return { accountId, report, error };
    });
    return new CashManagementReturnAccount({
      header,
      reports,
    });
  }
  static fromXML(xml) {
    const parser = XML.getParser();
    const doc = parser.parse(xml);
    if (!doc.Document) {
      throw new Error('Invalid XML format');
    }
    const namespace = doc.Document['@_xmlns'] || doc.Document['@_Xmlns'];
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.004.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.004 namespace');
    }
    return CashManagementReturnAccount.fromDocumentOject(doc);
  }
  static fromJSON(json) {
    const obj = JSON.parse(json);
    if (!obj.Document) {
      throw new Error('Invalid JSON format');
    }
    return CashManagementReturnAccount.fromDocumentOject(obj);
  }
  serialize() {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.004.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    return builder.build(obj);
  }
  toJSON() {
    // we should not have to serialize but we do it for consistency
    const Document = {
      RtrAcct: {
        MsgHdr: exportMessageHeader(this._data.header),
        RptOrErr: {
          AcctRpt: this._data.reports.map(report => {
            const obj = {
              AcctId: exportAccountIdentification(report.accountId),
              AcctOrErr: {}, // filled below
            };
            if (report.report) {
              obj.AcctOrErr.Acct = {
                Ccy: report.report.currency,
                Nm: report.report.name,
                Tp: { Cd: report.report.type }, // TODO add Prtry handling
                MulBal: report.report.balances.map(bal =>
                  exportBalanceReport(report.report.currency, bal),
                ),
              };
            } else if (report.error) {
              obj.AcctOrErr.BizErr = exportBusinessError(report.error);
            }
            return obj;
          }),
        },
      },
    };
    return { Document };
  }
}
registerISO20022Implementation(CashManagementReturnAccount);

class CashManagementGetTransaction {
  _data;
  constructor(data) {
    this._data = data;
  }
  get data() {
    return this._data;
  }
  static supportedMessages() {
    return [ISO20022Messages.CAMT_005];
  }
  static fromDocumentOject(doc) {
    const rawHeader = doc.Document?.GetTx?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError(
        'Invalid CAMT.005 document: missing MsgHdr',
      );
    }
    const header = parseMessageHeader(rawHeader);
    const newCrit = doc.Document?.GetTx?.TxQryDef?.TxCrit?.NewCrit;
    if (!newCrit) {
      throw new InvalidStructureError(
        'Invalid CAMT.005 document: missing GetTx.TxQryDef.TxCrit.NewCrit',
      );
    }
    const name = newCrit.NewQryNm;
    let searchCriteria = [];
    let rawCriterias = newCrit.SchCrit;
    if (!Array.isArray(rawCriterias)) {
      rawCriterias = [rawCriterias];
    }
    rawCriterias = rawCriterias.filter(c => !!c);
    if (rawCriterias.length === 0) {
      throw new InvalidStructureError(
        'Invalid CAMT.005 document: missing search criteria',
      );
    }
    for (const rawCriterium of rawCriterias) {
      // search on Ids
      if (rawCriterium.PmtSch.MsgId) {
        searchCriteria.push({
          type: 'PmtSch.MsgId',
          msgIdsEqualTo: Array.isArray(rawCriterium.PmtSch.MsgId)
            ? rawCriterium.PmtSch.MsgId
            : [rawCriterium.PmtSch.MsgId],
        });
      }
      // seach on date
      if (rawCriterium.PmtSch.ReqdExctnDt) {
        if (
          Array.isArray(rawCriterium.PmtSch.ReqdExctnDt) &&
          rawCriterium.PmtSch.ReqdExctnDt.length > 1
        ) {
          throw new InvalidStructureError(
            'Invalid CAMT.005 document: multiple ReqdExctnDt criterium not supported',
          );
        }
        const criterium = Array.isArray(rawCriterium.PmtSch.ReqdExctnDt)
          ? rawCriterium.PmtSch.ReqdExctnDt[0]
          : rawCriterium.PmtSch.ReqdExctnDt;
        if (criterium?.DtSch?.EQDt) {
          searchCriteria.push({
            type: 'PmtSch.ReqdExctnDt',
            dateEqualTo: parseDate(criterium.DtSch.EQDt),
          });
        }
      }
      let pmtIds = Array.isArray(rawCriterium.PmtSch.PmtId)
        ? rawCriterium.PmtSch.PmtId
        : [rawCriterium.PmtSch.PmtId];
      pmtIds = pmtIds.filter(p => !!p && p.LngBizId?.EndToEndId);
      if (pmtIds.length > 0) {
        searchCriteria.push({
          type: 'PmtSch.PmtId.LngBizId.EndToEndId',
          endToEndIdEqualTo: pmtIds.map(id => id.LngBizId.EndToEndId),
        });
      }
    }
    return new CashManagementGetTransaction({
      header,
      newCriteria: {
        name,
        searchCriteria,
      },
    });
  }
  static fromXML(xml) {
    const parser = XML.getParser();
    const doc = parser.parse(xml);
    if (!doc.Document) {
      throw new Error('Invalid XML format');
    }
    const namespace = doc.Document['@_xmlns'] || doc.Document['@_Xmlns'];
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.005.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.005 namespace');
    }
    return CashManagementGetTransaction.fromDocumentOject(doc);
  }
  static fromJSON(json) {
    const obj = JSON.parse(json);
    if (!obj.Document) {
      throw new Error('Invalid JSON format');
    }
    return CashManagementGetTransaction.fromDocumentOject(obj);
  }
  serialize() {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.005.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    return builder.build(obj);
  }
  toJSON() {
    // we should not have to serialize but we do it for consistency
    const Document = {
      GetTx: {
        MsgHdr: exportMessageHeader(this._data.header),
        TxQryDef: {
          TxCrit: {
            NewCrit: {
              NewQryNm: this._data.newCriteria?.name,
              SchCrit: this._data.newCriteria?.searchCriteria.map(c => {
                const obj = {};
                if (c.type === 'PmtSch.MsgId' && c.msgIdsEqualTo) {
                  obj.PmtSch = {
                    MsgId: c.msgIdsEqualTo,
                  };
                }
                if (c.type === 'PmtSch.ReqdExctnDt' && c.dateEqualTo) {
                  obj.PmtSch = {
                    ReqdExctnDt: {
                      DtSch: {
                        EQDt: c.dateEqualTo.toISOString().slice(0, 10),
                      },
                    },
                  };
                }
                if (
                  c.type === 'PmtSch.PmtId.LngBizId.EndToEndId' &&
                  c.endToEndIdEqualTo
                ) {
                  obj.PmtSch = {
                    PmtId: c.endToEndIdEqualTo.map(id => ({
                      LngBizId: {
                        EndToEndId: id,
                      },
                    })),
                  };
                }
                return obj;
              }),
            },
          },
        },
      },
    };
    return { Document };
  }
}
registerISO20022Implementation(CashManagementGetTransaction);

class CashManagementReturnTransaction {
  _data;
  constructor(data) {
    this._data = data;
  }
  get data() {
    return this._data;
  }
  static supportedMessages() {
    return [ISO20022Messages.CAMT_006];
  }
  static fromDocumentOject(doc) {
    const rawHeader = doc.Document?.RtrTx?.MsgHdr;
    if (!rawHeader) {
      throw new InvalidStructureError(
        'Invalid CAMT.006 document: missing MsgHdr',
      );
    }
    const header = parseMessageHeader(rawHeader);
    // interpret the report
    let rawReports = doc.Document?.RtrTx?.RptOrErr?.BizRpt?.TxRpt;
    if (!Array.isArray(rawReports)) rawReports = [rawReports];
    rawReports = rawReports.filter(r => !!r); // remove null/undefined
    const reports = rawReports.map(r => {
      const rawAmount =
        r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Amt ||
        r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Amount; // some implementations use Amount instead of Amt
      const paymentId = {
        currency: r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Ccy,
        amount: parseAmountToMinorUnits(
          rawAmount,
          r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Ccy,
        ),
        endToEndId: r.PmtId?.LngBizId?.EndToEndId,
        transactionId: r.PmtId?.LngBizId?.TxId,
        uetr: r.PmtId?.LngBizId?.UETR,
      };
      // check required fields
      if (!paymentId.currency) {
        throw new InvalidStructureError(
          'Invalid CAMT.006 document: missing Ccy in PmtId.LngBizId.IntrBkSttlmAmt',
        );
      }
      if (
        paymentId.amount === undefined ||
        paymentId.amount === null ||
        isNaN(paymentId.amount)
      ) {
        throw new InvalidStructureError(
          'Invalid CAMT.006 document: missing or invalid Amt in PmtId.LngBizId.IntrBkSttlmAmt',
        );
      }
      if (!paymentId.endToEndId) {
        throw new InvalidStructureError(
          'Invalid CAMT.006 document: missing EndToEndId in PmtId.LngBizId',
        );
      }
      let report = undefined;
      let error = undefined;
      if (r.TxOrErr?.Tx) {
        // report
        const msgId = r.TxOrErr.Tx.Pmt?.MsgId;
        const reqExecutionDate = r.TxOrErr.Tx.Pmt?.ReqdExctnDt?.Dt
          ? parseDate(r.TxOrErr.Tx.Pmt.ReqdExctnDt)
          : undefined;
        const status = (sts => {
          if (!sts) return undefined;
          if (Array.isArray(sts) && sts.length === 0) return undefined;
          if (Array.isArray(sts)) sts = sts[0]; // take the first one only
          let code =
            sts.Cd?.Pdg ||
            sts.Cd?.Fnl ||
            sts.Cd?.RTGS ||
            sts.Cd?.Sttlm ||
            sts.Cd?.Prtly;
          if (code)
            code = Object.keys(sts.Cd)[0] + ':' + code; // prefix with the type of code
          else return undefined;
          const reason = sts.Rsn?.Prtry;
          return { code, reason };
        })(r.TxOrErr.Tx.Pmt?.Sts);
        // to parse debtor and creditor with their agents
        function parseParty$1(party) {
          const p = parseParty(party?.Pty || {}); // force a valid object
          if (party?.Agt) p.agent = { bic: party.Agt.FinInstnId?.BICFI };
          return p;
        }
        function parseAgent(agent) {
          if (!agent) return { bic: '' };
          return { bic: agent?.FinInstnId?.BICFI };
        }
        report = {
          msgId,
          reqExecutionDate,
          status,
          debtor: parseParty$1(r.TxOrErr.Tx.Pmt?.Pties?.Dbtr),
          debtorAgent: parseAgent(r.TxOrErr.Tx.Pmt?.Pties?.DbtrAgt),
          creditor: parseParty$1(r.TxOrErr.Tx.Pmt?.Pties?.Cdtr),
          creditorAgent: parseAgent(r.TxOrErr.Tx.Pmt?.Pties?.CdtrAgt),
        };
        // check the debtor and creditor required fields
        if (!report.debtor.id) {
          throw new InvalidStructureError(
            'Invalid CAMT.006 document: missing Id in TxOrErr.Tx.Dbtr.Pty',
          );
        }
        if (!report.creditor.id) {
          throw new InvalidStructureError(
            'Invalid CAMT.006 document: missing Id in TxOrErr.Tx.Cdtr.Pty',
          );
        }
      } else if (r.TxOrErr?.BizErr) {
        // business error
        error = parseBusinessError(r.TxOrErr.BizErr);
      } else {
        throw new InvalidStructureError(
          'Invalid CAMT.006 document: missing TxOrErr',
        );
      }
      return { paymentId, report, error };
    });
    return new CashManagementReturnTransaction({
      header,
      reports,
    });
  }
  static fromXML(xml) {
    const parser = XML.getParser();
    const doc = parser.parse(xml);
    if (!doc.Document) {
      throw new Error('Invalid XML format');
    }
    const namespace = doc.Document['@_xmlns'] || doc.Document['@_Xmlns'];
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.004.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.004 namespace');
    }
    return CashManagementReturnTransaction.fromDocumentOject(doc);
  }
  static fromJSON(json) {
    const obj = JSON.parse(json);
    if (!obj.Document) {
      throw new Error('Invalid JSON format');
    }
    return CashManagementReturnTransaction.fromDocumentOject(obj);
  }
  serialize() {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.004.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    return builder.build(obj);
  }
  toJSON() {
    // we should not have to serialize but we do it for consistency
    const Document = {
      RtrTx: {
        MsgHdr: exportMessageHeader(this._data.header),
        RptOrErr: {
          BizRpt: {
            TxRpt: this._data.reports.map(report => {
              const obj = {
                PmtId: {
                  LngBizId: {
                    IntrBkSttlmAmt: {
                      Amt: exportAmountToString(
                        report.paymentId.amount,
                        report.paymentId.currency,
                      ),
                      Amount: exportAmountToString(
                        report.paymentId.amount,
                        report.paymentId.currency,
                      ), // some implementations use Amount instead of Amt
                      Ccy: report.paymentId.currency,
                    },
                    UETR: report.paymentId.uetr,
                    TxId: report.paymentId.transactionId,
                    EndToEndId: report.paymentId.endToEndId,
                  },
                },
                TxOrErr: {}, // filled below
              };
              if (report.report) {
                function exportParty(p) {
                  if (!p) return undefined;
                  return {
                    Pty: {
                      Nm: p.name,
                      Id: p.id ? { OrgId: { Othr: { Id: p.id } } } : undefined,
                    },
                    Agt: exportAgent(p.agent),
                  };
                }
                function exportAgent(a) {
                  if (!a) return undefined;
                  if ('bic' in a && a.bic)
                    return { FinInstnId: { BICFI: a.bic } };
                  if ('abaRoutingNumber' in a && a.abaRoutingNumber)
                    return { FinInstId: { Othr: { Id: a.abaRoutingNumber } } };
                  return undefined;
                }
                const [codeType, code] = report.report.status
                  ? report.report.status.code.split(':')
                  : [undefined, undefined];
                obj.TxOrErr.Tx = {
                  Pmt: {
                    MsgId: report.report.msgId,
                    ReqdExctnDt: {
                      Dt: report.report.reqExecutionDate
                        ?.toISOString()
                        ?.slice(0, 10),
                    },
                    Sts: {
                      Cd: codeType ? { [codeType]: code } : undefined,
                      Rsn: report.report.status?.reason
                        ? { Prtry: report.report.status.reason }
                        : undefined,
                    },
                    Pties: {
                      Dbtr: exportParty(report.report.debtor),
                      DbtrAgt: exportAgent(report.report.debtorAgent),
                      Cdtr: exportParty(report.report.creditor),
                      CdtrAgt: exportAgent(report.report.creditorAgent),
                    },
                  },
                };
              } else if (report.error) {
                obj.TxOrErr.BizErr = exportBusinessError(report.error);
              }
              return obj;
            }),
          },
        },
      },
    };
    return { Document };
  }
}
registerISO20022Implementation(CashManagementReturnTransaction);

/**
 * Represents a Cash Management Account Report (CAMT.052.x).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from a CAMT.052 XML file.
 */
class CashManagementAccountReport {
  _messageId;
  _creationDate;
  _recipient;
  _statements;
  constructor(config) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._recipient = config.recipient;
    this._statements = config.statements;
  }
  static supportedMessages() {
    return [ISO20022Messages.CAMT_052];
  }
  get data() {
    return {
      messageId: this._messageId,
      creationDate: this._creationDate,
      recipient: this._recipient,
      statements: this._statements,
    };
  }
  static fromDocumentObject(obj) {
    const bankToCustomerAcctRpt = obj.Document.BkToCstmrAcctRpt;
    const rawCreationDate = bankToCustomerAcctRpt.GrpHdr.CreDtTm;
    const creationDate = new Date(rawCreationDate);
    let statements = [];
    if (Array.isArray(bankToCustomerAcctRpt.Rpt)) {
      statements = bankToCustomerAcctRpt.Rpt.map(stmt => parseStatement(stmt));
    } else {
      statements = [parseStatement(bankToCustomerAcctRpt.Rpt)];
    }
    const rawRecipient = bankToCustomerAcctRpt.GrpHdr.MsgRcpt;
    return new CashManagementAccountReport({
      messageId: bankToCustomerAcctRpt.GrpHdr.MsgId.toString(),
      creationDate,
      recipient: rawRecipient ? parseRecipient(rawRecipient) : undefined,
      statements: statements,
    });
  }
  /**
   * Creates a CashManagementAccountReport instance from a raw XML string.
   *
   * @param {string} rawXml - The raw XML string containing the CAMT.052 data.
   * @returns {CashManagementAccountReport} A new instance of CashManagementAccountReport.
   * @throws {Error} If the XML parsing fails or required data is missing.
   */
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.052.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.052 namespace');
    }
    return CashManagementAccountReport.fromDocumentObject(xml);
  }
  /**
   *
   * @param json - JSON string representing a CashManagementAccountReport
   * @returns {CashManagementAccountReport} A new instance of CashManagementAccountReport
   * @throws {Error} If the JSON parsing fails or required data is missing.
   */
  static fromJSON(json) {
    const obj = JSON.parse(json);
    if (!obj.Document) {
      throw new InvalidXmlError('Invalid JSON format');
    }
    return CashManagementAccountReport.fromDocumentObject(obj);
  }
  toJSON() {
    const Document = {
      BkToCstmrAcctRpt: {
        GrpHdr: {
          MsgId: this._messageId,
          CreDtTm: this._creationDate.toISOString(),
          MsgRcpt: this._recipient
            ? exportRecipient(this._recipient)
            : undefined,
        },
        Rpt: this._statements.map(stmt => exportStatement(stmt)),
      },
    };
    return { Document };
  }
  serialize() {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.052.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    return builder.build(obj);
  }
  /**
   * Retrieves all balances from all statements in the report.
   * @returns {Balance[]} An array of all balances across all statements.
   */
  get balances() {
    return this._statements.flatMap(statement => statement.balances);
  }
  /**
   * Retrieves all transactions from all statements in the report.
   * @returns {Transaction[]} An array of all transactions across all statements.
   */
  get transactions() {
    return this._statements
      .flatMap(statement => statement.entries)
      .flatMap(entry => entry.transactions);
  }
  /**
   * Retrieves all entries from all statements in the report.
   * @returns {Entry[]} An array of all entries across all statements.
   */
  get entries() {
    return this._statements.flatMap(statement => statement.entries);
  }
  /**
   * Gets the unique identifier for the message.
   * @returns {string} The message ID.
   */
  get messageId() {
    return this._messageId;
  }
  /**
   * Gets the party receiving the report.
   * @returns {Party | undefined} The recipient party information, or undefined if no recipient is set.
   */
  get recipient() {
    return this._recipient;
  }
  /**
   * Gets the date and time when the report was created.
   * @returns {Date} The creation date of the report.
   */
  get creationDate() {
    return this._creationDate;
  }
  /**
   * Gets all statements included in the report.
   * @returns {Statement[]} An array of all statements in the report.
   */
  get statements() {
    return this._statements;
  }
}
registerISO20022Implementation(CashManagementAccountReport);

// Types related to CAMT 053
/**
 * Balance types as defined in ISO 20022.
 * @see {@link https://www.iso20022.org/sites/default/files/2022-03/externalcodesets_4q2021_v2_1.xlsx}
 */
const BalanceTypeCode = {
  /** Closing balance of amount of money that is at the disposal of the account owner on the date specified. */
  ClosingAvailable: 'CLAV',
  /** Balance of the account at the end of the pre-agreed account reporting period. It is the sum of the opening booked balance at the beginning of the period and all entries booked to the account during the pre-agreed account reporting period. */
  ClosingBooked: 'CLBD',
  /** Forward available balance of money that is at the disposal of the account owner on the date specified. */
  ForwardAvailable: 'FWAV',
  /** Balance for informational purposes. */
  Information: 'INFO',
  /** Available balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified. */
  InterimAvailable: 'ITAV',
  /** Balance calculated in the course of the account servicer's business day, at the time specified, and subject to further changes during the business day. The interim balance is calculated on the basis of booked credit and debit items during the calculation time/period specified. */
  InterimBooked: 'ITBD',
  /** Opening balance of amount of money that is at the disposal of the account owner on the date specified. */
  OpeningAvailable: 'OPAV',
  /** Book balance of the account at the beginning of the account reporting period. It always equals the closing book balance from the previous report. */
  OpeningBooked: 'OPBD',
  /** Balance of the account at the previously closed account reporting period. The opening booked balance for the new period has to be equal to this balance. Usage: the previously booked closing balance should equal (inclusive date) the booked closing balance of the date it references and equal the actual booked opening balance of the current date. */
  PreviouslyClosedBooked: 'PRCD',
  /** Balance, composed of booked entries and pending items known at the time of calculation, which projects the end of day balance if everything is booked on the account and no other entry is posted. */
  Expected: 'XPCD',
  /** The difference between the excess/(deficit) investable balance and the excess/(deficit) collected balance due to the reserve requirement. This balance is not used if the account's Earnings Credit Rate is net of reserves. This may be used when the earnings allowance rate is not adjusted for reserves. It may be that reserves have been subtracted from the collected balance to determine the investable balance. Therefore, they must be added back to the excess/(deficit) investable balance to determine the collected balance position. The presentation of this calculation is optional. AFP code=00 04 21 */
  AdditionalBalReserveRequirement: 'ABRR',
};
/**
 * Description mapping of BalanceTypeCode values to their names.
 */
const BalanceTypeCodeDescriptionMap = {
  CLAV: 'Closing Available',
  CLBD: 'Closing Booked',
  FWAV: 'Forward Available',
  INFO: 'Information',
  ITAV: 'Interim Available',
  ITBD: 'Interim Booked',
  OPAV: 'Opening Available',
  OPBD: 'Opening Booked',
  PRCD: 'Previously Closed Booked',
  XPCD: 'Expected',
  ABRR: 'Additional Balance Reserve Requirement',
};

/**
 * Represents an ISO20022 core message creator.
 * This class provides methods to create various basic ISO20022 compliant messages.
 *
 * @example
 * const iso20022 = new ISO20022({
 *     initiatingParty: {
 *         name: 'Example Corp',
 *         id: 'EXAMPLECORP',
 *         account: {
 *             accountNumber: '123456789',
 *         },
 *         agent: {
 *             bic: 'CHASUS33',
 *             bankAddress: {
 *                 country: 'US',
 *             },
 *         },
 *     },
 * });
 */
class ISO20022 {
  initiatingParty;
  /**
   * Creates an instance of ISO20022.
   * @param {ISO20022Config} config - The configuration object for ISO20022.
   */
  constructor(config) {
    this.initiatingParty = config.initiatingParty;
  }
  /**
   * Creates a SWIFT Credit Payment Initiation message.
   * @param {SWIFTCreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
   * @example
   * const payment = iso20022.createSWIFTCreditPaymentInitiation({
   *   paymentInstructions: [
   *     {
   *       type: 'swift',
   *       direction: 'credit',
   *       amount: 1000,
   *       currency: 'USD',
   *       creditor: {
   *         name: 'Hans Schneider',
   *         account: {
   *           iban: 'DE1234567890123456',
   *         },
   *         agent: {
   *           bic: 'DEUTDEFF',
   *           bankAddress: {
   *             country: 'DE',
   *           },
   *         },
   *         address: {
   *           streetName: 'Hauptstraße',
   *           buildingNumber: '42',
   *           postalCode: '10115',
   *           townName: 'Berlin',
   *           country: 'DE',
   *         },
   *       },
   *       remittanceInformation: 'Invoice payment #123',
   *     },
   *   ],
   *   messageId: 'SWIFT-MSG-001', // Optional
   *   creationDate: new Date('2025-03-01'), // Optional
   * });
   * @returns {SWIFTCreditPaymentInitiation} A new SWIFT Credit Payment Initiation object.
   */
  createSWIFTCreditPaymentInitiation(config) {
    return new SWIFTCreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: config.paymentInstructions,
      messageId: config.messageId,
      creationDate: config.creationDate,
    });
  }
  /**
   * Creates a SEPA Credit Payment Initiation message.
   * @param {SEPACreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
   * @example
   * const payment = iso20022.createSEPACreditPaymentInitiation({
   *   paymentInstructions: [
   *     {
   *       type: 'sepa',
   *       direction: 'credit',
   *       amount: 1000, // €10.00 Euros
   *       currency: 'EUR',
   *       creditor: {
   *         name: 'Hans Schneider',
   *         account: {
   *           iban: 'DE1234567890123456',
   *         },
   *       },
   *       remittanceInformation: 'Invoice payment #123',
   *     },
   *   ],
   *   messageId: 'SEPA-MSG-001', // Optional
   *   creationDate: new Date('2025-03-01'), // Optional
   * });
   * @returns {SEPACreditPaymentInitiation} A new SEPA Credit Payment Initiation object.
   */
  createSEPACreditPaymentInitiation(config) {
    return new SEPACreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: config.paymentInstructions,
      messageId: config.messageId,
      creationDate: config.creationDate,
    });
  }
  /**
   * Creates a SEPA Multi Credit Payment Initiation message with multiple payment information blocks.
   * @param {SEPAMultiCreditPaymentInitiationConfig} config - Configuration containing payment instruction groups and optional parameters.
   * @example
   * const payment = iso20022.createSEPAMultiCreditPaymentInitiation({
   *   paymentInstructions: [
   *     {
   *       initiatingParty: debtor1,
   *       payments: [
   *         {
   *           type: 'sepa',
   *           direction: 'credit',
   *           amount: 1000, // €10.00 Euros
   *           currency: 'EUR',
   *           creditor: {
   *             name: 'Hans Schneider',
   *             account: {
   *               iban: 'DE1234567890123456',
   *             },
   *           },
   *           remittanceInformation: 'Invoice payment #123',
   *         },
   *       ],
   *       categoryPurpose: 'SALA', // Optional
   *     },
   *   ],
   *   messageId: 'SEPA-MULTI-MSG-001', // Optional
   *   creationDate: new Date('2025-03-01'), // Optional
   * });
   * @returns {SEPAMultiCreditPaymentInitiation} A new SEPA Multi Credit Payment Initiation object.
   */
  createSEPAMultiCreditPaymentInitiation(config) {
    return new SEPAMultiCreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: config.paymentInstructions,
      messageId: config.messageId,
      creationDate: config.creationDate,
    });
  }
  /**
   * Creates a RTP Credit Payment Initiation message.
   * @param {RTPCreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
   * @example
   * const payment = iso20022.createRTPCreditPaymentInitiation({
   *   paymentInstructions: [
   *     {
   *       type: 'rtp',
   *       direction: 'credit',
   *       amount: 100000, // $1000.00
   *       currency: 'USD',
   *       creditor: {
   *         name: 'All-American Dogs Co.',
   *         account: {
   *           accountNumber: '123456789012',
   *         },
   *         agent: {
   *           abaRoutingNumber: '37714568112',
   *         },
   *       },
   *       remittanceInformation: '1000 Hot Dogs Feb26',
   *     },
   *   ],
   *   messageId: 'RTP-MSG-001', // Optional
   *   creationDate: new Date('2025-03-01'), // Optional
   * });
   * @returns {RTPCreditPaymentInitiation} A new RTP Credit Payment Initiation object.
   */
  createRTPCreditPaymentInitiation(config) {
    return new RTPCreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: config.paymentInstructions,
      messageId: config.messageId,
      creationDate: config.creationDate,
    });
  }
  /**
   * Creates an ACH Credit Payment Initiation message.
   * @param {ACHCreditPaymentInitiationConfig} config - Configuration containing payment instructions and optional parameters.
   * @example
   * const payment = iso20022.createACHCreditPaymentInitiation({
   *   paymentInstructions: [
   *     {
   *       type: 'ach',
   *       direction: 'credit',
   *       amount: 100000, // $1000.00
   *       currency: 'USD',
   *       creditor: {
   *         name: 'John Doe Funding LLC',
   *         account: {
   *           accountNumber: '123456789012',
   *         },
   *         agent: {
   *           abaRoutingNumber: '123456789',
   *         },
   *       },
   *       remittanceInformation: 'Invoice #12345',
   *     },
   *   ],
   *   messageId: 'ACH-MSG-001', // Optional
   *   creationDate: new Date('2025-03-01'), // Optional
   * });
   * @returns {ACHCreditPaymentInitiation} A new ACH Credit Payment Initiation object.
   */
  createACHCreditPaymentInitiation(config) {
    return new ACHCreditPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: config.paymentInstructions,
      messageId: config.messageId,
      creationDate: config.creationDate,
    });
  }
  /**
   * Creates a SEPA Direct Debit Payment Initiation message.
   * @param {SEPADirectDebitPaymentInitiationConfig} config - Configuration containing payment instruction groups and optional parameters.
   * @example
   * const payment = iso20022.createSEPADirectDebitPaymentInitiation({
   *   paymentInstructions: [
   *     {
   *       creditor: {
   *         name: 'Landlord Company Ltd',
   *         account: {
   *           iban: 'DE54120300001030860744',
   *         },
   *         agent: {
   *           bic: 'BYLADEM1001',
   *         },
   *       },
   *       creditorSchemeId: 'DE96ZZZ00000345986',
   *       requestedCollectionDate: new Date('2025-11-22'),
   *       sequenceType: 'RCUR',
   *       payments: [
   *         {
   *           type: 'sepa',
   *           direction: 'debit',
   *           amount: 31700, // €317.00 Euros
   *           currency: 'EUR',
   *           debtor: {
   *             name: 'John Doe',
   *             account: {
   *               iban: 'DE20120300001088243355',
   *             },
   *             agent: {
   *               bic: 'BYLADEM1001',
   *             },
   *           },
   *           mandate: {
   *             mandateId: 'MR-12345-001',
   *             dateOfSignature: new Date('2024-01-15'),
   *             amendmentIndicator: false,
   *           },
   *           remittanceInformation: 'Rent payment November 2024',
   *         },
   *       ],
   *       localInstrument: 'CORE', // Optional
   *     },
   *   ],
   *   messageId: 'DD-MSG-001', // Optional
   *   creationDate: new Date('2025-03-01'), // Optional
   * });
   * @returns {SEPADirectDebitPaymentInitiation} A new SEPA Direct Debit Payment Initiation object.
   */
  createSEPADirectDebitPaymentInitiation(config) {
    return new SEPADirectDebitPaymentInitiation({
      initiatingParty: this.initiatingParty,
      paymentInstructions: config.paymentInstructions,
      messageId: config.messageId,
      creationDate: config.creationDate,
    });
  }
  /** Create a message CAMT or other */
  createMessage(type, config) {
    const implementation = getISO20022Implementation(type);
    if (!implementation) {
      throw new Error(`No implementation found for message type ${type}`);
    }
    return new implementation(config);
  }
}

/**
 * Represents the status codes in a payment status report.
 * @see {@link https://www.iso20022.org/sites/default/files/2022-03/externalcodesets_4q2021_v2_1.xlsx}
 */
const PaymentStatusCode = {
  Rejected: 'RJCT',
  PartiallyAccepted: 'ACCP',
  Pending: 'PNDG',
  Accepted: 'ACCP',
  AcceptedSettlementInProgress: 'ACSP',
  AcceptedCreditSettlementCompleted: 'ACSC',
  AcceptedSettlementCompleted: 'ACSC',
  AcceptedTechnicalValidation: 'ACTC',
};

// NOTE: Consider not even using this switch statement.
const parseStatus = status => {
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
const parseGroupStatusInformation = originalGroupInfAndStatus => {
  if (!originalGroupInfAndStatus.hasOwnProperty('GrpSts')) {
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
const parsePaymentStatusInformations = originalPaymentInfAndStatuses => {
  return originalPaymentInfAndStatuses
    .map(payment => {
      if (!payment.hasOwnProperty('PmtInfSts')) {
        return null;
      }
      return {
        type: 'payment',
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
    .filter(status => status !== null);
};
const parseTransactionStatusInformations = allTxnsInfoAndStatuses => {
  const transactionStatuses = allTxnsInfoAndStatuses.map(transaction => {
    return {
      type: 'transaction',
      originalEndToEndId: transaction.OrgnlEndToEndId,
      status: parseStatus(transaction.TxSts),
      reason: {
        code: transaction.StsRsnInf?.Rsn?.Cd,
        additionalInformation: parseAdditionalInformation(
          transaction.StsRsnInf?.Rsn?.AddtlInf,
        ),
      },
    };
  });
  return transactionStatuses;
};

/**
 * Represents a Payment Status Report, containing information about the status of payments and transactions.
 */
class PaymentStatusReport {
  _messageId;
  _creationDate;
  _initatingParty;
  _originalGroupInformation;
  _statusInformations;
  /**
   * Creates a new PaymentStatusReport instance.
   * @param {PaymentStatusReportConfig} config - The configuration object for the PaymentStatusReport.
   */
  constructor(config) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._initatingParty = config.initatingParty;
    this._originalGroupInformation = config.originalGroupInformation;
    this._statusInformations = config.statusInformations;
  }
  /**
   * Creates a PaymentStatusReport instance from an XML string.
   * @param {string} rawXml - The raw XML string to parse.
   * @returns {PaymentStatusReport} A new PaymentStatusReport instance.
   */
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    const customerPaymentStatusReport = xml.Document.CstmrPmtStsRpt;
    const rawCreationDate = customerPaymentStatusReport.GrpHdr.CreDtTm;
    const messageId = customerPaymentStatusReport.GrpHdr.MsgId;
    const creationDate = new Date(rawCreationDate);
    const initatingParty = parseParty(
      customerPaymentStatusReport.GrpHdr.InitgPty,
    );
    const rawOriginalGroupInformation =
      customerPaymentStatusReport.OrgnlGrpInfAndSts;
    const originalGroupInformation = {
      originalMessageId: rawOriginalGroupInformation.OrgnlMsgId,
    };
    const rawPmtInfAndSts = customerPaymentStatusReport.OrgnlPmtInfAndSts;
    const pmtInfAndSts = Array.isArray(rawPmtInfAndSts)
      ? rawPmtInfAndSts
      : [rawPmtInfAndSts].filter(Boolean);
    // Find all TxnInfoAndSts
    const txnInfoAndSts = pmtInfAndSts
      .map(pmtInfAndSt => {
        // If there is no TxInfAndSts, return an empty array
        if (!pmtInfAndSt.hasOwnProperty('TxInfAndSts')) {
          return [];
        }
        // Otherwise, return the TxInfAndSts
        return Array.isArray(pmtInfAndSt.TxInfAndSts)
          ? pmtInfAndSt.TxInfAndSts
          : [pmtInfAndSt.TxInfAndSts];
      })
      .flat();
    const statusInformations = [
      parseGroupStatusInformation(
        customerPaymentStatusReport.OrgnlGrpInfAndSts,
      ),
      parsePaymentStatusInformations(pmtInfAndSts),
      parseTransactionStatusInformations(txnInfoAndSts),
    ]
      .flat()
      .filter(statusInformation => statusInformation !== null);
    return new PaymentStatusReport({
      messageId,
      creationDate,
      initatingParty,
      originalGroupInformation,
      statusInformations: statusInformations,
    });
  }
  /**
   * Gets the message ID of the Payment Status Report.
   * @returns {string} The message ID.
   */
  get messageId() {
    return this._messageId;
  }
  /**
   * Gets the creation date of the Payment Status Report.
   * @returns {Date} The creation date.
   */
  get creationDate() {
    return this._creationDate;
  }
  /**
   * Gets the initiating party of the Payment Status Report.
   * @returns {Party} The initiating party.
   */
  get initatingParty() {
    return this._initatingParty;
  }
  /**
   * Gets the original message ID from the original group information.
   * @returns {string} The original message ID.
   */
  get originalMessageId() {
    return this._originalGroupInformation.originalMessageId;
  }
  /**
   * Gets all status information entries in the Payment Status Report.
   * @returns {StatusInformation[]} An array of StatusInformation objects.
   */
  get statusInformations() {
    return this._statusInformations;
  }
  /**
   * Gets the first status information entry in the Payment Status Report.
   * @returns {StatusInformation} The first StatusInformation object in the statuses array.
   */
  get firstStatusInformation() {
    return this._statusInformations[0];
  }
  /**
   * Gets the original ID based on the type of the first status information.
   * @returns {string} The original ID, which could be the original message ID, payment ID, or end-to-end ID.
   */
  get originalId() {
    const firstStatusInformation = this.firstStatusInformation;
    switch (firstStatusInformation.type) {
      case 'group':
        return firstStatusInformation.originalMessageId;
      case 'payment':
        return firstStatusInformation.originalPaymentId;
      case 'transaction':
        return firstStatusInformation.originalEndToEndId;
    }
  }
  /**
   * Gets the status from the first status information entry.
   * @returns {PaymentStatus} The Status from the first status information.
   */
  get status() {
    return this.firstStatusInformation.status;
  }
}

class SEPADirectDebitPaymentReversal extends PaymentInitiation {
  initiatingParty;
  messageId;
  creationDate;
  originalMessage;
  reversalInstructions;
  formattedReversedSum;
  totalTransactionCount;
  get schemaId() {
    return ISO20022SchemaId.PAIN_007_001_02;
  }
  constructor(config) {
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
  countAllReversals() {
    return this.reversalInstructions.reduce((total, group) => {
      return total + group.reversals.length;
    }, 0);
  }
  sumAllReversedAmounts() {
    let totalAmount = 0;
    for (const group of this.reversalInstructions) {
      for (const reversal of group.reversals) {
        totalAmount += reversal.reversedAmount;
      }
    }
    return formatMinorUnits(totalAmount, 'EUR');
  }
  validate() {
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
  buildTxInf(reversal, group) {
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
          CdtrAgt: this.agent(group.creditor.agent),
        }),
        Cdtr: this.party(group.creditor),
        CdtrAcct: this.account(group.creditor.account),
      },
    };
  }
  serialize() {
    const builder = PaymentInitiation.getBuilder();
    const orgnlPmtInfAndRvslEntries = this.reversalInstructions.map(group => {
      const orgnlPmtInfId = group.reversals[0].originalReference.pmtInfId;
      return {
        RvslPmtInfId: group.paymentInformationId,
        OrgnlPmtInfId: orgnlPmtInfId,
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
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (!namespace.startsWith(`${XMLNS_PREFIX}pain.007`)) {
      throw new InvalidXmlNamespaceError('Invalid PAIN.007 namespace');
    }
    const root = xml.Document.CstmrPmtRvsl;
    const messageId = root.GrpHdr.MsgId;
    const creationDate = new Date(root.GrpHdr.CreDtTm);
    const initiatingParty = {
      name: root.GrpHdr.InitgPty?.Nm,
      id: root.GrpHdr.InitgPty?.Id?.OrgId?.Othr?.Id,
    };
    const originalMessage = {
      msgId: root.OrgnlGrpInf.OrgnlMsgId,
      msgNmId: root.OrgnlGrpInf.OrgnlMsgNmId,
      createdDateTime: new Date(root.OrgnlGrpInf.OrgnlCreDtTm),
    };
    const rawGroups = Array.isArray(root.OrgnlPmtInfAndRvsl)
      ? root.OrgnlPmtInfAndRvsl
      : [root.OrgnlPmtInfAndRvsl];
    const reversalInstructions = rawGroups.map(grp => {
      const rawTxInf = Array.isArray(grp.TxInf) ? grp.TxInf : [grp.TxInf];
      const orgnlPmtInfId = grp.OrgnlPmtInfId?.toString();
      let groupCreditor;
      let groupCreditorSchemeId = '';
      let groupSequenceType = 'RCUR';
      let groupLocalInstrument = 'CORE';
      const reversals = rawTxInf.map(tx => {
        const orgnlTxRef = tx.OrgnlTxRef;
        if (!groupCreditor && orgnlTxRef?.Cdtr) {
          groupCreditor = {
            name: orgnlTxRef.Cdtr.Nm,
            ...(orgnlTxRef.CdtrAgt && {
              agent: parseAgent(orgnlTxRef.CdtrAgt),
            }),
            ...(orgnlTxRef.CdtrAcct && {
              account: parseAccount(orgnlTxRef.CdtrAcct),
            }),
          };
          groupCreditorSchemeId =
            orgnlTxRef.CdtrSchmeId?.Id?.PrvtId?.Othr?.Id || '';
          groupSequenceType = orgnlTxRef.PmtTpInf?.SeqTp || 'RCUR';
          groupLocalInstrument = orgnlTxRef.PmtTpInf?.LclInstrm?.Cd || 'CORE';
        }
        return {
          ...(tx.RvslId && { reversalId: tx.RvslId.toString() }),
          originalAmount: parseAmountToMinorUnits(
            Number(tx.OrgnlInstdAmt['#text']),
            tx.OrgnlInstdAmt['@_Ccy'],
          ),
          reversedAmount: parseAmountToMinorUnits(
            Number(tx.RvsdInstdAmt['#text']),
            tx.RvsdInstdAmt['@_Ccy'],
          ),
          currency: 'EUR',
          reason: tx.RvslRsnInf?.Rsn?.Cd,
          ...(tx.RvslRsnInf?.AddtlInf && {
            additionalInfo: tx.RvslRsnInf.AddtlInf.toString(),
          }),
          originalReference: {
            pmtInfId: orgnlPmtInfId,
            endToEndId: tx.OrgnlEndToEndId?.toString(),
            ...(tx.OrgnlInstrId && {
              instrId: tx.OrgnlInstrId.toString(),
            }),
            requestedCollectionDate: new Date(orgnlTxRef?.ReqdColltnDt),
          },
          originalTransaction: {
            amount: parseAmountToMinorUnits(
              Number(orgnlTxRef?.Amt?.InstdAmt['#text']),
              orgnlTxRef?.Amt?.InstdAmt['@_Ccy'],
            ),
            debtor: {
              name: orgnlTxRef?.Dbtr?.Nm,
            },
            debtorAccount: parseAccount(orgnlTxRef?.DbtrAcct),
            ...(orgnlTxRef?.DbtrAgt && {
              debtorAgent: parseAgent(orgnlTxRef.DbtrAgt),
            }),
            mandate: parseMandate(orgnlTxRef?.MndtRltdInf),
          },
        };
      });
      const paymentInformationId = grp.RvslPmtInfId?.toString();
      return {
        creditor: groupCreditor || { name: '' },
        creditorSchemeId: groupCreditorSchemeId,
        sequenceType: groupSequenceType,
        localInstrument: groupLocalInstrument,
        reversals,
        ...(paymentInformationId && { paymentInformationId }),
      };
    });
    return new SEPADirectDebitPaymentReversal({
      messageId,
      creationDate,
      initiatingParty,
      originalMessage,
      reversalInstructions,
    });
  }
  static fromOriginalInitiation(original, reversals, opts) {
    const lookup = new Map();
    for (const group of original.paymentInstructions) {
      for (const instruction of group.payments) {
        const id = instruction.endToEndId || instruction.id;
        if (id) {
          lookup.set(id, { group, instruction });
        }
      }
    }
    const groupedReversals = new Map();
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
    const reversalInstructions = [];
    for (const [sourceGroup, revList] of groupedReversals) {
      const reversalTxs = revList.map(rev => {
        const { instruction } = lookup.get(rev.endToEndId);
        return {
          ...(rev.reversalId && { reversalId: rev.reversalId }),
          originalAmount: instruction.amount,
          reversedAmount: rev.reversedAmount ?? instruction.amount,
          currency: 'EUR',
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
            debtorAccount: instruction.debtor.account,
            ...(instruction.debtor.agent && {
              debtorAgent: instruction.debtor.agent,
            }),
            mandate: instruction.mandate,
          },
        };
      });
      reversalInstructions.push({
        creditor: sourceGroup.creditor,
        creditorSchemeId: sourceGroup.creditorSchemeId,
        sequenceType: sourceGroup.sequenceType,
        localInstrument: sourceGroup.localInstrument,
        reversals: reversalTxs,
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
      reversalInstructions: reversalInstructions,
    });
  }
}

/**
 * Represents a Cash Management End of Day Report (CAMT.053.x).
 * This class encapsulates the data and functionality related to processing
 * and accessing information from a CAMT.053 XML file.
 */
class CashManagementEndOfDayReport {
  _messageId;
  _creationDate;
  _recipient;
  _statements;
  constructor(config) {
    this._messageId = config.messageId;
    this._creationDate = config.creationDate;
    this._recipient = config.recipient;
    this._statements = config.statements;
  }
  static supportedMessages() {
    return [ISO20022Messages.CAMT_053];
  }
  get data() {
    return {
      messageId: this._messageId,
      creationDate: this._creationDate,
      recipient: this._recipient,
      statements: this._statements,
    };
  }
  static fromDocumentObject(obj) {
    const bankToCustomerStatement = obj.Document.BkToCstmrStmt;
    const rawCreationDate = bankToCustomerStatement.GrpHdr.CreDtTm;
    const creationDate = new Date(rawCreationDate);
    let statements = [];
    if (Array.isArray(bankToCustomerStatement.Stmt)) {
      statements = bankToCustomerStatement.Stmt.map(stmt =>
        parseStatement(stmt),
      );
    } else {
      statements = [parseStatement(bankToCustomerStatement.Stmt)];
    }
    const rawRecipient = bankToCustomerStatement.GrpHdr.MsgRcpt;
    return new CashManagementEndOfDayReport({
      messageId: bankToCustomerStatement.GrpHdr.MsgId.toString(),
      creationDate,
      recipient: rawRecipient ? parseRecipient(rawRecipient) : undefined,
      statements: statements,
    });
  }
  /**
   * Creates a CashManagementEndOfDayReport instance from a raw XML string.
   *
   * @param {string} rawXml - The raw XML string containing the CAMT.053 data.
   * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport.
   * @throws {Error} If the XML parsing fails or required data is missing.
   */
  static fromXML(rawXml) {
    const parser = XML.getParser();
    const xml = parser.parse(rawXml);
    if (!xml.Document) {
      throw new InvalidXmlError('Invalid XML format');
    }
    const namespace = xml.Document['@_xmlns'] || xml.Document['@_Xmlns'];
    if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:camt.053.001.')) {
      throw new InvalidXmlNamespaceError('Invalid CAMT.053 namespace');
    }
    return CashManagementEndOfDayReport.fromDocumentObject(xml);
  }
  /**
   *
   * @param json - JSON string representing a CashManagementEndOfDayReport
   * @returns {CashManagementEndOfDayReport} A new instance of CashManagementEndOfDayReport
   * @throws {Error} If the JSON parsing fails or required data is missing.
   */
  static fromJSON(json) {
    const obj = JSON.parse(json);
    if (!obj.Document) {
      throw new InvalidXmlError('Invalid JSON format');
    }
    return CashManagementEndOfDayReport.fromDocumentObject(obj);
  }
  toJSON() {
    const Document = {
      BkToCstmrStmt: {
        GrpHdr: {
          MsgId: this._messageId,
          CreDtTm: this._creationDate.toISOString(),
          MsgRcpt: this._recipient
            ? exportRecipient(this._recipient)
            : undefined,
        },
        Stmt: this._statements.map(stmt => exportStatement(stmt)),
      },
    };
    return { Document };
  }
  serialize() {
    const builder = XML.getBuilder();
    const obj = this.toJSON();
    obj.Document['@_xmlns'] = 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02';
    obj.Document['@_xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
    return builder.build(obj);
  }
  /**
   * Retrieves all balances from all statements in the report.
   * @returns {Balance[]} An array of all balances across all statements.
   */
  get balances() {
    return this._statements.flatMap(statement => statement.balances);
  }
  /**
   * Retrieves all transactions from all statements in the report.
   * @returns {Transaction[]} An array of all transactions across all statements.
   */
  get transactions() {
    return this._statements
      .flatMap(statement => statement.entries)
      .flatMap(entry => entry.transactions);
  }
  /**
   * Retrieves all entries from all statements in the report.
   * @returns {Entry[]} An array of all entries across all statements.
   */
  get entries() {
    return this._statements.flatMap(statement => statement.entries);
  }
  /**
   * Gets the unique identifier for the message.
   * @returns {string} The message ID.
   */
  get messageId() {
    return this._messageId;
  }
  /**
   * Gets the party receiving the report.
   * @returns {Party | undefined} The recipient party information, or undefined if no recipient is set.
   */
  get recipient() {
    return this._recipient;
  }
  /**
   * Gets the date and time when the report was created.
   * @returns {Date} The creation date of the report.
   */
  get creationDate() {
    return this._creationDate;
  }
  /**
   * Gets all statements included in the report.
   * @returns {Statement[]} An array of all statements in the report.
   */
  get statements() {
    return this._statements;
  }
}
registerISO20022Implementation(CashManagementEndOfDayReport);

exports.ACHCreditPaymentInitiation = ACHCreditPaymentInitiation;
exports.ACHLocalInstrumentCode = ACHLocalInstrumentCode;
exports.ACHLocalInstrumentCodeDescriptionMap =
  ACHLocalInstrumentCodeDescriptionMap;
exports.BalanceTypeCode = BalanceTypeCode;
exports.BalanceTypeCodeDescriptionMap = BalanceTypeCodeDescriptionMap;
exports.CashManagementAccountReport = CashManagementAccountReport;
exports.CashManagementEndOfDayReport = CashManagementEndOfDayReport;
exports.ISO20022 = ISO20022;
exports.InvalidXmlError = InvalidXmlError;
exports.InvalidXmlNamespaceError = InvalidXmlNamespaceError;
exports.Iso20022JsError = Iso20022JsError;
exports.PaymentStatusCode = PaymentStatusCode;
exports.PaymentStatusReport = PaymentStatusReport;
exports.RTPCreditPaymentInitiation = RTPCreditPaymentInitiation;
exports.SEPACreditPaymentInitiation = SEPACreditPaymentInitiation;
exports.SEPADirectDebitPaymentInitiation = SEPADirectDebitPaymentInitiation;
exports.SEPADirectDebitPaymentReversal = SEPADirectDebitPaymentReversal;
exports.SEPAMultiCreditPaymentInitiation = SEPAMultiCreditPaymentInitiation;
exports.SEPAReversalReasonCode = SEPAReversalReasonCode;
exports.SWIFTCreditPaymentInitiation = SWIFTCreditPaymentInitiation;
