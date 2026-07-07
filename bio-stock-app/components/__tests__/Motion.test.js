import { accentForZone } from "../Motion";
import { colors } from "../../utils/theme";

describe("accentForZone", () => {
  it("maps known zones case-insensitively", () => {
    expect(accentForZone("green")).toBe(colors.green);
    expect(accentForZone("Yellow")).toBe(colors.yellow);
    expect(accentForZone("RED")).toBe(colors.red);
  });

  it("defaults to cyan for an unknown or missing zone", () => {
    expect(accentForZone("unknown")).toBe(colors.cyan);
    expect(accentForZone(undefined)).toBe(colors.cyan);
  });
});
