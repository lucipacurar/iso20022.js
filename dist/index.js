'use strict';

var Dinero = require('dinero.js');

var validator$2 = {};

var util$3 = {};

(function (exports) {

	const nameStartChar = ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
	const nameChar = nameStartChar + '\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
	const nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*';
	const regexName = new RegExp('^' + nameRegexp + '$');

	const getAllMatches = function(string, regex) {
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
	};

	const isName = function(string) {
	  const match = regexName.exec(string);
	  return !(match === null || typeof match === 'undefined');
	};

	exports.isExist = function(v) {
	  return typeof v !== 'undefined';
	};

	exports.isEmptyObject = function(obj) {
	  return Object.keys(obj).length === 0;
	};

	/**
	 * Copy all the properties of a into b.
	 * @param {*} target
	 * @param {*} a
	 */
	exports.merge = function(target, a, arrayMode) {
	  if (a) {
	    const keys = Object.keys(a); // will return an array of own properties
	    const len = keys.length; //don't make it inline
	    for (let i = 0; i < len; i++) {
	      if (arrayMode === 'strict') {
	        target[keys[i]] = [ a[keys[i]] ];
	      } else {
	        target[keys[i]] = a[keys[i]];
	      }
	    }
	  }
	};
	/* exports.merge =function (b,a){
	  return Object.assign(b,a);
	} */

	exports.getValue = function(v) {
	  if (exports.isExist(v)) {
	    return v;
	  } else {
	    return '';
	  }
	};

	// const fakeCall = function(a) {return a;};
	// const fakeCallNoReturn = function() {};

	exports.isName = isName;
	exports.getAllMatches = getAllMatches;
	exports.nameRegexp = nameRegexp; 
} (util$3));

const util$2 = util$3;

const defaultOptions$2 = {
  allowBooleanAttributes: false, //A tag can have attributes without any value
  unpairedTags: []
};

//const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");
validator$2.validate = function (xmlData, options) {
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

    if (xmlData[i] === '<' && xmlData[i+1] === '?') {
      i+=2;
      i = readPI(xmlData,i);
      if (i.err) return i;
    }else if (xmlData[i] === '<') {
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
        for (; i < xmlData.length &&
          xmlData[i] !== '>' &&
          xmlData[i] !== ' ' &&
          xmlData[i] !== '\t' &&
          xmlData[i] !== '\n' &&
          xmlData[i] !== '\r'; i++
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
            msg = "Tag '"+tagName+"' is an invalid name.";
          }
          return getErrorObject('InvalidTag', msg, getLineNumberForPosition(xmlData, i));
        }

        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject('InvalidAttr', "Attributes for '"+tagName+"' have open quote.", getLineNumberForPosition(xmlData, i));
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
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject('InvalidTag',
                "Expected closing tag '"+otg.tagName+"' (opened in line "+openPos.line+", col "+openPos.col+") instead of closing tag '"+tagName+"'.",
                getLineNumberForPosition(xmlData, tagStartPos));
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
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }

          //if the root level has been reached before ...
          if (reachedRoot === true) {
            return getErrorObject('InvalidXml', 'Multiple possible root nodes found.', getLineNumberForPosition(xmlData, i));
          } else if(options.unpairedTags.indexOf(tagName) !== -1); else {
            tags.push({tagName, tagStartPos});
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
            } else if (xmlData[i+1] === '?') {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else {
              break;
            }
          } else if (xmlData[i] === '&') {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject('InvalidChar', "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          }else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject('InvalidXml', "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        } //end of reading tag text value
        if (xmlData[i] === '<') {
          i--;
        }
      }
    } else {
      if ( isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject('InvalidChar', "char '"+xmlData[i]+"' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }

  if (!tagFound) {
    return getErrorObject('InvalidXml', 'Start tag expected.', 1);
  }else if (tags.length == 1) {
      return getErrorObject('InvalidTag', "Unclosed tag '"+tags[0].tagName+"'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  }else if (tags.length > 0) {
      return getErrorObject('InvalidXml', "Invalid '"+
          JSON.stringify(tags.map(t => t.tagName), null, 4).replace(/\r?\n/g, '')+
          "' found.", {line: 1, col: 1});
  }

  return true;
};

function isWhiteSpace(char){
  return char === ' ' || char === '\t' || char === '\n'  || char === '\r';
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
        return getErrorObject('InvalidXml', 'XML declaration allowed only at the start of the document.', getLineNumberForPosition(xmlData, i));
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
  if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
    //comment
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
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
      if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
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
      } else if (startChar !== xmlData[i]) ; else {
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
    tagClosed: tagClosed
  };
}

/**
 * Select all the attributes whether valid or invalid.
 */
const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');

//attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

function validateAttributeString(attrStr, options) {
  //console.log("start:"+attrStr+":end");

  //if(attrStr.trim().length === 0) return true; //empty string

  const matches = util$2.getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};

  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      //nospace before attribute name: a="sd"b="saf"
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' has no space in starting.", getPositionFromMatch(matches[i]))
    } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
      return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
      //independent attribute: ab
      return getErrorObject('InvalidAttr', "boolean attribute '"+matches[i][2]+"' is not allowed.", getPositionFromMatch(matches[i]));
    }
    /* else if(matches[i][6] === undefined){//attribute without value: ab=
                    return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                } */
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!attrNames.hasOwnProperty(attrName)) {
      //check for duplicate attribute.
      attrNames[attrName] = 1;
    } else {
      return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is repeated.", getPositionFromMatch(matches[i]));
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
    if (xmlData[i] === ';')
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}

function validateAmpersand(xmlData, i) {
  // https://www.w3.org/TR/xml/#dt-charref
  i++;
  if (xmlData[i] === ';')
    return -1;
  if (xmlData[i] === '#') {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ';')
      break;
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
  return util$2.isName(attrName);
}

// const startsWithXML = /^xml/i;

function validateTagName(tagname) {
  return util$2.isName(tagname) /* && !tagname.match(startsWithXML) */;
}

//this function returns the line number for the character at the given index
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,

    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}

//this function returns the position of the first character of match within attrStr
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

var OptionsBuilder = {};

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
      eNotation: true
    },
    tagValueProcessor: function(tagName, val) {
      return val;
    },
    attributeValueProcessor: function(attrName, val) {
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
    updateTag: function(tagName, jPath, attrs){
      return tagName
    },
    // skipEmptyListItem: false
};
   
const buildOptions$1 = function(options) {
    return Object.assign({}, defaultOptions$1, options);
};

OptionsBuilder.buildOptions = buildOptions$1;
OptionsBuilder.defaultOptions = defaultOptions$1;

class XmlNode{
  constructor(tagname) {
    this.tagname = tagname;
    this.child = []; //nested tags, text, cdata, comments in order
    this[":@"] = {}; //attributes map
  }
  add(key,val){
    // this.child.push( {name : key, val: val, isCdata: isCdata });
    if(key === "__proto__") key = "#__proto__";
    this.child.push( {[key]: val });
  }
  addChild(node) {
    if(node.tagname === "__proto__") node.tagname = "#__proto__";
    if(node[":@"] && Object.keys(node[":@"]).length > 0){
      this.child.push( { [node.tagname]: node.child, [":@"]: node[":@"] });
    }else {
      this.child.push( { [node.tagname]: node.child });
    }
  };
}

var xmlNode$1 = XmlNode;

const util$1 = util$3;

//TODO: handle comments
function readDocType$1(xmlData, i){
    
    const entities = {};
    if( xmlData[i + 3] === 'O' &&
         xmlData[i + 4] === 'C' &&
         xmlData[i + 5] === 'T' &&
         xmlData[i + 6] === 'Y' &&
         xmlData[i + 7] === 'P' &&
         xmlData[i + 8] === 'E')
    {    
        i = i+9;
        let angleBracketsCount = 1;
        let hasBody = false, comment = false;
        let exp = "";
        for(;i<xmlData.length;i++){
            if (xmlData[i] === '<' && !comment) { //Determine the tag type
                if( hasBody && isEntity(xmlData, i)){
                    i += 7; 
                    [entityName, val,i] = readEntityExp(xmlData,i+1);
                    if(val.indexOf("&") === -1) //Parameter entities are not supported
                        entities[ validateEntityName(entityName) ] = {
                            regx : RegExp( `&${entityName};`,"g"),
                            val: val
                        };
                }
                else if( hasBody && isElement(xmlData, i))  i += 8;//Not supported
                else if( hasBody && isAttlist(xmlData, i))  i += 8;//Not supported
                else if( hasBody && isNotation(xmlData, i)) i += 9;//Not supported
                else if( isComment)                         comment = true;
                else                                        throw new Error("Invalid DOCTYPE");

                angleBracketsCount++;
                exp = "";
            } else if (xmlData[i] === '>') { //Read tag content
                if(comment){
                    if( xmlData[i - 1] === "-" && xmlData[i - 2] === "-"){
                        comment = false;
                        angleBracketsCount--;
                    }
                }else {
                    angleBracketsCount--;
                }
                if (angleBracketsCount === 0) {
                  break;
                }
            }else if( xmlData[i] === '['){
                hasBody = true;
            }else {
                exp += xmlData[i];
            }
        }
        if(angleBracketsCount !== 0){
            throw new Error(`Unclosed DOCTYPE`);
        }
    }else {
        throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return {entities, i};
}

function readEntityExp(xmlData,i){
    //External entities are not supported
    //    <!ENTITY ext SYSTEM "http://normal-website.com" >

    //Parameter entities are not supported
    //    <!ENTITY entityname "&anotherElement;">

    //Internal entities are supported
    //    <!ENTITY entityname "replacement text">
    
    //read EntityName
    let entityName = "";
    for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"' ); i++) {
        // if(xmlData[i] === " ") continue;
        // else 
        entityName += xmlData[i];
    }
    entityName = entityName.trim();
    if(entityName.indexOf(" ") !== -1) throw new Error("External entites are not supported");

    //read Entity Value
    const startChar = xmlData[i++];
    let val = "";
    for (; i < xmlData.length && xmlData[i] !== startChar ; i++) {
        val += xmlData[i];
    }
    return [entityName, val, i];
}

function isComment(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === '-' &&
    xmlData[i+3] === '-') return true
    return false
}
function isEntity(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'E' &&
    xmlData[i+3] === 'N' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'I' &&
    xmlData[i+6] === 'T' &&
    xmlData[i+7] === 'Y') return true
    return false
}
function isElement(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'E' &&
    xmlData[i+3] === 'L' &&
    xmlData[i+4] === 'E' &&
    xmlData[i+5] === 'M' &&
    xmlData[i+6] === 'E' &&
    xmlData[i+7] === 'N' &&
    xmlData[i+8] === 'T') return true
    return false
}

function isAttlist(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'A' &&
    xmlData[i+3] === 'T' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'L' &&
    xmlData[i+6] === 'I' &&
    xmlData[i+7] === 'S' &&
    xmlData[i+8] === 'T') return true
    return false
}
function isNotation(xmlData, i){
    if(xmlData[i+1] === '!' &&
    xmlData[i+2] === 'N' &&
    xmlData[i+3] === 'O' &&
    xmlData[i+4] === 'T' &&
    xmlData[i+5] === 'A' &&
    xmlData[i+6] === 'T' &&
    xmlData[i+7] === 'I' &&
    xmlData[i+8] === 'O' &&
    xmlData[i+9] === 'N') return true
    return false
}

function validateEntityName(name){
    if (util$1.isName(name))
	return name;
    else
        throw new Error(`Invalid entity name ${name}`);
}

var DocTypeReader = readDocType$1;

const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
const numRegex = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
// const octRegex = /0x[a-z0-9]+/;
// const binRegex = /0x[a-z0-9]+/;


//polyfill
if (!Number.parseInt && window.parseInt) {
    Number.parseInt = window.parseInt;
}
if (!Number.parseFloat && window.parseFloat) {
    Number.parseFloat = window.parseFloat;
}

  
const consider = {
    hex :  true,
    leadingZeros: true,
    decimalPoint: "\.",
    eNotation: true
    //skipLike: /regex/
};

