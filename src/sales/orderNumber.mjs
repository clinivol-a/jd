/** Shared records display the allocated number; unlinked history retains its original number. */
export function orderNumber(order) {
  if (!order || order.status === '草稿') return '-';
  if(order.source==='isolated-shared')return order.businessNo || '-';
  return order.businessNo || order.orderNumber || order.id || '-';
}
export function matchesBusinessKeyword(item, keyword) {
  const query = keyword.trim().toLocaleLowerCase();
  return !query || [item.orderNumber === '-' ? '' : item.orderNumber, item.object, item.hospital]
    .some(value => String(value || '').toLocaleLowerCase().includes(query));
}
