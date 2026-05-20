export type FloorId = 'floor-0' | 'floor-b1' | 'floor-b2'
export type BlockStatus = 'available' | 'busy' | 'full'
export type SpotStatus = 'available' | 'occupied'
export type SignageStatus = 'online' | 'offline'

export interface Floor {
  id: FloorId
  label: string
  shortLabel: string
  capacity: number
  occupied: number
}

export interface ParkingBlock {
  id: string
  floorId: FloorId
  name: string
  label: string
  capacity: number
  occupied: number
  status: BlockStatus
  x: number
  y: number
  width: number
  height: number
  rotateLabel?: boolean
  vip?: boolean
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  owner: string
  tier: string
  floorId: FloorId
  blockId: string
  spotId: string
  locationLabel: string
  isElectric?: boolean
  batteryLevel?: number
}

export interface ParkingSpot {
  id: string
  floorId: FloorId
  blockId: string
  status: SpotStatus
  vehicleId?: string
}

export interface DigitalSignage {
  id: string
  floorId: FloorId
  blockId?: string
  location: string
  status: SignageStatus
  contentTitle: string
  template: string
  brightness: number
  temperatureC: number
  lastSync: string
  x?: number
  y?: number
  orientation?: 'horizontal' | 'vertical'
}

export interface MessageTemplate {
  id: string
  type: string
  title: string
  body: string
  trigger: string
  sentAt?: string
  icon: 'welcome' | 'campaign' | 'loyalty'
}

export interface StoreRecommendation {
  id: string
  storeName: string
  floorLabel: string
  blockLabel: string
  spotLabel: string
  closest?: boolean
  icon: 'coffee' | 'apparel' | 'visibility'
}
