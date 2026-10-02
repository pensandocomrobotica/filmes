import { describe, expect, it } from "vitest";
import { formatarDuracao, formatarNota } from "./formatar";

describe("formatarNota", () => {
  it("usa vírgula e uma casa decimal", () => {
    expect(formatarNota(7.8)).toBe("7,8");
    expect(formatarNota(8)).toBe("8,0");
  });

  it("sem nota mostra um travessão", () => {
    expect(formatarNota(null)).toBe("—");
  });
});

describe("formatarDuracao", () => {
  it("horas e minutos", () => {
    expect(formatarDuracao(130)).toBe("2h 10min");
  });

  it("só minutos", () => {
    expect(formatarDuracao(45)).toBe("45min");
  });

  it("horas exatas", () => {
    expect(formatarDuracao(120)).toBe("2h");
  });

  it("sem duração", () => {
    expect(formatarDuracao(null)).toBe("");
  });
});
