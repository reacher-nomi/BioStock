// Bio-Stock design tokens — derived from the pitch deck brand language.
export const colors = {
  // Deep navy / near-black backgrounds
  bg: "#06090F",
  bgElevated: "#0B111C",
  surface: "rgba(255,255,255,0.04)",
  surfaceStrong: "rgba(255,255,255,0.07)",
  stroke: "rgba(255,255,255,0.10)",
  strokeStrong: "rgba(255,255,255,0.18)",

  // Accents
  cyan: "#22D3EE",
  cyanDim: "#0E7490",
  teal: "#2DD4BF",
  lime: "#C6F24E",
  blue: "#3B82F6",

  // Zones
  green: "#34E0A1",
  yellow: "#F5D547",
  red: "#FF5C7A",

  // Text
  text: "#F4F8FF",
  textMuted: "#8A97AD",
  textFaint: "#5C677D",

  white: "#FFFFFF",
};

export const zoneColor = (zone) => {
  switch ((zone || "").toLowerCase()) {
    case "green": return colors.green;
    case "yellow": return colors.yellow;
    case "red": return colors.red;
    default: return colors.textFaint;
  }
};

export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };
export const space = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };
export const font = {
  h1: 34, h2: 26, h3: 20, body: 15, small: 13, tiny: 11,
};
