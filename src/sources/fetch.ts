import type { SourceAdapter } from '..'
import type { Input } from '../config'
import type { InputData } from '../input'

/**
 * Creates a SourceAdapter fetches data from `url`.
 * It does this by seding a POST request with the Input as a application/json body.
 *
 * You can also pass a `transformer` if the response data is not in `InputData` format.
 */
export function fetchAdapter(
  url: string,
  headers?: RequestInit['headers'],
  transformer?: (d: unknown) => InputData,
): SourceAdapter {
  return {
    fetch: async (input: Input) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(input),
      })
      const data = await res.json()

      if (transformer)
        return transformer(data)

      return data as InputData
    },
  }
}
