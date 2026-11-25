export const anhuiCities:string[];
export function coversRegion(regions:string[]|undefined,region:string):boolean;
export function hospitalMatches(hospital:{name:string;region:string;status:string},filters?:{name?:string;region?:string;status?:string}):boolean;
export function fixedColumn(index:number,count:number):'left'|'right'|undefined;
