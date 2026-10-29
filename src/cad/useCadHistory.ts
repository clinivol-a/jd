import { useCallback, useEffect, useReducer } from 'react'
import type { CadProject } from './cadProject'
import { cadProjectContent } from './cadProject'
export type CadHistory = { present: CadProject; past: CadProject[]; future: CadProject[]; mergeKey?: string; at?: number }
type Update = CadProject | ((current: CadProject) => CadProject)
export type CadHistoryAction = { type: 'commit'; update: Update; mergeKey?: string; at: number } | { type: 'undo' } | { type: 'redo' } | { type: 'reset'; project: CadProject }
export function cadHistoryReducer(state: CadHistory, action: CadHistoryAction): CadHistory {
  if (action.type === 'reset') return { present: action.project, past: [], future: [] }
  if (action.type === 'undo') return state.past.length ? { present: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.present, ...state.future] } : state
  if (action.type === 'redo') return state.future.length ? { present: state.future[0], past: [...state.past, state.present], future: state.future.slice(1) } : state
  const present = typeof action.update === 'function' ? action.update(state.present) : action.update
  if (cadProjectContent(present) === cadProjectContent(state.present)) return state
  const merge = action.mergeKey && action.mergeKey === state.mergeKey && action.at - (state.at ?? 0) < 650 && !state.future.length
  if (merge && state.past.length && cadProjectContent(present) === cadProjectContent(state.past[state.past.length - 1])) return { present, past: state.past.slice(0, -1), future: [] }
  return { present, past: merge ? state.past : [...state.past, state.present].slice(-50), future: [], mergeKey: action.mergeKey, at: action.at }
}
const sessions = new Map<string, CadHistory>()
export function useCadHistory(initial: () => CadProject) {
  const [history, dispatch] = useReducer(cadHistoryReducer, undefined, () => {
    const present = initial(), cached = sessions.get(present.taskId)
    return cached && cadProjectContent(cached.present) === cadProjectContent(present) ? { ...cached, present: { ...cached.present, savedAt: present.savedAt, version: present.version } } : { present, past: [], future: [] }
  })
  useEffect(() => { sessions.set(history.present.taskId, history); if (sessions.size > 12) sessions.delete(sessions.keys().next().value!) }, [history])
  const commit = useCallback((update: Update, mergeKey?: string) => dispatch({ type: 'commit', update, mergeKey, at: Date.now() }), [])
  const reset = useCallback((project: CadProject) => dispatch({ type: 'reset', project }), [])
  return { project: history.present, commit, reset, undo: () => dispatch({ type: 'undo' }), redo: () => dispatch({ type: 'redo' }), canUndo: !!history.past.length, canRedo: !!history.future.length }
}
