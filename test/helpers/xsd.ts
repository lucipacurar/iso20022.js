import * as fs from 'fs';
import * as path from 'path';
import libxmljs from 'libxmljs2';

export function validateAgainstXsd(xml: string, xsdPath: string): void {
  const xsdContent = fs.readFileSync(path.resolve(xsdPath), 'utf-8');
  const xsdDoc = libxmljs.parseXml(xsdContent);
  const xmlDoc = libxmljs.parseXml(xml);
  const isValid = xmlDoc.validate(xsdDoc);
  if (!isValid) {
    const errors = xmlDoc.validationErrors
      .map((e: any) => e.message || e.toString())
      .join('\n');
    throw new Error(`XSD validation failed:\n${errors}`);
  }
}
