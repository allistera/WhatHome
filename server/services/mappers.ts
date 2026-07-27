import type { Device, Floor, Home, Room } from '../db/schema'
import type {
  DeviceDto,
  DeviceLocationState,
  FloorDto,
  HomeDto,
  RoomDto
} from '../../shared/types/domain'

export function toHomeDto(home: Home): HomeDto {
  return {
    id: home.id,
    name: home.name,
    createdAt: home.createdAt.toISOString(),
    updatedAt: home.updatedAt.toISOString(),
    version: home.version
  }
}

export function toFloorDto(floor: Floor): FloorDto {
  return {
    id: floor.id,
    homeId: floor.homeId,
    name: floor.name,
    position: floor.position,
    createdAt: floor.createdAt.toISOString(),
    updatedAt: floor.updatedAt.toISOString(),
    version: floor.version
  }
}

export function toRoomDto(room: Room): RoomDto {
  return {
    id: room.id,
    floorId: room.floorId,
    homeId: room.homeId,
    name: room.name,
    position: room.position,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    version: room.version
  }
}

export function deviceLocationState(
  device: Pick<Device, 'roomId' | 'inStorage'>
): DeviceLocationState {
  if (device.roomId) return 'in_room'
  if (device.inStorage) return 'in_storage'
  return 'unassigned'
}

export function toDeviceDto(device: Device): DeviceDto {
  return {
    id: device.id,
    homeId: device.homeId,
    roomId: device.roomId,
    inStorage: device.inStorage,
    locationState: deviceLocationState(device),
    name: device.name,
    type: device.type,
    protocol: device.protocol,
    manufacturer: device.manufacturer,
    model: device.model,
    serialNumber: device.serialNumber,
    ipAddress: device.ipAddress,
    notes: device.notes,
    purchaseDate: device.purchaseDate,
    createdAt: device.createdAt.toISOString(),
    updatedAt: device.updatedAt.toISOString(),
    version: device.version
  }
}
