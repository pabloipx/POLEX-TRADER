import { describe, expect, it } from "vitest"
import { Metrics, percentile } from "./metrics.mjs"

describe("resilience metrics", () => {
  it("calcula percentis sem alterar a entrada", () => {
    const values = [40, 10, 30, 20]
    expect(percentile(values, 0.5)).toBe(20)
    expect(percentile(values, 0.95)).toBe(40)
    expect(values).toEqual([40, 10, 30, 20])
  })

  it("resume sucesso, falhas e códigos", () => {
    const metrics = new Metrics()
    metrics.add("read", 10, 200, true)
    metrics.add("write", 30, 503, false, "indisponível")
    const summary = metrics.summary()
    expect(summary.requests).toBe(2)
    expect(summary.successRate).toBe(0.5)
    expect(summary.statuses).toEqual({ 200: 1, 503: 1 })
  })
})
