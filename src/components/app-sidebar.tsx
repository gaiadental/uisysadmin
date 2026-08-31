import * as React from "react"
import {
  IconBuilding,
  IconSparkles,
  IconWorld,
  IconHome,
  IconKey,
  IconPlus,
  IconFileText,
  IconServerCog,
  IconTags,
  IconUsers,
  IconBolt,
  IconDevices,
  IconShieldLock,
  IconSettings,
} from "@tabler/icons-react"

import { navCounts } from "@/data/nav"
import { Link, useRoute, type RouteName } from "@/router"
import { NavUser } from "@/components/nav-user"
import { Badge } from "@/components/ui/badge"
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

type NavItem = {
  title: string
  route: RouteName
  icon: React.ComponentType<{ className?: string }>
  count?: number
  countTone?: "default" | "destructive"
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    items: [{ title: "Dashboard", route: "beranda", icon: IconHome }],
  },
  {
    label: "Tenant",
    items: [
      {
        title: "Daftar tenant",
        route: "tenant.list",
        icon: IconBuilding,
        count: navCounts.tenantList,
      },
      { title: "Tambah tenant", route: "tenant.create", icon: IconPlus },
    ],
  },
  {
    label: "Katalog",
    items: [
      {
        title: "Permission",
        route: "katalog.permission",
        icon: IconKey,
        count: navCounts.permission,
      },
      {
        title: "Kategori tenant",
        route: "katalog.kategori",
        icon: IconTags,
        count: navCounts.tenantCategory,
      },
      {
        title: "Negara",
        route: "katalog.negara",
        icon: IconWorld,
        count: navCounts.country,
      },
    ],
  },
  {
    label: "Tim IT",
    items: [
      {
        title: "Akun",
        route: "tim.akun",
        icon: IconUsers,
        count: navCounts.itAccount,
      },
      {
        title: "Peran",
        route: "tim.peran",
        icon: IconShieldLock,
        count: navCounts.role,
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        title: "Event",
        route: "sistem.event",
        icon: IconBolt,
        count: navCounts.eventFailed,
        countTone: "destructive",
      },
      {
        title: "Sesi aktif",
        route: "sistem.sesi",
        icon: IconDevices,
        count: navCounts.activeSession,
      },
      {
        title: "Housekeeping",
        route: "sistem.housekeeping",
        icon: IconSparkles,
      },
      { title: "Log audit", route: "sistem.audit", icon: IconFileText },
      {
        title: "Pengaturan platform",
        route: "sistem.pengaturan",
        icon: IconSettings,
      },
    ],
  },
]

/** Route mana yang menandai item nav sebagai aktif (termasuk sub-halaman). */
function matchesActive(current: RouteName, item: RouteName): boolean {
  if (current === item) return true
  if (item === "tenant.list" && current === "tenant.detail") return true
  return false
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const route = useRoute()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link to="/" />}
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
        {NAV.map((group, i) => (
          <SidebarGroup key={group.label ?? `group-${i}`}>
            {group.label ? (
              <SidebarGroupLabel className="font-mono text-[0.7rem] tracking-wider uppercase">
                {group.label}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.route}>
                      <SidebarMenuButton
                        isActive={matchesActive(route.name, item.route)}
                        tooltip={item.title}
                        render={<Link to={pathOf(item.route)} />}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {typeof item.count === "number" ? (
                        item.countTone === "destructive" ? (
                          <SidebarMenuBadge className="pointer-events-none">
                            <Badge
                              variant="destructive"
                              className="h-4 px-1 font-mono text-[0.7rem]"
                            >
                              {item.count}
                            </Badge>
                          </SidebarMenuBadge>
                        ) : (
                          <SidebarMenuBadge className="font-mono">
                            {item.count}
                          </SidebarMenuBadge>
                        )
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
        <NavUser
          user={{
            name: "Irfan W.",
            email: "it.gaiadental@gmail.com",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}

function pathOf(route: RouteName): string {
  const map: Record<RouteName, string> = {
    beranda: "/",
    "tenant.list": "/tenant",
    "tenant.create": "/tenant/tambah",
    "tenant.detail": "/tenant",
    "katalog.permission": "/katalog/permission",
    "katalog.kategori": "/katalog/kategori",
    "katalog.negara": "/katalog/negara",
    "tim.akun": "/tim/akun",
    "tim.peran": "/tim/peran",
    "sistem.event": "/sistem/event",
    "sistem.sesi": "/sistem/sesi",
    "sistem.housekeeping": "/sistem/housekeeping",
    "sistem.audit": "/sistem/audit",
    "sistem.pengaturan": "/sistem/pengaturan",
  }
  return map[route]
}
