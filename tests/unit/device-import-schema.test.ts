import { describe, expect, it } from 'vitest'
import {
  buildDeviceImportTemplateCsv,
  deviceImportColumns,
  isTruthyImportFlag,
  matchDeviceImportColumn
} from '../../shared/schemas/device-import'

describe('matchDeviceImportColumn', () => {
  it('matches an exact canonical header', () => {
    expect(matchDeviceImportColumn('Name')).toBe('name')
  })

  it('matches case-insensitively and ignoring whitespace', () => {
    expect(matchDeviceImportColumn('serial number')).toBe('serialNumber')
    expect(matchDeviceImportColumn('SERIAL NUMBER')).toBe('serialNumber')
    expect(matchDeviceImportColumn('  Serial   Number  ')).toBe('serialNumber')
  })

  it('matches known aliases', () => {
    expect(matchDeviceImportColumn('Brand')).toBe('manufacturer')
    expect(matchDeviceImportColumn('IP')).toBe('ipAddress')
    expect(matchDeviceImportColumn('Storage')).toBe('inStorage')
  })

  it('matches ignoring punctuation', () => {
    expect(matchDeviceImportColumn('Serial-Number')).toBe('serialNumber')
    expect(matchDeviceImportColumn('serial_number')).toBe('serialNumber')
  })

  it('returns null for an unrecognized header', () => {
    expect(matchDeviceImportColumn('Favorite Color')).toBeNull()
  })
})

describe('isTruthyImportFlag', () => {
  it.each(['true', 'True', 'yes', 'YES', 'y', '1'])('treats %s as true', (value) => {
    expect(isTruthyImportFlag(value)).toBe(true)
  })

  it.each(['false', 'no', 'n', '0', '', undefined])('treats %s as false', (value) => {
    expect(isTruthyImportFlag(value)).toBe(false)
  })
})

describe('deviceImportColumns', () => {
  it('marks exactly name, type, and protocol as required', () => {
    const required = deviceImportColumns
      .filter((column) => column.required)
      .map((column) => column.key)
    expect(required.sort()).toEqual(['name', 'protocol', 'type'])
  })
})

describe('buildDeviceImportTemplateCsv', () => {
  it('produces a header row with every column label', () => {
    const csv = buildDeviceImportTemplateCsv()
    const [headerLine] = csv.trim().split('\n')
    for (const column of deviceImportColumns) {
      expect(headerLine).toContain(column.label)
    }
  })

  it('produces exactly one example data row', () => {
    const csv = buildDeviceImportTemplateCsv()
    const lines = csv.trim().split('\n')
    expect(lines).toHaveLength(2)
  })
})
