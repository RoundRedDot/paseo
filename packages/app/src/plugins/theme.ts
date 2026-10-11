import type { PluginTheme } from "@getpaseo/plugin";
import type { Theme } from "@/styles/theme";

export function toPluginTheme(theme: Theme): PluginTheme {
  return {
    colors: {
      surface0: theme.colors.surface0,
      surface1: theme.colors.surface1,
      surface2: theme.colors.surface2,
      border: theme.colors.border,
      foreground: theme.colors.foreground,
      foregroundMuted: theme.colors.foregroundMuted,
      accent: theme.colors.accent,
      accentForeground: theme.colors.accentForeground,
      statusSuccess: theme.colors.statusSuccess,
      statusWarning: theme.colors.statusWarning,
      statusDanger: theme.colors.statusDanger,
    },
    typography: {
      fontFamily: { ui: theme.fontFamily.ui, mono: theme.fontFamily.mono },
      fontSize: {
        ui: theme.fontSize.base,
        content: theme.fontSize.content,
        code: theme.fontSize.code,
      },
      lineHeight: { code: theme.lineHeight.diff },
    },
  };
}
