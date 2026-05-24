export function enrichExpense(store, expense) {
  const vendor = store.vendors.find((item) => item.id === expense.vendorId);
  return { ...expense, vendorName: vendor?.name || "Unassigned vendor" };
}
