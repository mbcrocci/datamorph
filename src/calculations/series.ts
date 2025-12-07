import type {
  DataElement,
  GroupedInputData,
  InputData,
  SeriesInputData,
} from '../input'
import type { OutputData, SeriesOutput } from '../output'

export type SeriesOperation = 'sum'
type Operation = SeriesOperation

export function calculateSeries(
  operation: Operation,
  data: InputData,
): OutputData {
  switch (data.type) {
    case 'series':
      return calculateSeriesSeries(operation, data)
    case 'grouped':
      return calculateSeriesGrouped(operation, data)
    default:
      return {
        type: 'single',
        value: 0,
      }
  }
}

export function calculateSeriesSeries(
  operation: Operation,
  data: SeriesInputData,
): OutputData {
  return calculateSeriesElement(operation, data.data)
}

export function calculateSeriesGrouped(
  operation: Operation,
  data: GroupedInputData,
): OutputData {
  return {
    type: 'multi-series',
    series: data.data.map(d => ({
      key: d.key,
      values: calculateSeriesElement(operation, d.data),
    })),
  }
}

export function calculateSeriesElement(
  operation: Operation,
  data: DataElement[],
): SeriesOutput {
  switch (operation) {
    case 'sum':
      return calculateSeriesElementSum(data)
    default:
      return calculateSeriesElementNone(data)
  }
}

function calculateSeriesElementNone(data: DataElement[]): SeriesOutput {
  const values = data.map(d => d.value)

  const metadata = []
  for (const d of data) {
    if (d.metadata)
      metadata.push(d.metadata)
  }

  return {
    type: 'series',
    values,
    metadata,
  }
}

function calculateSeriesElementSum(data: DataElement[]): SeriesOutput {
  const values = []
  const metadata = []
  let prev = 0

  for (const d of data) {
    prev += d.value
    values.push(prev)
    if (d.metadata)
      metadata.push(d.metadata)
  }

  return {
    type: 'series',
    values,
    metadata,
  }
}
