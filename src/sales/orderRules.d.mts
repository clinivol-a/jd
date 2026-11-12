import type { Order, Attachment } from "./model";
export const designStages: string[];
export function localDate(value?: Date | string): string;
export function isImaging(file: Attachment): boolean;
export function orderErrors(
  order: Order,
  patientName: string | undefined,
  now?: Date,
): Record<string, string>;

export function confirmedDelivery(order: Partial<Order>): string;
