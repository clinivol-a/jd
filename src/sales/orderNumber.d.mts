export function orderNumber(order?: {id?: unknown;status?: unknown;orderNumber?: unknown}): string;
export function matchesBusinessKeyword(item: {orderNumber:string;object:string;hospital:string},keyword:string): boolean;
