import type {
  ComponentType,
  FunctionComponent,
  ReactNode,
  ForwardRefExoticComponent,
  RefAttributes,
  ReactElement,
  Ref,
} from "react";
import type {
  Animated,
  StyleProp,
  ViewStyle,
  ScrollView as NativeScrollView,
  ScrollViewProps,
  FlatList as NativeFlatList,
  FlatListProps,
  TextInput as NativeTextInput,
  TextInputProps,
} from "react-native";
import type { PluginIconProps } from "./contracts.js";

export interface ModalProps {
  title: string;
  icon?: ReactNode;
  open: boolean;
  onOpenChange(open: boolean): void;
  children: ReactNode;
}

export interface ModalContentProps {
  children: ReactNode;
  /** Paint the full body below the header. */
  style?: StyleProp<ViewStyle>;
  /** Overrides the default 24px padding and 16px gap. Safe-area clearance stays host-owned. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Default true. Set false for a bounded body with your own ScrollView or FlatList. */
  scrollable?: boolean;
}

export interface ModalComponent extends FunctionComponent<ModalProps> {
  Content: ComponentType<ModalContentProps>;
}

export type ToastVariant = "default" | "info" | "success" | "warning" | "error";

export interface ToastOptions {
  variant?: ToastVariant;
  durationMs?: number;
}

export interface ToastApi {
  show(message: string, options?: ToastOptions): void;
  error(message: string): void;
}

export declare const Icon: ComponentType<PluginIconProps>;
export declare const Modal: ModalComponent;
export declare function useToast(): ToastApi;
export declare function useRevealedText(text: string, phase: "streaming" | "complete"): string;

export interface TimelineStickyHeaderOptions {
  /** Height of the header in points, measured by the renderer. */
  headerHeight: number;
  /** Stick only while it helps, for example while the card is expanded and taller than the screen. */
  enabled: boolean;
}

/**
 * Keeps a header at the top of a timeline renderer's card visible while the card scrolls
 * past the top of the transcript. Apply the result as `transform: [{ translateY }]` on an
 * `Animated.View` from `react-native` at the top of the renderer's root view. The header
 * follows the top edge, below Paseo's own sticky prompt bar, and the end of its card pushes
 * it out, so it never leaves the card. Paseo drives it from the scroll position on the
 * native driver; the renderer does not re-render while scrolling.
 *
 * While `enabled` is false the value stays 0. Keep the transform bound rather than
 * removing it: native views keep the last animated position when an animated transform is
 * replaced by a static one.
 *
 * Returns `null` outside an agent timeline. Hosts before this API do not provide it; check
 * `typeof useTimelineStickyHeader === "function"` when supporting them.
 */
export declare function useTimelineStickyHeader(
  options: TimelineStickyHeaderOptions,
): Animated.AnimatedInterpolation<number> | null;

export type { PluginIconProps } from "./contracts.js";

/** React Native scrolling with the host's sheet gestures when rendered inside a sheet. */
export declare const ScrollView: ForwardRefExoticComponent<
  ScrollViewProps & RefAttributes<NativeScrollView>
>;
export declare function FlatList<Item>(
  props: FlatListProps<Item> & { ref?: Ref<NativeFlatList<Item>> },
): ReactElement;
/** Copies text to this client's clipboard. Rejects when copying is unavailable or denied. */
export declare function copyText(text: string): Promise<void>;

/** Native input focus integrated with modal keyboard positioning. */
export declare const TextInput: ForwardRefExoticComponent<
  TextInputProps & RefAttributes<NativeTextInput>
>;
