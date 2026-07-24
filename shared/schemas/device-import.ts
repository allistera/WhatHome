export interface DeviceImportColumn {
  key: DeviceImportColumnKey
  label: string
  required: boolean
  description: string
  example: string
}

export const deviceImportColumns: DeviceImportColumn[] = [
  { key: 'name', label: 'Name', required: true, description: 'Device name.', example: 'Living Room Sensor' },
  { key: 'type', label: 'Type', required: true, description: 'Device type or category.', example: 'Sensor' },
  {
    key: 'protocol',
    label: 'Protocol',
    required: true,
    description: 'Communication protocol.',
    example: 'Zigbee'
  },
  {
    key: 'manufacturer',
    label: 'Manufacturer',
    required: false,
    description: 'Optional.',
    example: 'Acme'
  },
  { key: 'model', label: 'Model', required: false, description: 'Optional.', example: 'X100' },
  {
    key: 'serialNumber',
    label: 'Serial Number',
    required: false,
    description: 'Optional.',
    example: 'SN-12345'
  },
  {
    key: 'ipAddress',
    label: 'IP Address',
    required: false,
    description: 'Optional. Must be a valid IPv4 or IPv6 address.',
    example: '192.168.1.10'
  },
  {
    key: 'purchaseDate',
    label: 'Purchase Date',
    required: false,
    description: 'Optional. Format YYYY-MM-DD.',
    example: '2024-01-15'
  },
  {
    key: 'floor',
    label: 'Floor',
    required: false,
    description: 'Optional. Provide together with Room to place the device in a room. Must match an existing floor name in this home.',
    example: 'Ground Floor'
  },
  {
    key: 'room',
    label: 'Room',
    required: false,
    description: 'Optional. Provide together with Floor to place the device in a room. Must match an existing room name on that floor.',
    example: 'Kitchen'
  },
  {
    key: 'inStorage',
    label: 'In Storage',
    required: false,
    description: 'Optional. Enter "yes" if the device is in storage. Leave Floor and Room blank when this is set.',
    example: 'no'
  },
  { key: 'notes', label: 'Notes', required: false, description: 'Optional.', example: '' }
]

export const deviceImportColumnKeys = [
  'name',
  'type',
  'protocol',
  'manufacturer',
  'model',
  'serialNumber',
  'ipAddress',
  'purchaseDate',
  'floor',
  'room',
  'inStorage',
  'notes'
] as const

export type DeviceImportColumnKey = (typeof deviceImportColumnKeys)[number]

export type RawDeviceImportRow = Partial<Record<DeviceImportColumnKey, string>>

const columnAliases: Record<DeviceImportColumnKey, string[]> = {
  name: ['name', 'devicename'],
  type: ['type', 'devicetype', 'category'],
  protocol: ['protocol'],
  manufacturer: ['manufacturer', 'brand', 'maker'],
  model: ['model'],
  serialNumber: ['serialnumber', 'serial', 'sn'],
  ipAddress: ['ipaddress', 'ip'],
  purchaseDate: ['purchasedate', 'dateofpurchase', 'datepurchased', 'purchased'],
  floor: ['floor', 'floorname'],
  room: ['room', 'roomname'],
  inStorage: ['instorage', 'storage', 'stored'],
  notes: ['notes', 'note', 'comments', 'comment']
}

function normalizeHeaderText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Matches a raw CSV header cell to a canonical column key, tolerant of casing/spacing/punctuation. */
export function matchDeviceImportColumn(header: string): DeviceImportColumnKey | null {
  const normalized = normalizeHeaderText(header)
  for (const key of deviceImportColumnKeys) {
    if (columnAliases[key].includes(normalized)) {
      return key
    }
  }
  return null
}

export function isTruthyImportFlag(value: string | undefined): boolean {
  if (!value) return false
  return ['true', 'yes', 'y', '1'].includes(value.trim().toLowerCase())
}

export function buildDeviceImportTemplateCsv(): string {
  const header = deviceImportColumns.map((column) => column.label).join(',')
  const example = deviceImportColumns
    .map((column) => (column.example.includes(',') ? `"${column.example}"` : column.example))
    .join(',')
  return `${header}\n${example}\n`
}
