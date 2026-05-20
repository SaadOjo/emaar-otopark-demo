import type { DigitalSignage, Floor, MessageTemplate, ParkingBlock, ParkingSpot, StoreRecommendation, Vehicle } from '../../domain/types'

export const mockFloors: Floor[] = [
  { id: 'floor-0', label: 'Kat 0 (Ground)', shortLabel: 'Floor 00', capacity: 260, occupied: 154 },
  { id: 'floor-b1', label: 'Kat -1 (Basement)', shortLabel: 'Floor -1', capacity: 310, occupied: 217 },
  { id: 'floor-b2', label: 'Kat -2 (Sub-Basement)', shortLabel: 'Floor -2', capacity: 410, occupied: 268 },
]

export const mockBlocks: ParkingBlock[] = [
  { id: 'block-a', floorId: 'floor-b2', name: 'Block A', label: 'BLOCK A', capacity: 50, occupied: 48, status: 'full', x: 100, y: 80, width: 120, height: 200 },
  { id: 'block-b', floorId: 'floor-b2', name: 'Block B', label: 'BLOCK B', capacity: 60, occupied: 12, status: 'available', x: 280, y: 80, width: 180, height: 200 },
  { id: 'block-c', floorId: 'floor-b2', name: 'Block C', label: 'BLOCK C', capacity: 80, occupied: 5, status: 'available', x: 490, y: 80, width: 230, height: 200 },
  { id: 'block-d', floorId: 'floor-b2', name: 'Block D', label: 'BLOCK D', capacity: 50, occupied: 25, status: 'busy', x: 100, y: 320, width: 120, height: 200 },
  { id: 'block-e', floorId: 'floor-b2', name: 'Block E', label: 'BLOCK E (VIP)', capacity: 120, occupied: 118, status: 'full', x: 280, y: 320, width: 440, height: 200, vip: true },
  { id: 'block-f', floorId: 'floor-b2', name: 'Block F', label: 'BLOCK F', capacity: 50, occupied: 2, status: 'available', x: 780, y: 80, width: 140, height: 440, rotateLabel: true },

  { id: 'block-a', floorId: 'floor-b1', name: 'Block A', label: 'BLOCK A', capacity: 64, occupied: 42, status: 'busy', x: 100, y: 80, width: 160, height: 210 },
  { id: 'block-b', floorId: 'floor-b1', name: 'Block B', label: 'BLOCK B', capacity: 76, occupied: 34, status: 'busy', x: 300, y: 80, width: 230, height: 210 },
  { id: 'block-c', floorId: 'floor-b1', name: 'Block C', label: 'BLOCK C', capacity: 90, occupied: 70, status: 'full', x: 570, y: 80, width: 160, height: 440 },
  { id: 'block-d', floorId: 'floor-b1', name: 'Block D', label: 'BLOCK D', capacity: 80, occupied: 21, status: 'available', x: 100, y: 330, width: 430, height: 190 },

  { id: 'block-a', floorId: 'floor-0', name: 'Block A', label: 'BLOCK A', capacity: 70, occupied: 35, status: 'busy', x: 110, y: 90, width: 180, height: 190 },
  { id: 'block-b', floorId: 'floor-0', name: 'Block B', label: 'BLOCK B', capacity: 80, occupied: 22, status: 'available', x: 330, y: 90, width: 250, height: 190 },
  { id: 'block-c', floorId: 'floor-0', name: 'Valet', label: 'VALET', capacity: 110, occupied: 97, status: 'full', x: 630, y: 90, width: 210, height: 430 },
]

export const mockVehicles: Vehicle[] = [
  { id: 'v-a01', plate: '34 ABC 123', brand: 'BMW', model: 'X5', owner: 'Ahmet Y.', tier: 'Standard Member', floorId: 'floor-b2', blockId: 'block-a', spotId: 'A01', locationLabel: 'Zone A-01, Level -2' },
  { id: 'v-a03', plate: '34 TES 003', brand: 'Tesla', model: 'Model 3', owner: 'Elif S.', tier: 'EV Member', floorId: 'floor-b2', blockId: 'block-a', spotId: 'A03', locationLabel: 'Zone A-03, Level -2', isElectric: true, batteryLevel: 82 },
  { id: 'v-a05', plate: '34 GLC 005', brand: 'Mercedes', model: 'GLC', owner: 'Caner D.', tier: 'Standard Member', floorId: 'floor-b2', blockId: 'block-a', spotId: 'A05', locationLabel: 'Zone A-05, Level -2' },
  { id: 'v-a08', plate: '34 AUD 808', brand: 'Audi', model: 'A6', owner: 'Mina K.', tier: 'Premium Member', floorId: 'floor-b2', blockId: 'block-a', spotId: 'A08', locationLabel: 'Zone A-08, Level -2' },
  { id: 'v-a11', plate: '34 M4 011', brand: 'BMW', model: 'M4 Competition', owner: 'Julian Sterling', tier: 'Elite Tier Member', floorId: 'floor-b2', blockId: 'block-a', spotId: 'A11', locationLabel: 'Zone A-11, Level -2' },
]

