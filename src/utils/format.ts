import { randomUUID } from 'node:crypto';

export const sanitize = (value: string, length: 35) => {
  return value.slice(0, length);
};

export const generateId = (): string => {
  return randomUUID().replace(/-/g, '');
};
