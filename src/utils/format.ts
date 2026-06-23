import { randomUUID } from 'node:crypto';

export const sanitize = (value: string, length: 35) => value.slice(0, length);

export const generateId = (): string => randomUUID().replace(/-/g, '');
