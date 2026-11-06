import type { Theme } from "@/styles/theme";

/** Shared look for short action labels, matching Better Paseo's command-copy hint. */
export function tooltipHintStyles(theme: Theme) {
  return {
    tooltipBubble: {
      backgroundColor: theme.colors.surface0,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 4,
      boxShadow: `0px 2px 8px rgba(0, 0, 0, ${theme.colorScheme === "dark" ? 0.36 : 0.12})`,
    },
    tooltipLabel: {
      color: theme.colors.foreground,
      fontFamily: theme.fontFamily.ui,
      fontSize: 12,
      lineHeight: 18,
      userSelect: "none" as const,
    },
  };
}
