const INK = "#334155"      // slate-700
const HAIRLINE = "#cbd5e1" // slate-300

export const COLORS = {
  cardBackground: "#f8fafc",

  scale: {
    1: "#d94343",
    2: "#f09090",
    3: "#97b68a",
    4: "#83b6cf",
    5: "#2b5f6d",
  } as Record<number, string>,

  metric: {
    low:  "#f09090", // = scale[2]
    mid:  "#e0a940",
    high: "#83b6cf", // = scale[4]
  },

  ink:      INK,
  inkMuted: "#64748b",
  inkFaint: "#94a3b8",
  hairline: HAIRLINE,
  track:    "#e2e8f0",

  button: { background: INK, text: "#ffffff" },

  option: {
    default:  { background: "#ffffff", border: HAIRLINE, text: INK },
    selected: { background: INK,       border: INK,      text: "#ffffff" },
  },
}

export const FONT = "'Inter', sans-serif"

export const DISPLAY = { weight: 800 as const, letterSpacing: "-0.02em" }

export const CARD_RADIUS = 20  // FitDetailsScreen only — do not use elsewhere

export const RADIUS = { card: 8, control: 6 }

export const PAGE = { sidePadding: 16, maxWidth: 430 }
