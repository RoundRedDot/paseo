import { memo, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Pressable, StyleSheet as RNStyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useIsCompactFormFactor } from "@/constants/layout";
import { isNative } from "@/constants/platform";
import type { ChatOutlinePrompt, StickyPromptSource } from "./model";

const STICKY_PROMPT_BAR_HEIGHT = 36;
const COMPACT_STICKY_PROMPT_BAR_HEIGHT = 32;
const FADE_DURATION_MS = 120;
const EXPANDED_LINES = 3;

function resolveStickyPromptBarHeight(isCompact: boolean): number {
  return isCompact ? COMPACT_STICKY_PROMPT_BAR_HEIGHT : STICKY_PROMPT_BAR_HEIGHT;
}

export interface StickyPromptClearance {
  visibility: Animated.Value;
  /** The collapsed bar's height while shown, animated with its fade. */
  inset: Animated.AnimatedInterpolation<number>;
}

export function useStickyPromptClearance(): StickyPromptClearance {
  const isCompact = useIsCompactFormFactor();
  const [visibility] = useState(() => new Animated.Value(0));
  const inset = useMemo(
    () =>
      visibility.interpolate({
        inputRange: [0, 1],
        outputRange: [0, resolveStickyPromptBarHeight(isCompact)],
      }),
    [isCompact, visibility],
  );
  return { visibility, inset };
}

export interface StickyPromptBarProps {
  source: StickyPromptSource;
  /** 0 hidden, 1 shown. The owner derives the bar's animated clearance from it. */
  visibility: Animated.Value;
  onJumpToPrompt: (seq: number) => void;
  /** Visual-top clearance of an overlay already floating over the transcript. */
  topInset: number;
}

/**
 * The prompt whose turn the reader is in, pinned over the top of the transcript once that
 * prompt has scrolled away. It overlays the list instead of taking layout space, so showing
 * and hiding it never moves the rows under the reader.
 */
export const StickyPromptBar = memo(function StickyPromptBar({
  source,
  visibility,
  onJumpToPrompt,
  topInset,
}: StickyPromptBarProps) {
  const { t } = useTranslation();
  const isCompact = useIsCompactFormFactor();
  const prefersReducedMotion = useReducedMotion();
  const prompt = useSyncExternalStore(source.subscribe, source.getPrompt);
  // The bar keeps the last prompt while it fades out, rather than blanking first.
  const [shownPrompt, setShownPrompt] = useState<ChatOutlinePrompt | null>(prompt);
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null);
  const isVisible = prompt !== null;

  if (prompt !== null && prompt !== shownPrompt) {
    setShownPrompt(prompt);
  }

  useEffect(() => {
    const animation = Animated.timing(visibility, {
      toValue: isVisible ? 1 : 0,
      duration: prefersReducedMotion ? 0 : FADE_DURATION_MS,
      useNativeDriver: isNative,
    });
    animation.start();
    return () => animation.stop();
  }, [isVisible, prefersReducedMotion, visibility]);

  const handlePress = useCallback(() => {
    if (prompt) onJumpToPrompt(prompt.seq);
  }, [onJumpToPrompt, prompt]);
  const handleLongPress = useCallback(() => {
    if (prompt) setExpandedSeq((current) => (current === prompt.seq ? null : prompt.seq));
  }, [prompt]);

  if (shownPrompt === null) {
    return null;
  }
  const isExpanded = expandedSeq === shownPrompt.seq;
  const barHeight = resolveStickyPromptBarHeight(isCompact);
  const containerStyle = [positionStyles.container, { top: topInset, opacity: visibility }];
  const rowStyle = isExpanded
    ? [styles.column, styles.rowExpanded]
    : [styles.column, styles.row, { height: barHeight }];

  return (
    <Animated.View
      style={containerStyle}
      pointerEvents={isVisible ? "box-none" : "none"}
      testID="sticky-prompt-bar"
    >
      <View style={styles.surface}>
        <Pressable
          onPress={handlePress}
          onLongPress={isNative ? handleLongPress : undefined}
          accessibilityRole="button"
          accessibilityLabel={t("agentStream.stickyPrompt.jump", { preview: shownPrompt.preview })}
          style={styles.pressable}
        >
          <View style={rowStyle}>
            <Text
              style={styles.text}
              numberOfLines={isExpanded ? EXPANDED_LINES : 1}
              testID="sticky-prompt-bar-text"
            >
              <Text style={styles.label}>{t("agentStream.stickyPrompt.you")} </Text>
              {shownPrompt.preview}
            </Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
});

// Animated drives the outer view's opacity, so it stays off the Unistyles path. See
// docs/unistyles.md on animated views.
const positionStyles = RNStyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 2,
  },
});

const styles = StyleSheet.create((theme) => ({
  surface: {
    backgroundColor: theme.colors.surface0,
    borderBottomWidth: theme.borderWidth[1],
    borderBottomColor: theme.colors.border,
  },
  // The same horizontal rails as the transcript rows below it.
  pressable: {
    paddingHorizontal: {
      xs: theme.spacing[3],
      md: theme.spacing[4],
    },
  },
  column: {
    width: "100%",
    maxWidth: theme.contentMaxWidth,
    alignSelf: "center",
    paddingHorizontal: theme.spacing[2],
  },
  row: {
    justifyContent: "center",
  },
  rowExpanded: {
    justifyContent: "center",
    paddingVertical: theme.spacing[2],
  },
  text: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  label: {
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foregroundMuted,
  },
}));
