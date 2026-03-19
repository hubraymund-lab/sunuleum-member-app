// Created: 2026-03-18
const STORAGE_KEYS = {
  MEMBERS: 'sunuleum_members',
  ATTENDANCE: 'sunuleum_attendance',
  FEES: 'sunuleum_fees',
};

export function loadData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export { STORAGE_KEYS };
