import { useCallback, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  CircleGauge,
  CircleHelp,
  FolderPlus,
  MoreVertical,
  Server,
  Settings,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { HostPicker } from "@/components/hosts/host-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type MenuPageDefinition,
} from "@/components/ui/dropdown-menu";
import { DensityIcon } from "@/components/ui/density-icon";
import type { MenuTriggerState } from "@/components/ui/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHosts } from "@/runtime/host-runtime";
import { density } from "@/styles/density";
import { ICON_SIZE, type Theme } from "@/styles/theme";
import { useOpenSidebarUsage } from "@/usage";
import type { SidebarFooterSlot } from "./sidebar-footer-overflow";
import { SidebarFooterIconHighlight } from "./sidebar-footer-icon-highlight";
import { SidebarHelpMenuItems } from "./sidebar-help-menu";

const HELP_PAGE_ID = "sidebar-footer-help";

const ThemedFolderPlus = withUnistyles(FolderPlus);
const ThemedCircleGauge = withUnistyles(CircleGauge);
const ThemedCircleHelp = withUnistyles(CircleHelp);
const ThemedServer = withUnistyles(Server);
const ThemedSettings = withUnistyles(Settings);
const foregroundMutedColorMapping = (theme: Theme) => ({
  color: theme.colors.foregroundMuted,
});
const addProjectLeadingIcon = (
  <ThemedFolderPlus size={ICON_SIZE.sm} uniProps={foregroundMutedColorMapping} />
);
const usageLeadingIcon = (
  <ThemedCircleGauge size={ICON_SIZE.sm} uniProps={foregroundMutedColorMapping} />
);
const hostsLeadingIcon = (
  <ThemedServer size={ICON_SIZE.sm} uniProps={foregroundMutedColorMapping} />
);
const helpLeadingIcon = (
  <ThemedCircleHelp size={ICON_SIZE.sm} uniProps={foregroundMutedColorMapping} />
);
const settingsLeadingIcon = (
  <ThemedSettings size={ICON_SIZE.sm} uniProps={foregroundMutedColorMapping} />
);

interface SidebarFooterOverflowMenuProps {
  /** The footer slots that did not fit on the icon line, in display order. */
  slots: readonly SidebarFooterSlot[];
  labels: { addProject: string; usage: string; hosts: string; settings: string; more: string };
  onOpenProject: () => void;
  onSettings: () => void;
  onAddHost: () => void;
  onOpenHostSettings: (serverId: string) => void;
}

/**
 * The More button at the end of a footer line too narrow for every icon. It lists the slots that
 * did not fit: plain actions run from the menu, Help opens as a page, and Hosts opens the same
 * host picker the Hosts button does, anchored to More.
 */
export function SidebarFooterOverflowMenu({
  slots,
  labels,
  onOpenProject,
  onSettings,
  onAddHost,
  onOpenHostSettings,
}: SidebarFooterOverflowMenuProps) {
  const { t } = useTranslation();
  const hosts = useHosts();
  const openUsage = useOpenSidebarUsage();
  const triggerRef = useRef<View | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hostsOpen, setHostsOpen] = useState(false);
  const openHosts = useCallback(() => setHostsOpen(true), []);

  const pages = useMemo<MenuPageDefinition[]>(
    () =>
      slots.includes("help")
        ? [
            {
              id: HELP_PAGE_ID,
              title: t("sidebar.help.trigger"),
              content: <SidebarHelpMenuItems />,
            },
          ]
        : [],
    [slots, t],
  );

  return (
    <HostPicker
      hosts={hosts}
      value=""
      onSelect={onOpenHostSettings}
      open={hostsOpen}
      onOpenChange={setHostsOpen}
      anchorRef={triggerRef}
      includeAddHost
      onAddHost={onAddHost}
      showActiveConnection
      onOpenHostSettings={onOpenHostSettings}
      searchable
      desktopPlacement="top-start"
      desktopMinWidth={240}
      addHostTestID="sidebar-host-add"
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip delayDuration={300} enabledOnDesktop={!menuOpen}>
          <TooltipTrigger asChild>
            <View ref={triggerRef} collapsable={false}>
              <DropdownMenuTrigger
                style={styles.trigger}
                testID="sidebar-footer-more"
                accessibilityRole="button"
                accessibilityLabel={labels.more}
              >
                {renderMoreTrigger}
              </DropdownMenuTrigger>
            </View>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" offset={8}>
            <Text style={styles.tooltipText}>{labels.more}</Text>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          side="top"
          align="end"
          offset={8}
          width={240}
          pages={pages}
          sheetTitle={labels.more}
          testID="sidebar-footer-more-menu"
        >
          {slots.map((slot) => {
            switch (slot) {
              case "addProject":
                return (
                  <DropdownMenuItem
                    key={slot}
                    testID="sidebar-footer-more-add-project"
                    leading={addProjectLeadingIcon}
                    onSelect={onOpenProject}
                  >
                    {labels.addProject}
                  </DropdownMenuItem>
                );
              case "usage":
                return (
                  <DropdownMenuItem
                    key={slot}
                    testID="sidebar-footer-more-usage"
                    leading={usageLeadingIcon}
                    onSelect={openUsage}
                  >
                    {labels.usage}
                  </DropdownMenuItem>
                );
              case "hosts":
                return (
                  <DropdownMenuItem
                    key={slot}
                    testID="sidebar-footer-more-hosts"
                    leading={hostsLeadingIcon}
                    onSelect={openHosts}
                  >
                    {labels.hosts}
                  </DropdownMenuItem>
                );
              case "help":
                return (
                  <DropdownMenuSubTrigger
                    key={slot}
                    id={HELP_PAGE_ID}
                    leading={helpLeadingIcon}
                    testID="sidebar-footer-more-help"
                  >
                    {t("sidebar.help.trigger")}
                  </DropdownMenuSubTrigger>
                );
              case "settings":
                return (
                  <DropdownMenuItem
                    key={slot}
                    testID="sidebar-footer-more-settings"
                    leading={settingsLeadingIcon}
                    onSelect={onSettings}
                  >
                    {labels.settings}
                  </DropdownMenuItem>
                );
            }
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </HostPicker>
  );
}

function renderMoreTrigger({ hovered, pressed, open }: MenuTriggerState) {
  return (
    <>
      <SidebarFooterIconHighlight visible={pressed || open} />
      <DensityIcon
        icon={MoreVertical}
        size="md"
        color={hovered ? "foreground" : "foregroundMuted"}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  trigger: {
    width: density.iconButton,
    height: density.iconButton,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[1],
  },
  tooltipText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.popoverForeground,
  },
}));
