import { describe, it, expect } from "vitest";
import { evaluarCaso, nivelDeScore, PRESETS } from "@/lib/fraud-rules";

describe("motor de reglas de fraude", () => {
  it("caso limpio no debe activar reglas críticas", () => {
    const reglas = evaluarCaso(PRESETS.limpio.caso);
    const score = reglas.filter((r) => r.activada).reduce((s, r) => s + r.puntos, 0);
    expect(nivelDeScore(score)).toBe("verde");
  });

  it("reporte tardío activa R01", () => {
    const reglas = evaluarCaso(PRESETS.tardio.caso);
    expect(reglas.find((r) => r.id === "R01")?.activada).toBe(true);
  });

  it("proveedor restrictivo activa R06 con 10 puntos", () => {
    const reglas = evaluarCaso(PRESETS.proveedor.caso);
    const r06 = reglas.find((r) => r.id === "R06");
    expect(r06?.activada).toBe(true);
    expect(r06?.puntos).toBe(10);
  });
});
