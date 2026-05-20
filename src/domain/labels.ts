import type { BlockStatus, FloorId, SignageStatus, SpotStatus } from './types'

export const floorLabels: Record<FloorId, string> = {
  'floor-0': 'Kat 0',
  'floor-b1': 'Kat -1',
  'floor-b2': 'Kat -2',
}

export const blockStatusLabels: Record<BlockStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  full: 'Full',
}

export const spotStatusLabels: Record<SpotStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
}

export const signageStatusLabels: Record<SignageStatus, string> = {
  online: 'Online',
  offline: 'Offline',
}
