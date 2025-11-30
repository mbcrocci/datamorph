import { describe, expect, it } from 'vitest'
import { calculateSeriesElement, calculateSeriesGrouped, calculateSeriesSeries } from '../../src/calculations/series'
import type { DataElement, InputData } from '../../src/input'
import type { MultiSeriesOutput, OutputData, SeriesOutput } from '../../src/output'

describe('series element operations', () => {
  it('sum series', () => {
    const data = [
      { elements: [], expected: { type: 'series', values: [], metadata: [] } as SeriesOutput },
      { elements: [1, 2], expected: { type: 'series', values: [1, 3], metadata: [] } as SeriesOutput },
      { elements: [1, 2, 3], expected: { type: 'series', values: [1, 3, 6], metadata: [] } as SeriesOutput },
    ]

    for (const { elements, expected } of data)
      expect(calculateSeriesElement('sum', elements.map(e => ({ value: e } as DataElement)))).toStrictEqual(expected)
  })

  it('sum series (negative numbers)', () => {
    const data = [
      { elements: [], expected: { type: 'series', values: [], metadata: [] } as SeriesOutput },
      { elements: [1, -2], expected: { type: 'series', values: [1, -1], metadata: [] } as SeriesOutput },
      { elements: [1, 2, -3, 1], expected: { type: 'series', values: [1, 3, 0, 1], metadata: [] } as SeriesOutput },
    ]

    for (const { elements, expected } of data)
      expect(calculateSeriesElement('sum', elements.map(e => ({ value: e } as DataElement)))).toStrictEqual(expected)
  })
})

describe('series element metadata', () => {
  it('sum series', () => {
    expect(calculateSeriesElement('sum', [{ value: 1, metadata: { timestamp: 1111 } }] as DataElement[])).toStrictEqual({ type: 'series', values: [1], metadata: [{ timestamp: 1111 }] })
  })
})

describe('series input operations', () => {
  it('calculates from series', () => {
    const input: InputData = {
      type: 'series',
      data: [
        { value: 1 } as DataElement,
        { value: 2 } as DataElement,
        { value: 3 } as DataElement,
      ],
    }

    const result: OutputData = calculateSeriesSeries('sum', input)

    expect(result).toStrictEqual({ metadata: [], type: 'series', values: [1, 3, 6] } as SeriesOutput)
  })

  it('series calculates from grouped Data', () => {
    const input: InputData = {
      type: 'grouped',
      data: [
        {
          key: '1',
          data: [
            { value: 1 } as DataElement,
            { value: 2 } as DataElement,
          ],
        },
        {
          key: '2',
          data: [
            { value: 1 } as DataElement,
            { value: 2 } as DataElement,
            { value: 3 } as DataElement,
          ],
        },
      ],
    }

    const result = calculateSeriesGrouped('sum', input)

    expect(result).toStrictEqual({
      type: 'multi-series',
      series: [
        {
          key: '1',
          values: {
            metadata: [],
            type: 'series',
            values: [1, 3],
          } as SeriesOutput,
        },
        {
          key: '2',
          values: {
            metadata: [],
            type: 'series',
            values: [1, 3, 6],
          } as SeriesOutput,
        },
      ],
    } as MultiSeriesOutput)
  })
})
