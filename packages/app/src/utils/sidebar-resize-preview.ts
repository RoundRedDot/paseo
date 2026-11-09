import { makeMutable } from "react-native-reanimated";

/**
 * Position and visibility of the line drawn where a sidebar drag would put the divider.
 *
 * A drag that animates a real `width` re-lays out every descendant each frame: the sidebar's list,
 * the chat, the terminal grid, the plugin surface sharing the row. That layout pass is what makes
 * the edge trail the finger on a 60 Hz tablet. This pair of mutables moves one 2 px line on the UI
 * thread instead, so nothing is laid out until the gesture ends and the width is committed once.
 */
export const sidebarResizePreviewX = makeMutable(0);
export const sidebarResizePreviewOpacity = makeMutable(0);
