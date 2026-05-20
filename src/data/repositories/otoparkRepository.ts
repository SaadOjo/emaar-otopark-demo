import type { DigitalSignage, Floor, FloorId, MessageTemplate, ParkingBlock, ParkingSpot, StoreRecommendation, Vehicle } from '../../domain/types'

export interface OtoparkRepository {
  listFloors(): Promise<Floor[]>
  getFloor(floorId: FloorId): Promise<Floor | undefined>
  listBlocks(floorId?: FloorId): Promise<ParkingBlock[]>
  getBlock(floorId: FloorId, blockId: string): Promise<ParkingBlock | undefined>
  listSpots(floorId: FloorId, blockId: string): Promise<ParkingSpot[]>
  listVehicles(floorId?: FloorId, blockId?: string): Promise<Vehicle[]>
  getVehicle(vehicleId: string): Promise<Vehicle | undefined>
  listSignage(floorId?: FloorId, blockId?: string): Promise<DigitalSignage[]>
  getSignage(signageId: string): Promise<DigitalSignage | undefined>
  listMessageTemplates(vehicleId?: string): Promise<MessageTemplate[]>
  listRecommendations(): Promise<StoreRecommendation[]>
}
