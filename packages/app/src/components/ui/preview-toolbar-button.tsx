import { memo, useCallback, type ComponentType } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useIsCompactFormFactor } from "@/constants/layout";
import { iconButtonChromeGlyphSize, iconButtonChromeStyle } from "./icon-button-chrome";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { tooltipHintStyles } from "./tooltip-hint";

interface PreviewToolbarButtonProps {
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  visible?: boolean;
  testID?: string;
}

export const PreviewToolbarButton = memo(function PreviewToolbarButton({
  icon: Icon,
  label,
  onPress,
  disabled = false,
  visible = true,
  testID,
}: PreviewToolbarButtonProps) {
  const isCompact = useIsCompactFormFactor();
  const iconSize = iconButtonChromeGlyphSize("small", isCompact);
  const buttonStyle = useCallback(
    ({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) =>
      iconButtonChromeStyle({
        size: "small",
        compact: isCompact,
        state: { hovered, pressed },
        disabled,
        style: visible ? styles.button : styles.buttonHidden,
      }),
    [disabled, isCompact, visible],
  );

  return (
    <Tooltip delayDuration={300} enabledOnDesktop={visible}>
      <TooltipTrigger asChild>
        <Pressable
          accessibilityLabel={label}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={isCompact ? 6 : 4}
          onPress={onPress}
          style={buttonStyle}
          testID={testID}
        >
          {({ hovered }) => (
            <Icon size={iconSize} color={hovered ? styles.iconHovered.color : styles.icon.color} />
          )}
        </Pressable>
      </TooltipTrigger>
      <TooltipContent side="top" align="center" offset={8} style={styles.tooltipBubble}>
        <Text style={styles.tooltipLabel}>{label}</Text>
      </TooltipContent>
    </Tooltip>
  );
});

const styles = StyleSheet.create((theme) => ({
  button: {
    backgroundColor: theme.colors.surface2,
    opacity: 1,
    pointerEvents: "auto",
  },
  buttonHidden: {
    backgroundColor: theme.colors.surface2,
    opacity: 0,
    pointerEvents: "none",
  },
  icon: { color: theme.colors.foregroundMuted },
  iconHovered: { color: theme.colors.foreground },
  ...tooltipHintStyles(theme),
}));
