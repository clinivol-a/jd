/** Presentation only. Legacy submitted numbers remain unchanged; record IDs still own relations. */
export function orderNumber(order) {
  if (!order || order.status === '草稿') return '-';
  return order.orderNumber || order.id || '-';
}
export function matchesBusinessKeyword(item, keyword) {
  const query = keyword.trim().toLocaleLowerCase();
  return !query || [item.orderNumber === '-' ? '' : item.orderNumber, item.object, item.hospital]
    .some(value => String(value || '').toLocaleLowerCase().includes(query));
}
