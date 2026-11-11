import type {SalesData, Doctor, Case, Order, Event, Attachment} from './model';
export const stageTeams: string[];
export const syntheticPatients: string[];
export function orderFixtures(ownerId:string,doctors:Doctor[],cases:Case[],now?:Date,prefix?:string,recent?:boolean):{orders:Order[];events:Event[];projects:NonNullable<SalesData['projects']>};
export function fixtureAttachments(owner:string,order:string,at:string):Attachment[];
export function fixtureBytes(kind:number):Uint8Array<ArrayBuffer>;
export function addOrderScenario(data:SalesData,now?:Date):SalesData;
