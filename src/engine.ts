import { calculateSingle } from './calculations/single'
import { calculateSeries } from './calculations/series'
import type { Calculation } from './config'

import { calculateNode } from './calculations/tree'
import type { InputAdapter, OutputAdapter, StorageAdapter } from './adapters'
import type { OutputData, SingleOutput } from './output'

function hashInput<I>(input: I): string {
  const json = JSON.stringify(input) // TODO: use a faster library
  return btoa(json)
}

// Fetch data based on input
async function fetchData<I>(input: I, source: InputAdapter<I>) {
  const data = await source.fetch(input)
  if (!data)
    return

  return data
}

export function outputKey(key: string) {
  return `output-${key}`
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchFromStorage(storage: StorageAdapter, key: string) {
  const okey = outputKey(key)
  let data = storage.get(okey)

  let retries = 0
  let interval = 500
  while (!data && retries < 10) {
    await sleep(interval)

    data = storage.get(okey)

    interval = interval - (interval * 0.2)
    retries++
  }

  return data as OutputData
}

export async function calcByType<I>(
  calculation: Calculation<I>,
  source: InputAdapter<I>,
  storage: StorageAdapter,
): Promise<OutputData | undefined> {
  if (calculation.type === 'static')
    return { type: 'single', value: calculation.value } satisfies SingleOutput

  if (calculation.type === 'reference')
    return fetchFromStorage(storage!, calculation.reference)

  if (calculation.type === 'tree') {
    const left = await calcByType(calculation.left, source, storage)
    if (!left)
      return undefined

    const right = await calcByType(calculation.right, source, storage)
    if (!right)
      return undefined

    if (left.type !== 'single' || right.type !== 'single')
      return undefined

    return calculateNode({ type: 'tree', left: left.value, right: right.value, operation: calculation.operation })
  }

  const data = await fetchData(calculation.input, source)

  // Store fetched data
  const inputHash = hashInput(calculation.input)
  const inputKey = `${calculation.key}-${inputHash}`
  storage!.set(inputKey, data!)

  if (calculation.type === 'single')
    return calculateSingle(calculation.operation, data!)

  if (calculation.type === 'series')
    return calculateSeries(calculation.operation, data!)
}

export function createDataEngine<TInput>({ source, output, storage }: {
  source: InputAdapter<TInput>
  storage: StorageAdapter
  output: OutputAdapter
}) {
  return {
    calculate: async (calculation: Calculation<TInput>) => {
      const result = await calcByType(calculation, source, storage!)
      if (!result)
        throw new Error('can\'t generate result')

      // Store result of calculating
      storage!.set(outputKey(calculation.key), result)

      return output.format(result)
    },
  }
}
