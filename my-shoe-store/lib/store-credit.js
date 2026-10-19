export const STORE_CREDIT_UPDATED_EVENT = "tradits:store-credit-updated";

export function readStoreCredit() {
  const storedValue = window.localStorage.getItem("storeCredit");
  if (storedValue === null) return 0;

  const credit = Number(storedValue);
  if (!Number.isFinite(credit) || credit < 0) {
    throw new Error("Your saved store credit could not be read.");
  }

  return credit;
}

export function addStoreCredit(amount) {
  const creditAmount = Number(amount);
  if (!Number.isFinite(creditAmount) || creditAmount < 0) {
    throw new Error("The store credit amount is invalid.");
  }

  const updatedCredit = readStoreCredit() + creditAmount;
  window.localStorage.setItem("storeCredit", updatedCredit.toFixed(2));
  window.dispatchEvent(new Event(STORE_CREDIT_UPDATED_EVENT));
  return updatedCredit;
}