function toNumber$1(str, options = {}){
    // const options = Object.assign({}, consider);
    // if(opt.leadingZeros === false){
    //     options.leadingZeros = false;
    // }else if(opt.hex === false){
    //     options.hex = false;
    // }

    options = Object.assign({}, consider, options );
    if(!str || typeof str !== "string" ) return str;
    
    let trimmedStr  = str.trim();
    // if(trimmedStr === "0.0") return 0;
    // else if(trimmedStr === "+0.0") return 0;
    // else if(trimmedStr === "-0.0") return -0;

    if(options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
    else if (options.hex && hexRegex.test(trimmedStr)) {
        return Number.parseInt(trimmedStr, 16);
    // } else if (options.parseOct && octRegex.test(str)) {
    //     return Number.parseInt(val, 8);
    // }else if (options.parseBin && binRegex.test(str)) {
    //     return Number.parseInt(val, 2);
    }else {
        //separate negative sign, leading zeros, and rest number
        const match = numRegex.exec(trimmedStr);
        if(match){
            const sign = match[1];
            const leadingZeros = match[2];
            let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
            //trim ending zeros for floating number
            
            const eNotation = match[4] || match[6];
            if(!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str; //-0123
            else if(!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str; //0123
            else {//no leading zeros or leading zeros are allowed
                const num = Number(trimmedStr);
                const numStr = "" + num;
                if(numStr.search(/[eE]/) !== -1){ //given number is long and parsed to eNotation
                    if(options.eNotation) return num;
                    else return str;
                }else if(eNotation){ //given number has enotation
                    if(options.eNotation) return num;
                    else return str;
                }else if(trimmedStr.indexOf(".") !== -1){ //floating number
                    // const decimalPart = match[5].substr(1);
                    // const intPart = trimmedStr.substr(0,trimmedStr.indexOf("."));

                    
                    // const p = numStr.indexOf(".");
                    // const givenIntPart = numStr.substr(0,p);
                    // const givenDecPart = numStr.substr(p+1);
                    if(numStr === "0" && (numTrimmedByZeros === "") ) return num; //0.0
                    else if(numStr === numTrimmedByZeros) return num; //0.456. 0.79000
                    else if( sign && numStr === "-"+numTrimmedByZeros) return num;
                    else return str;
                }
                
                if(leadingZeros){
                    // if(numTrimmedByZeros === numStr){
                    //     if(options.leadingZeros) return num;
                    //     else return str;
                    // }else return str;
                    if(numTrimmedByZeros === numStr) return num;
                    else if(sign+numTrimmedByZeros === numStr) return num;
                    else return str;
                }

                if(trimmedStr === numStr) return num;
                else if(trimmedStr === sign+numStr) return num;
                // else{
                //     //number with +/- sign
                //     trimmedStr.test(/[-+][0-9]);

                // }
                return str;
            }
            // else if(!eNotation && trimmedStr && trimmedStr !== Number(trimmedStr) ) return str;
            
        }else { //non-numeric string
            return str;
        }
    }
}

/**
 * 
 * @param {string} numStr without leading zeros
 * @returns 
 */
function trimZeros(numStr){
    if(numStr && numStr.indexOf(".") !== -1){//float
        numStr = numStr.replace(/0+$/, ""); //remove ending zeros
        if(numStr === ".")  numStr = "0";
        else if(numStr[0] === ".")  numStr = "0"+numStr;
        else if(numStr[numStr.length-1] === ".")  numStr = numStr.substr(0,numStr.length-1);
        return numStr;
    }
    return numStr;
}
var strnum = toNumber$1;

function getIgnoreAttributesFn$2(ignoreAttributes) {
    if (typeof ignoreAttributes === 'function') {
        return ignoreAttributes
    }
    if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
            for (const pattern of ignoreAttributes) {
                if (typeof pattern === 'string' && attrName === pattern) {
                    return true
                }
                if (pattern instanceof RegExp && pattern.test(attrName)) {
                    return true
                }
            }
        }
    }
    return () => false
}

var ignoreAttributes = getIgnoreAttributesFn$2;

///@ts-check

const util = util$3;
const xmlNode = xmlNode$1;
const readDocType = DocTypeReader;
const toNumber = strnum;
const getIgnoreAttributesFn$1 = ignoreAttributes;

// const regx =
//   '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'
//   .replace(/NAME/g, util.nameRegexp);

//const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
//const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");

let OrderedObjParser$1 = class OrderedObjParser{
  constructor(options){
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      "apos" : { regex: /&(apos|#39|#x27);/g, val : "'"},
      "gt" : { regex: /&(gt|#62|#x3E);/g, val : ">"},
      "lt" : { regex: /&(lt|#60|#x3C);/g, val : "<"},
      "quot" : { regex: /&(quot|#34|#x22);/g, val : "\""},
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val : "&"};
    this.htmlEntities = {
      "space": { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      "cent" : { regex: /&(cent|#162);/g, val: "¢" },
      "pound" : { regex: /&(pound|#163);/g, val: "£" },
      "yen" : { regex: /&(yen|#165);/g, val: "¥" },
      "euro" : { regex: /&(euro|#8364);/g, val: "€" },
      "copyright" : { regex: /&(copy|#169);/g, val: "©" },
      "reg" : { regex: /&(reg|#174);/g, val: "®" },
      "inr" : { regex: /&(inr|#8377);/g, val: "₹" },
      "num_dec": { regex: /&#([0-9]{1,7});/g, val : (_, str) => String.fromCharCode(Number.parseInt(str, 10)) },
      "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val : (_, str) => String.fromCharCode(Number.parseInt(str, 16)) },
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue$1;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn$1(this.options.ignoreAttributes);
  }

};

function addExternalEntities(externalEntities){
  const entKeys = Object.keys(externalEntities);
  for (let i = 0; i < entKeys.length; i++) {
    const ent = entKeys[i];
    this.lastEntities[ent] = {
       regex: new RegExp("&"+ent+";","g"),
       val : externalEntities[ent]
    };
  }
}

/**
 * @param {string} val
 * @param {string} tagName
 * @param {string} jPath
 * @param {boolean} dontTrim
 * @param {boolean} hasAttributes
 * @param {boolean} isLeafNode
 * @param {boolean} escapeEntities
 */
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== undefined) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if(val.length > 0){
      if(!escapeEntities) val = this.replaceEntitiesValue(val);
      
      const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
      if(newval === null || newval === undefined){
        //don't parse
        return val;
      }else if(typeof newval !== typeof val || newval !== val){
        //overwrite
        return newval;
      }else if(this.options.trimValues){
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      }else {
        const trimmedVal = val.trim();
        if(trimmedVal === val){
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        }else {
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
const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])([\\s\\S]*?)\\3)?', 'gm');

function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === 'string') {
    // attrStr = attrStr.replace(/\r?\n/g, ' ');
    //attrStr = attrStr || attrStr.trim();

    const matches = util.getAllMatches(attrStr, attrsRegx);
    const len = matches.length; //don't make it inline
    const attrs = {};
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPath)) {
        continue
      }
      let oldVal = matches[i][4];
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        if(aName === "__proto__") aName  = "#__proto__";
        if (oldVal !== undefined) {
          if (this.options.trimValues) {
            oldVal = oldVal.trim();
          }
          oldVal = this.replaceEntitiesValue(oldVal);
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
          if(newVal === null || newVal === undefined){
            //don't parse
            attrs[aName] = oldVal;
          }else if(typeof newVal !== typeof oldVal || newVal !== oldVal){
            //overwrite
            attrs[aName] = newVal;
          }else {
            //parse
            attrs[aName] = parseValue(
              oldVal,
              this.options.parseAttributeValue,
              this.options.numberParseOptions
            );
          }
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
        }
      }
    }
    if (!Object.keys(attrs).length) {
      return;
    }
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs
  }
}

const parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, "\n"); //TODO: remove this line
  const xmlObj = new xmlNode('!xml');
  let currentNode = xmlObj;
  let textData = "";
  let jPath = "";
  for(let i=0; i< xmlData.length; i++){//for each char in XML data
    const ch = xmlData[i];
    if(ch === '<'){
      // const nextIndex = i+1;
      // const _2ndChar = xmlData[nextIndex];
      if( xmlData[i+1] === '/') {//Closing Tag
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i+2,closeIndex).trim();

        if(this.options.removeNSPrefix){
          const colonIndex = tagName.indexOf(":");
          if(colonIndex !== -1){
            tagName = tagName.substr(colonIndex+1);
          }
        }

        if(this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }

        if(currentNode){
          textData = this.saveTextToParentTag(textData, currentNode, jPath);
        }

        //check if last tag of nested tag was unpaired tag
        const lastTagName = jPath.substring(jPath.lastIndexOf(".")+1);
        if(tagName && this.options.unpairedTags.indexOf(tagName) !== -1 ){
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        let propIndex = 0;
        if(lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1 ){
          propIndex = jPath.lastIndexOf('.', jPath.lastIndexOf('.')-1);
          this.tagsNodeStack.pop();
        }else {
          propIndex = jPath.lastIndexOf(".");
        }
        jPath = jPath.substring(0, propIndex);

        currentNode = this.tagsNodeStack.pop();//avoid recursion, set the parent tag scope
        textData = "";
        i = closeIndex;
      } else if( xmlData[i+1] === '?') {

        let tagData = readTagExp(xmlData,i, false, "?>");
        if(!tagData) throw new Error("Pi Tag is not closed.");

        textData = this.saveTextToParentTag(textData, currentNode, jPath);
        if( (this.options.ignoreDeclaration && tagData.tagName === "?xml") || this.options.ignorePiTags);else {
  
          const childNode = new xmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          
          if(tagData.tagName !== tagData.tagExp && tagData.attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
          }
          this.addChild(currentNode, childNode, jPath);

        }


        i = tagData.closeIndex + 1;
      } else if(xmlData.substr(i + 1, 3) === '!--') {
        const endIndex = findClosingIndex(xmlData, "-->", i+4, "Comment is not closed.");
        if(this.options.commentPropName){
          const comment = xmlData.substring(i + 4, endIndex - 2);

          textData = this.saveTextToParentTag(textData, currentNode, jPath);

          currentNode.add(this.options.commentPropName, [ { [this.options.textNodeName] : comment } ]);
        }
        i = endIndex;
      } else if( xmlData.substr(i + 1, 2) === '!D') {
        const result = readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      }else if(xmlData.substr(i + 1, 2) === '![') {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9,closeIndex);

        textData = this.saveTextToParentTag(textData, currentNode, jPath);

        let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
        if(val == undefined) val = "";

        //cdata should be set even if it is 0 length string
        if(this.options.cdataPropName){
          currentNode.add(this.options.cdataPropName, [ { [this.options.textNodeName] : tagExp } ]);
        }else {
          currentNode.add(this.options.textNodeName, val);
        }
        
        i = closeIndex + 2;
      }else {//Opening tag
        let result = readTagExp(xmlData,i, this.options.removeNSPrefix);
        let tagName= result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;

        if (this.options.transformTagName) {
          tagName = this.options.transformTagName(tagName);
        }
        
        //save text as child node
        if (currentNode && textData) {
          if(currentNode.tagname !== '!xml'){
            //when nested tag is found
            textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
          }
        }

        //check if last tag was unpaired tag
        const lastTag = currentNode;
        if(lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1 ){
          currentNode = this.tagsNodeStack.pop();
          jPath = jPath.substring(0, jPath.lastIndexOf("."));
        }
        if(tagName !== xmlObj.tagname){
          jPath += jPath ? "." + tagName : tagName;
        }
        if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
          let tagContent = "";
          //self-closing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            }else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            i = result.closeIndex;
          }
          //unpaired tag
          else if(this.options.unpairedTags.indexOf(tagName) !== -1){
            
            i = result.closeIndex;
          }
          //normal tag
          else {
            //read until closing tag is found
            const result = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if(!result) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result.i;
            tagContent = result.tagContent;
          }

          const childNode = new xmlNode(tagName);
          if(tagName !== tagExp && attrExpPresent){
            childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
          }
          if(tagContent) {
            tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
          }
          
          jPath = jPath.substr(0, jPath.lastIndexOf("."));
          childNode.add(this.options.textNodeName, tagContent);
          
          this.addChild(currentNode, childNode, jPath);
        }else {
  //selfClosing tag
          if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
            if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
              tagName = tagName.substr(0, tagName.length - 1);
              jPath = jPath.substr(0, jPath.length - 1);
              tagExp = tagName;
            }else {
              tagExp = tagExp.substr(0, tagExp.length - 1);
            }
            
            if(this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }

            const childNode = new xmlNode(tagName);
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath);
            jPath = jPath.substr(0, jPath.lastIndexOf("."));
          }
    //opening tag
          else {
            const childNode = new xmlNode( tagName);
            this.tagsNodeStack.push(currentNode);
            
            if(tagName !== tagExp && attrExpPresent){
              childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
            }
            this.addChild(currentNode, childNode, jPath);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    }else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};

function addChild(currentNode, childNode, jPath){
  const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
  if(result === false);else if(typeof result === "string"){
    childNode.tagname = result;
    currentNode.addChild(childNode);
  }else {
    currentNode.addChild(childNode);
  }
}

const replaceEntitiesValue$1 = function(val){

  if(this.options.processEntities){
    for(let entityName in this.docTypeEntities){
      const entity = this.docTypeEntities[entityName];
      val = val.replace( entity.regx, entity.val);
    }
    for(let entityName in this.lastEntities){
      const entity = this.lastEntities[entityName];
      val = val.replace( entity.regex, entity.val);
    }
    if(this.options.htmlEntities){
      for(let entityName in this.htmlEntities){
        const entity = this.htmlEntities[entityName];
        val = val.replace( entity.regex, entity.val);
      }
    }
    val = val.replace( this.ampEntity.regex, this.ampEntity.val);
  }
  return val;
};
function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
  if (textData) { //store previously collected data as textNode
    if(isLeafNode === undefined) isLeafNode = Object.keys(currentNode.child).length === 0;
    
    textData = this.parseTextData(textData,
      currentNode.tagname,
      jPath,
      false,
      currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
      isLeafNode);

    if (textData !== undefined && textData !== "")
      currentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}

//TODO: use jPath to simplify the logic
/**
 * 
 * @param {string[]} stopNodes 
 * @param {string} jPath
 * @param {string} currentTagName 
 */
function isItStopNode(stopNodes, jPath, currentTagName){
  const allNodesExp = "*." + currentTagName;
  for (const stopNodePath in stopNodes) {
    const stopNodeExp = stopNodes[stopNodePath];
    if( allNodesExp === stopNodeExp || jPath === stopNodeExp  ) return true;
  }
  return false;
}

/**
 * Returns the tag Expression and where it is ending handling single-double quotes situation
 * @param {string} xmlData 
 * @param {number} i starting index
 * @returns 
 */
function tagExpWithClosingIndex(xmlData, i, closingChar = ">"){
  let attrBoundary;
  let tagExp = "";
  for (let index = i; index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
        if (ch === attrBoundary) attrBoundary = "";//reset
    } else if (ch === '"' || ch === "'") {
        attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if(closingChar[1]){
        if(xmlData[index + 1] === closingChar[1]){
          return {
            data: tagExp,
            index: index
          }
        }
      }else {
        return {
          data: tagExp,
          index: index
        }
      }
    } else if (ch === '\t') {
      ch = " ";
    }
    tagExp += ch;
  }
}

function findClosingIndex(xmlData, str, i, errMsg){
  const closingIndex = xmlData.indexOf(str, i);
  if(closingIndex === -1){
    throw new Error(errMsg)
  }else {
    return closingIndex + str.length - 1;
  }
}

function readTagExp(xmlData,i, removeNSPrefix, closingChar = ">"){
  const result = tagExpWithClosingIndex(xmlData, i+1, closingChar);
  if(!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if(separatorIndex !== -1){//separate tag name and attributes expression
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }

  const rawTagName = tagName;
  if(removeNSPrefix){
    const colonIndex = tagName.indexOf(":");
    if(colonIndex !== -1){
      tagName = tagName.substr(colonIndex+1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }

  return {
    tagName: tagName,
    tagExp: tagExp,
    closeIndex: closeIndex,
    attrExpPresent: attrExpPresent,
    rawTagName: rawTagName,
  }
}
/**
 * find paired tag for a stop node
 * @param {string} xmlData 
 * @param {string} tagName 
 * @param {number} i 
 */
function readStopNodeData(xmlData, tagName, i){
  const startIndex = i;
  // Starting at 1 since we already have an open tag
  let openTagCount = 1;

  for (; i < xmlData.length; i++) {
    if( xmlData[i] === "<"){ 
      if (xmlData[i+1] === "/") {//close tag
          const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
          let closeTagName = xmlData.substring(i+2,closeIndex).trim();
          if(closeTagName === tagName){
            openTagCount--;
            if (openTagCount === 0) {
              return {
                tagContent: xmlData.substring(startIndex, i),
                i : closeIndex
              }
            }
          }
          i=closeIndex;
        } else if(xmlData[i+1] === '?') { 
          const closeIndex = findClosingIndex(xmlData, "?>", i+1, "StopNode is not closed.");
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 3) === '!--') { 
          const closeIndex = findClosingIndex(xmlData, "-->", i+3, "StopNode is not closed.");
          i=closeIndex;
        } else if(xmlData.substr(i + 1, 2) === '![') { 
          const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
          i=closeIndex;
        } else {
          const tagData = readTagExp(xmlData, i, '>');

          if (tagData) {
            const openTagName = tagData && tagData.tagName;
            if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length-1] !== "/") {
              openTagCount++;
            }
            i=tagData.closeIndex;
          }
        }
      }
  }//end for loop
}

function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === 'string') {
    //console.log(options)
    const newval = val.trim();
    if(newval === 'true' ) return true;
    else if(newval === 'false' ) return false;
    else return toNumber(val, options);
  } else {
    if (util.isExist(val)) {
      return val;
    } else {
      return '';
    }
  }
}


var OrderedObjParser_1 = OrderedObjParser$1;

var node2json = {};

/**
 * 
 * @param {array} node 
 * @param {any} options 
 * @returns 
 */
function prettify$1(node, options){
  return compress( node, options);
}

/**
 * 
 * @param {array} arr 
 * @param {object} options 
 * @param {string} jPath 
 * @returns object
 */
function compress(arr, options, jPath){
  let text;
  const compressedObj = {};
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName$1(tagObj);
    let newJpath = "";
    if(jPath === undefined) newJpath = property;
    else newJpath = jPath + "." + property;

    if(property === options.textNodeName){
      if(text === undefined) text = tagObj[property];
      else text += "" + tagObj[property];
    }else if(property === undefined){
      continue;
    }else if(tagObj[property]){
      
      let val = compress(tagObj[property], options, newJpath);
      const isLeaf = isLeafTag(val, options);

      if(tagObj[":@"]){
        assignAttributes( val, tagObj[":@"], newJpath, options);
      }else if(Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode){
        val = val[options.textNodeName];
      }else if(Object.keys(val).length === 0){
        if(options.alwaysCreateTextNode) val[options.textNodeName] = "";
        else val = "";
      }

      if(compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
        if(!Array.isArray(compressedObj[property])) {
            compressedObj[property] = [ compressedObj[property] ];
        }
        compressedObj[property].push(val);
      }else {
        //TODO: if a node is not an array, then check if it should be an array
        //also determine if it is a leaf node
        if (options.isArray(property, newJpath, isLeaf )) {
          compressedObj[property] = [val];
        }else {
          compressedObj[property] = val;
        }
      }
    }
    
  }
  // if(text && text.length > 0) compressedObj[options.textNodeName] = text;
  if(typeof text === "string"){
    if(text.length > 0) compressedObj[options.textNodeName] = text;
  }else if(text !== undefined) compressedObj[options.textNodeName] = text;
  return compressedObj;
}

function propName$1(obj){
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if(key !== ":@") return key;
  }
}

function assignAttributes(obj, attrMap, jpath, options){
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length; //don't make it inline
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i];
      if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
        obj[atrrName] = [ attrMap[atrrName] ];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}

function isLeafTag(obj, options){
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  
  if (propCount === 0) {
    return true;
  }

  if (
    propCount === 1 &&
    (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)
  ) {
    return true;
  }

  return false;
}
node2json.prettify = prettify$1;

const { buildOptions} = OptionsBuilder;
const OrderedObjParser = OrderedObjParser_1;
const { prettify} = node2json;
const validator$1 = validator$2;

let XMLParser$1 = class XMLParser{
    
    constructor(options){
        this.externalEntities = {};
        this.options = buildOptions(options);
        
    }
    /**
     * Parse XML dats to JS object 
     * @param {string|Buffer} xmlData 
     * @param {boolean|Object} validationOption 
     */
    parse(xmlData,validationOption){
        if(typeof xmlData === "string");else if( xmlData.toString){
            xmlData = xmlData.toString();
        }else {
            throw new Error("XML data is accepted in String or Bytes[] form.")
        }
        if( validationOption){
            if(validationOption === true) validationOption = {}; //validate with default options
            
            const result = validator$1.validate(xmlData, validationOption);
            if (result !== true) {
              throw Error( `${result.err.msg}:${result.err.line}:${result.err.col}` )
            }
          }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if(this.options.preserveOrder || orderedResult === undefined) return orderedResult;
        else return prettify(orderedResult, this.options);
    }

    /**
     * Add Entity which is not by default supported by this library
     * @param {string} key 
     * @param {string} value 
     */
    addEntity(key, value){
        if(value.indexOf("&") !== -1){
            throw new Error("Entity value can't have '&'")
        }else if(key.indexOf("&") !== -1 || key.indexOf(";") !== -1){
            throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'")
        }else if(value === "&"){
            throw new Error("An entity with value '&' is not permitted");
        }else {
            this.externalEntities[key] = value;
        }
    }
};

var XMLParser_1 = XMLParser$1;

const EOL = "\n";

/**
 * 
 * @param {array} jArray 
 * @param {any} options 
 * @returns 
 */
function toXml(jArray, options) {
    let indentation = "";
    if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
    }
    return arrToStr(jArray, options, "", indentation);
}

function arrToStr(arr, options, jPath, indentation) {
    let xmlStr = "";
    let isPreviousElementTag = false;

    for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const tagName = propName(tagObj);
        if(tagName === undefined) continue;

        let newJPath = "";
        if (jPath.length === 0) newJPath = tagName;
        else newJPath = `${jPath}.${tagName}`;

        if (tagName === options.textNodeName) {
            let tagText = tagObj[tagName];
            if (!isStopNode(newJPath, options)) {
                tagText = options.tagValueProcessor(tagName, tagText);
                tagText = replaceEntitiesValue(tagText, options);
            }
            if (isPreviousElementTag) {
                xmlStr += indentation;
            }
            xmlStr += tagText;
            isPreviousElementTag = false;
            continue;
        } else if (tagName === options.cdataPropName) {
            if (isPreviousElementTag) {
                xmlStr += indentation;
            }
            xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
            isPreviousElementTag = false;
            continue;
        } else if (tagName === options.commentPropName) {
            xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
            isPreviousElementTag = true;
            continue;
        } else if (tagName[0] === "?") {
            const attStr = attr_to_str(tagObj[":@"], options);
            const tempInd = tagName === "?xml" ? "" : indentation;
            let piTextNodeName = tagObj[tagName][0][options.textNodeName];
            piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : ""; //remove extra spacing
            xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr}?>`;
            isPreviousElementTag = true;
            continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
            newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
            if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
            else xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
            xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
            xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
            xmlStr += tagStart + ">";
            if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
                xmlStr += indentation + options.indentBy + tagValue + indentation;
            } else {
                xmlStr += tagValue;
            }
            xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
    }

    return xmlStr;
}

function propName(obj) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if(!obj.hasOwnProperty(key)) continue;
        if (key !== ":@") return key;
    }
}

function attr_to_str(attrMap, options) {
    let attrStr = "";
    if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
            if(!attrMap.hasOwnProperty(attr)) continue;
            let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
            attrVal = replaceEntitiesValue(attrVal, options);
            if (attrVal === true && options.suppressBooleanAttributes) {
                attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
            } else {
                attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
            }
        }
    }
    return attrStr;
}

function isStopNode(jPath, options) {
    jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
    let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
    for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
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
var orderedJs2Xml = toXml;

//parse Empty Node as self closing node
const buildFromOrderedJs = orderedJs2Xml;
const getIgnoreAttributesFn = ignoreAttributes;

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
  tagValueProcessor: function(key, a) {
    return a;
  },
  attributeValueProcessor: function(attrName, a) {
    return a;
  },
  preserveOrder: false,
  commentPropName: false,
  unpairedTags: [],
  entities: [
    { regex: new RegExp("&", "g"), val: "&amp;" },//it must be on top
    { regex: new RegExp(">", "g"), val: "&gt;" },
    { regex: new RegExp("<", "g"), val: "&lt;" },
    { regex: new RegExp("\'", "g"), val: "&apos;" },
    { regex: new RegExp("\"", "g"), val: "&quot;" }
  ],
  processEntities: true,
  stopNodes: [],
  // transformTagName: false,
  // transformAttributeName: false,
  oneListGroup: false
};

function Builder(options) {
  this.options = Object.assign({}, defaultOptions, options);
  if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
    this.isAttribute = function(/*a*/) {
      return false;
    };
  } else {
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
    this.attrPrefixLen = this.options.attributeNamePrefix.length;
    this.isAttribute = isAttribute;
  }

  this.processTextOrObjNode = processTextOrObjNode;

  if (this.options.format) {
    this.indentate = indentate;
    this.tagEndChar = '>\n';
    this.newLine = '\n';
  } else {
    this.indentate = function() {
      return '';
    };
    this.tagEndChar = '>';
    this.newLine = '';
  }
}

Builder.prototype.build = function(jObj) {
  if(this.options.preserveOrder){
    return buildFromOrderedJs(jObj, this.options);
  }else {
    if(Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1){
      jObj = {
        [this.options.arrayNodeName] : jObj
      };
    }
    return this.j2x(jObj, 0, []).val;
  }
};

Builder.prototype.j2x = function(jObj, level, ajPath) {
  let attrStr = '';
  let val = '';
  const jPath = ajPath.join('.');
  for (let key in jObj) {
    if(!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
    if (typeof jObj[key] === 'undefined') {
      // supress undefined node only if it is not an attribute
      if (this.isAttribute(key)) {
        val += '';
      }
    } else if (jObj[key] === null) {
      // null attribute should be ignored by the attribute list, but should not cause the tag closing
      if (this.isAttribute(key)) {
        val += '';
      } else if (key[0] === '?') {
        val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
      } else {
        val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
      }
      // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
    } else if (jObj[key] instanceof Date) {
      val += this.buildTextValNode(jObj[key], key, '', level);
    } else if (typeof jObj[key] !== 'object') {
      //premitive type
      const attr = this.isAttribute(key);
      if (attr && !this.ignoreAttributesFn(attr, jPath)) {
        attrStr += this.buildAttrPairStr(attr, '' + jObj[key]);
      } else if (!attr) {
        //tag value
        if (key === this.options.textNodeName) {
          let newval = this.options.tagValueProcessor(key, '' + jObj[key]);
          val += this.replaceEntitiesValue(newval);
        } else {
          val += this.buildTextValNode(jObj[key], key, '', level);
        }
      }
    } else if (Array.isArray(jObj[key])) {
      //repeated nodes
      const arrLen = jObj[key].length;
      let listTagVal = "";
      let listTagAttr = "";
      for (let j = 0; j < arrLen; j++) {
        const item = jObj[key][j];
        if (typeof item === 'undefined') ; else if (item === null) {
          if(key[0] === "?") val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
          else val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
          // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
        } else if (typeof item === 'object') {
          if(this.options.oneListGroup){
            const result = this.j2x(item, level + 1, ajPath.concat(key));
            listTagVal += result.val;
            if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
              listTagAttr += result.attrStr;
            }
          }else {
            listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
          }
        } else {
          if (this.options.oneListGroup) {
            let textValue = this.options.tagValueProcessor(key, item);
            textValue = this.replaceEntitiesValue(textValue);
            listTagVal += textValue;
          } else {
            listTagVal += this.buildTextValNode(item, key, '', level);
          }
        }
      }
      if(this.options.oneListGroup){
        listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
      }
      val += listTagVal;
    } else {
      //nested node
      if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
        const Ks = Object.keys(jObj[key]);
        const L = Ks.length;
        for (let j = 0; j < L; j++) {
          attrStr += this.buildAttrPairStr(Ks[j], '' + jObj[key][Ks[j]]);
        }
      } else {
        val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
      }
    }
  }
  return {attrStr: attrStr, val: val};
};

Builder.prototype.buildAttrPairStr = function(attrName, val){
  val = this.options.attributeValueProcessor(attrName, '' + val);
  val = this.replaceEntitiesValue(val);
  if (this.options.suppressBooleanAttributes && val === "true") {
    return ' ' + attrName;
  } else return ' ' + attrName + '="' + val + '"';
};

function processTextOrObjNode (object, key, level, ajPath) {
  const result = this.j2x(object, level + 1, ajPath.concat(key));
  if (object[this.options.textNodeName] !== undefined && Object.keys(object).length === 1) {
    return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
  } else {
    return this.buildObjectNode(result.val, key, result.attrStr, level);
  }
}

Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
  if(val === ""){
    if(key[0] === "?") return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar;
    else {
      return this.indentate(level) + '<' + key + attrStr + this.closeTag(key) + this.tagEndChar;
    }
  }else {

    let tagEndExp = '</' + key + this.tagEndChar;
    let piClosingChar = "";
    
    if(key[0] === "?") {
      piClosingChar = "?";
      tagEndExp = "";
    }
  
    // attrStr is an empty string in case the attribute came as undefined or null
    if ((attrStr || attrStr === '') && val.indexOf('<') === -1) {
      return ( this.indentate(level) + '<' +  key + attrStr + piClosingChar + '>' + val + tagEndExp );
    } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
      return this.indentate(level) + `<!--${val}-->` + this.newLine;
    }else {
      return (
        this.indentate(level) + '<' + key + attrStr + piClosingChar + this.tagEndChar +
        val +
        this.indentate(level) + tagEndExp    );
    }
  }
};

Builder.prototype.closeTag = function(key){
  let closeTag = "";
  if(this.options.unpairedTags.indexOf(key) !== -1){ //unpaired
    if(!this.options.suppressUnpairedNode) closeTag = "/";
  }else if(this.options.suppressEmptyNode){ //empty
    closeTag = "/";
  }else {
    closeTag = `></${key}`;
  }
  return closeTag;
};

Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
  if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
    return this.indentate(level) + `<![CDATA[${val}]]>` +  this.newLine;
  }else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
    return this.indentate(level) + `<!--${val}-->` +  this.newLine;
  }else if(key[0] === "?") {//PI tag
    return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar; 
  }else {
    let textValue = this.options.tagValueProcessor(key, val);
    textValue = this.replaceEntitiesValue(textValue);
  
    if( textValue === ''){
      return this.indentate(level) + '<' + key + attrStr + this.closeTag(key) + this.tagEndChar;
    }else {
      return this.indentate(level) + '<' + key + attrStr + '>' +
         textValue +
        '</' + key + this.tagEndChar;
    }
  }
};

Builder.prototype.replaceEntitiesValue = function(textValue){
  if(textValue && textValue.length > 0 && this.options.processEntities){
    for (let i=0; i<this.options.entities.length; i++) {
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
  if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
    return name.substr(this.attrPrefixLen);
  } else {
    return false;
  }
}

var json2xml = Builder;

const validator = validator$2;
const XMLParser = XMLParser_1;
const XMLBuilder = json2xml;

var fxp = {
  XMLParser: XMLParser,
  XMLValidator: validator,
  XMLBuilder: XMLBuilder
};

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

/*!
 *  decimal.js v10.6.0
 *  An arbitrary-precision Decimal type for JavaScript.
 *  https://github.com/MikeMcl/decimal.js
 *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
 *  MIT Licence
 */


// -----------------------------------  EDITABLE DEFAULTS  ------------------------------------ //


  // The maximum exponent magnitude.
  // The limit on the value of `toExpNeg`, `toExpPos`, `minE` and `maxE`.
var EXP_LIMIT = 9e15,                      // 0 to 9e15

  // The limit on the value of `precision`, and on the value of the first argument to
  // `toDecimalPlaces`, `toExponential`, `toFixed`, `toPrecision` and `toSignificantDigits`.
  MAX_DIGITS = 1e9,                        // 0 to 1e9

  // Base conversion alphabet.
  NUMERALS = '0123456789abcdef',

  // The natural logarithm of 10 (1025 digits).
  LN10 = '2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058',

  // Pi (1025 digits).
  PI = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789',


  // The initial configuration properties of the Decimal constructor.
  DEFAULTS = {

    // These values must be integers within the stated ranges (inclusive).
    // Most of these values can be changed at run-time using the `Decimal.config` method.

    // The maximum number of significant digits of the result of a calculation or base conversion.
    // E.g. `Decimal.config({ precision: 20 });`
    precision: 20,                         // 1 to MAX_DIGITS

    // The rounding mode used when rounding to `precision`.
    //
    // ROUND_UP         0 Away from zero.
    // ROUND_DOWN       1 Towards zero.
    // ROUND_CEIL       2 Towards +Infinity.
    // ROUND_FLOOR      3 Towards -Infinity.
    // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
    // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
    // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
    // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
    // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
    //
    // E.g.
    // `Decimal.rounding = 4;`
    // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
    rounding: 4,                           // 0 to 8

    // The modulo mode used when calculating the modulus: a mod n.
    // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
    // The remainder (r) is calculated as: r = a - n * q.
    //
    // UP         0 The remainder is positive if the dividend is negative, else is negative.
    // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
    // FLOOR      3 The remainder has the same sign as the divisor (Python %).
    // HALF_EVEN  6 The IEEE 754 remainder function.
    // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
    //
    // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
    // division (9) are commonly used for the modulus operation. The other rounding modes can also
    // be used, but they may not give useful results.
    modulo: 1,                             // 0 to 9

    // The exponent value at and beneath which `toString` returns exponential notation.
    // JavaScript numbers: -7
    toExpNeg: -7,                          // 0 to -EXP_LIMIT

    // The exponent value at and above which `toString` returns exponential notation.
    // JavaScript numbers: 21
    toExpPos:  21,                         // 0 to EXP_LIMIT

    // The minimum exponent value, beneath which underflow to zero occurs.
    // JavaScript numbers: -324  (5e-324)
    minE: -EXP_LIMIT,                      // -1 to -EXP_LIMIT

    // The maximum exponent value, above which overflow to Infinity occurs.
    // JavaScript numbers: 308  (1.7976931348623157e+308)
    maxE: EXP_LIMIT,                       // 1 to EXP_LIMIT

    // Whether to use cryptographically-secure random number generation, if available.
    crypto: false                          // true/false
  },


// ----------------------------------- END OF EDITABLE DEFAULTS ------------------------------- //


  inexact, quadrant,
  external = true,

  decimalError = '[DecimalError] ',
  invalidArgument = decimalError + 'Invalid argument: ',
  precisionLimitExceeded = decimalError + 'Precision limit exceeded',
  cryptoUnavailable = decimalError + 'crypto unavailable',
  tag = '[object Decimal]',

  mathfloor = Math.floor,
  mathpow = Math.pow,

  isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i,
  isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i,
  isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i,
  isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,

  BASE = 1e7,
  LOG_BASE = 7,
  MAX_SAFE_INTEGER = 9007199254740991,

  LN10_PRECISION = LN10.length - 1,
  PI_PRECISION = PI.length - 1,

  // Decimal.prototype object
  P = { toStringTag: tag };


// Decimal prototype methods


/*
 *  absoluteValue             abs
 *  ceil
 *  clampedTo                 clamp
 *  comparedTo                cmp
 *  cosine                    cos
 *  cubeRoot                  cbrt
 *  decimalPlaces             dp
 *  dividedBy                 div
 *  dividedToIntegerBy        divToInt
 *  equals                    eq
 *  floor
 *  greaterThan               gt
 *  greaterThanOrEqualTo      gte
 *  hyperbolicCosine          cosh
 *  hyperbolicSine            sinh
 *  hyperbolicTangent         tanh
 *  inverseCosine             acos
 *  inverseHyperbolicCosine   acosh
 *  inverseHyperbolicSine     asinh
 *  inverseHyperbolicTangent  atanh
 *  inverseSine               asin
 *  inverseTangent            atan
 *  isFinite
 *  isInteger                 isInt
 *  isNaN
 *  isNegative                isNeg
 *  isPositive                isPos
 *  isZero
 *  lessThan                  lt
 *  lessThanOrEqualTo         lte
 *  logarithm                 log
 *  [maximum]                 [max]
 *  [minimum]                 [min]
 *  minus                     sub
 *  modulo                    mod
 *  naturalExponential        exp
 *  naturalLogarithm          ln
 *  negated                   neg
 *  plus                      add
 *  precision                 sd
 *  round
 *  sine                      sin
 *  squareRoot                sqrt
 *  tangent                   tan
 *  times                     mul
 *  toBinary
 *  toDecimalPlaces           toDP
 *  toExponential
 *  toFixed
 *  toFraction
 *  toHexadecimal             toHex
 *  toNearest
 *  toNumber
 *  toOctal
 *  toPower                   pow
 *  toPrecision
 *  toSignificantDigits       toSD
 *  toString
 *  truncated                 trunc
 *  valueOf                   toJSON
 */


/*
 * Return a new Decimal whose value is the absolute value of this Decimal.
 *
 */
P.absoluteValue = P.abs = function () {
  var x = new this.constructor(this);
  if (x.s < 0) x.s = 1;
  return finalise(x);
};


/*
 * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
 * direction of positive Infinity.
 *
 */
P.ceil = function () {
  return finalise(new this.constructor(this), this.e + 1, 2);
};


/*
 * Return a new Decimal whose value is the value of this Decimal clamped to the range
 * delineated by `min` and `max`.
 *
 * min {number|string|bigint|Decimal}
 * max {number|string|bigint|Decimal}
 *
 */
P.clampedTo = P.clamp = function (min, max) {
  var k,
    x = this,
    Ctor = x.constructor;
  min = new Ctor(min);
  max = new Ctor(max);
  if (!min.s || !max.s) return new Ctor(NaN);
  if (min.gt(max)) throw Error(invalidArgument + max);
  k = x.cmp(min);
  return k < 0 ? min : x.cmp(max) > 0 ? max : new Ctor(x);
};


/*
 * Return
 *   1    if the value of this Decimal is greater than the value of `y`,
 *  -1    if the value of this Decimal is less than the value of `y`,
 *   0    if they have the same value,
 *   NaN  if the value of either Decimal is NaN.
 *
 */
P.comparedTo = P.cmp = function (y) {
  var i, j, xdL, ydL,
    x = this,
    xd = x.d,
    yd = (y = new x.constructor(y)).d,
    xs = x.s,
    ys = y.s;

  // Either NaN or ±Infinity?
  if (!xd || !yd) {
    return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
  }

  // Either zero?
  if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;

  // Signs differ?
  if (xs !== ys) return xs;

  // Compare exponents.
  if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;

  xdL = xd.length;
  ydL = yd.length;

  // Compare digit by digit.
  for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) {
    if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
  }

  // Compare lengths.
  return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
};


/*
 * Return a new Decimal whose value is the cosine of the value in radians of this Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-1, 1]
 *
 * cos(0)         = 1
 * cos(-0)        = 1
 * cos(Infinity)  = NaN
 * cos(-Infinity) = NaN
 * cos(NaN)       = NaN
 *
 */
P.cosine = P.cos = function () {
  var pr, rm,
    x = this,
    Ctor = x.constructor;

  if (!x.d) return new Ctor(NaN);

  // cos(0) = cos(-0) = 1
  if (!x.d[0]) return new Ctor(1);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
  Ctor.rounding = 1;

  x = cosine(Ctor, toLessThanHalfPi(Ctor, x));

  Ctor.precision = pr;
  Ctor.rounding = rm;

  return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
};


/*
 *
 * Return a new Decimal whose value is the cube root of the value of this Decimal, rounded to
 * `precision` significant digits using rounding mode `rounding`.
 *
 *  cbrt(0)  =  0
 *  cbrt(-0) = -0
 *  cbrt(1)  =  1
 *  cbrt(-1) = -1
 *  cbrt(N)  =  N
 *  cbrt(-I) = -I
 *  cbrt(I)  =  I
 *
 * Math.cbrt(x) = (x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3))
 *
 */
P.cubeRoot = P.cbrt = function () {
  var e, m, n, r, rep, s, sd, t, t3, t3plusx,
    x = this,
    Ctor = x.constructor;

  if (!x.isFinite() || x.isZero()) return new Ctor(x);
  external = false;

  // Initial estimate.
  s = x.s * mathpow(x.s * x, 1 / 3);

   // Math.cbrt underflow/overflow?
   // Pass x to Math.pow as integer, then adjust the exponent of the result.
  if (!s || Math.abs(s) == 1 / 0) {
    n = digitsToString(x.d);
    e = x.e;

    // Adjust n exponent so it is a multiple of 3 away from x exponent.
    if (s = (e - n.length + 1) % 3) n += (s == 1 || s == -2 ? '0' : '00');
    s = mathpow(n, 1 / 3);

    // Rarely, e may be one less than the result exponent value.
    e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));

    if (s == 1 / 0) {
      n = '5e' + e;
    } else {
      n = s.toExponential();
      n = n.slice(0, n.indexOf('e') + 1) + e;
    }

    r = new Ctor(n);
    r.s = x.s;
  } else {
    r = new Ctor(s.toString());
  }

  sd = (e = Ctor.precision) + 3;

  // Halley's method.
  // TODO? Compare Newton's method.
  for (;;) {
    t = r;
    t3 = t.times(t).times(t);
    t3plusx = t3.plus(x);
    r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);

    // TODO? Replace with for-loop and checkRoundingDigits.
    if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
      n = n.slice(sd - 3, sd + 1);

      // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or 4999
      // , i.e. approaching a rounding boundary, continue the iteration.
      if (n == '9999' || !rep && n == '4999') {

        // On the first iteration only, check to see if rounding up gives the exact result as the
        // nines may infinitely repeat.
        if (!rep) {
          finalise(t, e + 1, 0);

          if (t.times(t).times(t).eq(x)) {
            r = t;
            break;
          }
        }

        sd += 4;
        rep = 1;
      } else {

        // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
        // If not, then there are further digits and m will be truthy.
        if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

          // Truncate to the first rounding digit.
          finalise(r, e + 1, 1);
          m = !r.times(r).times(r).eq(x);
        }

        break;
      }
    }
  }

  external = true;

  return finalise(r, e, Ctor.rounding, m);
};


/*
 * Return the number of decimal places of the value of this Decimal.
 *
 */
P.decimalPlaces = P.dp = function () {
  var w,
    d = this.d,
    n = NaN;

  if (d) {
    w = d.length - 1;
    n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;

    // Subtract the number of trailing zeros of the last word.
    w = d[w];
    if (w) for (; w % 10 == 0; w /= 10) n--;
    if (n < 0) n = 0;
  }

  return n;
};


/*
 *  n / 0 = I
 *  n / N = N
 *  n / I = 0
 *  0 / n = 0
 *  0 / 0 = N
 *  0 / N = N
 *  0 / I = 0
 *  N / n = N
 *  N / 0 = N
 *  N / N = N
 *  N / I = N
 *  I / n = I
 *  I / 0 = I
 *  I / N = N
 *  I / I = N
 *
 * Return a new Decimal whose value is the value of this Decimal divided by `y`, rounded to
 * `precision` significant digits using rounding mode `rounding`.
 *
 */
P.dividedBy = P.div = function (y) {
  return divide(this, new this.constructor(y));
};


/*
 * Return a new Decimal whose value is the integer part of dividing the value of this Decimal
 * by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
 *
 */
P.dividedToIntegerBy = P.divToInt = function (y) {
  var x = this,
    Ctor = x.constructor;
  return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
};


/*
 * Return true if the value of this Decimal is equal to the value of `y`, otherwise return false.
 *
 */
P.equals = P.eq = function (y) {
  return this.cmp(y) === 0;
};


/*
 * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
 * direction of negative Infinity.
 *
 */
P.floor = function () {
  return finalise(new this.constructor(this), this.e + 1, 3);
};


/*
 * Return true if the value of this Decimal is greater than the value of `y`, otherwise return
 * false.
 *
 */
P.greaterThan = P.gt = function (y) {
  return this.cmp(y) > 0;
};


/*
 * Return true if the value of this Decimal is greater than or equal to the value of `y`,
 * otherwise return false.
 *
 */
P.greaterThanOrEqualTo = P.gte = function (y) {
  var k = this.cmp(y);
  return k == 1 || k === 0;
};


/*
 * Return a new Decimal whose value is the hyperbolic cosine of the value in radians of this
 * Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [1, Infinity]
 *
 * cosh(x) = 1 + x^2/2! + x^4/4! + x^6/6! + ...
 *
 * cosh(0)         = 1
 * cosh(-0)        = 1
 * cosh(Infinity)  = Infinity
 * cosh(-Infinity) = Infinity
 * cosh(NaN)       = NaN
 *
 *  x        time taken (ms)   result
 * 1000      9                 9.8503555700852349694e+433
 * 10000     25                4.4034091128314607936e+4342
 * 100000    171               1.4033316802130615897e+43429
 * 1000000   3817              1.5166076984010437725e+434294
 * 10000000  abandoned after 2 minute wait
 *
 * TODO? Compare performance of cosh(x) = 0.5 * (exp(x) + exp(-x))
 *
 */
P.hyperbolicCosine = P.cosh = function () {
  var k, n, pr, rm, len,
    x = this,
    Ctor = x.constructor,
    one = new Ctor(1);

  if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
  if (x.isZero()) return one;

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
  Ctor.rounding = 1;
  len = x.d.length;

  // Argument reduction: cos(4x) = 1 - 8cos^2(x) + 8cos^4(x) + 1
  // i.e. cos(x) = 1 - cos^2(x/4)(8 - 8cos^2(x/4))

  // Estimate the optimum number of times to use the argument reduction.
  // TODO? Estimation reused from cosine() and may not be optimal here.
  if (len < 32) {
    k = Math.ceil(len / 3);
    n = (1 / tinyPow(4, k)).toString();
  } else {
    k = 16;
    n = '2.3283064365386962890625e-10';
  }

  x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);

  // Reverse argument reduction
  var cosh2_x,
    i = k,
    d8 = new Ctor(8);
  for (; i--;) {
    cosh2_x = x.times(x);
    x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
  }

  return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
};


/*
 * Return a new Decimal whose value is the hyperbolic sine of the value in radians of this
 * Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-Infinity, Infinity]
 *
 * sinh(x) = x + x^3/3! + x^5/5! + x^7/7! + ...
 *
 * sinh(0)         = 0
 * sinh(-0)        = -0
 * sinh(Infinity)  = Infinity
 * sinh(-Infinity) = -Infinity
 * sinh(NaN)       = NaN
 *
 * x        time taken (ms)
 * 10       2 ms
 * 100      5 ms
 * 1000     14 ms
 * 10000    82 ms
 * 100000   886 ms            1.4033316802130615897e+43429
 * 200000   2613 ms
 * 300000   5407 ms
 * 400000   8824 ms
 * 500000   13026 ms          8.7080643612718084129e+217146
 * 1000000  48543 ms
 *
 * TODO? Compare performance of sinh(x) = 0.5 * (exp(x) - exp(-x))
 *
 */
P.hyperbolicSine = P.sinh = function () {
  var k, pr, rm, len,
    x = this,
    Ctor = x.constructor;

  if (!x.isFinite() || x.isZero()) return new Ctor(x);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
  Ctor.rounding = 1;
  len = x.d.length;

  if (len < 3) {
    x = taylorSeries(Ctor, 2, x, x, true);
  } else {

    // Alternative argument reduction: sinh(3x) = sinh(x)(3 + 4sinh^2(x))
    // i.e. sinh(x) = sinh(x/3)(3 + 4sinh^2(x/3))
    // 3 multiplications and 1 addition

    // Argument reduction: sinh(5x) = sinh(x)(5 + sinh^2(x)(20 + 16sinh^2(x)))
    // i.e. sinh(x) = sinh(x/5)(5 + sinh^2(x/5)(20 + 16sinh^2(x/5)))
    // 4 multiplications and 2 additions

    // Estimate the optimum number of times to use the argument reduction.
    k = 1.4 * Math.sqrt(len);
    k = k > 16 ? 16 : k | 0;

    x = x.times(1 / tinyPow(5, k));
    x = taylorSeries(Ctor, 2, x, x, true);

    // Reverse argument reduction
    var sinh2_x,
      d5 = new Ctor(5),
      d16 = new Ctor(16),
      d20 = new Ctor(20);
    for (; k--;) {
      sinh2_x = x.times(x);
      x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
    }
  }

  Ctor.precision = pr;
  Ctor.rounding = rm;

  return finalise(x, pr, rm, true);
};


/*
 * Return a new Decimal whose value is the hyperbolic tangent of the value in radians of this
 * Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-1, 1]
 *
 * tanh(x) = sinh(x) / cosh(x)
 *
 * tanh(0)         = 0
 * tanh(-0)        = -0
 * tanh(Infinity)  = 1
 * tanh(-Infinity) = -1
 * tanh(NaN)       = NaN
 *
 */
P.hyperbolicTangent = P.tanh = function () {
  var pr, rm,
    x = this,
    Ctor = x.constructor;

  if (!x.isFinite()) return new Ctor(x.s);
  if (x.isZero()) return new Ctor(x);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + 7;
  Ctor.rounding = 1;

  return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
};


/*
 * Return a new Decimal whose value is the arccosine (inverse cosine) in radians of the value of
 * this Decimal.
 *
 * Domain: [-1, 1]
 * Range: [0, pi]
 *
 * acos(x) = pi/2 - asin(x)
 *
 * acos(0)       = pi/2
 * acos(-0)      = pi/2
 * acos(1)       = 0
 * acos(-1)      = pi
 * acos(1/2)     = pi/3
 * acos(-1/2)    = 2*pi/3
 * acos(|x| > 1) = NaN
 * acos(NaN)     = NaN
 *
 */
P.inverseCosine = P.acos = function () {
  var x = this,
    Ctor = x.constructor,
    k = x.abs().cmp(1),
    pr = Ctor.precision,
    rm = Ctor.rounding;

  if (k !== -1) {
    return k === 0
      // |x| is 1
      ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0)
      // |x| > 1 or x is NaN
      : new Ctor(NaN);
  }

  if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);

  // TODO? Special case acos(0.5) = pi/3 and acos(-0.5) = 2*pi/3

  Ctor.precision = pr + 6;
  Ctor.rounding = 1;

  // See https://github.com/MikeMcl/decimal.js/pull/217
  x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan();

  Ctor.precision = pr;
  Ctor.rounding = rm;

  return x.times(2);
};


/*
 * Return a new Decimal whose value is the inverse of the hyperbolic cosine in radians of the
 * value of this Decimal.
 *
 * Domain: [1, Infinity]
 * Range: [0, Infinity]
 *
 * acosh(x) = ln(x + sqrt(x^2 - 1))
 *
 * acosh(x < 1)     = NaN
 * acosh(NaN)       = NaN
 * acosh(Infinity)  = Infinity
 * acosh(-Infinity) = NaN
 * acosh(0)         = NaN
 * acosh(-0)        = NaN
 * acosh(1)         = 0
 * acosh(-1)        = NaN
 *
 */
P.inverseHyperbolicCosine = P.acosh = function () {
  var pr, rm,
    x = this,
    Ctor = x.constructor;

  if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
  if (!x.isFinite()) return new Ctor(x);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
  Ctor.rounding = 1;
  external = false;

  x = x.times(x).minus(1).sqrt().plus(x);

  external = true;
  Ctor.precision = pr;
  Ctor.rounding = rm;

  return x.ln();
};


/*
 * Return a new Decimal whose value is the inverse of the hyperbolic sine in radians of the value
 * of this Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-Infinity, Infinity]
 *
 * asinh(x) = ln(x + sqrt(x^2 + 1))
 *
 * asinh(NaN)       = NaN
 * asinh(Infinity)  = Infinity
 * asinh(-Infinity) = -Infinity
 * asinh(0)         = 0
 * asinh(-0)        = -0
 *
 */
P.inverseHyperbolicSine = P.asinh = function () {
  var pr, rm,
    x = this,
    Ctor = x.constructor;

  if (!x.isFinite() || x.isZero()) return new Ctor(x);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
  Ctor.rounding = 1;
  external = false;

  x = x.times(x).plus(1).sqrt().plus(x);

  external = true;
  Ctor.precision = pr;
  Ctor.rounding = rm;

  return x.ln();
};


/*
 * Return a new Decimal whose value is the inverse of the hyperbolic tangent in radians of the
 * value of this Decimal.
 *
 * Domain: [-1, 1]
 * Range: [-Infinity, Infinity]
 *
 * atanh(x) = 0.5 * ln((1 + x) / (1 - x))
 *
 * atanh(|x| > 1)   = NaN
 * atanh(NaN)       = NaN
 * atanh(Infinity)  = NaN
 * atanh(-Infinity) = NaN
 * atanh(0)         = 0
 * atanh(-0)        = -0
 * atanh(1)         = Infinity
 * atanh(-1)        = -Infinity
 *
 */
P.inverseHyperbolicTangent = P.atanh = function () {
  var pr, rm, wpr, xsd,
    x = this,
    Ctor = x.constructor;

  if (!x.isFinite()) return new Ctor(NaN);
  if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  xsd = x.sd();

  if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);

  Ctor.precision = wpr = xsd - x.e;

  x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);

  Ctor.precision = pr + 4;
  Ctor.rounding = 1;

  x = x.ln();

  Ctor.precision = pr;
  Ctor.rounding = rm;

  return x.times(0.5);
};


/*
 * Return a new Decimal whose value is the arcsine (inverse sine) in radians of the value of this
 * Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-pi/2, pi/2]
 *
 * asin(x) = 2*atan(x/(1 + sqrt(1 - x^2)))
 *
 * asin(0)       = 0
 * asin(-0)      = -0
 * asin(1/2)     = pi/6
 * asin(-1/2)    = -pi/6
 * asin(1)       = pi/2
 * asin(-1)      = -pi/2
 * asin(|x| > 1) = NaN
 * asin(NaN)     = NaN
 *
 * TODO? Compare performance of Taylor series.
 *
 */
P.inverseSine = P.asin = function () {
  var halfPi, k,
    pr, rm,
    x = this,
    Ctor = x.constructor;

  if (x.isZero()) return new Ctor(x);

  k = x.abs().cmp(1);
  pr = Ctor.precision;
  rm = Ctor.rounding;

  if (k !== -1) {

    // |x| is 1
    if (k === 0) {
      halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
      halfPi.s = x.s;
      return halfPi;
    }

    // |x| > 1 or x is NaN
    return new Ctor(NaN);
  }

  // TODO? Special case asin(1/2) = pi/6 and asin(-1/2) = -pi/6

  Ctor.precision = pr + 6;
  Ctor.rounding = 1;

  x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();

  Ctor.precision = pr;
  Ctor.rounding = rm;

  return x.times(2);
};


/*
 * Return a new Decimal whose value is the arctangent (inverse tangent) in radians of the value
 * of this Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-pi/2, pi/2]
 *
 * atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
 *
 * atan(0)         = 0
 * atan(-0)        = -0
 * atan(1)         = pi/4
 * atan(-1)        = -pi/4
 * atan(Infinity)  = pi/2
 * atan(-Infinity) = -pi/2
 * atan(NaN)       = NaN
 *
 */
P.inverseTangent = P.atan = function () {
  var i, j, k, n, px, t, r, wpr, x2,
    x = this,
    Ctor = x.constructor,
    pr = Ctor.precision,
    rm = Ctor.rounding;

  if (!x.isFinite()) {
    if (!x.s) return new Ctor(NaN);
    if (pr + 4 <= PI_PRECISION) {
      r = getPi(Ctor, pr + 4, rm).times(0.5);
      r.s = x.s;
      return r;
    }
  } else if (x.isZero()) {
    return new Ctor(x);
  } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
    r = getPi(Ctor, pr + 4, rm).times(0.25);
    r.s = x.s;
    return r;
  }

  Ctor.precision = wpr = pr + 10;
  Ctor.rounding = 1;

  // TODO? if (x >= 1 && pr <= PI_PRECISION) atan(x) = halfPi * x.s - atan(1 / x);

  // Argument reduction
  // Ensure |x| < 0.42
  // atan(x) = 2 * atan(x / (1 + sqrt(1 + x^2)))

  k = Math.min(28, wpr / LOG_BASE + 2 | 0);

  for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));

  external = false;

  j = Math.ceil(wpr / LOG_BASE);
  n = 1;
  x2 = x.times(x);
  r = new Ctor(x);
  px = x;

  // atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
  for (; i !== -1;) {
    px = px.times(x2);
    t = r.minus(px.div(n += 2));

    px = px.times(x2);
    r = t.plus(px.div(n += 2));

    if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--;);
  }

  if (k) r = r.times(2 << (k - 1));

  external = true;

  return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
};


/*
 * Return true if the value of this Decimal is a finite number, otherwise return false.
 *
 */
P.isFinite = function () {
  return !!this.d;
};


/*
 * Return true if the value of this Decimal is an integer, otherwise return false.
 *
 */
P.isInteger = P.isInt = function () {
  return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
};


/*
 * Return true if the value of this Decimal is NaN, otherwise return false.
 *
 */
P.isNaN = function () {
  return !this.s;
};


/*
 * Return true if the value of this Decimal is negative, otherwise return false.
 *
 */
P.isNegative = P.isNeg = function () {
  return this.s < 0;
};


/*
 * Return true if the value of this Decimal is positive, otherwise return false.
 *
 */
P.isPositive = P.isPos = function () {
  return this.s > 0;
};


/*
 * Return true if the value of this Decimal is 0 or -0, otherwise return false.
 *
 */
P.isZero = function () {
  return !!this.d && this.d[0] === 0;
};


/*
 * Return true if the value of this Decimal is less than `y`, otherwise return false.
 *
 */
P.lessThan = P.lt = function (y) {
  return this.cmp(y) < 0;
};


/*
 * Return true if the value of this Decimal is less than or equal to `y`, otherwise return false.
 *
 */
P.lessThanOrEqualTo = P.lte = function (y) {
  return this.cmp(y) < 1;
};


/*
 * Return the logarithm of the value of this Decimal to the specified base, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * If no base is specified, return log[10](arg).
 *
 * log[base](arg) = ln(arg) / ln(base)
 *
 * The result will always be correctly rounded if the base of the log is 10, and 'almost always'
 * otherwise:
 *
 * Depending on the rounding mode, the result may be incorrectly rounded if the first fifteen
 * rounding digits are [49]99999999999999 or [50]00000000000000. In that case, the maximum error
 * between the result and the correctly rounded result will be one ulp (unit in the last place).
 *
 * log[-b](a)       = NaN
 * log[0](a)        = NaN
 * log[1](a)        = NaN
 * log[NaN](a)      = NaN
 * log[Infinity](a) = NaN
 * log[b](0)        = -Infinity
 * log[b](-0)       = -Infinity
 * log[b](-a)       = NaN
 * log[b](1)        = 0
 * log[b](Infinity) = Infinity
 * log[b](NaN)      = NaN
 *
 * [base] {number|string|bigint|Decimal} The base of the logarithm.
 *
 */
P.logarithm = P.log = function (base) {
  var isBase10, d, denominator, k, inf, num, sd, r,
    arg = this,
    Ctor = arg.constructor,
    pr = Ctor.precision,
    rm = Ctor.rounding,
    guard = 5;

  // Default base is 10.
  if (base == null) {
    base = new Ctor(10);
    isBase10 = true;
  } else {
    base = new Ctor(base);
    d = base.d;

    // Return NaN if base is negative, or non-finite, or is 0 or 1.
    if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);

    isBase10 = base.eq(10);
  }

  d = arg.d;

  // Is arg negative, non-finite, 0 or 1?
  if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
    return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
  }

  // The result will have a non-terminating decimal expansion if base is 10 and arg is not an
  // integer power of 10.
  if (isBase10) {
    if (d.length > 1) {
      inf = true;
    } else {
      for (k = d[0]; k % 10 === 0;) k /= 10;
      inf = k !== 1;
    }
  }

  external = false;
  sd = pr + guard;
  num = naturalLogarithm(arg, sd);
  denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);

  // The result will have 5 rounding digits.
  r = divide(num, denominator, sd, 1);

  // If at a rounding boundary, i.e. the result's rounding digits are [49]9999 or [50]0000,
  // calculate 10 further digits.
  //
  // If the result is known to have an infinite decimal expansion, repeat this until it is clear
  // that the result is above or below the boundary. Otherwise, if after calculating the 10
  // further digits, the last 14 are nines, round up and assume the result is exact.
  // Also assume the result is exact if the last 14 are zero.
  //
  // Example of a result that will be incorrectly rounded:
  // log[1048576](4503599627370502) = 2.60000000000000009610279511444746...
  // The above result correctly rounded using ROUND_CEIL to 1 decimal place should be 2.7, but it
  // will be given as 2.6 as there are 15 zeros immediately after the requested decimal place, so
  // the exact result would be assumed to be 2.6, which rounded using ROUND_CEIL to 1 decimal
  // place is still 2.6.
  if (checkRoundingDigits(r.d, k = pr, rm)) {

    do {
      sd += 10;
      num = naturalLogarithm(arg, sd);
      denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
      r = divide(num, denominator, sd, 1);

      if (!inf) {

        // Check for 14 nines from the 2nd rounding digit, as the first may be 4.
        if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
          r = finalise(r, pr + 1, 0);
        }

        break;
      }
    } while (checkRoundingDigits(r.d, k += 10, rm));
  }

  external = true;

  return finalise(r, pr, rm);
};


/*
 * Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
 *
 * arguments {number|string|bigint|Decimal}
 *
P.max = function () {
  Array.prototype.push.call(arguments, this);
  return maxOrMin(this.constructor, arguments, -1);
};
 */


/*
 * Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
 *
 * arguments {number|string|bigint|Decimal}
 *
P.min = function () {
  Array.prototype.push.call(arguments, this);
  return maxOrMin(this.constructor, arguments, 1);
};
 */


/*
 *  n - 0 = n
 *  n - N = N
 *  n - I = -I
 *  0 - n = -n
 *  0 - 0 = 0
 *  0 - N = N
 *  0 - I = -I
 *  N - n = N
 *  N - 0 = N
 *  N - N = N
 *  N - I = N
 *  I - n = I
 *  I - 0 = I
 *  I - N = N
 *  I - I = N
 *
 * Return a new Decimal whose value is the value of this Decimal minus `y`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 */
P.minus = P.sub = function (y) {
  var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd,
    x = this,
    Ctor = x.constructor;

  y = new Ctor(y);

  // If either is not finite...
  if (!x.d || !y.d) {

    // Return NaN if either is NaN.
    if (!x.s || !y.s) y = new Ctor(NaN);

    // Return y negated if x is finite and y is ±Infinity.
    else if (x.d) y.s = -y.s;

    // Return x if y is finite and x is ±Infinity.
    // Return x if both are ±Infinity with different signs.
    // Return NaN if both are ±Infinity with the same sign.
    else y = new Ctor(y.d || x.s !== y.s ? x : NaN);

    return y;
  }

  // If signs differ...
  if (x.s != y.s) {
    y.s = -y.s;
    return x.plus(y);
  }

  xd = x.d;
  yd = y.d;
  pr = Ctor.precision;
  rm = Ctor.rounding;

  // If either is zero...
  if (!xd[0] || !yd[0]) {

    // Return y negated if x is zero and y is non-zero.
    if (yd[0]) y.s = -y.s;

    // Return x if y is zero and x is non-zero.
    else if (xd[0]) y = new Ctor(x);

    // Return zero if both are zero.
    // From IEEE 754 (2008) 6.3: 0 - 0 = -0 - -0 = -0 when rounding to -Infinity.
    else return new Ctor(rm === 3 ? -0 : 0);

    return external ? finalise(y, pr, rm) : y;
  }

  // x and y are finite, non-zero numbers with the same sign.

  // Calculate base 1e7 exponents.
  e = mathfloor(y.e / LOG_BASE);
  xe = mathfloor(x.e / LOG_BASE);

  xd = xd.slice();
  k = xe - e;

  // If base 1e7 exponents differ...
  if (k) {
    xLTy = k < 0;

    if (xLTy) {
      d = xd;
      k = -k;
      len = yd.length;
    } else {
      d = yd;
      e = xe;
      len = xd.length;
    }

    // Numbers with massively different exponents would result in a very high number of
    // zeros needing to be prepended, but this can be avoided while still ensuring correct
    // rounding by limiting the number of zeros to `Math.ceil(pr / LOG_BASE) + 2`.
    i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;

    if (k > i) {
      k = i;
      d.length = 1;
    }

    // Prepend zeros to equalise exponents.
    d.reverse();
    for (i = k; i--;) d.push(0);
    d.reverse();

  // Base 1e7 exponents equal.
  } else {

    // Check digits to determine which is the bigger number.

    i = xd.length;
    len = yd.length;
    xLTy = i < len;
    if (xLTy) len = i;

    for (i = 0; i < len; i++) {
      if (xd[i] != yd[i]) {
        xLTy = xd[i] < yd[i];
        break;
      }
    }

    k = 0;
  }

  if (xLTy) {
    d = xd;
    xd = yd;
    yd = d;
    y.s = -y.s;
  }

  len = xd.length;

  // Append zeros to `xd` if shorter.
  // Don't add zeros to `yd` if shorter as subtraction only needs to start at `yd` length.
  for (i = yd.length - len; i > 0; --i) xd[len++] = 0;

  // Subtract yd from xd.
  for (i = yd.length; i > k;) {

    if (xd[--i] < yd[i]) {
      for (j = i; j && xd[--j] === 0;) xd[j] = BASE - 1;
      --xd[j];
      xd[i] += BASE;
    }

    xd[i] -= yd[i];
  }

  // Remove trailing zeros.
  for (; xd[--len] === 0;) xd.pop();

  // Remove leading zeros and adjust exponent accordingly.
  for (; xd[0] === 0; xd.shift()) --e;

  // Zero?
  if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);

  y.d = xd;
  y.e = getBase10Exponent(xd, e);

  return external ? finalise(y, pr, rm) : y;
};


/*
 *   n % 0 =  N
 *   n % N =  N
 *   n % I =  n
 *   0 % n =  0
 *  -0 % n = -0
 *   0 % 0 =  N
 *   0 % N =  N
 *   0 % I =  0
 *   N % n =  N
 *   N % 0 =  N
 *   N % N =  N
 *   N % I =  N
 *   I % n =  N
 *   I % 0 =  N
 *   I % N =  N
 *   I % I =  N
 *
 * Return a new Decimal whose value is the value of this Decimal modulo `y`, rounded to
 * `precision` significant digits using rounding mode `rounding`.
 *
 * The result depends on the modulo mode.
 *
 */
P.modulo = P.mod = function (y) {
  var q,
    x = this,
    Ctor = x.constructor;

  y = new Ctor(y);

  // Return NaN if x is ±Infinity or NaN, or y is NaN or ±0.
  if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);

  // Return x if y is ±Infinity or x is ±0.
  if (!y.d || x.d && !x.d[0]) {
    return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
  }

  // Prevent rounding of intermediate calculations.
  external = false;

  if (Ctor.modulo == 9) {

    // Euclidian division: q = sign(y) * floor(x / abs(y))
    // result = x - q * y    where  0 <= result < abs(y)
    q = divide(x, y.abs(), 0, 3, 1);
    q.s *= y.s;
  } else {
    q = divide(x, y, 0, Ctor.modulo, 1);
  }

  q = q.times(y);

  external = true;

  return x.minus(q);
};


/*
 * Return a new Decimal whose value is the natural exponential of the value of this Decimal,
 * i.e. the base e raised to the power the value of this Decimal, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 */
P.naturalExponential = P.exp = function () {
  return naturalExponential(this);
};


/*
 * Return a new Decimal whose value is the natural logarithm of the value of this Decimal,
 * rounded to `precision` significant digits using rounding mode `rounding`.
 *
 */
P.naturalLogarithm = P.ln = function () {
  return naturalLogarithm(this);
};


/*
 * Return a new Decimal whose value is the value of this Decimal negated, i.e. as if multiplied by
 * -1.
 *
 */
P.negated = P.neg = function () {
  var x = new this.constructor(this);
  x.s = -x.s;
  return finalise(x);
};


/*
 *  n + 0 = n
 *  n + N = N
 *  n + I = I
 *  0 + n = n
 *  0 + 0 = 0
 *  0 + N = N
 *  0 + I = I
 *  N + n = N
 *  N + 0 = N
 *  N + N = N
 *  N + I = N
 *  I + n = I
 *  I + 0 = I
 *  I + N = N
 *  I + I = I
 *
 * Return a new Decimal whose value is the value of this Decimal plus `y`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 */
P.plus = P.add = function (y) {
  var carry, d, e, i, k, len, pr, rm, xd, yd,
    x = this,
    Ctor = x.constructor;

  y = new Ctor(y);

  // If either is not finite...
  if (!x.d || !y.d) {

    // Return NaN if either is NaN.
    if (!x.s || !y.s) y = new Ctor(NaN);

    // Return x if y is finite and x is ±Infinity.
    // Return x if both are ±Infinity with the same sign.
    // Return NaN if both are ±Infinity with different signs.
    // Return y if x is finite and y is ±Infinity.
    else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);

    return y;
  }

   // If signs differ...
  if (x.s != y.s) {
    y.s = -y.s;
    return x.minus(y);
  }

  xd = x.d;
  yd = y.d;
  pr = Ctor.precision;
  rm = Ctor.rounding;

  // If either is zero...
  if (!xd[0] || !yd[0]) {

    // Return x if y is zero.
    // Return y if y is non-zero.
    if (!yd[0]) y = new Ctor(x);

    return external ? finalise(y, pr, rm) : y;
  }

  // x and y are finite, non-zero numbers with the same sign.

  // Calculate base 1e7 exponents.
  k = mathfloor(x.e / LOG_BASE);
  e = mathfloor(y.e / LOG_BASE);

  xd = xd.slice();
  i = k - e;

  // If base 1e7 exponents differ...
  if (i) {

    if (i < 0) {
      d = xd;
      i = -i;
      len = yd.length;
    } else {
      d = yd;
      e = k;
      len = xd.length;
    }

    // Limit number of zeros prepended to max(ceil(pr / LOG_BASE), len) + 1.
    k = Math.ceil(pr / LOG_BASE);
    len = k > len ? k + 1 : len + 1;

    if (i > len) {
      i = len;
      d.length = 1;
    }

    // Prepend zeros to equalise exponents. Note: Faster to use reverse then do unshifts.
    d.reverse();
    for (; i--;) d.push(0);
    d.reverse();
  }

  len = xd.length;
  i = yd.length;

  // If yd is longer than xd, swap xd and yd so xd points to the longer array.
  if (len - i < 0) {
    i = len;
    d = yd;
    yd = xd;
    xd = d;
  }

  // Only start adding at yd.length - 1 as the further digits of xd can be left as they are.
  for (carry = 0; i;) {
    carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
    xd[i] %= BASE;
  }

  if (carry) {
    xd.unshift(carry);
    ++e;
  }

  // Remove trailing zeros.
  // No need to check for zero, as +x + +y != 0 && -x + -y != 0
  for (len = xd.length; xd[--len] == 0;) xd.pop();

  y.d = xd;
  y.e = getBase10Exponent(xd, e);

  return external ? finalise(y, pr, rm) : y;
};


/*
 * Return the number of significant digits of the value of this Decimal.
 *
 * [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
 *
 */
P.precision = P.sd = function (z) {
  var k,
    x = this;

  if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);

  if (x.d) {
    k = getPrecision(x.d);
    if (z && x.e + 1 > k) k = x.e + 1;
  } else {
    k = NaN;
  }

  return k;
};


/*
 * Return a new Decimal whose value is the value of this Decimal rounded to a whole number using
 * rounding mode `rounding`.
 *
 */
P.round = function () {
  var x = this,
    Ctor = x.constructor;

  return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
};


/*
 * Return a new Decimal whose value is the sine of the value in radians of this Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-1, 1]
 *
 * sin(x) = x - x^3/3! + x^5/5! - ...
 *
 * sin(0)         = 0
 * sin(-0)        = -0
 * sin(Infinity)  = NaN
 * sin(-Infinity) = NaN
 * sin(NaN)       = NaN
 *
 */
P.sine = P.sin = function () {
  var pr, rm,
    x = this,
    Ctor = x.constructor;

  if (!x.isFinite()) return new Ctor(NaN);
  if (x.isZero()) return new Ctor(x);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
  Ctor.rounding = 1;

  x = sine(Ctor, toLessThanHalfPi(Ctor, x));

  Ctor.precision = pr;
  Ctor.rounding = rm;

  return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
};


/*
 * Return a new Decimal whose value is the square root of this Decimal, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 *  sqrt(-n) =  N
 *  sqrt(N)  =  N
 *  sqrt(-I) =  N
 *  sqrt(I)  =  I
 *  sqrt(0)  =  0
 *  sqrt(-0) = -0
 *
 */
P.squareRoot = P.sqrt = function () {
  var m, n, sd, r, rep, t,
    x = this,
    d = x.d,
    e = x.e,
    s = x.s,
    Ctor = x.constructor;

  // Negative/NaN/Infinity/zero?
  if (s !== 1 || !d || !d[0]) {
    return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
  }

  external = false;

  // Initial estimate.
  s = Math.sqrt(+x);

  // Math.sqrt underflow/overflow?
  // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
  if (s == 0 || s == 1 / 0) {
    n = digitsToString(d);

    if ((n.length + e) % 2 == 0) n += '0';
    s = Math.sqrt(n);
    e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);

    if (s == 1 / 0) {
      n = '5e' + e;
    } else {
      n = s.toExponential();
      n = n.slice(0, n.indexOf('e') + 1) + e;
    }

    r = new Ctor(n);
  } else {
    r = new Ctor(s.toString());
  }

  sd = (e = Ctor.precision) + 3;

  // Newton-Raphson iteration.
  for (;;) {
    t = r;
    r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);

    // TODO? Replace with for-loop and checkRoundingDigits.
    if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
      n = n.slice(sd - 3, sd + 1);

      // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or
      // 4999, i.e. approaching a rounding boundary, continue the iteration.
      if (n == '9999' || !rep && n == '4999') {

        // On the first iteration only, check to see if rounding up gives the exact result as the
        // nines may infinitely repeat.
        if (!rep) {
          finalise(t, e + 1, 0);

          if (t.times(t).eq(x)) {
            r = t;
            break;
          }
        }

        sd += 4;
        rep = 1;
      } else {

        // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
        // If not, then there are further digits and m will be truthy.
        if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

          // Truncate to the first rounding digit.
          finalise(r, e + 1, 1);
          m = !r.times(r).eq(x);
        }

        break;
      }
    }
  }

  external = true;

  return finalise(r, e, Ctor.rounding, m);
};


/*
 * Return a new Decimal whose value is the tangent of the value in radians of this Decimal.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-Infinity, Infinity]
 *
 * tan(0)         = 0
 * tan(-0)        = -0
 * tan(Infinity)  = NaN
 * tan(-Infinity) = NaN
 * tan(NaN)       = NaN
 *
 */
P.tangent = P.tan = function () {
  var pr, rm,
    x = this,
    Ctor = x.constructor;

  if (!x.isFinite()) return new Ctor(NaN);
  if (x.isZero()) return new Ctor(x);

  pr = Ctor.precision;
  rm = Ctor.rounding;
  Ctor.precision = pr + 10;
  Ctor.rounding = 1;

  x = x.sin();
  x.s = 1;
  x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);

  Ctor.precision = pr;
  Ctor.rounding = rm;

  return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
};


/*
 *  n * 0 = 0
 *  n * N = N
 *  n * I = I
 *  0 * n = 0
 *  0 * 0 = 0
 *  0 * N = N
 *  0 * I = N
 *  N * n = N
 *  N * 0 = N
 *  N * N = N
 *  N * I = N
 *  I * n = I
 *  I * 0 = N
 *  I * N = N
 *  I * I = I
 *
 * Return a new Decimal whose value is this Decimal times `y`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 */
P.times = P.mul = function (y) {
  var carry, e, i, k, r, rL, t, xdL, ydL,
    x = this,
    Ctor = x.constructor,
    xd = x.d,
    yd = (y = new Ctor(y)).d;

  y.s *= x.s;

   // If either is NaN, ±Infinity or ±0...
  if (!xd || !xd[0] || !yd || !yd[0]) {

    return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd

      // Return NaN if either is NaN.
      // Return NaN if x is ±0 and y is ±Infinity, or y is ±0 and x is ±Infinity.
      ? NaN

      // Return ±Infinity if either is ±Infinity.
      // Return ±0 if either is ±0.
      : !xd || !yd ? y.s / 0 : y.s * 0);
  }

  e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
  xdL = xd.length;
  ydL = yd.length;

  // Ensure xd points to the longer array.
  if (xdL < ydL) {
    r = xd;
    xd = yd;
    yd = r;
    rL = xdL;
    xdL = ydL;
    ydL = rL;
  }

  // Initialise the result array with zeros.
  r = [];
  rL = xdL + ydL;
  for (i = rL; i--;) r.push(0);

  // Multiply!
  for (i = ydL; --i >= 0;) {
    carry = 0;
    for (k = xdL + i; k > i;) {
      t = r[k] + yd[i] * xd[k - i - 1] + carry;
      r[k--] = t % BASE | 0;
      carry = t / BASE | 0;
    }

    r[k] = (r[k] + carry) % BASE | 0;
  }

  // Remove trailing zeros.
  for (; !r[--rL];) r.pop();

  if (carry) ++e;
  else r.shift();

  y.d = r;
  y.e = getBase10Exponent(r, e);

  return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
};


/*
 * Return a string representing the value of this Decimal in base 2, round to `sd` significant
 * digits using rounding mode `rm`.
 *
 * If the optional `sd` argument is present then return binary exponential notation.
 *
 * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 */
P.toBinary = function (sd, rm) {
  return toStringBinary(this, 2, sd, rm);
};


/*
 * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `dp`
 * decimal places using rounding mode `rm` or `rounding` if `rm` is omitted.
 *
 * If `dp` is omitted, return a new Decimal whose value is the value of this Decimal.
 *
 * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 */
P.toDecimalPlaces = P.toDP = function (dp, rm) {
  var x = this,
    Ctor = x.constructor;

  x = new Ctor(x);
  if (dp === void 0) return x;

  checkInt32(dp, 0, MAX_DIGITS);

  if (rm === void 0) rm = Ctor.rounding;
  else checkInt32(rm, 0, 8);

  return finalise(x, dp + x.e + 1, rm);
};


/*
 * Return a string representing the value of this Decimal in exponential notation rounded to
 * `dp` fixed decimal places using rounding mode `rounding`.
 *
 * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 */
P.toExponential = function (dp, rm) {
  var str,
    x = this,
    Ctor = x.constructor;

  if (dp === void 0) {
    str = finiteToString(x, true);
  } else {
    checkInt32(dp, 0, MAX_DIGITS);

    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);

    x = finalise(new Ctor(x), dp + 1, rm);
    str = finiteToString(x, true, dp + 1);
  }

  return x.isNeg() && !x.isZero() ? '-' + str : str;
};


/*
 * Return a string representing the value of this Decimal in normal (fixed-point) notation to
 * `dp` fixed decimal places and rounded using rounding mode `rm` or `rounding` if `rm` is
 * omitted.
 *
 * As with JavaScript numbers, (-0).toFixed(0) is '0', but e.g. (-0.00001).toFixed(0) is '-0'.
 *
 * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
 * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
 * (-0).toFixed(3) is '0.000'.
 * (-0.5).toFixed(0) is '-0'.
 *
 */
P.toFixed = function (dp, rm) {
  var str, y,
    x = this,
    Ctor = x.constructor;

  if (dp === void 0) {
    str = finiteToString(x);
  } else {
    checkInt32(dp, 0, MAX_DIGITS);

    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);

    y = finalise(new Ctor(x), dp + x.e + 1, rm);
    str = finiteToString(y, false, dp + y.e + 1);
  }

  // To determine whether to add the minus sign look at the value before it was rounded,
  // i.e. look at `x` rather than `y`.
  return x.isNeg() && !x.isZero() ? '-' + str : str;
};


/*
 * Return an array representing the value of this Decimal as a simple fraction with an integer
 * numerator and an integer denominator.
 *
 * The denominator will be a positive non-zero value less than or equal to the specified maximum
 * denominator. If a maximum denominator is not specified, the denominator will be the lowest
 * value necessary to represent the number exactly.
 *
 * [maxD] {number|string|bigint|Decimal} Maximum denominator. Integer >= 1 and < Infinity.
 *
 */
P.toFraction = function (maxD) {
  var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r,
    x = this,
    xd = x.d,
    Ctor = x.constructor;

  if (!xd) return new Ctor(x);

  n1 = d0 = new Ctor(1);
  d1 = n0 = new Ctor(0);

  d = new Ctor(d1);
  e = d.e = getPrecision(xd) - x.e - 1;
  k = e % LOG_BASE;
  d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);

  if (maxD == null) {

    // d is 10**e, the minimum max-denominator needed.
    maxD = e > 0 ? d : n1;
  } else {
    n = new Ctor(maxD);
    if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
    maxD = n.gt(d) ? (e > 0 ? d : n1) : n;
  }

  external = false;
  n = new Ctor(digitsToString(xd));
  pr = Ctor.precision;
  Ctor.precision = e = xd.length * LOG_BASE * 2;

  for (;;)  {
    q = divide(n, d, 0, 1, 1);
    d2 = d0.plus(q.times(d1));
    if (d2.cmp(maxD) == 1) break;
    d0 = d1;
    d1 = d2;
    d2 = n1;
    n1 = n0.plus(q.times(d2));
    n0 = d2;
    d2 = d;
    d = n.minus(q.times(d2));
    n = d2;
  }

  d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
  n0 = n0.plus(d2.times(n1));
  d0 = d0.plus(d2.times(d1));
  n0.s = n1.s = x.s;

  // Determine which fraction is closer to x, n0/d0 or n1/d1?
  r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1
      ? [n1, d1] : [n0, d0];

  Ctor.precision = pr;
  external = true;

  return r;
};


/*
 * Return a string representing the value of this Decimal in base 16, round to `sd` significant
 * digits using rounding mode `rm`.
 *
 * If the optional `sd` argument is present then return binary exponential notation.
 *
 * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 */
P.toHexadecimal = P.toHex = function (sd, rm) {
  return toStringBinary(this, 16, sd, rm);
};


/*
 * Returns a new Decimal whose value is the nearest multiple of `y` in the direction of rounding
 * mode `rm`, or `Decimal.rounding` if `rm` is omitted, to the value of this Decimal.
 *
 * The return value will always have the same sign as this Decimal, unless either this Decimal
 * or `y` is NaN, in which case the return value will be also be NaN.
 *
 * The return value is not affected by the value of `precision`.
 *
 * y {number|string|bigint|Decimal} The magnitude to round to a multiple of.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 * 'toNearest() rounding mode not an integer: {rm}'
 * 'toNearest() rounding mode out of range: {rm}'
 *
 */
P.toNearest = function (y, rm) {
  var x = this,
    Ctor = x.constructor;

  x = new Ctor(x);

  if (y == null) {

    // If x is not finite, return x.
    if (!x.d) return x;

    y = new Ctor(1);
    rm = Ctor.rounding;
  } else {
    y = new Ctor(y);
    if (rm === void 0) {
      rm = Ctor.rounding;
    } else {
      checkInt32(rm, 0, 8);
    }

    // If x is not finite, return x if y is not NaN, else NaN.
    if (!x.d) return y.s ? x : y;

    // If y is not finite, return Infinity with the sign of x if y is Infinity, else NaN.
    if (!y.d) {
      if (y.s) y.s = x.s;
      return y;
    }
  }

  // If y is not zero, calculate the nearest multiple of y to x.
  if (y.d[0]) {
    external = false;
    x = divide(x, y, 0, rm, 1).times(y);
    external = true;
    finalise(x);

  // If y is zero, return zero with the sign of x.
  } else {
    y.s = x.s;
    x = y;
  }

  return x;
};


/*
 * Return the value of this Decimal converted to a number primitive.
 * Zero keeps its sign.
 *
 */
P.toNumber = function () {
  return +this;
};


/*
 * Return a string representing the value of this Decimal in base 8, round to `sd` significant
 * digits using rounding mode `rm`.
 *
 * If the optional `sd` argument is present then return binary exponential notation.
 *
 * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 */
P.toOctal = function (sd, rm) {
  return toStringBinary(this, 8, sd, rm);
};


/*
 * Return a new Decimal whose value is the value of this Decimal raised to the power `y`, rounded
 * to `precision` significant digits using rounding mode `rounding`.
 *
 * ECMAScript compliant.
 *
 *   pow(x, NaN)                           = NaN
 *   pow(x, ±0)                            = 1

 *   pow(NaN, non-zero)                    = NaN
 *   pow(abs(x) > 1, +Infinity)            = +Infinity
 *   pow(abs(x) > 1, -Infinity)            = +0
 *   pow(abs(x) == 1, ±Infinity)           = NaN
 *   pow(abs(x) < 1, +Infinity)            = +0
 *   pow(abs(x) < 1, -Infinity)            = +Infinity
 *   pow(+Infinity, y > 0)                 = +Infinity
 *   pow(+Infinity, y < 0)                 = +0
 *   pow(-Infinity, odd integer > 0)       = -Infinity
 *   pow(-Infinity, even integer > 0)      = +Infinity
 *   pow(-Infinity, odd integer < 0)       = -0
 *   pow(-Infinity, even integer < 0)      = +0
 *   pow(+0, y > 0)                        = +0
 *   pow(+0, y < 0)                        = +Infinity
 *   pow(-0, odd integer > 0)              = -0
 *   pow(-0, even integer > 0)             = +0
 *   pow(-0, odd integer < 0)              = -Infinity
 *   pow(-0, even integer < 0)             = +Infinity
 *   pow(finite x < 0, finite non-integer) = NaN
 *
 * For non-integer or very large exponents pow(x, y) is calculated using
 *
 *   x^y = exp(y*ln(x))
 *
 * Assuming the first 15 rounding digits are each equally likely to be any digit 0-9, the
 * probability of an incorrectly rounded result
 * P([49]9{14} | [50]0{14}) = 2 * 0.2 * 10^-14 = 4e-15 = 1/2.5e+14
 * i.e. 1 in 250,000,000,000,000
 *
 * If a result is incorrectly rounded the maximum error will be 1 ulp (unit in last place).
 *
 * y {number|string|bigint|Decimal} The power to which to raise this Decimal.
 *
 */
P.toPower = P.pow = function (y) {
  var e, k, pr, r, rm, s,
    x = this,
    Ctor = x.constructor,
    yn = +(y = new Ctor(y));

  // Either ±Infinity, NaN or ±0?
  if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));

  x = new Ctor(x);

  if (x.eq(1)) return x;

  pr = Ctor.precision;
  rm = Ctor.rounding;

  if (y.eq(1)) return finalise(x, pr, rm);

  // y exponent
  e = mathfloor(y.e / LOG_BASE);

  // If y is a small integer use the 'exponentiation by squaring' algorithm.
  if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
    r = intPow(Ctor, x, k, pr);
    return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
  }

  s = x.s;

  // if x is negative
  if (s < 0) {

    // if y is not an integer
    if (e < y.d.length - 1) return new Ctor(NaN);

    // Result is positive if x is negative and the last digit of integer y is even.
    if ((y.d[e] & 1) == 0) s = 1;

    // if x.eq(-1)
    if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
      x.s = s;
      return x;
    }
  }

  // Estimate result exponent.
  // x^y = 10^e,  where e = y * log10(x)
  // log10(x) = log10(x_significand) + x_exponent
  // log10(x_significand) = ln(x_significand) / ln(10)
  k = mathpow(+x, yn);
  e = k == 0 || !isFinite(k)
    ? mathfloor(yn * (Math.log('0.' + digitsToString(x.d)) / Math.LN10 + x.e + 1))
    : new Ctor(k + '').e;

  // Exponent estimate may be incorrect e.g. x: 0.999999999999999999, y: 2.29, e: 0, r.e: -1.

  // Overflow/underflow?
  if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);

  external = false;
  Ctor.rounding = x.s = 1;

  // Estimate the extra guard digits needed to ensure five correct rounding digits from
  // naturalLogarithm(x). Example of failure without these extra digits (precision: 10):
  // new Decimal(2.32456).pow('2087987436534566.46411')
  // should be 1.162377823e+764914905173815, but is 1.162355823e+764914905173815
  k = Math.min(12, (e + '').length);

  // r = x^y = exp(y*ln(x))
  r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);

  // r may be Infinity, e.g. (0.9999999999999999).pow(-1e+40)
  if (r.d) {

    // Truncate to the required precision plus five rounding digits.
    r = finalise(r, pr + 5, 1);

    // If the rounding digits are [49]9999 or [50]0000 increase the precision by 10 and recalculate
    // the result.
    if (checkRoundingDigits(r.d, pr, rm)) {
      e = pr + 10;

      // Truncate to the increased precision plus five rounding digits.
      r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);

      // Check for 14 nines from the 2nd rounding digit (the first rounding digit may be 4 or 9).
      if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
        r = finalise(r, pr + 1, 0);
      }
    }
  }

  r.s = s;
  external = true;
  Ctor.rounding = rm;

  return finalise(r, pr, rm);
};


/*
 * Return a string representing the value of this Decimal rounded to `sd` significant digits
 * using rounding mode `rounding`.
 *
 * Return exponential notation if `sd` is less than the number of digits necessary to represent
 * the integer part of the value in normal notation.
 *
 * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 */
P.toPrecision = function (sd, rm) {
  var str,
    x = this,
    Ctor = x.constructor;

  if (sd === void 0) {
    str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
  } else {
    checkInt32(sd, 1, MAX_DIGITS);

    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);

    x = finalise(new Ctor(x), sd, rm);
    str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
  }

  return x.isNeg() && !x.isZero() ? '-' + str : str;
};


/*
 * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `sd`
 * significant digits using rounding mode `rm`, or to `precision` and `rounding` respectively if
 * omitted.
 *
 * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
 * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
 *
 * 'toSD() digits out of range: {sd}'
 * 'toSD() digits not an integer: {sd}'
 * 'toSD() rounding mode not an integer: {rm}'
 * 'toSD() rounding mode out of range: {rm}'
 *
 */
P.toSignificantDigits = P.toSD = function (sd, rm) {
  var x = this,
    Ctor = x.constructor;

  if (sd === void 0) {
    sd = Ctor.precision;
    rm = Ctor.rounding;
  } else {
    checkInt32(sd, 1, MAX_DIGITS);

    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
  }

  return finalise(new Ctor(x), sd, rm);
};


/*
 * Return a string representing the value of this Decimal.
 *
 * Return exponential notation if this Decimal has a positive exponent equal to or greater than
 * `toExpPos`, or a negative exponent equal to or less than `toExpNeg`.
 *
 */
P.toString = function () {
  var x = this,
    Ctor = x.constructor,
    str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

  return x.isNeg() && !x.isZero() ? '-' + str : str;
};


/*
 * Return a new Decimal whose value is the value of this Decimal truncated to a whole number.
 *
 */
P.truncated = P.trunc = function () {
  return finalise(new this.constructor(this), this.e + 1, 1);
};


/*
 * Return a string representing the value of this Decimal.
 * Unlike `toString`, negative zero will include the minus sign.
 *
 */
P.valueOf = P.toJSON = function () {
  var x = this,
    Ctor = x.constructor,
    str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

  return x.isNeg() ? '-' + str : str;
};


// Helper functions for Decimal.prototype (P) and/or Decimal methods, and their callers.


/*
 *  digitsToString           P.cubeRoot, P.logarithm, P.squareRoot, P.toFraction, P.toPower,
 *                           finiteToString, naturalExponential, naturalLogarithm
 *  checkInt32               P.toDecimalPlaces, P.toExponential, P.toFixed, P.toNearest,
 *                           P.toPrecision, P.toSignificantDigits, toStringBinary, random
 *  checkRoundingDigits      P.logarithm, P.toPower, naturalExponential, naturalLogarithm
 *  convertBase              toStringBinary, parseOther
 *  cos                      P.cos
 *  divide                   P.atanh, P.cubeRoot, P.dividedBy, P.dividedToIntegerBy,
 *                           P.logarithm, P.modulo, P.squareRoot, P.tan, P.tanh, P.toFraction,
 *                           P.toNearest, toStringBinary, naturalExponential, naturalLogarithm,
 *                           taylorSeries, atan2, parseOther
 *  finalise                 P.absoluteValue, P.atan, P.atanh, P.ceil, P.cos, P.cosh,
 *                           P.cubeRoot, P.dividedToIntegerBy, P.floor, P.logarithm, P.minus,
 *                           P.modulo, P.negated, P.plus, P.round, P.sin, P.sinh, P.squareRoot,
 *                           P.tan, P.times, P.toDecimalPlaces, P.toExponential, P.toFixed,
 *                           P.toNearest, P.toPower, P.toPrecision, P.toSignificantDigits,
 *                           P.truncated, divide, getLn10, getPi, naturalExponential,
 *                           naturalLogarithm, ceil, floor, round, trunc
 *  finiteToString           P.toExponential, P.toFixed, P.toPrecision, P.toString, P.valueOf,
 *                           toStringBinary
 *  getBase10Exponent        P.minus, P.plus, P.times, parseOther
 *  getLn10                  P.logarithm, naturalLogarithm
 *  getPi                    P.acos, P.asin, P.atan, toLessThanHalfPi, atan2
 *  getPrecision             P.precision, P.toFraction
 *  getZeroString            digitsToString, finiteToString
 *  intPow                   P.toPower, parseOther
 *  isOdd                    toLessThanHalfPi
 *  maxOrMin                 max, min
 *  naturalExponential       P.naturalExponential, P.toPower
 *  naturalLogarithm         P.acosh, P.asinh, P.atanh, P.logarithm, P.naturalLogarithm,
 *                           P.toPower, naturalExponential
 *  nonFiniteToString        finiteToString, toStringBinary
 *  parseDecimal             Decimal
 *  parseOther               Decimal
 *  sin                      P.sin
 *  taylorSeries             P.cosh, P.sinh, cos, sin
 *  toLessThanHalfPi         P.cos, P.sin
 *  toStringBinary           P.toBinary, P.toHexadecimal, P.toOctal
 *  truncate                 intPow
 *
 *  Throws:                  P.logarithm, P.precision, P.toFraction, checkInt32, getLn10, getPi,
 *                           naturalLogarithm, config, parseOther, random, Decimal
 */


function digitsToString(d) {
  var i, k, ws,
    indexOfLastWord = d.length - 1,
    str = '',
    w = d[0];

  if (indexOfLastWord > 0) {
    str += w;
    for (i = 1; i < indexOfLastWord; i++) {
      ws = d[i] + '';
      k = LOG_BASE - ws.length;
      if (k) str += getZeroString(k);
      str += ws;
    }

    w = d[i];
    ws = w + '';
    k = LOG_BASE - ws.length;
    if (k) str += getZeroString(k);
  } else if (w === 0) {
    return '0';
  }

  // Remove trailing zeros of last w.
  for (; w % 10 === 0;) w /= 10;

  return str + w;
}


function checkInt32(i, min, max) {
  if (i !== ~~i || i < min || i > max) {
    throw Error(invalidArgument + i);
  }
}


/*
 * Check 5 rounding digits if `repeating` is null, 4 otherwise.
 * `repeating == null` if caller is `log` or `pow`,
 * `repeating != null` if caller is `naturalLogarithm` or `naturalExponential`.
 */
function checkRoundingDigits(d, i, rm, repeating) {
  var di, k, r, rd;

  // Get the length of the first word of the array d.
  for (k = d[0]; k >= 10; k /= 10) --i;

  // Is the rounding digit in the first word of d?
  if (--i < 0) {
    i += LOG_BASE;
    di = 0;
  } else {
    di = Math.ceil((i + 1) / LOG_BASE);
    i %= LOG_BASE;
  }

  // i is the index (0 - 6) of the rounding digit.
  // E.g. if within the word 3487563 the first rounding digit is 5,
  // then i = 4, k = 1000, rd = 3487563 % 1000 = 563
  k = mathpow(10, LOG_BASE - i);
  rd = d[di] % k | 0;

  if (repeating == null) {
    if (i < 3) {
      if (i == 0) rd = rd / 100 | 0;
      else if (i == 1) rd = rd / 10 | 0;
      r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 50000 || rd == 0;
    } else {
      r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) &&
        (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 ||
          (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
    }
  } else {
    if (i < 4) {
      if (i == 0) rd = rd / 1000 | 0;
      else if (i == 1) rd = rd / 100 | 0;
      else if (i == 2) rd = rd / 10 | 0;
      r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
    } else {
      r = ((repeating || rm < 4) && rd + 1 == k ||
      (!repeating && rm > 3) && rd + 1 == k / 2) &&
        (d[di + 1] / k / 1000 | 0) == mathpow(10, i - 3) - 1;
    }
  }

  return r;
}


// Convert string of `baseIn` to an array of numbers of `baseOut`.
// Eg. convertBase('255', 10, 16) returns [15, 15].
// Eg. convertBase('ff', 16, 10) returns [2, 5, 5].
function convertBase(str, baseIn, baseOut) {
  var j,
    arr = [0],
    arrL,
    i = 0,
    strL = str.length;

  for (; i < strL;) {
    for (arrL = arr.length; arrL--;) arr[arrL] *= baseIn;
    arr[0] += NUMERALS.indexOf(str.charAt(i++));
    for (j = 0; j < arr.length; j++) {
      if (arr[j] > baseOut - 1) {
        if (arr[j + 1] === void 0) arr[j + 1] = 0;
        arr[j + 1] += arr[j] / baseOut | 0;
        arr[j] %= baseOut;
      }
    }
  }

  return arr.reverse();
}


/*
 * cos(x) = 1 - x^2/2! + x^4/4! - ...
 * |x| < pi/2
 *
 */
function cosine(Ctor, x) {
  var k, len, y;

  if (x.isZero()) return x;

  // Argument reduction: cos(4x) = 8*(cos^4(x) - cos^2(x)) + 1
  // i.e. cos(x) = 8*(cos^4(x/4) - cos^2(x/4)) + 1

  // Estimate the optimum number of times to use the argument reduction.
  len = x.d.length;
  if (len < 32) {
    k = Math.ceil(len / 3);
    y = (1 / tinyPow(4, k)).toString();
  } else {
    k = 16;
    y = '2.3283064365386962890625e-10';
  }

  Ctor.precision += k;

  x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));

  // Reverse argument reduction
  for (var i = k; i--;) {
    var cos2x = x.times(x);
    x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
  }

  Ctor.precision -= k;

  return x;
}


/*
 * Perform division in the specified base.
 */
var divide = (function () {

  // Assumes non-zero x and k, and hence non-zero result.
  function multiplyInteger(x, k, base) {
    var temp,
      carry = 0,
      i = x.length;

    for (x = x.slice(); i--;) {
      temp = x[i] * k + carry;
      x[i] = temp % base | 0;
      carry = temp / base | 0;
    }

    if (carry) x.unshift(carry);

    return x;
  }

  function compare(a, b, aL, bL) {
    var i, r;

    if (aL != bL) {
      r = aL > bL ? 1 : -1;
    } else {
      for (i = r = 0; i < aL; i++) {
        if (a[i] != b[i]) {
          r = a[i] > b[i] ? 1 : -1;
          break;
        }
      }
    }

    return r;
  }

  function subtract(a, b, aL, base) {
    var i = 0;

    // Subtract b from a.
    for (; aL--;) {
      a[aL] -= i;
      i = a[aL] < b[aL] ? 1 : 0;
      a[aL] = i * base + a[aL] - b[aL];
    }

    // Remove leading zeros.
    for (; !a[0] && a.length > 1;) a.shift();
  }

  return function (x, y, pr, rm, dp, base) {
    var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0,
      yL, yz,
      Ctor = x.constructor,
      sign = x.s == y.s ? 1 : -1,
      xd = x.d,
      yd = y.d;

    // Either NaN, Infinity or 0?
    if (!xd || !xd[0] || !yd || !yd[0]) {

      return new Ctor(// Return NaN if either NaN, or both Infinity or 0.
        !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

        // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
        xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
    }

    if (base) {
      logBase = 1;
      e = x.e - y.e;
    } else {
      base = BASE;
      logBase = LOG_BASE;
      e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
    }

    yL = yd.length;
    xL = xd.length;
    q = new Ctor(sign);
    qd = q.d = [];

    // Result exponent may be one less than e.
    // The digit array of a Decimal from toStringBinary may have trailing zeros.
    for (i = 0; yd[i] == (xd[i] || 0); i++);

    if (yd[i] > (xd[i] || 0)) e--;

    if (pr == null) {
      sd = pr = Ctor.precision;
      rm = Ctor.rounding;
    } else if (dp) {
      sd = pr + (x.e - y.e) + 1;
    } else {
      sd = pr;
    }

    if (sd < 0) {
      qd.push(1);
      more = true;
    } else {

      // Convert precision in number of base 10 digits to base 1e7 digits.
      sd = sd / logBase + 2 | 0;
      i = 0;

      // divisor < 1e7
      if (yL == 1) {
        k = 0;
        yd = yd[0];
        sd++;

        // k is the carry.
        for (; (i < xL || k) && sd--; i++) {
          t = k * base + (xd[i] || 0);
          qd[i] = t / yd | 0;
          k = t % yd | 0;
        }

        more = k || i < xL;

      // divisor >= 1e7
      } else {

        // Normalise xd and yd so highest order digit of yd is >= base/2
        k = base / (yd[0] + 1) | 0;

        if (k > 1) {
          yd = multiplyInteger(yd, k, base);
          xd = multiplyInteger(xd, k, base);
          yL = yd.length;
          xL = xd.length;
        }

        xi = yL;
        rem = xd.slice(0, yL);
        remL = rem.length;

        // Add zeros to make remainder as long as divisor.
        for (; remL < yL;) rem[remL++] = 0;

        yz = yd.slice();
        yz.unshift(0);
        yd0 = yd[0];

        if (yd[1] >= base / 2) ++yd0;

        do {
          k = 0;

          // Compare divisor and remainder.
          cmp = compare(yd, rem, yL, remL);

          // If divisor < remainder.
          if (cmp < 0) {

            // Calculate trial digit, k.
            rem0 = rem[0];
            if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

            // k will be how many times the divisor goes into the current remainder.
            k = rem0 / yd0 | 0;

            //  Algorithm:
            //  1. product = divisor * trial digit (k)
            //  2. if product > remainder: product -= divisor, k--
            //  3. remainder -= product
            //  4. if product was < remainder at 2:
            //    5. compare new remainder and divisor
            //    6. If remainder > divisor: remainder -= divisor, k++

            if (k > 1) {
              if (k >= base) k = base - 1;

              // product = divisor * trial digit.
              prod = multiplyInteger(yd, k, base);
              prodL = prod.length;
              remL = rem.length;

              // Compare product and remainder.
              cmp = compare(prod, rem, prodL, remL);

              // product > remainder.
              if (cmp == 1) {
                k--;

                // Subtract divisor from product.
                subtract(prod, yL < prodL ? yz : yd, prodL, base);
              }
            } else {

              // cmp is -1.
              // If k is 0, there is no need to compare yd and rem again below, so change cmp to 1
              // to avoid it. If k is 1 there is a need to compare yd and rem again below.
              if (k == 0) cmp = k = 1;
              prod = yd.slice();
            }

            prodL = prod.length;
            if (prodL < remL) prod.unshift(0);

            // Subtract product from remainder.
            subtract(rem, prod, remL, base);

            // If product was < previous remainder.
            if (cmp == -1) {
              remL = rem.length;

              // Compare divisor and new remainder.
              cmp = compare(yd, rem, yL, remL);

              // If divisor < new remainder, subtract divisor from remainder.
              if (cmp < 1) {
                k++;

                // Subtract divisor from remainder.
                subtract(rem, yL < remL ? yz : yd, remL, base);
              }
            }

            remL = rem.length;
          } else if (cmp === 0) {
            k++;
            rem = [0];
          }    // if cmp === 1, k will be 0

          // Add the next digit, k, to the result array.
          qd[i++] = k;

          // Update the remainder.
          if (cmp && rem[0]) {
            rem[remL++] = xd[xi] || 0;
          } else {
            rem = [xd[xi]];
            remL = 1;
          }

        } while ((xi++ < xL || rem[0] !== void 0) && sd--);

        more = rem[0] !== void 0;
      }

      // Leading zero?
      if (!qd[0]) qd.shift();
    }

    // logBase is 1 when divide is being used for base conversion.
    if (logBase == 1) {
      q.e = e;
      inexact = more;
    } else {

      // To calculate q.e, first get the number of digits of qd[0].
      for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
      q.e = i + e * logBase - 1;

      finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
    }

    return q;
  };
})();


/*
 * Round `x` to `sd` significant digits using rounding mode `rm`.
 * Check for over/under-flow.
 */
 function finalise(x, sd, rm, isTruncated) {
  var digits, i, j, k, rd, roundUp, w, xd, xdi,
    Ctor = x.constructor;

  // Don't round if sd is null or undefined.
  out: if (sd != null) {
    xd = x.d;

    // Infinity/NaN.
    if (!xd) return x;

    // rd: the rounding digit, i.e. the digit after the digit that may be rounded up.
    // w: the word of xd containing rd, a base 1e7 number.
    // xdi: the index of w within xd.
    // digits: the number of digits of w.
    // i: what would be the index of rd within w if all the numbers were 7 digits long (i.e. if
    // they had leading zeros)
    // j: if > 0, the actual index of rd within w (if < 0, rd is a leading zero).

    // Get the length of the first word of the digits array xd.
    for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
    i = sd - digits;

    // Is the rounding digit in the first word of xd?
    if (i < 0) {
      i += LOG_BASE;
      j = sd;
      w = xd[xdi = 0];

      // Get the rounding digit at index j of w.
      rd = w / mathpow(10, digits - j - 1) % 10 | 0;
    } else {
      xdi = Math.ceil((i + 1) / LOG_BASE);
      k = xd.length;
      if (xdi >= k) {
        if (isTruncated) {

          // Needed by `naturalExponential`, `naturalLogarithm` and `squareRoot`.
          for (; k++ <= xdi;) xd.push(0);
          w = rd = 0;
          digits = 1;
          i %= LOG_BASE;
          j = i - LOG_BASE + 1;
        } else {
          break out;
        }
      } else {
        w = k = xd[xdi];

        // Get the number of digits of w.
        for (digits = 1; k >= 10; k /= 10) digits++;

        // Get the index of rd within w.
        i %= LOG_BASE;

        // Get the index of rd within w, adjusted for leading zeros.
        // The number of leading zeros of w is given by LOG_BASE - digits.
        j = i - LOG_BASE + digits;

        // Get the rounding digit at index j of w.
        rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
      }
    }

    // Are there any non-zero digits after the rounding digit?
    isTruncated = isTruncated || sd < 0 ||
      xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));

    // The expression `w % mathpow(10, digits - j - 1)` returns all the digits of w to the right
    // of the digit at (left-to-right) index j, e.g. if w is 908714 and j is 2, the expression
    // will give 714.

    roundUp = rm < 4
      ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
      : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 &&

        // Check whether the digit to the left of the rounding digit is odd.
        ((i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10) & 1 ||
          rm == (x.s < 0 ? 8 : 7));

    if (sd < 1 || !xd[0]) {
      xd.length = 0;
      if (roundUp) {

        // Convert sd to decimal places.
        sd -= x.e + 1;

        // 1, 0.1, 0.01, 0.001, 0.0001 etc.
        xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
        x.e = -sd || 0;
      } else {

        // Zero.
        xd[0] = x.e = 0;
      }

      return x;
    }

    // Remove excess digits.
    if (i == 0) {
      xd.length = xdi;
      k = 1;
      xdi--;
    } else {
      xd.length = xdi + 1;
      k = mathpow(10, LOG_BASE - i);

      // E.g. 56700 becomes 56000 if 7 is the rounding digit.
      // j > 0 means i > number of leading zeros of w.
      xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
    }

    if (roundUp) {
      for (;;) {

        // Is the digit to be rounded up in the first word of xd?
        if (xdi == 0) {

          // i will be the length of xd[0] before k is added.
          for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
          j = xd[0] += k;
          for (k = 1; j >= 10; j /= 10) k++;

          // if i != k the length has increased.
          if (i != k) {
            x.e++;
            if (xd[0] == BASE) xd[0] = 1;
          }

          break;
        } else {
          xd[xdi] += k;
          if (xd[xdi] != BASE) break;
          xd[xdi--] = 0;
          k = 1;
        }
      }
    }

    // Remove trailing zeros.
    for (i = xd.length; xd[--i] === 0;) xd.pop();
  }

  if (external) {

    // Overflow?
    if (x.e > Ctor.maxE) {

      // Infinity.
      x.d = null;
      x.e = NaN;

    // Underflow?
    } else if (x.e < Ctor.minE) {

      // Zero.
      x.e = 0;
      x.d = [0];
      // Ctor.underflow = true;
    } // else Ctor.underflow = false;
  }

  return x;
}


function finiteToString(x, isExp, sd) {
  if (!x.isFinite()) return nonFiniteToString(x);
  var k,
    e = x.e,
    str = digitsToString(x.d),
    len = str.length;

  if (isExp) {
    if (sd && (k = sd - len) > 0) {
      str = str.charAt(0) + '.' + str.slice(1) + getZeroString(k);
    } else if (len > 1) {
      str = str.charAt(0) + '.' + str.slice(1);
    }

    str = str + (x.e < 0 ? 'e' : 'e+') + x.e;
  } else if (e < 0) {
    str = '0.' + getZeroString(-e - 1) + str;
    if (sd && (k = sd - len) > 0) str += getZeroString(k);
  } else if (e >= len) {
    str += getZeroString(e + 1 - len);
    if (sd && (k = sd - e - 1) > 0) str = str + '.' + getZeroString(k);
  } else {
    if ((k = e + 1) < len) str = str.slice(0, k) + '.' + str.slice(k);
    if (sd && (k = sd - len) > 0) {
      if (e + 1 === len) str += '.';
      str += getZeroString(k);
    }
  }

  return str;
}


// Calculate the base 10 exponent from the base 1e7 exponent.
function getBase10Exponent(digits, e) {
  var w = digits[0];

  // Add the number of digits of the first word of the digits array.
  for ( e *= LOG_BASE; w >= 10; w /= 10) e++;
  return e;
}


function getLn10(Ctor, sd, pr) {
  if (sd > LN10_PRECISION) {

    // Reset global state in case the exception is caught.
    external = true;
    if (pr) Ctor.precision = pr;
    throw Error(precisionLimitExceeded);
  }
  return finalise(new Ctor(LN10), sd, 1, true);
}


function getPi(Ctor, sd, rm) {
  if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
  return finalise(new Ctor(PI), sd, rm, true);
}


function getPrecision(digits) {
  var w = digits.length - 1,
    len = w * LOG_BASE + 1;

  w = digits[w];

  // If non-zero...
  if (w) {

    // Subtract the number of trailing zeros of the last word.
    for (; w % 10 == 0; w /= 10) len--;

    // Add the number of digits of the first word.
    for (w = digits[0]; w >= 10; w /= 10) len++;
  }

  return len;
}


function getZeroString(k) {
  var zs = '';
  for (; k--;) zs += '0';
  return zs;
}


/*
 * Return a new Decimal whose value is the value of Decimal `x` to the power `n`, where `n` is an
 * integer of type number.
 *
 * Implements 'exponentiation by squaring'. Called by `pow` and `parseOther`.
 *
 */
function intPow(Ctor, x, n, pr) {
  var isTruncated,
    r = new Ctor(1),

    // Max n of 9007199254740991 takes 53 loop iterations.
    // Maximum digits array length; leaves [28, 34] guard digits.
    k = Math.ceil(pr / LOG_BASE + 4);

  external = false;

  for (;;) {
    if (n % 2) {
      r = r.times(x);
      if (truncate(r.d, k)) isTruncated = true;
    }

    n = mathfloor(n / 2);
    if (n === 0) {

      // To ensure correct rounding when r.d is truncated, increment the last word if it is zero.
      n = r.d.length - 1;
      if (isTruncated && r.d[n] === 0) ++r.d[n];
      break;
    }

    x = x.times(x);
    truncate(x.d, k);
  }

  external = true;

  return r;
}


function isOdd(n) {
  return n.d[n.d.length - 1] & 1;
}


/*
 * Handle `max` (`n` is -1) and `min` (`n` is 1).
 */
function maxOrMin(Ctor, args, n) {
  var k, y,
    x = new Ctor(args[0]),
    i = 0;

  for (; ++i < args.length;) {
    y = new Ctor(args[i]);

    // NaN?
    if (!y.s) {
      x = y;
      break;
    }

    k = x.cmp(y);

    if (k === n || k === 0 && x.s === n) {
      x = y;
    }
  }

  return x;
}


/*
 * Return a new Decimal whose value is the natural exponential of `x` rounded to `sd` significant
 * digits.
 *
 * Taylor/Maclaurin series.
 *
 * exp(x) = x^0/0! + x^1/1! + x^2/2! + x^3/3! + ...
 *
 * Argument reduction:
 *   Repeat x = x / 32, k += 5, until |x| < 0.1
 *   exp(x) = exp(x / 2^k)^(2^k)
 *
 * Previously, the argument was initially reduced by
 * exp(x) = exp(r) * 10^k  where r = x - k * ln10, k = floor(x / ln10)
 * to first put r in the range [0, ln10], before dividing by 32 until |x| < 0.1, but this was
 * found to be slower than just dividing repeatedly by 32 as above.
 *
 * Max integer argument: exp('20723265836946413') = 6.3e+9000000000000000
 * Min integer argument: exp('-20723265836946411') = 1.2e-9000000000000000
 * (Math object integer min/max: Math.exp(709) = 8.2e+307, Math.exp(-745) = 5e-324)
 *
 *  exp(Infinity)  = Infinity
 *  exp(-Infinity) = 0
 *  exp(NaN)       = NaN
 *  exp(±0)        = 1
 *
 *  exp(x) is non-terminating for any finite, non-zero x.
 *
 *  The result will always be correctly rounded.
 *
 */
function naturalExponential(x, sd) {
  var denominator, guard, j, pow, sum, t, wpr,
    rep = 0,
    i = 0,
    k = 0,
    Ctor = x.constructor,
    rm = Ctor.rounding,
    pr = Ctor.precision;

  // 0/NaN/Infinity?
  if (!x.d || !x.d[0] || x.e > 17) {

    return new Ctor(x.d
      ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0
      : x.s ? x.s < 0 ? 0 : x : 0 / 0);
  }

  if (sd == null) {
    external = false;
    wpr = pr;
  } else {
    wpr = sd;
  }

  t = new Ctor(0.03125);

  // while abs(x) >= 0.1
  while (x.e > -2) {

    // x = x / 2^5
    x = x.times(t);
    k += 5;
  }

  // Use 2 * log10(2^k) + 5 (empirically derived) to estimate the increase in precision
  // necessary to ensure the first 4 rounding digits are correct.
  guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
  wpr += guard;
  denominator = pow = sum = new Ctor(1);
  Ctor.precision = wpr;

  for (;;) {
    pow = finalise(pow.times(x), wpr, 1);
    denominator = denominator.times(++i);
    t = sum.plus(divide(pow, denominator, wpr, 1));

    if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
      j = k;
      while (j--) sum = finalise(sum.times(sum), wpr, 1);

      // Check to see if the first 4 rounding digits are [49]999.
      // If so, repeat the summation with a higher precision, otherwise
      // e.g. with precision: 18, rounding: 1
      // exp(18.404272462595034083567793919843761) = 98372560.1229999999 (should be 98372560.123)
      // `wpr - guard` is the index of first rounding digit.
      if (sd == null) {

        if (rep < 3 && checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
          Ctor.precision = wpr += 10;
          denominator = pow = t = new Ctor(1);
          i = 0;
          rep++;
        } else {
          return finalise(sum, Ctor.precision = pr, rm, external = true);
        }
      } else {
        Ctor.precision = pr;
        return sum;
      }
    }

    sum = t;
  }
}


/*
 * Return a new Decimal whose value is the natural logarithm of `x` rounded to `sd` significant
 * digits.
 *
 *  ln(-n)        = NaN
 *  ln(0)         = -Infinity
 *  ln(-0)        = -Infinity
 *  ln(1)         = 0
 *  ln(Infinity)  = Infinity
 *  ln(-Infinity) = NaN
 *  ln(NaN)       = NaN
 *
 *  ln(n) (n != 1) is non-terminating.
 *
 */
function naturalLogarithm(y, sd) {
  var c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2,
    n = 1,
    guard = 10,
    x = y,
    xd = x.d,
    Ctor = x.constructor,
    rm = Ctor.rounding,
    pr = Ctor.precision;

  // Is x negative or Infinity, NaN, 0 or 1?
  if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
    return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
  }

  if (sd == null) {
    external = false;
    wpr = pr;
  } else {
    wpr = sd;
  }

  Ctor.precision = wpr += guard;
  c = digitsToString(xd);
  c0 = c.charAt(0);

  if (Math.abs(e = x.e) < 1.5e15) {

    // Argument reduction.
    // The series converges faster the closer the argument is to 1, so using
    // ln(a^b) = b * ln(a),   ln(a) = ln(a^b) / b
    // multiply the argument by itself until the leading digits of the significand are 7, 8, 9,
    // 10, 11, 12 or 13, recording the number of multiplications so the sum of the series can
    // later be divided by this number, then separate out the power of 10 using
    // ln(a*10^b) = ln(a) + b*ln(10).

    // max n is 21 (gives 0.9, 1.0 or 1.1) (9e15 / 21 = 4.2e14).
    //while (c0 < 9 && c0 != 1 || c0 == 1 && c.charAt(1) > 1) {
    // max n is 6 (gives 0.7 - 1.3)
    while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
      x = x.times(y);
      c = digitsToString(x.d);
      c0 = c.charAt(0);
      n++;
    }

    e = x.e;

    if (c0 > 1) {
      x = new Ctor('0.' + c);
      e++;
    } else {
      x = new Ctor(c0 + '.' + c.slice(1));
    }
  } else {

    // The argument reduction method above may result in overflow if the argument y is a massive
    // number with exponent >= 1500000000000000 (9e15 / 6 = 1.5e15), so instead recall this
    // function using ln(x*10^e) = ln(x) + e*ln(10).
    t = getLn10(Ctor, wpr + 2, pr).times(e + '');
    x = naturalLogarithm(new Ctor(c0 + '.' + c.slice(1)), wpr - guard).plus(t);
    Ctor.precision = pr;

    return sd == null ? finalise(x, pr, rm, external = true) : x;
  }

  // x1 is x reduced to a value near 1.
  x1 = x;

  // Taylor series.
  // ln(y) = ln((1 + x)/(1 - x)) = 2(x + x^3/3 + x^5/5 + x^7/7 + ...)
  // where x = (y - 1)/(y + 1)    (|x| < 1)
  sum = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
  x2 = finalise(x.times(x), wpr, 1);
  denominator = 3;

  for (;;) {
    numerator = finalise(numerator.times(x2), wpr, 1);
    t = sum.plus(divide(numerator, new Ctor(denominator), wpr, 1));

    if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
      sum = sum.times(2);

      // Reverse the argument reduction. Check that e is not 0 because, besides preventing an
      // unnecessary calculation, -0 + 0 = +0 and to ensure correct rounding -0 needs to stay -0.
      if (e !== 0) sum = sum.plus(getLn10(Ctor, wpr + 2, pr).times(e + ''));
      sum = divide(sum, new Ctor(n), wpr, 1);

      // Is rm > 3 and the first 4 rounding digits 4999, or rm < 4 (or the summation has
      // been repeated previously) and the first 4 rounding digits 9999?
      // If so, restart the summation with a higher precision, otherwise
      // e.g. with precision: 12, rounding: 1
      // ln(135520028.6126091714265381533) = 18.7246299999 when it should be 18.72463.
      // `wpr - guard` is the index of first rounding digit.
      if (sd == null) {
        if (checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
          Ctor.precision = wpr += guard;
          t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
          x2 = finalise(x.times(x), wpr, 1);
          denominator = rep = 1;
        } else {
          return finalise(sum, Ctor.precision = pr, rm, external = true);
        }
      } else {
        Ctor.precision = pr;
        return sum;
      }
    }

    sum = t;
    denominator += 2;
  }
}


// ±Infinity, NaN.
function nonFiniteToString(x) {
  // Unsigned.
  return String(x.s * x.s / 0);
}


/*
 * Parse the value of a new Decimal `x` from string `str`.
 */
function parseDecimal(x, str) {
  var e, i, len;

  // TODO BigInt str: no need to check for decimal point, exponential form or leading zeros.
  // Decimal point?
  if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

  // Exponential form?
  if ((i = str.search(/e/i)) > 0) {

    // Determine exponent.
    if (e < 0) e = i;
    e += +str.slice(i + 1);
    str = str.substring(0, i);
  } else if (e < 0) {

    // Integer.
    e = str.length;
  }

  // Determine leading zeros.
  for (i = 0; str.charCodeAt(i) === 48; i++);

  // Determine trailing zeros.
  for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
  str = str.slice(i, len);

  if (str) {
    len -= i;
    x.e = e = e - i - 1;
    x.d = [];

    // Transform base

    // e is the base 10 exponent.
    // i is where to slice str to get the first word of the digits array.
    i = (e + 1) % LOG_BASE;
    if (e < 0) i += LOG_BASE;

    if (i < len) {
      if (i) x.d.push(+str.slice(0, i));
      for (len -= LOG_BASE; i < len;) x.d.push(+str.slice(i, i += LOG_BASE));
      str = str.slice(i);
      i = LOG_BASE - str.length;
    } else {
      i -= len;
    }

    for (; i--;) str += '0';
    x.d.push(+str);

    if (external) {

      // Overflow?
      if (x.e > x.constructor.maxE) {

        // Infinity.
        x.d = null;
        x.e = NaN;

      // Underflow?
      } else if (x.e < x.constructor.minE) {

        // Zero.
        x.e = 0;
        x.d = [0];
        // x.constructor.underflow = true;
      } // else x.constructor.underflow = false;
    }
  } else {

    // Zero.
    x.e = 0;
    x.d = [0];
  }

  return x;
}


/*
 * Parse the value of a new Decimal `x` from a string `str`, which is not a decimal value.
 */
function parseOther(x, str) {
  var base, Ctor, divisor, i, isFloat, len, p, xd, xe;

  if (str.indexOf('_') > -1) {
    str = str.replace(/(\d)_(?=\d)/g, '$1');
    if (isDecimal.test(str)) return parseDecimal(x, str);
  } else if (str === 'Infinity' || str === 'NaN') {
    if (!+str) x.s = NaN;
    x.e = NaN;
    x.d = null;
    return x;
  }

  if (isHex.test(str))  {
    base = 16;
    str = str.toLowerCase();
  } else if (isBinary.test(str))  {
    base = 2;
  } else if (isOctal.test(str))  {
    base = 8;
  } else {
    throw Error(invalidArgument + str);
  }

  // Is there a binary exponent part?
  i = str.search(/p/i);

  if (i > 0) {
    p = +str.slice(i + 1);
    str = str.substring(2, i);
  } else {
    str = str.slice(2);
  }

  // Convert `str` as an integer then divide the result by `base` raised to a power such that the
  // fraction part will be restored.
  i = str.indexOf('.');
  isFloat = i >= 0;
  Ctor = x.constructor;

  if (isFloat) {
    str = str.replace('.', '');
    len = str.length;
    i = len - i;

    // log[10](16) = 1.2041... , log[10](88) = 1.9444....
    divisor = intPow(Ctor, new Ctor(base), i, i * 2);
  }

  xd = convertBase(str, base, BASE);
  xe = xd.length - 1;

  // Remove trailing zeros.
  for (i = xe; xd[i] === 0; --i) xd.pop();
  if (i < 0) return new Ctor(x.s * 0);
  x.e = getBase10Exponent(xd, xe);
  x.d = xd;
  external = false;

  // At what precision to perform the division to ensure exact conversion?
  // maxDecimalIntegerPartDigitCount = ceil(log[10](b) * otherBaseIntegerPartDigitCount)
  // log[10](2) = 0.30103, log[10](8) = 0.90309, log[10](16) = 1.20412
  // E.g. ceil(1.2 * 3) = 4, so up to 4 decimal digits are needed to represent 3 hex int digits.
  // maxDecimalFractionPartDigitCount = {Hex:4|Oct:3|Bin:1} * otherBaseFractionPartDigitCount
  // Therefore using 4 * the number of digits of str will always be enough.
  if (isFloat) x = divide(x, divisor, len * 4);

  // Multiply by the binary exponent part if present.
  if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
  external = true;

  return x;
}


/*
 * sin(x) = x - x^3/3! + x^5/5! - ...
 * |x| < pi/2
 *
 */
function sine(Ctor, x) {
  var k,
    len = x.d.length;

  if (len < 3) {
    return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
  }

  // Argument reduction: sin(5x) = 16*sin^5(x) - 20*sin^3(x) + 5*sin(x)
  // i.e. sin(x) = 16*sin^5(x/5) - 20*sin^3(x/5) + 5*sin(x/5)
  // and  sin(x) = sin(x/5)(5 + sin^2(x/5)(16sin^2(x/5) - 20))

  // Estimate the optimum number of times to use the argument reduction.
  k = 1.4 * Math.sqrt(len);
  k = k > 16 ? 16 : k | 0;

  x = x.times(1 / tinyPow(5, k));
  x = taylorSeries(Ctor, 2, x, x);

  // Reverse argument reduction
  var sin2_x,
    d5 = new Ctor(5),
    d16 = new Ctor(16),
    d20 = new Ctor(20);
  for (; k--;) {
    sin2_x = x.times(x);
    x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
  }

  return x;
}


// Calculate Taylor series for `cos`, `cosh`, `sin` and `sinh`.
function taylorSeries(Ctor, n, x, y, isHyperbolic) {
  var j, t, u, x2,
    pr = Ctor.precision,
    k = Math.ceil(pr / LOG_BASE);

  external = false;
  x2 = x.times(x);
  u = new Ctor(y);

  for (;;) {
    t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
    u = isHyperbolic ? y.plus(t) : y.minus(t);
    y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
    t = u.plus(y);

    if (t.d[k] !== void 0) {
      for (j = k; t.d[j] === u.d[j] && j--;);
      if (j == -1) break;
    }

    j = u;
    u = y;
    y = t;
    t = j;
  }

  external = true;
  t.d.length = k + 1;

  return t;
}


// Exponent e must be positive and non-zero.
function tinyPow(b, e) {
  var n = b;
  while (--e) n *= b;
  return n;
}


// Return the absolute value of `x` reduced to less than or equal to half pi.
function toLessThanHalfPi(Ctor, x) {
  var t,
    isNeg = x.s < 0,
    pi = getPi(Ctor, Ctor.precision, 1),
    halfPi = pi.times(0.5);

  x = x.abs();

  if (x.lte(halfPi)) {
    quadrant = isNeg ? 4 : 1;
    return x;
  }

  t = x.divToInt(pi);

  if (t.isZero()) {
    quadrant = isNeg ? 3 : 2;
  } else {
    x = x.minus(t.times(pi));

    // 0 <= x < pi
    if (x.lte(halfPi)) {
      quadrant = isOdd(t) ? (isNeg ? 2 : 3) : (isNeg ? 4 : 1);
      return x;
    }

    quadrant = isOdd(t) ? (isNeg ? 1 : 4) : (isNeg ? 3 : 2);
  }

  return x.minus(pi).abs();
}


/*
 * Return the value of Decimal `x` as a string in base `baseOut`.
 *
 * If the optional `sd` argument is present include a binary exponent suffix.
 */
function toStringBinary(x, baseOut, sd, rm) {
  var base, e, i, k, len, roundUp, str, xd, y,
    Ctor = x.constructor,
    isExp = sd !== void 0;

  if (isExp) {
    checkInt32(sd, 1, MAX_DIGITS);
    if (rm === void 0) rm = Ctor.rounding;
    else checkInt32(rm, 0, 8);
  } else {
    sd = Ctor.precision;
    rm = Ctor.rounding;
  }

  if (!x.isFinite()) {
    str = nonFiniteToString(x);
  } else {
    str = finiteToString(x);
    i = str.indexOf('.');

    // Use exponential notation according to `toExpPos` and `toExpNeg`? No, but if required:
    // maxBinaryExponent = floor((decimalExponent + 1) * log[2](10))
    // minBinaryExponent = floor(decimalExponent * log[2](10))
    // log[2](10) = 3.321928094887362347870319429489390175864

    if (isExp) {
      base = 2;
      if (baseOut == 16) {
        sd = sd * 4 - 3;
      } else if (baseOut == 8) {
        sd = sd * 3 - 2;
      }
    } else {
      base = baseOut;
    }

    // Convert the number as an integer then divide the result by its base raised to a power such
    // that the fraction part will be restored.

    // Non-integer.
    if (i >= 0) {
      str = str.replace('.', '');
      y = new Ctor(1);
      y.e = str.length - i;
      y.d = convertBase(finiteToString(y), 10, base);
      y.e = y.d.length;
    }

    xd = convertBase(str, 10, base);
    e = len = xd.length;

    // Remove trailing zeros.
    for (; xd[--len] == 0;) xd.pop();

    if (!xd[0]) {
      str = isExp ? '0p+0' : '0';
    } else {
      if (i < 0) {
        e--;
      } else {
        x = new Ctor(x);
        x.d = xd;
        x.e = e;
        x = divide(x, y, sd, rm, 0, base);
        xd = x.d;
        e = x.e;
        roundUp = inexact;
      }

      // The rounding digit, i.e. the digit after the digit that may be rounded up.
      i = xd[sd];
      k = base / 2;
      roundUp = roundUp || xd[sd + 1] !== void 0;

      roundUp = rm < 4
        ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2))
        : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 ||
          rm === (x.s < 0 ? 8 : 7));

      xd.length = sd;

      if (roundUp) {

        // Rounding up may mean the previous digit has to be rounded up and so on.
        for (; ++xd[--sd] > base - 1;) {
          xd[sd] = 0;
          if (!sd) {
            ++e;
            xd.unshift(1);
          }
        }
      }

      // Determine trailing zeros.
      for (len = xd.length; !xd[len - 1]; --len);

      // E.g. [4, 11, 15] becomes 4bf.
      for (i = 0, str = ''; i < len; i++) str += NUMERALS.charAt(xd[i]);

      // Add binary exponent suffix?
      if (isExp) {
        if (len > 1) {
          if (baseOut == 16 || baseOut == 8) {
            i = baseOut == 16 ? 4 : 3;
            for (--len; len % i; len++) str += '0';
            xd = convertBase(str, base, baseOut);
            for (len = xd.length; !xd[len - 1]; --len);

            // xd[0] will always be be 1
            for (i = 1, str = '1.'; i < len; i++) str += NUMERALS.charAt(xd[i]);
          } else {
            str = str.charAt(0) + '.' + str.slice(1);
          }
        }

        str =  str + (e < 0 ? 'p' : 'p+') + e;
      } else if (e < 0) {
        for (; ++e;) str = '0' + str;
        str = '0.' + str;
      } else {
        if (++e > len) for (e -= len; e-- ;) str += '0';
        else if (e < len) str = str.slice(0, e) + '.' + str.slice(e);
      }
    }

    str = (baseOut == 16 ? '0x' : baseOut == 2 ? '0b' : baseOut == 8 ? '0o' : '') + str;
  }

  return x.s < 0 ? '-' + str : str;
}


// Does not strip trailing zeros.
function truncate(arr, len) {
  if (arr.length > len) {
    arr.length = len;
    return true;
  }
}


// Decimal methods


/*
 *  abs
 *  acos
 *  acosh
 *  add
 *  asin
 *  asinh
 *  atan
 *  atanh
 *  atan2
 *  cbrt
 *  ceil
 *  clamp
 *  clone
 *  config
 *  cos
 *  cosh
 *  div
 *  exp
 *  floor
 *  hypot
 *  ln
 *  log
 *  log2
 *  log10
 *  max
 *  min
 *  mod
 *  mul
 *  pow
 *  random
 *  round
 *  set
 *  sign
 *  sin
 *  sinh
 *  sqrt
 *  sub
 *  sum
 *  tan
 *  tanh
 *  trunc
 */


/*
 * Return a new Decimal whose value is the absolute value of `x`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function abs(x) {
  return new this(x).abs();
}


/*
 * Return a new Decimal whose value is the arccosine in radians of `x`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function acos(x) {
  return new this(x).acos();
}


/*
 * Return a new Decimal whose value is the inverse of the hyperbolic cosine of `x`, rounded to
 * `precision` significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function acosh(x) {
  return new this(x).acosh();
}


/*
 * Return a new Decimal whose value is the sum of `x` and `y`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 * y {number|string|bigint|Decimal}
 *
 */
function add(x, y) {
  return new this(x).plus(y);
}


/*
 * Return a new Decimal whose value is the arcsine in radians of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function asin(x) {
  return new this(x).asin();
}


/*
 * Return a new Decimal whose value is the inverse of the hyperbolic sine of `x`, rounded to
 * `precision` significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function asinh(x) {
  return new this(x).asinh();
}


/*
 * Return a new Decimal whose value is the arctangent in radians of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function atan(x) {
  return new this(x).atan();
}


/*
 * Return a new Decimal whose value is the inverse of the hyperbolic tangent of `x`, rounded to
 * `precision` significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function atanh(x) {
  return new this(x).atanh();
}


/*
 * Return a new Decimal whose value is the arctangent in radians of `y/x` in the range -pi to pi
 * (inclusive), rounded to `precision` significant digits using rounding mode `rounding`.
 *
 * Domain: [-Infinity, Infinity]
 * Range: [-pi, pi]
 *
 * y {number|string|bigint|Decimal} The y-coordinate.
 * x {number|string|bigint|Decimal} The x-coordinate.
 *
 * atan2(±0, -0)               = ±pi
 * atan2(±0, +0)               = ±0
 * atan2(±0, -x)               = ±pi for x > 0
 * atan2(±0, x)                = ±0 for x > 0
 * atan2(-y, ±0)               = -pi/2 for y > 0
 * atan2(y, ±0)                = pi/2 for y > 0
 * atan2(±y, -Infinity)        = ±pi for finite y > 0
 * atan2(±y, +Infinity)        = ±0 for finite y > 0
 * atan2(±Infinity, x)         = ±pi/2 for finite x
 * atan2(±Infinity, -Infinity) = ±3*pi/4
 * atan2(±Infinity, +Infinity) = ±pi/4
 * atan2(NaN, x) = NaN
 * atan2(y, NaN) = NaN
 *
 */
function atan2(y, x) {
  y = new this(y);
  x = new this(x);
  var r,
    pr = this.precision,
    rm = this.rounding,
    wpr = pr + 4;

  // Either NaN
  if (!y.s || !x.s) {
    r = new this(NaN);

  // Both ±Infinity
  } else if (!y.d && !x.d) {
    r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
    r.s = y.s;

  // x is ±Infinity or y is ±0
  } else if (!x.d || y.isZero()) {
    r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
    r.s = y.s;

  // y is ±Infinity or x is ±0
  } else if (!y.d || x.isZero()) {
    r = getPi(this, wpr, 1).times(0.5);
    r.s = y.s;

  // Both non-zero and finite
  } else if (x.s < 0) {
    this.precision = wpr;
    this.rounding = 1;
    r = this.atan(divide(y, x, wpr, 1));
    x = getPi(this, wpr, 1);
    this.precision = pr;
    this.rounding = rm;
    r = y.s < 0 ? r.minus(x) : r.plus(x);
  } else {
    r = this.atan(divide(y, x, wpr, 1));
  }

  return r;
}


/*
 * Return a new Decimal whose value is the cube root of `x`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function cbrt(x) {
  return new this(x).cbrt();
}


/*
 * Return a new Decimal whose value is `x` rounded to an integer using `ROUND_CEIL`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function ceil(x) {
  return finalise(x = new this(x), x.e + 1, 2);
}


/*
 * Return a new Decimal whose value is `x` clamped to the range delineated by `min` and `max`.
 *
 * x {number|string|bigint|Decimal}
 * min {number|string|bigint|Decimal}
 * max {number|string|bigint|Decimal}
 *
 */
function clamp(x, min, max) {
  return new this(x).clamp(min, max);
}


/*
 * Configure global settings for a Decimal constructor.
 *
 * `obj` is an object with one or more of the following properties,
 *
 *   precision  {number}
 *   rounding   {number}
 *   toExpNeg   {number}
 *   toExpPos   {number}
 *   maxE       {number}
 *   minE       {number}
 *   modulo     {number}
 *   crypto     {boolean|number}
 *   defaults   {true}
 *
 * E.g. Decimal.config({ precision: 20, rounding: 4 })
 *
 */
function config(obj) {
  if (!obj || typeof obj !== 'object') throw Error(decimalError + 'Object expected');
  var i, p, v,
    useDefaults = obj.defaults === true,
    ps = [
      'precision', 1, MAX_DIGITS,
      'rounding', 0, 8,
      'toExpNeg', -EXP_LIMIT, 0,
      'toExpPos', 0, EXP_LIMIT,
      'maxE', 0, EXP_LIMIT,
      'minE', -EXP_LIMIT, 0,
      'modulo', 0, 9
    ];

  for (i = 0; i < ps.length; i += 3) {
    if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
    if ((v = obj[p]) !== void 0) {
      if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
      else throw Error(invalidArgument + p + ': ' + v);
    }
  }

  if (p = 'crypto', useDefaults) this[p] = DEFAULTS[p];
  if ((v = obj[p]) !== void 0) {
    if (v === true || v === false || v === 0 || v === 1) {
      if (v) {
        if (typeof crypto != 'undefined' && crypto &&
          (crypto.getRandomValues || crypto.randomBytes)) {
          this[p] = true;
        } else {
          throw Error(cryptoUnavailable);
        }
      } else {
        this[p] = false;
      }
    } else {
      throw Error(invalidArgument + p + ': ' + v);
    }
  }

  return this;
}


/*
 * Return a new Decimal whose value is the cosine of `x`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function cos(x) {
  return new this(x).cos();
}


/*
 * Return a new Decimal whose value is the hyperbolic cosine of `x`, rounded to precision
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function cosh(x) {
  return new this(x).cosh();
}


/*
 * Create and return a Decimal constructor with the same configuration properties as this Decimal
 * constructor.
 *
 */
function clone(obj) {
  var i, p, ps;

  /*
   * The Decimal constructor and exported function.
   * Return a new Decimal instance.
   *
   * v {number|string|bigint|Decimal} A numeric value.
   *
   */
  function Decimal(v) {
    var e, i, t,
      x = this;

    // Decimal called without new.
    if (!(x instanceof Decimal)) return new Decimal(v);

    // Retain a reference to this Decimal constructor, and shadow Decimal.prototype.constructor
    // which points to Object.
    x.constructor = Decimal;

    if (isDecimalInstance(v)) {
      x.s = v.s;

      if (external) {
        if (!v.d || v.e > Decimal.maxE) {

          // Infinity.
          x.e = NaN;
          x.d = null;
        } else if (v.e < Decimal.minE) {

          // Zero.
          x.e = 0;
          x.d = [0];
        } else {
          x.e = v.e;
          x.d = v.d.slice();
        }
      } else {
        x.e = v.e;
        x.d = v.d ? v.d.slice() : v.d;
      }

      return;
    }

    t = typeof v;

    if (t === 'number') {
      if (v === 0) {
        x.s = 1 / v < 0 ? -1 : 1;
        x.e = 0;
        x.d = [0];
        return;
      }

      if (v < 0) {
        v = -v;
        x.s = -1;
      } else {
        x.s = 1;
      }

      // Fast path for small integers.
      if (v === ~~v && v < 1e7) {
        for (e = 0, i = v; i >= 10; i /= 10) e++;

        if (external) {
          if (e > Decimal.maxE) {
            x.e = NaN;
            x.d = null;
          } else if (e < Decimal.minE) {
            x.e = 0;
            x.d = [0];
          } else {
            x.e = e;
            x.d = [v];
          }
        } else {
          x.e = e;
          x.d = [v];
        }

        return;
      }

      // Infinity or NaN?
      if (v * 0 !== 0) {
        if (!v) x.s = NaN;
        x.e = NaN;
        x.d = null;
        return;
      }

      return parseDecimal(x, v.toString());
    }

    if (t === 'string') {
      if ((i = v.charCodeAt(0)) === 45) {  // minus sign
        v = v.slice(1);
        x.s = -1;
      } else {
        if (i === 43) v = v.slice(1);  // plus sign
        x.s = 1;
      }

      return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
    }

    if (t === 'bigint') {
      if (v < 0) {
        v = -v;
        x.s = -1;
      } else {
        x.s = 1;
      }

      return parseDecimal(x, v.toString());
    }

    throw Error(invalidArgument + v);
  }

  Decimal.prototype = P;

  Decimal.ROUND_UP = 0;
  Decimal.ROUND_DOWN = 1;
  Decimal.ROUND_CEIL = 2;
  Decimal.ROUND_FLOOR = 3;
  Decimal.ROUND_HALF_UP = 4;
  Decimal.ROUND_HALF_DOWN = 5;
  Decimal.ROUND_HALF_EVEN = 6;
  Decimal.ROUND_HALF_CEIL = 7;
  Decimal.ROUND_HALF_FLOOR = 8;
  Decimal.EUCLID = 9;

  Decimal.config = Decimal.set = config;
  Decimal.clone = clone;
  Decimal.isDecimal = isDecimalInstance;

  Decimal.abs = abs;
  Decimal.acos = acos;
  Decimal.acosh = acosh;        // ES6
  Decimal.add = add;
  Decimal.asin = asin;
  Decimal.asinh = asinh;        // ES6
  Decimal.atan = atan;
  Decimal.atanh = atanh;        // ES6
  Decimal.atan2 = atan2;
  Decimal.cbrt = cbrt;          // ES6
  Decimal.ceil = ceil;
  Decimal.clamp = clamp;
  Decimal.cos = cos;
  Decimal.cosh = cosh;          // ES6
  Decimal.div = div;
  Decimal.exp = exp;
  Decimal.floor = floor;
  Decimal.hypot = hypot;        // ES6
  Decimal.ln = ln;
  Decimal.log = log;
  Decimal.log10 = log10;        // ES6
  Decimal.log2 = log2;          // ES6
  Decimal.max = max;
  Decimal.min = min;
  Decimal.mod = mod;
  Decimal.mul = mul;
  Decimal.pow = pow;
  Decimal.random = random;
  Decimal.round = round;
  Decimal.sign = sign;          // ES6
  Decimal.sin = sin;
  Decimal.sinh = sinh;          // ES6
  Decimal.sqrt = sqrt;
  Decimal.sub = sub;
  Decimal.sum = sum;
  Decimal.tan = tan;
  Decimal.tanh = tanh;          // ES6
  Decimal.trunc = trunc;        // ES6

  if (obj === void 0) obj = {};
  if (obj) {
    if (obj.defaults !== true) {
      ps = ['precision', 'rounding', 'toExpNeg', 'toExpPos', 'maxE', 'minE', 'modulo', 'crypto'];
      for (i = 0; i < ps.length;) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
    }
  }

  Decimal.config(obj);

  return Decimal;
}


/*
 * Return a new Decimal whose value is `x` divided by `y`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 * y {number|string|bigint|Decimal}
 *
 */
function div(x, y) {
  return new this(x).div(y);
}


/*
 * Return a new Decimal whose value is the natural exponential of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} The power to which to raise the base of the natural log.
 *
 */
function exp(x) {
  return new this(x).exp();
}


/*
 * Return a new Decimal whose value is `x` round to an integer using `ROUND_FLOOR`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function floor(x) {
  return finalise(x = new this(x), x.e + 1, 3);
}


/*
 * Return a new Decimal whose value is the square root of the sum of the squares of the arguments,
 * rounded to `precision` significant digits using rounding mode `rounding`.
 *
 * hypot(a, b, ...) = sqrt(a^2 + b^2 + ...)
 *
 * arguments {number|string|bigint|Decimal}
 *
 */
function hypot() {
  var i, n,
    t = new this(0);

  external = false;

  for (i = 0; i < arguments.length;) {
    n = new this(arguments[i++]);
    if (!n.d) {
      if (n.s) {
        external = true;
        return new this(1 / 0);
      }
      t = n;
    } else if (t.d) {
      t = t.plus(n.times(n));
    }
  }

  external = true;

  return t.sqrt();
}


/*
 * Return true if object is a Decimal instance (where Decimal is any Decimal constructor),
 * otherwise return false.
 *
 */
function isDecimalInstance(obj) {
  return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
}


/*
 * Return a new Decimal whose value is the natural logarithm of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function ln(x) {
  return new this(x).ln();
}


/*
 * Return a new Decimal whose value is the log of `x` to the base `y`, or to base 10 if no base
 * is specified, rounded to `precision` significant digits using rounding mode `rounding`.
 *
 * log[y](x)
 *
 * x {number|string|bigint|Decimal} The argument of the logarithm.
 * y {number|string|bigint|Decimal} The base of the logarithm.
 *
 */
function log(x, y) {
  return new this(x).log(y);
}


/*
 * Return a new Decimal whose value is the base 2 logarithm of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function log2(x) {
  return new this(x).log(2);
}


/*
 * Return a new Decimal whose value is the base 10 logarithm of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function log10(x) {
  return new this(x).log(10);
}


/*
 * Return a new Decimal whose value is the maximum of the arguments.
 *
 * arguments {number|string|bigint|Decimal}
 *
 */
function max() {
  return maxOrMin(this, arguments, -1);
}


/*
 * Return a new Decimal whose value is the minimum of the arguments.
 *
 * arguments {number|string|bigint|Decimal}
 *
 */
function min() {
  return maxOrMin(this, arguments, 1);
}


/*
 * Return a new Decimal whose value is `x` modulo `y`, rounded to `precision` significant digits
 * using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 * y {number|string|bigint|Decimal}
 *
 */
function mod(x, y) {
  return new this(x).mod(y);
}


/*
 * Return a new Decimal whose value is `x` multiplied by `y`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 * y {number|string|bigint|Decimal}
 *
 */
function mul(x, y) {
  return new this(x).mul(y);
}


/*
 * Return a new Decimal whose value is `x` raised to the power `y`, rounded to precision
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} The base.
 * y {number|string|bigint|Decimal} The exponent.
 *
 */
function pow(x, y) {
  return new this(x).pow(y);
}


/*
 * Returns a new Decimal with a random value equal to or greater than 0 and less than 1, and with
 * `sd`, or `Decimal.precision` if `sd` is omitted, significant digits (or less if trailing zeros
 * are produced).
 *
 * [sd] {number} Significant digits. Integer, 0 to MAX_DIGITS inclusive.
 *
 */
function random(sd) {
  var d, e, k, n,
    i = 0,
    r = new this(1),
    rd = [];

  if (sd === void 0) sd = this.precision;
  else checkInt32(sd, 1, MAX_DIGITS);

  k = Math.ceil(sd / LOG_BASE);

  if (!this.crypto) {
    for (; i < k;) rd[i++] = Math.random() * 1e7 | 0;

  // Browsers supporting crypto.getRandomValues.
  } else if (crypto.getRandomValues) {
    d = crypto.getRandomValues(new Uint32Array(k));

    for (; i < k;) {
      n = d[i];

      // 0 <= n < 4294967296
      // Probability n >= 4.29e9, is 4967296 / 4294967296 = 0.00116 (1 in 865).
      if (n >= 4.29e9) {
        d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
      } else {

        // 0 <= n <= 4289999999
        // 0 <= (n % 1e7) <= 9999999
        rd[i++] = n % 1e7;
      }
    }

  // Node.js supporting crypto.randomBytes.
  } else if (crypto.randomBytes) {

    // buffer
    d = crypto.randomBytes(k *= 4);

    for (; i < k;) {

      // 0 <= n < 2147483648
      n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 0x7f) << 24);

      // Probability n >= 2.14e9, is 7483648 / 2147483648 = 0.0035 (1 in 286).
      if (n >= 2.14e9) {
        crypto.randomBytes(4).copy(d, i);
      } else {

        // 0 <= n <= 2139999999
        // 0 <= (n % 1e7) <= 9999999
        rd.push(n % 1e7);
        i += 4;
      }
    }

    i = k / 4;
  } else {
    throw Error(cryptoUnavailable);
  }

  k = rd[--i];
  sd %= LOG_BASE;

  // Convert trailing digits to zeros according to sd.
  if (k && sd) {
    n = mathpow(10, LOG_BASE - sd);
    rd[i] = (k / n | 0) * n;
  }

  // Remove trailing words which are zero.
  for (; rd[i] === 0; i--) rd.pop();

  // Zero?
  if (i < 0) {
    e = 0;
    rd = [0];
  } else {
    e = -1;

    // Remove leading words which are zero and adjust exponent accordingly.
    for (; rd[0] === 0; e -= LOG_BASE) rd.shift();

    // Count the digits of the first word of rd to determine leading zeros.
    for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;

    // Adjust the exponent for leading zeros of the first word of rd.
    if (k < LOG_BASE) e -= LOG_BASE - k;
  }

  r.e = e;
  r.d = rd;

  return r;
}


/*
 * Return a new Decimal whose value is `x` rounded to an integer using rounding mode `rounding`.
 *
 * To emulate `Math.round`, set rounding to 7 (ROUND_HALF_CEIL).
 *
 * x {number|string|bigint|Decimal}
 *
 */
function round(x) {
  return finalise(x = new this(x), x.e + 1, this.rounding);
}


/*
 * Return
 *   1    if x > 0,
 *  -1    if x < 0,
 *   0    if x is 0,
 *  -0    if x is -0,
 *   NaN  otherwise
 *
 * x {number|string|bigint|Decimal}
 *
 */
function sign(x) {
  x = new this(x);
  return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN;
}


/*
 * Return a new Decimal whose value is the sine of `x`, rounded to `precision` significant digits
 * using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function sin(x) {
  return new this(x).sin();
}


/*
 * Return a new Decimal whose value is the hyperbolic sine of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function sinh(x) {
  return new this(x).sinh();
}


/*
 * Return a new Decimal whose value is the square root of `x`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function sqrt(x) {
  return new this(x).sqrt();
}


/*
 * Return a new Decimal whose value is `x` minus `y`, rounded to `precision` significant digits
 * using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal}
 * y {number|string|bigint|Decimal}
 *
 */
function sub(x, y) {
  return new this(x).sub(y);
}


/*
 * Return a new Decimal whose value is the sum of the arguments, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * Only the result is rounded, not the intermediate calculations.
 *
 * arguments {number|string|bigint|Decimal}
 *
 */
function sum() {
  var i = 0,
    args = arguments,
    x = new this(args[i]);

  external = false;
  for (; x.s && ++i < args.length;) x = x.plus(args[i]);
  external = true;

  return finalise(x, this.precision, this.rounding);
}


/*
 * Return a new Decimal whose value is the tangent of `x`, rounded to `precision` significant
 * digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function tan(x) {
  return new this(x).tan();
}


/*
 * Return a new Decimal whose value is the hyperbolic tangent of `x`, rounded to `precision`
 * significant digits using rounding mode `rounding`.
 *
 * x {number|string|bigint|Decimal} A value in radians.
 *
 */
function tanh(x) {
  return new this(x).tanh();
}


/*
 * Return a new Decimal whose value is `x` truncated to an integer.
 *
 * x {number|string|bigint|Decimal}
 *
 */
function trunc(x) {
  return finalise(x = new this(x), x.e + 1, 1);
}


P[Symbol.for('nodejs.util.inspect.custom')] = P.toString;
P[Symbol.toStringTag] = 'Decimal';

// Create and configure initial Decimal constructor.
var Decimal = P.constructor = clone(DEFAULTS);

// Create the internal constants from their string values.
LN10 = new Decimal(LN10);
PI = new Decimal(PI);

const parseAccount = (account) => {
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
const exportAccount = (account) => {
    const obj = {};
    if (account.iban) {
        obj.Id = { IBAN: account.iban };
    }
    else {
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
const parseAccountIdentification = (accountId) => {
    if (accountId.IBAN) {
        return {
            iban: accountId.IBAN,
        };
    }
    else {
        return {
            id: accountId.Othr?.Id,
            schemeName: accountId.Othr?.SchmeNm?.Cd || accountId.Othr?.SchmeNm?.Prtry,
            issuer: accountId.Othr?.Issr,
        };
    }
};
const exportAccountIdentification = (accountId) => {
    if (accountId.iban) {
        return { IBAN: accountId.iban };
    }
    else {
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
const parseAgent = (agent) => {
    // Get BIC if it exists first
    if (agent.FinInstnId.BIC) {
        return {
            bic: agent.FinInstnId.BIC,
        };
    }
    return {
        abaRoutingNumber: (agent.FinInstnId.Othr?.Id || agent.FinInstnId.ClrSysMmbId.MmbId).toString(),
    };
};
const exportAgent = (agent) => {
    const obj = {
        FinInstnId: {},
    };
    if (agent.bic) {
        obj.FinInstnId.BIC = agent.bic;
    }
    else if (agent.abaRoutingNumber) {
        obj.FinInstnId.Othr = { Id: agent.abaRoutingNumber };
    }
    return obj;
};
// Parse raw currency data, turn into Dinero object and turn into minor units
const parseAmountToMinorUnits = (rawAmount, currency = 'USD') => {
    const currencyObject = Dinero({
        currency: currency,
        precision: getCurrencyPrecision(currency),
    });
    // Also make sure Javascript number parsing error do not happen.
    return new Decimal(rawAmount)
        .mul(10 ** currencyObject.getPrecision())
        .toNumber();
};
const exportAmountToString = (amount, currency = 'USD') => {
    const currencyObject = Dinero({
        amount,
        currency: currency,
        precision: getCurrencyPrecision(currency),
    });
    const precision = currencyObject.getPrecision();
    const zeroes = '0'.repeat(precision);
    return currencyObject.toFormat('0' + (zeroes.length > 0 ? '.' + zeroes : ''));
};
const parseDate = (dateElement) => {
    // Find the date element, which can be DtTm or Dt
    const date = dateElement.DtTm || dateElement.Dt || dateElement;
    return new Date(date);
};
const parseParty = (party) => {
    return {
        id: party.Id?.OrgId?.Othr?.Id,
        name: party.Nm,
    };
};
const parseRecipient = (recipient) => {
    return {
        id: recipient.Id?.OrgId?.Othr?.Id,
        name: recipient.Nm,
    };
};
const exportRecipient = (recipient) => {
    return {
        Id: recipient.id ? { OrgId: { Othr: { Id: recipient.id } } } : undefined,
        Nm: recipient.name,
    };
};
// Standardize into a single string
const parseAdditionalInformation = (additionalInformation) => {
    if (!additionalInformation) {
        return undefined;
    }
    if (Array.isArray(additionalInformation)) {
        return additionalInformation.join('\n');
    }
    else {
        return additionalInformation;
    }
};
const parseMessageHeader = (rawHeader) => {
    return {
        id: rawHeader.MsgId,
        creationDateTime: rawHeader.CreDtTm
            ? parseDate(rawHeader.CreDtTm)
            : undefined,
        queryName: rawHeader.QueryNm,
        requestType: rawHeader.ReqTp?.PmtCtrl ||
            rawHeader.ReqTp?.Enqry ||
            rawHeader.ReqTp?.Prtry,
        originalMessageHeader: rawHeader.OrgnlBizQry
            ? parseMessageHeader(rawHeader.OrgnlBizQry)
            : undefined,
    };
};
const exportMessageHeader = (header) => {
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

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  //
  // Note to future-self: No, you can't remove the `toLowerCase()` call.
  // REF: https://github.com/uuidjs/uuid/pull/677#issuecomment-1757351351
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).

var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);
    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }
  return getRandomValues(rnds8);
}

var randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native = {
  randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }
  options = options || {};
  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80;
  return unsafeStringify(rnds);
}

const sanitize = (value, length) => {
    return value.slice(0, length);
};
const generateId = () => {
    return v4().replace(/-/g, '');
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
        }
        else {
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
    /**
     * Returns the string representation of the payment initiation.
     * @returns {string} The serialized payment initiation.
     */
    toString() {
        return this.serialize();
    }
    static getBuilder() {
        return new fxp.XMLBuilder({
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
        const creditorWithIncompleteAddress = this.paymentInstructions.find(instruction => {
            const address = instruction.creditor.address;
            return !address || !address.country;
        });
        if (creditorWithIncompleteAddress) {
            throw new Error('All creditors must have complete addresses (street name, building number, postal code, town name, and country)');
        }
        // Add more validation as needed
    }
    /**
     * Generates payment information for a single payment instruction.
     * @param {SWIFTCreditPaymentInstruction} paymentInstruction - The payment instruction.
     * @returns {Object} The credit transfer object.
     */
    creditTransfer(paymentInstruction) {
        const paymentInstructionId = sanitize(paymentInstruction.id || generateId(), 35);
        const amount = Dinero({
            amount: paymentInstruction.amount,
            currency: paymentInstruction.currency,
        }).toUnit();
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
        const parser = new fxp.XMLParser({ ignoreAttributes: false });
        const xml = parser.parse(rawXml);
        if (!xml.Document) {
            throw new InvalidXmlError('Invalid XML format');
        }
        const namespace = (xml.Document['@_xmlns'] ||
            xml.Document['@_Xmlns']);
        if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.001.001')) {
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
        const rawInstructions = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf)
            ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
            : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
        const paymentInstructions = rawInstructions.map((inst) => {
            const currency = inst.Amt.InstdAmt['@_Ccy'];
            const amount = parseAmountToMinorUnits(Number(inst.Amt.InstdAmt['#text']), currency);
            // Create base creditor party
            const creditor = {
                name: inst.Cdtr.Nm,
                agent: {
                    bic: inst.CdtrAgt?.FinInstnId?.BIC,
                },
                account: inst.CdtrAcct?.Id?.IBAN || inst.CdtrAcct?.Id?.Othr?.Id
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
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
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
                        CdtTrfTxInf: this.paymentInstructions.map(p => this.creditTransfer(p)),
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
        this.formattedPaymentSum = this.sumPaymentInstructions(this.paymentInstructions);
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
        const instructionDineros = instructions.map(instruction => Dinero({ amount: instruction.amount, currency: instruction.currency }));
        return instructionDineros
            .reduce((acc, next) => {
            return acc.add(next);
        }, Dinero({ amount: 0, currency: instructions[0].currency }))
            .toFormat('0.00');
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
        if (!this.paymentInstructions.every(i => {
            return i.currency === this.paymentInstructions[0].currency;
        })) {
            throw new Error('In order to calculate the payment instructions sum, all payment instruction currencies must be the same.');
        }
    }
    /**
     * Generates payment information for a single SEPA credit transfer instruction.
     * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA specifications.
     */
    creditTransfer(instruction) {
        const paymentInstructionId = sanitize(instruction.id || generateId(), 35);
        const endToEndId = sanitize(instruction.endToEndId || instruction.id || generateId(), 35);
        const dinero = Dinero({
            amount: instruction.amount,
            currency: instruction.currency,
        });
        return {
            PmtId: {
                InstrId: paymentInstructionId,
                EndToEndId: endToEndId,
            },
            Amt: {
                InstdAmt: {
                    '#': dinero.toFormat('0.00'),
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
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
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
                        DbtrAgt: this.agent(this.initiatingParty.agent),
                        ChrgBr: 'SLEV',
                        // payments[]
                        CdtTrfTxInf: this.paymentInstructions.map(p => this.creditTransfer(p)),
                    },
                },
            },
        };
        return builder.build(xml);
    }
    static fromXML(rawXml) {
        const parser = new fxp.XMLParser({ ignoreAttributes: false });
        const xml = parser.parse(rawXml);
        if (!xml.Document) {
            throw new InvalidXmlError('Invalid XML format');
        }
        const namespace = (xml.Document['@_xmlns'] ||
            xml.Document['@_Xmlns']);
        if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.001.001.03')) {
            throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
        }
        const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
        const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
        if (Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf)) {
            throw new Error('Multiple PmtInf is not supported');
        }
        // Assuming we have one PmtInf / one Debtor, we can hack together this information from InitgPty / Dbtr
        const initiatingParty = {
            name: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm ||
                xml.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
            id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId.Othr
                .Id,
            agent: parseAgent(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt),
            account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
        };
        const rawInstructions = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf)
            ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
            : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
        const paymentInstructions = rawInstructions.map((inst) => {
            const currency = inst.Amt.InstdAmt['@_Ccy'];
            const amount = parseAmountToMinorUnits(Number(inst.Amt.InstdAmt['#text']), currency);
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
        return Dinero({ amount: totalAmount, currency }).toFormat('0.00');
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
        if (!payments.every(i => {
            return i.currency === payments[0].currency;
        })) {
            throw new Error('In order to calculate the payment instructions sum, all payment instruction currencies within a group must be the same.');
        }
    }
    /**
     * Generates payment information for a single SEPA credit transfer instruction.
     * @param {SEPACreditPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA specifications.
     */
    creditTransfer(instruction) {
        const paymentInstructionId = sanitize(instruction.id || generateId(), 35);
        const endToEndId = sanitize(instruction.endToEndId || instruction.id || generateId(), 35);
        const dinero = Dinero({
            amount: instruction.amount,
            currency: instruction.currency,
        });
        return {
            PmtId: {
                InstrId: paymentInstructionId,
                EndToEndId: endToEndId,
            },
            Amt: {
                InstdAmt: {
                    '#': dinero.toFormat('0.00'),
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
        const paymentInfoEntries = this.paymentInstructions.flatMap((group) => {
            return group.payments.map((payment) => {
                const dinero = Dinero({
                    amount: payment.amount,
                    currency: payment.currency,
                });
                const pmtInfId = generateId();
                const requestedExecutionDate = payment.requestedPaymentExecutionDate || new Date();
                const batchBooking = group.batchBooking !== undefined ? group.batchBooking : false;
                return {
                    PmtInfId: pmtInfId,
                    PmtMtd: 'TRF',
                    BtchBookg: batchBooking,
                    NbOfTxs: '1',
                    CtrlSum: dinero.toFormat('0.00'),
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
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
                '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                '@xsi:schemaLocation': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03 pain.001.001.03.xsd',
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
        const parser = new fxp.XMLParser({ ignoreAttributes: false });
        const xml = parser.parse(rawXml);
        // Validate XML structure
        if (!xml.Document) {
            throw new InvalidXmlError('Invalid XML format');
        }
        // Validate namespace
        const namespace = (xml.Document['@_xmlns'] ||
            xml.Document['@_Xmlns']);
        if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.001.001.03')) {
            throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
        }
        // Extract GrpHdr data
        const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
        const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
        // Extract top-level initiating party from GrpHdr
        const topLevelInitiatingParty = {
            name: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm,
            id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr
                ?.Id,
        };
        // Normalize PmtInf to array (handle both single object and array cases)
        const rawPmtInf = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf)
            ? xml.Document.CstmrCdtTrfInitn.PmtInf
            : [xml.Document.CstmrCdtTrfInitn.PmtInf];
        // Map each PmtInf to SEPAMultiCreditPaymentInstructionGroup
        const paymentInstructions = rawPmtInf.map((pmtInf) => {
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
            const payments = rawInstructions.map((inst) => {
                const currency = inst.Amt.InstdAmt['@_Ccy'];
                const amount = parseAmountToMinorUnits(Number(inst.Amt.InstdAmt['#text']), currency);
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
            // Extract batch booking
            const batchBooking = pmtInf.BtchBookg === 'true' || pmtInf.BtchBookg === true;
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
    constructor(config) {
        super({ type: 'rtp' });
        this.initiatingParty = config.initiatingParty;
        this.paymentInstructions = config.paymentInstructions;
        this.messageId = config.messageId || generateId();
        this.creationDate = config.creationDate || new Date();
        this.paymentInformationId = generateId();
        this.formattedPaymentSum = this.sumPaymentInstructions(this.paymentInstructions);
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
        const instructionDineros = instructions.map(instruction => Dinero({ amount: instruction.amount, currency: instruction.currency }));
        return instructionDineros
            .reduce((acc, next) => {
            return acc.add(next);
        }, Dinero({ amount: 0, currency: instructions[0].currency }))
            .toFormat('0.00');
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
        const endToEndId = sanitize(instruction.endToEndId || instruction.id || generateId(), 35);
        const dinero = Dinero({
            amount: instruction.amount,
            currency: instruction.currency,
        });
        return {
            PmtId: {
                InstrId: paymentInstructionId,
                EndToEndId: endToEndId,
            },
            Amt: {
                InstdAmt: {
                    '#': dinero.toFormat('0.00'),
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
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
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
                        CdtTrfTxInf: this.paymentInstructions.map(p => this.creditTransfer(p)),
                    },
                },
            },
        };
        return builder.build(xml);
    }
    static fromXML(rawXml) {
        const parser = new fxp.XMLParser({ ignoreAttributes: false });
        const xml = parser.parse(rawXml);
        if (!xml.Document) {
            throw new InvalidXmlError('Invalid XML format');
        }
        const namespace = (xml.Document['@_xmlns'] ||
            xml.Document['@_Xmlns']);
        if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.001.001.03')) {
            throw new InvalidXmlNamespaceError('Invalid PAIN.001 namespace');
        }
        const messageId = xml.Document.CstmrCdtTrfInitn.GrpHdr.MsgId;
        const creationDate = new Date(xml.Document.CstmrCdtTrfInitn.GrpHdr.CreDtTm);
        if (Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf)) {
            throw new Error('Multiple PmtInf is not supported');
        }
        // Assuming we have one PmtInf / one Debtor, we can hack together this information from InitgPty / Dbtr
        const initiatingParty = {
            name: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm ||
                xml.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
            id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.Othr?.Id ||
                xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.BICOrBEI,
            agent: parseAgent(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt),
            account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
        };
        const rawInstructions = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf)
            ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
            : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
        const paymentInstructions = rawInstructions.map((inst) => {
            const currency = inst.Amt.InstdAmt['@_Ccy'];
            const amount = parseAmountToMinorUnits(Number(inst.Amt.InstdAmt['#text']), currency);
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
        this.formattedPaymentSum = this.sumPaymentInstructions(this.paymentInstructions);
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
        const instructionDineros = instructions.map(instruction => Dinero({ amount: instruction.amount, currency: instruction.currency }));
        return instructionDineros
            .reduce((acc, next) => {
            return acc.add(next);
        }, Dinero({ amount: 0, currency: instructions[0].currency }))
            .toFormat('0.00');
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
        const endToEndId = sanitize(instruction.endToEndId || instruction.id || generateId(), 35);
        const dinero = Dinero({
            amount: instruction.amount,
            currency: instruction.currency,
        });
        return {
            PmtId: {
                InstrId: paymentInstructionId,
                EndToEndId: endToEndId,
            },
            Amt: {
                InstdAmt: {
                    '#': dinero.toFormat('0.00'),
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
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
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
                        CdtTrfTxInf: this.paymentInstructions.map(p => this.creditTransfer(p)),
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
        const parser = new fxp.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
        });
        const xml = parser.parse(rawXml);
        if (!xml.Document) {
            throw new InvalidXmlError('Invalid XML format');
        }
        const namespace = (xml.Document['@_xmlns'] ||
            xml.Document['@_Xmlns']);
        if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.001.001.03')) {
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
            name: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Nm ||
                xml.Document.CstmrCdtTrfInitn.PmtInf.Dbtr.Nm,
            id: xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.BICOrBEI ||
                xml.Document.CstmrCdtTrfInitn.GrpHdr.InitgPty.Id.OrgId?.Othr?.Id,
            agent: parseAgent(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAgt),
            account: parseAccount(xml.Document.CstmrCdtTrfInitn.PmtInf.DbtrAcct),
        };
        const rawInstructions = Array.isArray(xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf)
            ? xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf
            : [xml.Document.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf];
        const paymentInstructions = rawInstructions.map((inst) => {
            const currency = inst.Amt.InstdAmt['@_Ccy'];
            const amount = parseAmountToMinorUnits(Number(inst.Amt.InstdAmt['#text']), currency);
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
        return Dinero({ amount: totalAmount, currency }).toFormat('0.00');
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
     * Validates that all payment instructions in a group have the same currency (EUR).
     * @private
     * @param {AtLeastOne<SEPADirectDebitPaymentInstruction>} payments - Array of payment instructions.
     * @throws {Error} If payment instructions have different currencies.
     */
    validateGroupInstructionsHaveSameCurrency(payments) {
        if (!payments.every(i => {
            return i.currency === payments[0].currency;
        })) {
            throw new Error('In order to calculate the payment instructions sum, all payment instruction currencies within a group must be the same.');
        }
    }
    /**
     * Generates payment information for a single SEPA direct debit transfer instruction.
     * @param {SEPADirectDebitPaymentInstruction} instruction - The payment instruction.
     * @returns {Object} The payment information object formatted according to SEPA direct debit specifications.
     */
    directDebitTransfer(instruction) {
        const endToEndId = sanitize(instruction.endToEndId || instruction.id || generateId(), 35);
        const dinero = Dinero({
            amount: instruction.amount,
            currency: instruction.currency,
        });
        return {
            PmtId: {
                EndToEndId: endToEndId,
            },
            InstdAmt: {
                '#': dinero.toFormat('0.00'),
                '@Ccy': instruction.currency,
            },
            DrctDbtTx: {
                MndtRltdInf: {
                    MndtId: instruction.mandate.mandateId,
                    DtOfSgntr: instruction.mandate.dateOfSignature
                        .toISOString()
                        .split('T')[0],
                    AmdmntInd: instruction.mandate.amendmentIndicator,
                    ...(instruction.mandate.amendmentIndicator &&
                        instruction.mandate.amendmentInformation && {
                        AmdmntInfDtls: {
                            ...(instruction.mandate.amendmentInformation
                                .originalMandateId && {
                                OrgnlMndtId: instruction.mandate.amendmentInformation.originalMandateId,
                            }),
                            ...(instruction.mandate.amendmentInformation
                                .originalCreditorSchemeId && {
                                OrgnlCdtrSchmeId: {
                                    ...(instruction.mandate.amendmentInformation
                                        .originalCreditorSchemeId.name && {
                                        Nm: instruction.mandate.amendmentInformation
                                            .originalCreditorSchemeId.name,
                                    }),
                                    ...(instruction.mandate.amendmentInformation
                                        .originalCreditorSchemeId.id && {
                                        Id: {
                                            PrvtId: {
                                                Othr: {
                                                    Id: instruction.mandate.amendmentInformation
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
                },
            },
            DbtrAgt: this.agent(instruction.debtor.agent),
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
        const paymentInfoEntries = this.paymentInstructions.map((group) => {
            const pmtInfId = generateId();
            const localInstrument = group.localInstrument || 'CORE';
            const batchBooking = group.batchBooking !== undefined ? group.batchBooking : false;
            // Calculate sum for this group
            let groupSum = 0;
            for (const payment of group.payments) {
                groupSum += payment.amount;
            }
            const groupCtrlSum = Dinero({
                amount: groupSum,
                currency: 'EUR',
            }).toFormat('0.00');
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
                ReqdColltnDt: group.requestedCollectionDate
                    .toISOString()
                    .split('T')[0],
                Cdtr: this.party(group.creditor),
                CdtrAcct: this.account(group.creditor.account),
                CdtrAgt: this.agent(group.creditor.agent),
                ChrgBr: 'SLEV',
                CdtrSchmeId: {
                    Id: {
                        PrvtId: {
                            Othr: {
                                Id: group.creditorSchemeId,
                                SchmeNm: { Prtry: 'SEPA' },
                            },
                        },
                    },
                },
                DrctDbtTxInf: group.payments.map(payment => this.directDebitTransfer(payment)),
            };
        });
        const xml = {
            '?xml': {
                '@version': '1.0',
                '@encoding': 'UTF-8',
            },
            Document: {
                '@xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02',
                '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                '@xsi:schemaLocation': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02 pain.008.001.02.xsd',
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
        const parser = new fxp.XMLParser({ ignoreAttributes: false });
        const xml = parser.parse(rawXml);
        // Validate XML structure
        if (!xml.Document) {
            throw new InvalidXmlError('Invalid XML format');
        }
        // Validate namespace
        const namespace = (xml.Document['@_xmlns'] ||
            xml.Document['@_Xmlns']);
        if (!namespace.startsWith('urn:iso:std:iso:20022:tech:xsd:pain.008')) {
            throw new InvalidXmlNamespaceError('Invalid PAIN.008 namespace');
        }
        // Extract GrpHdr data
        const messageId = xml.Document.CstmrDrctDbtInitn.GrpHdr.MsgId;
        const creationDate = new Date(xml.Document.CstmrDrctDbtInitn.GrpHdr.CreDtTm);
        // Extract top-level initiating party from GrpHdr
        const topLevelInitiatingParty = {
            name: xml.Document.CstmrDrctDbtInitn.GrpHdr.InitgPty.Nm,
            id: xml.Document.CstmrDrctDbtInitn.GrpHdr.InitgPty.Id?.OrgId?.Othr
                ?.Id,
        };
        // Normalize PmtInf to array (handle both single object and array cases)
        const rawPmtInf = Array.isArray(xml.Document.CstmrDrctDbtInitn.PmtInf)
            ? xml.Document.CstmrDrctDbtInitn.PmtInf
            : [xml.Document.CstmrDrctDbtInitn.PmtInf];
        // Map each PmtInf to SEPADirectDebitPaymentInstructionGroup
        const paymentInstructions = rawPmtInf.map((pmtInf) => {
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
            const batchBooking = pmtInf.BtchBookg === 'true' || pmtInf.BtchBookg === true;
            // Normalize DrctDbtTxInf to array
            const rawInstructions = Array.isArray(pmtInf.DrctDbtTxInf)
                ? pmtInf.DrctDbtTxInf
                : [pmtInf.DrctDbtTxInf];
            // Parse each DrctDbtTxInf to SEPADirectDebitPaymentInstruction
            const payments = rawInstructions.map((inst) => {
                const currency = inst.InstdAmt['@_Ccy'];
                const amount = parseAmountToMinorUnits(Number(inst.InstdAmt['#text']), currency);
                // Parse mandate information
                const mandateInfo = inst.DrctDbtTx?.MndtRltdInf;
                const mandate = {
                    mandateId: mandateInfo?.MndtId,
                    dateOfSignature: new Date(mandateInfo?.DtOfSgntr),
                    amendmentIndicator: mandateInfo?.AmdmntInd === 'true' ||
                        mandateInfo?.AmdmntInd === true,
                    ...(mandateInfo?.AmdmntInd &&
                        mandateInfo?.AmdmntInfDtls && {
                        amendmentInformation: {
                            ...(mandateInfo.AmdmntInfDtls.OrgnlMndtId && {
                                originalMandateId: mandateInfo.AmdmntInfDtls
                                    .OrgnlMndtId,
                            }),
                            ...(mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId && {
                                originalCreditorSchemeId: {
                                    ...(mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId.Nm && {
                                        name: mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId
                                            .Nm,
                                    }),
                                    ...(mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId.Id?.PrvtId
                                        ?.Othr?.Id && {
                                        id: mandateInfo.AmdmntInfDtls.OrgnlCdtrSchmeId.Id.PrvtId
                                            .Othr.Id,
                                    }),
                                },
                            }),
                        },
                    }),
                };
                return {
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
            return {
                creditor: groupCreditor,
                creditorSchemeId: creditorSchemeId,
                payments: payments,
                requestedCollectionDate: requestedCollectionDate,
                sequenceType: sequenceType,
                localInstrument: localInstrument,
                ...(categoryPurpose && { categoryPurpose }),
                batchBooking: batchBooking,
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

const ISO20022Messages = {
    CAMT_003: 'CAMT.003',
    CAMT_004: 'CAMT.004',
    CAMT_005: 'CAMT.005',
    CAMT_006: 'CAMT.006',
    CAMT_053: 'CAMT.053',
    PAIN_001: 'PAIN.001',
    PAIN_002: 'PAIN.002',
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
        return new fxp.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            tagValueProcessor: (tagName, tagValue, _jPath, _hasAttributes, isLeafNode) => {
                /**
                 * Codes and Entry References can look like numbers and get parsed
                 * appropriately. We don't want this to happen, as they contain leading
                 * zeros or are too long and overflow.
                 *
                 * Ex. <Cd>0001234<Cd> Should resolve to "0001234"
                 */
                if (isLeafNode && ['Cd', 'NtryRef'].includes(tagName))
                    return undefined;
                return tagValue;
            },
        });
    }
    static getBuilder() {
        return new fxp.XMLBuilder({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            format: true,
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
            throw new InvalidStructureError('Invalid CAMT.003 document: missing MsgHdr');
        }
        const header = parseMessageHeader(rawHeader);
        const newCrit = doc.Document?.GetAcct?.AcctQryDef?.AcctCrit?.NewCrit;
        if (!newCrit) {
            throw new InvalidStructureError('Invalid CAMT.003 document: missing GetAcct.AcctQryDef.AcctCrit.NewCrit');
        }
        const name = newCrit.NewQryNm;
        let searchCriteria = [];
        let rawCriterias = newCrit.SchCrit;
        if (!Array.isArray(rawCriterias)) {
            rawCriterias = [rawCriterias];
        }
        rawCriterias = rawCriterias.filter((c) => !!c);
        if (rawCriterias.length === 0) {
            throw new InvalidStructureError('Invalid CAMT.003 document: missing search criteria');
        }
        for (const rawCriterium of rawCriterias) {
            const crit = {};
            // search on Ids, only one criterium supported for now
            if (rawCriterium.AcctId) {
                if (Array.isArray(rawCriterium.AcctId) &&
                    rawCriterium.AcctId.length > 1) {
                    throw new InvalidStructureError('Invalid CAMT.003 document: multiple AcctId criterium not supported');
                }
                const acctId = Array.isArray(rawCriterium.AcctId)
                    ? rawCriterium.AcctId[0]
                    : rawCriterium.AcctId;
                if (acctId.CTTxt) {
                    crit.accountRegExp = `.*${acctId.CTTxt}.*`; // contains
                }
                else if (acctId.NCTTxt) {
                    crit.accountRegExp = `^((?!${acctId.NCTTxt}).)*$`; // does not contain
                }
                else if (acctId.EQ) {
                    crit.accountEqualTo = parseAccountIdentification(acctId.EQ);
                }
            }
            // search on currency
            if (rawCriterium.Ccy) {
                if (Array.isArray(rawCriterium.Ccy) && rawCriterium.Ccy.length > 1) {
                    throw new InvalidStructureError('Invalid CAMT.003 document: multiple Ccy criterium not supported');
                }
                const ccy = Array.isArray(rawCriterium.Ccy)
                    ? rawCriterium.Ccy[0]
                    : rawCriterium.Ccy;
                crit.currencyEqualTo = ccy;
            }
            // search on balance as of date
            if (rawCriterium.Bal) {
                if (Array.isArray(rawCriterium.Bal) && rawCriterium.Bal.length > 1) {
                    throw new InvalidStructureError('Invalid CAMT.003 document: multiple Bal criterium not supported');
                }
                const bal = Array.isArray(rawCriterium.Bal)
                    ? rawCriterium.Bal[0]
                    : rawCriterium.Bal;
                if (bal?.ValDt && Array.isArray(bal.ValDt) && bal.ValDt.length > 1) {
                    throw new InvalidStructureError('Invalid CAMT.003 document: multiple ValDt criterium not supported');
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
        const namespace = (doc.Document['@_xmlns'] ||
            doc.Document['@_Xmlns']);
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
                                    if (c.accountRegExp.startsWith('.*') &&
                                        c.accountRegExp.endsWith('.*')) {
                                        obj.AcctId = {
                                            CTTxt: c.accountRegExp
                                                .replace(/^\.\*/, '')
                                                .replace(/\.\*$/, ''),
                                        }; // contains
                                    }
                                    else if (c.accountRegExp.startsWith('^((?!') &&
                                        c.accountRegExp.endsWith(').)*$')) {
                                        obj.AcctId = {
                                            NCTTxt: c.accountRegExp
                                                .replace(/^\^\(\(\!\(/, '')
                                                .replace(/\)\.\)\*\$$/, ''),
                                        }; // does not contain
                                    }
                                }
                                else if (c.accountEqualTo) {
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

const parseStatement = (stmt) => {
    const id = stmt.Id.toString();
    const electronicSequenceNumber = stmt.ElctrncSeqNb;
    const legalSequenceNumber = stmt.LglSeqNb;
    const creationDate = new Date(stmt.CreDtTm);
    let fromDate;
    let toDate;
    if (stmt.FrToDt) {
        fromDate = new Date(stmt.FrToDt.FrDtTm);
        toDate = new Date(stmt.FrToDt.ToDtTm);
    }
    // Txn Summaries
    const numOfEntries = stmt.TxsSummry?.TtlNtries.NbOfNtries;
    const sumOfEntries = stmt.TxsSummry?.TtlNtries.Sum;
    const rawNetAmountOfEntries = stmt.TxsSummry?.TtlNtries.TtlNetNtryAmt;
    let netAmountOfEntries;
    // No currency information, default to USD
    if (rawNetAmountOfEntries) {
        netAmountOfEntries = parseAmountToMinorUnits(rawNetAmountOfEntries);
    }
    const numOfCreditEntries = stmt.TxsSummry?.TtlCdtNtries.NbOfNtries;
    const sumOfCreditEntries = stmt.TxsSummry?.TtlCdtNtries.Sum;
    const numOfDebitEntries = stmt.TxsSummry?.TtlDbtNtries.NbOfNtries;
    const sumOfDebitEntries = stmt.TxsSummry?.TtlDbtNtries.Sum;
    // Get account information
    // TODO: Save account types here
    const account = parseAccount(stmt.Acct);
    const agent = parseAgent(stmt.Acct.Svcr);
    let balances = [];
    if (Array.isArray(stmt.Bal)) {
        balances = stmt.Bal.map(parseBalance);
    }
    else if (stmt.Bal) {
        balances = [parseBalance(stmt.Bal)];
    }
    let entries = [];
    if (Array.isArray(stmt.Ntry)) {
        entries = stmt.Ntry.map(parseEntry);
    }
    else if (stmt.Ntry) {
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
const exportStatement = (stmt) => {
    const obj = {
        Id: stmt.id,
        ElctrncSeqNb: stmt.electronicSequenceNumber,
        LglSeqNb: stmt.legalSequenceNumber,
        CreDtTm: stmt.creationDate.toISOString(),
        FrToDt: stmt.fromDate && stmt.toDate
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
                    ? exportAmountToString(stmt.netAmountOfEntries, stmt.balances[0]?.currency)
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
            Svcr: exportAgent(stmt.agent),
        },
        Bal: stmt.balances.map(bal => exportBalance(bal)),
        Ntry: stmt.entries.map(entry => exportEntry(entry)),
    };
    return obj;
};
const parseBalance = (balance) => {
    const rawAmount = balance.Amt['#text'];
    const currency = balance.Amt['@_Ccy'];
    const amount = parseAmountToMinorUnits(rawAmount, currency);
    const creditDebitIndicator = balance.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
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
const exportBalance = (balance) => {
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
    const creditDebitIndicator = balance.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
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
const parseEntry = (entry) => {
    const referenceId = entry.NtryRef;
    const creditDebitIndicator = entry.CdtDbtInd === 'CRDT' ? 'credit' : 'debit';
    const bookingDate = parseDate(entry.BookgDt);
    const reversal = entry.RvslInd === true;
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
        .map((rawDetail) => {
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
const exportEntry = (entry) => {
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
        BkTxCd: exportBankTransactionCode(entry.bankTransactionCode, entry.proprietaryCode),
        AddtlNtryInf: entry.additionalInformation,
        AcctSvcrRef: entry.accountServicerReferenceId,
        NtryDtls: entry.transactions.map(tx => ({
            TxDtls: exportTransactionDetails(tx),
        })),
    };
    return obj;
};
const parseTransactionDetail = (transactionDetail) => {
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
        debtorName = transactionDetail.RltdPties.Dbtr.Nm;
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
        creditorName = transactionDetail.RltdPties.Cdtr.Nm;
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
const exportTransactionDetails = (tx) => {
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
const parseBankTransactionCode = (transactionCode) => {
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
const parseBusinessError = (bizErr) => {
    const code = bizErr.Err?.Cd || bizErr.Err?.Prtry || 'UKNW';
    const description = bizErr.Desc;
    return {
        code,
        description,
    };
};
const exportBusinessError = (bizErr) => {
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
            throw new InvalidStructureError('Invalid CAMT.004 document: missing MsgHdr');
        }
        const header = parseMessageHeader(rawHeader);
        // interpret the report
        let rawReports = doc.Document?.RtrAcct?.RptOrErr?.AcctRpt;
        if (!Array.isArray(rawReports))
            rawReports = [rawReports];
        rawReports = rawReports.filter((r) => !!r); // remove null/undefined
        const reports = rawReports.map((r) => {
            const accountId = parseAccountIdentification(r.AcctId);
            let report = undefined;
            let error = undefined;
            if (r.AcctOrErr?.Acct) {
                // report
                if (!r.AcctOrErr.Acct.Ccy) {
                    throw new InvalidStructureError('Invalid CAMT.004 document: missing Ccy in Acct');
                }
                let rawMulBal = r.AcctOrErr.Acct.MulBal;
                if (!Array.isArray(rawMulBal))
                    rawMulBal = [rawMulBal];
                rawMulBal = rawMulBal.filter((b) => !!b);
                report = {
                    currency: r.AcctOrErr.Acct.Ccy,
                    name: r.AcctOrErr.Acct.Nm,
                    type: r.AcctOrErr.Acct.Tp?.Cd || r.AcctOrErr.Acct.Tp?.Prtry,
                    balances: rawMulBal.map((bal) => parseBalanceReport(r.AcctOrErr.Acct.Ccy, bal)),
                };
                if (report.balances.length === 0) {
                    throw new InvalidStructureError('Invalid CAMT.004 document: missing MulBal in Acct');
                }
            }
            else if (r.AcctOrErr?.BizErr) {
                // business error
                error = parseBusinessError(r.AcctOrErr.BizErr);
            }
            else {
                throw new InvalidStructureError('Invalid CAMT.004 document: missing AcctOrErr');
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
        const namespace = (doc.Document['@_xmlns'] ||
            doc.Document['@_Xmlns']);
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
                                MulBal: report.report.balances.map(bal => exportBalanceReport(report.report.currency, bal)),
                            };
                        }
                        else if (report.error) {
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
            throw new InvalidStructureError('Invalid CAMT.005 document: missing MsgHdr');
        }
        const header = parseMessageHeader(rawHeader);
        const newCrit = doc.Document?.GetTx?.TxQryDef?.TxCrit?.NewCrit;
        if (!newCrit) {
            throw new InvalidStructureError('Invalid CAMT.005 document: missing GetTx.TxQryDef.TxCrit.NewCrit');
        }
        const name = newCrit.NewQryNm;
        let searchCriteria = [];
        let rawCriterias = newCrit.SchCrit;
        if (!Array.isArray(rawCriterias)) {
            rawCriterias = [rawCriterias];
        }
        rawCriterias = rawCriterias.filter((c) => !!c);
        if (rawCriterias.length === 0) {
            throw new InvalidStructureError('Invalid CAMT.005 document: missing search criteria');
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
                if (Array.isArray(rawCriterium.PmtSch.ReqdExctnDt) &&
                    rawCriterium.PmtSch.ReqdExctnDt.length > 1) {
                    throw new InvalidStructureError('Invalid CAMT.005 document: multiple ReqdExctnDt criterium not supported');
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
        const namespace = (doc.Document['@_xmlns'] ||
            doc.Document['@_Xmlns']);
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
                                if (c.type === 'PmtSch.PmtId.LngBizId.EndToEndId' &&
                                    c.endToEndIdEqualTo) {
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
            throw new InvalidStructureError('Invalid CAMT.006 document: missing MsgHdr');
        }
        const header = parseMessageHeader(rawHeader);
        // interpret the report
        let rawReports = doc.Document?.RtrTx?.RptOrErr?.BizRpt?.TxRpt;
        if (!Array.isArray(rawReports))
            rawReports = [rawReports];
        rawReports = rawReports.filter((r) => !!r); // remove null/undefined
        const reports = rawReports.map((r) => {
            const rawAmount = r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Amt ||
                r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Amount; // some implementations use Amount instead of Amt
            const paymentId = {
                currency: r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Ccy,
                amount: parseAmountToMinorUnits(rawAmount, r.PmtId?.LngBizId?.IntrBkSttlmAmt?.Ccy),
                endToEndId: r.PmtId?.LngBizId?.EndToEndId,
                transactionId: r.PmtId?.LngBizId?.TxId,
                uetr: r.PmtId?.LngBizId?.UETR,
            };
            // check required fields
            if (!paymentId.currency) {
                throw new InvalidStructureError('Invalid CAMT.006 document: missing Ccy in PmtId.LngBizId.IntrBkSttlmAmt');
            }
            if (paymentId.amount === undefined ||
                paymentId.amount === null ||
                isNaN(paymentId.amount)) {
                throw new InvalidStructureError('Invalid CAMT.006 document: missing or invalid Amt in PmtId.LngBizId.IntrBkSttlmAmt');
            }
            if (!paymentId.endToEndId) {
                throw new InvalidStructureError('Invalid CAMT.006 document: missing EndToEndId in PmtId.LngBizId');
            }
            let report = undefined;
            let error = undefined;
            if (r.TxOrErr?.Tx) {
                // report
                const msgId = r.TxOrErr.Tx.Pmt?.MsgId;
                const reqExecutionDate = r.TxOrErr.Tx.Pmt?.ReqdExctnDt?.Dt
                    ? parseDate(r.TxOrErr.Tx.Pmt.ReqdExctnDt)
                    : undefined;
                const status = ((sts) => {
                    if (!sts)
                        return undefined;
                    if (Array.isArray(sts) && sts.length === 0)
                        return undefined;
                    if (Array.isArray(sts))
                        sts = sts[0]; // take the first one only
                    let code = sts.Cd?.Pdg ||
                        sts.Cd?.Fnl ||
                        sts.Cd?.RTGS ||
                        sts.Cd?.Sttlm ||
                        sts.Cd?.Prtly;
                    if (code)
                        code = Object.keys(sts.Cd)[0] + ':' + code; // prefix with the type of code
                    else
                        return undefined;
                    const reason = sts.Rsn?.Prtry;
                    return { code, reason };
                })(r.TxOrErr.Tx.Pmt?.Sts);
                // to parse debtor and creditor with their agents
                function parseParty$1(party) {
                    const p = parseParty(party?.Pty || {}); // force a valid object
                    if (party?.Agt)
                        p.agent = { bic: party.Agt.FinInstnId?.BICFI };
                    return p;
                }
                function parseAgent(agent) {
                    if (!agent)
                        return { bic: '' };
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
                    throw new InvalidStructureError('Invalid CAMT.006 document: missing Id in TxOrErr.Tx.Dbtr.Pty');
                }
                if (!report.creditor.id) {
                    throw new InvalidStructureError('Invalid CAMT.006 document: missing Id in TxOrErr.Tx.Cdtr.Pty');
                }
            }
            else if (r.TxOrErr?.BizErr) {
                // business error
                error = parseBusinessError(r.TxOrErr.BizErr);
            }
            else {
                throw new InvalidStructureError('Invalid CAMT.006 document: missing TxOrErr');
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
        const namespace = (doc.Document['@_xmlns'] ||
            doc.Document['@_Xmlns']);
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
                                            Amt: exportAmountToString(report.paymentId.amount, report.paymentId.currency),
                                            Amount: exportAmountToString(report.paymentId.amount, report.paymentId.currency), // some implementations use Amount instead of Amt
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
                                    if (!p)
                                        return undefined;
                                    return {
                                        Pty: {
                                            Nm: p.name,
                                            Id: p.id ? { OrgId: { Othr: { Id: p.id } } } : undefined,
                                        },
                                        Agt: exportAgent(p.agent),
                                    };
                                }
                                function exportAgent(a) {
                                    if (!a)
                                        return undefined;
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
                            }
                            else if (report.error) {
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
const parseStatus = (status) => {
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
const parseGroupStatusInformation = (originalGroupInfAndStatus) => {
    if (!originalGroupInfAndStatus.hasOwnProperty('GrpSts')) {
        return null;
    }
    return {
        type: 'group',
        originalMessageId: originalGroupInfAndStatus.OrgnlMsgId,
        status: parseStatus(originalGroupInfAndStatus.GrpSts),
        reason: {
            code: originalGroupInfAndStatus.StsRsnInf?.Rsn?.Cd,
            additionalInformation: parseAdditionalInformation(originalGroupInfAndStatus.StsRsnInf?.AddtlInf),
        },
    };
};
const parsePaymentStatusInformations = (originalPaymentInfAndStatuses) => {
    return originalPaymentInfAndStatuses
        .map((payment) => {
        if (!payment.hasOwnProperty('PmtInfSts')) {
            return null;
        }
        return {
            type: 'payment',
            originalPaymentId: payment.OrgnlPmtInfId,
            status: parseStatus(payment.PmtInfSts),
            reason: {
                code: payment.StsRsnInf?.Rsn?.Cd,
                additionalInformation: parseAdditionalInformation(payment.StsRsnInf?.AddtlInf),
            },
        };
    })
        .filter((status) => status !== null);
};
const parseTransactionStatusInformations = (allTxnsInfoAndStatuses) => {
    const transactionStatuses = allTxnsInfoAndStatuses.map((transaction) => {
        return {
            type: 'transaction',
            originalEndToEndId: transaction.OrgnlEndToEndId,
            status: parseStatus(transaction.TxSts),
            reason: {
                code: transaction.StsRsnInf?.Rsn?.Cd,
                additionalInformation: parseAdditionalInformation(transaction.StsRsnInf?.Rsn?.AddtlInf),
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
        const parser = new fxp.XMLParser({ ignoreAttributes: false });
        const xml = parser.parse(rawXml);
        const customerPaymentStatusReport = xml.Document.CstmrPmtStsRpt;
        const rawCreationDate = customerPaymentStatusReport.GrpHdr.CreDtTm;
        const messageId = customerPaymentStatusReport.GrpHdr.MsgId;
        const creationDate = new Date(rawCreationDate);
        const initatingParty = parseParty(customerPaymentStatusReport.GrpHdr.InitgPty);
        const rawOriginalGroupInformation = customerPaymentStatusReport.OrgnlGrpInfAndSts;
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
            parseGroupStatusInformation(customerPaymentStatusReport.OrgnlGrpInfAndSts),
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
        const firstStatusInformation = this
            .firstStatusInformation;
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
            statements = bankToCustomerStatement.Stmt.map((stmt) => parseStatement(stmt));
        }
        else {
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
        const namespace = (xml.Document['@_xmlns'] ||
            xml.Document['@_Xmlns']);
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
exports.ACHLocalInstrumentCodeDescriptionMap = ACHLocalInstrumentCodeDescriptionMap;
exports.BalanceTypeCode = BalanceTypeCode;
exports.BalanceTypeCodeDescriptionMap = BalanceTypeCodeDescriptionMap;
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
exports.SEPAMultiCreditPaymentInitiation = SEPAMultiCreditPaymentInitiation;
exports.SWIFTCreditPaymentInitiation = SWIFTCreditPaymentInitiation;
