import type { FloorId } from '../../domain/types'
import type { OtoparkRepository } from '../repositories/otoparkRepository'
import { mockBlocks, mockFloors, mockMessageTemplates, mockRecommendations, mockSignage, mockSpots, mockVehicles } from './mockData'

export const mockOtoparkRepository: OtoparkRepository = {
  async listFloors() {
    return mockFloors
  },

  async getFloor(floorId: FloorId) {
    return mockFloors.find((floor) => floor.id === floorId)
  },

  async listBlocks(floorId?: FloorId) {
    return floorId ? mockBlocks.filter((block) => block.floorId === floorId) : mockBlocks
  },

  async getBlock(floorId: FloorId, blockId: string) {
    return mockBlocks.find((block) => block.floorId === floorId && block.id === blockId)
  },

  async listSpots(floorId: FloorId, blockId: string) {
    return mockSpots.filter((spot) => spot.floorId === floorId && spot.blockId === blockId)
  },

  async listVehicles(floorId?: FloorId, blockId?: string) {
    return mockVehicles.filter((vehicle) => {
      if (floorId && vehicle.floorId !== floorId) return false
      if (blockId && vehicle.blockId !== blockId) return false
      return true
    })
  },

  async getVehicle(vehicleId: string) {
    return mockVehicles.find((vehicle) => vehicle.id === vehicleId)
  },

  async listSignage(floorId?: FloorId, blockId?: string) {
    return mockSignage.filter((signage) => {
      if (floorId && signage.floorId !== floorId) return false
      if (blockId && signage.blockId !== blockId) return false
      return true
    })
  },

  async getSignage(signageId: string) {
    return mockSignage.find((signage) => signage.id === signageId)
  },

  async listMessageTemplates() {
    return mockMessageTemplates
  },

  async listRecommendations() {
    return mockRecommendations
  },
}
