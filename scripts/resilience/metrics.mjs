export function percentile(values, fraction) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]
}

export class Metrics {
  constructor() {
    this.startedAt = Date.now()
    this.samples = []
  }

  /** @param {string} name @param {number} durationMs @param {string | number} status @param {boolean} ok @param {string | null} [error] */
  add(name, durationMs, status, ok, error = null) {
    this.samples.push({ name, durationMs, status, ok, error })
  }

  summary() {
    const durations = this.samples.map((sample) => sample.durationMs)
    const elapsedSeconds = Math.max((Date.now() - this.startedAt) / 1000, 0.001)
    const succeeded = this.samples.filter((sample) => sample.ok).length
    const statuses = {}
    for (const sample of this.samples) statuses[sample.status] = (statuses[sample.status] ?? 0) + 1
    return {
      requests: this.samples.length,
      succeeded,
      failed: this.samples.length - succeeded,
      successRate: this.samples.length ? succeeded / this.samples.length : 0,
      throughputRps: this.samples.length / elapsedSeconds,
      latencyMs: {
        p50: percentile(durations, 0.5),
        p95: percentile(durations, 0.95),
        p99: percentile(durations, 0.99),
        max: durations.length ? Math.max(...durations) : 0,
      },
      statuses,
    }
  }
}

export async function measured(metrics, name, operation) {
  const started = performance.now()
  try {
    const result = await operation()
    const status = result?.status ?? (result?.error ? "DB_ERROR" : 200)
    const ok = result?.ok ?? !result?.error
    metrics.add(name, Math.round(performance.now() - started), status, ok, ok ? null : result?.error?.message)
    return result
  } catch (error) {
    metrics.add(name, Math.round(performance.now() - started), "EXCEPTION", false, error instanceof Error ? error.message : "Erro desconhecido")
    throw error
  }
}
