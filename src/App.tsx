import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { RouterProvider, useRoute } from "@/router"
import { pageRegistry } from "@/pages/registry"
import { CommandPaletteProvider } from "@/components/command-palette"
import { DialogsProvider } from "@/components/dialogs/dialogs"

function RoutedPage() {
  const route = useRoute()
  const Page = pageRegistry[route.name]
  return <Page />
}

export default function App() {
  return (
    <RouterProvider>
      <TooltipProvider>
        <CommandPaletteProvider>
          <DialogsProvider>
            <SidebarProvider
              defaultOpen
              style={
                {
                  "--sidebar-width": "calc(var(--spacing) * 68)",
                  "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
              }
            >
              <AppSidebar variant="floating" />
              <SidebarInset>
                <SiteHeader />
                <div className="@container/main flex flex-1 flex-col">
                  <RoutedPage />
                </div>
              </SidebarInset>
            </SidebarProvider>
          </DialogsProvider>
        </CommandPaletteProvider>
      </TooltipProvider>
    </RouterProvider>
  )
}
