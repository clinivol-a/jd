import { syntheticPatients } from '../sales/orderFixtures.mjs'

export type PatientDisplaySource = {
  id: string
  orderNo: string
  patient: string
  patientName?: string
  dataOrigin?: 'demo' | 'production'
}

// Only the existing, isolated seed records have these presentation names.
// This is not a patient identity registry or a link to a sales Order.
const demoPatients: Record<string, { reference: string; tasks: string[]; name: string }> = {
  'CV260910-0184': { reference: 'CV-P-2026-0184', tasks: ['001'], name: syntheticPatients[0] },
  'CV260908-0172': { reference: 'CV-P-2026-0172', tasks: ['002'], name: syntheticPatients[1] },
  'CV260907-0168': { reference: 'CV-P-2026-0168', tasks: ['003'], name: syntheticPatients[0] },
  'CV261019-0211': { reference: 'CV-P-2026-0211', tasks: ['004', '005'], name: syntheticPatients[1] },
  'CV261020-0226': { reference: 'CV-P-2026-0226', tasks: ['006', '007'], name: syntheticPatients[0] },
  'CV261102-0301': { reference: 'CV-P-2026-301', tasks: ['P301-1', 'P301-2', 'P301-3', 'P301-4'], name: syntheticPatients[0] },
  'CV261101-0302': { reference: 'CV-P-2026-302', tasks: ['P302-1'], name: syntheticPatients[1] },
  'CV261102-0303': { reference: 'CV-P-2026-303', tasks: ['P303-1', 'P303-2'], name: syntheticPatients[1] },
  'CV261101-0304': { reference: 'CV-P-2026-304', tasks: ['P304-1'], name: syntheticPatients[0] },
  'CV261102-0305': { reference: 'CV-P-2026-305', tasks: ['P305-1', 'P305-2'], name: syntheticPatients[0] },
  'CV261101-0306': { reference: 'CV-P-2026-306', tasks: ['P306-1'], name: syntheticPatients[1] },
  'CV261102-0307': { reference: 'CV-P-2026-307', tasks: ['P307-1', 'P307-2'], name: syntheticPatients[1] },
  'CV261101-0308': { reference: 'CV-P-2026-308', tasks: ['P308-1'], name: syntheticPatients[0] },
}

export function patientDisplayName(source: PatientDisplaySource): string {
  const name = source.patientName?.trim()
  if (name && name !== '-' && name !== '—') return name
  if (source.dataOrigin === 'production') return '—'
  const fixture = demoPatients[source.orderNo]
  return fixture?.reference === source.patient && fixture.tasks.includes(source.id) ? fixture.name : '—'
}
