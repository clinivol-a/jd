import { BrowseIcon, BrowseOffIcon, LockOffIcon, LockOnIcon } from './design-system/tdesign'

/** Shared TDesign line icons for professional-object state; behaviour stays with each caller. */
export default function ObjectStateIcon({ kind, active, size = 16 }: { kind: 'visibility' | 'lock'; active: boolean; size?: number }) {
  const Icon = kind === 'visibility' ? active ? BrowseIcon : BrowseOffIcon : active ? LockOnIcon : LockOffIcon
  return <Icon size={size} />
}
