import { colors, zoneColor } from "../theme";

describe("zoneColor", () => {
  it("maps each known zone to its color, case-insensitively", () => {
    expect(zoneColor("green")).toBe(colors.green);
    expect(zoneColor("GREEN")).toBe(colors.green);
    expect(zoneColor("yellow")).toBe(colors.yellow);
    expect(zoneColor("red")).toBe(colors.red);
  });

  it("falls back to a neutral color for unknown or missing zones", () => {
    expect(zoneColor("purple")).toBe(colors.textFaint);
    expect(zoneColor(undefined)).toBe(colors.textFaint);
    expect(zoneColor(null)).toBe(colors.textFaint);
    expect(zoneColor("")).toBe(colors.textFaint);
  });
});
