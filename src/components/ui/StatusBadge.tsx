import type { ReactNode } from 'react'
import type { BlockStatus, SignageStatus, SpotStatus } from '../../domain/types'

interface Props {
  status: BlockStatus | SignageStatus | SpotStatus | 'active' | 'offline'
  children?: ReactNode
}

export function StatusBadge({ status, children }: Props) {
  return <span className={`status-badge status-badge--${status}`}>{children ?? formatStatus(status)}</span>
}

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase())
}
