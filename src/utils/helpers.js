export const now = () => new Date().toISOString();

export const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export const money = (value) => Number.parseFloat(value || 0) || 0;

export const today = () => new Date().toISOString().slice(0, 10);
