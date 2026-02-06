import { v4 as uuidv4 } from 'uuid';

export const sanitize = (value: string, length: 35) => {
  return value.slice(0, length);
};

export const generateId = (): string => {
  return uuidv4().replace(/-/g, '');
};
