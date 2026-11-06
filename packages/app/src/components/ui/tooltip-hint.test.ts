import { describe, expect, it } from "vitest";
import { darkTheme, lightTheme } from "@/styles/theme";
import { tooltipHintStyles } from "./tooltip-hint";

describe("short action tooltip design contract", () => {
  it.each([
    ["light", lightTheme, 0.12],
    ["dark", darkTheme, 0.36],
  ] as const)("matches the command-copy hint on %s surfaces", (_name, theme, opacity) => {
    const styles = tooltipHintStyles(theme);
    expect(styles.tooltipBubble).toEqual({
      backgroundColor: theme.colors.surface0,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 4,
      boxShadow: `0px 2px 8px rgba(0, 0, 0, ${opacity})`,
    });
    expect(styles.tooltipLabel).toMatchObject({
      color: theme.colors.foreground,
      fontFamily: theme.fontFamily.ui,
      fontSize: 12,
      lineHeight: 18,
      userSelect: "none",
    });
  });
});
