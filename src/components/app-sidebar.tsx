/**
 * Sidebar (ARCH-FE-001 D6.2, D6.3). It shows the groups and items that the
 * navigation config allows for the current `me`. A badge shows the contract
 * total for the item's badge key (REQ-FE-038). There are no badges for failed
 * events or active sessions: the contract has none (SP-BG-08).
 */

import type { ComponentProps, ComponentType, MouseEvent } from "react"
import {
  IconBuilding,
  IconDevices,
  IconKey,
  IconLock,
  IconPlus,
  IconServerCog,
  IconShieldLock,
  IconTags,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react"

import { useAuth } from "@/app/providers/auth-provider"
import {
  findNavItem,
  visibleNavSections,
  type NavItemId,
} from "@/app/navigation"
import { useNavBadges } from "@/features/dashboard/use-nav-badges"
import { navigateTo, splitHref, useLocationHref } from "@/app/router"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavIcon = ComponentType<{ className?: string }>

const ITEM_ICONS: Record<NavItemId, NavIcon> = {
  "tenant.list": IconBuilding,
  "tenant.create": IconPlus,
  "catalog.permission": IconKey,
  "catalog.kategori": IconTags,
  "catalog.negara": IconWorld,
  "team.akun": IconUsers,
  "team.peran": IconShieldLock,
  "account.sessions": IconDevices,
  "account.password": IconLock,
}

/** A plain click moves inside the app. Modified clicks keep the browser default (new tab). */
function openInApp(event: MouseEvent<HTMLAnchorElement>, to: string): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }
  event.preventDefault()
  navigateTo(to)
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { status, me } = useAuth()
  const { pathname } = splitHref(useLocationHref())
  const activeId = findNavItem(pathname)?.id ?? null
  const sections = visibleNavSections({ status, me })
  const badges = useNavBadges()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/" onClick={(event) => openInApp(event, "/")} />}
            >
              <IconServerCog className="size-5!" />
              <span className="font-heading text-base font-semibold">
                SysAdmin
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.id}>
            <SidebarGroupLabel className="font-mono text-xs tracking-wider uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = ITEM_ICONS[item.id]
                  const count =
                    item.badge === undefined ? null : badges[item.badge]
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={item.id === activeId}
                        tooltip={item.label}
                        render={
                          <a
                            href={item.path}
                            onClick={(event) => openInApp(event, item.path)}
                          />
                        }
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {count !== null ? (
                        <SidebarMenuBadge>{count}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
