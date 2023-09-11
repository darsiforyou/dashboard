export const convertToMoney = (amount: number) => {
  if (amount === undefined || amount === null) return;
  return parseFloat(amount.toFixed(2)).toLocaleString();
};
