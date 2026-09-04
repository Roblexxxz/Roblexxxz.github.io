const storageKey = 'robuxBalance';
const defaultBalance = 50;

function loadBalance() {
  const storedValue = localStorage.getItem(storageKey);
  const savedBalance = Number(storedValue);
  return storedValue !== null && Number.isFinite(savedBalance) && savedBalance >= 0 ? savedBalance : defaultBalance;
}

export const currentRobux = {
  robuxBalance: loadBalance()
};

export function setRobuxBalance(balance) {
  const nextBalance = Number(balance);
  if (!Number.isFinite(nextBalance) || nextBalance < 0) {
    throw new Error('Robux balance must be a non-negative number.');
  }

  currentRobux.robuxBalance = nextBalance;
  localStorage.setItem(storageKey, String(nextBalance));
}