export const mockSpots: ParkingSpot[] = Array.from({ length: 12 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0')
  const id = `A${number}`
  const vehicle = mockVehicles.find((item) => item.spotId === id)
  return {
    id,
    floorId: 'floor-b2' as const,
    blockId: 'block-a',
    status: vehicle ? 'occupied' as const : 'available' as const,
    vehicleId: vehicle?.id,
  }
})

export const mockSignage: DigitalSignage[] = [
  { id: 'DS-401', floorId: 'floor-0', blockId: 'block-a', location: 'Entrance East A', status: 'online', contentTitle: 'WELCOME', template: 'Standard Welcome (v4.2)', brightness: 85, temperatureC: 32.4, lastSync: '2m ago', x: 244, y: 134, orientation: 'vertical' },
  { id: 'DS-405', floorId: 'floor-0', blockId: 'block-a', location: 'Kiosk Main', status: 'online', contentTitle: 'STARBUCKS CAMPAIGN', template: 'Partner Campaign (v1.8)', brightness: 78, temperatureC: 31.8, lastSync: '15s ago', x: 484, y: 294, orientation: 'horizontal' },
  { id: 'DS-410', floorId: 'floor-0', blockId: 'block-c', location: 'Elevator Bank', status: 'offline', contentTitle: 'OFFLINE', template: 'Diagnostics', brightness: 0, temperatureC: 29.1, lastSync: '4h ago', x: 744, y: 134, orientation: 'vertical' },
  { id: 'DS-501', floorId: 'floor-b1', blockId: 'block-a', location: 'Ramp Down', status: 'online', contentTitle: 'ATASUN CAMPAIGN', template: 'Partner Campaign (v2.0)', brightness: 80, temperatureC: 33.0, lastSync: '4m ago', x: 244, y: 434, orientation: 'vertical' },
  { id: 'DS-502', floorId: 'floor-b1', blockId: 'block-b', location: 'Central Pillar', status: 'online', contentTitle: 'ADIDAS OFFER', template: 'Retail Offer (v3.1)', brightness: 88, temperatureC: 32.7, lastSync: 'Just now', x: 744, y: 434, orientation: 'vertical' },
  { id: 'DS-402', floorId: 'floor-b2', blockId: 'block-a', location: 'Block A Entry', status: 'online', contentTitle: 'WELCOME TO EMAAR SQUARE AVM', template: 'Standard Welcome (v4.2)', brightness: 85, temperatureC: 32.4, lastSync: '14:20:05', x: 244, y: 134, orientation: 'vertical' },
  { id: 'DS-604', floorId: 'floor-b2', blockId: 'block-f', location: 'Exit Portal B', status: 'online', contentTitle: 'VALET SERVICE', template: 'Valet Direction (v1.5)', brightness: 72, temperatureC: 30.2, lastSync: '1h ago', x: 484, y: 294, orientation: 'horizontal' },
]

export const mockMessageTemplates: MessageTemplate[] = [
  {
    id: 'welcome',
    type: 'Welcome',
    title: 'Visitor Greeting',
    body: 'Welcome Julian! Hope you have a great shopping experience today.',
    trigger: 'Default: Auto-Trigger',
    sentAt: '10:45 AM',
    icon: 'welcome',
  },
  {
    id: 'weekend',
    type: 'Promotion',
    title: 'Weekend Special',
    body: 'Weekend Special: 20% discount at the food court for parking users!',
    trigger: '5 mins after entry',
    sentAt: '11:02 AM',
    icon: 'campaign',
  },
  {
    id: 'starbucks',
    type: 'Exclusive',
    title: 'Starbucks Reward',
    body: 'Exclusive for you: Get a free coffee at Starbucks with your parking ticket.',
    trigger: 'Partner: Starbucks',
    sentAt: '11:15 AM',
    icon: 'loyalty',
  },
]

export const mockRecommendations: StoreRecommendation[] = [
  { id: 'starbucks', storeName: 'Starbucks', floorLabel: 'Kat -2', blockLabel: 'Blok A', spotLabel: 'Nokta 11', closest: true, icon: 'coffee' },
  { id: 'adidas', storeName: 'Adidas', floorLabel: 'Kat 1', blockLabel: 'Blok A', spotLabel: 'Nokta 10', icon: 'apparel' },
  { id: 'atasun', storeName: 'Atasun Optik', floorLabel: 'Kat 0', blockLabel: 'Blok A', spotLabel: 'Nokta 11', icon: 'visibility' },
]
