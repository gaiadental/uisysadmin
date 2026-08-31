import * as React from "react"
import { toast } from "sonner"
import { IconDeviceFloppy } from "@tabler/icons-react"

import { defaultPlatformSettings } from "@/data/platform-settings"
import { PageBody, PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function SistemPengaturanPage() {
  const [settings, setSettings] = React.useState(defaultPlatformSettings)
  const [dirty, setDirty] = React.useState(false)

  function set<K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) {
    setSettings((s) => ({ ...s, [key]: value }))
    setDirty(true)
  }

  function save() {
    setDirty(false)
    toast.success("Pengaturan platform disimpan")
  }

  return (
    <PageBody>
      <PageHeader
        title="Pengaturan platform"
        description="Masa berlaku token, batas sesi bersamaan, dan retensi housekeeping — Token Domain spec §26."
        actions={
          <Button onClick={save} disabled={!dirty}>
            <IconDeviceFloppy />
            Simpan
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Token akses & refresh</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="access-ttl">
              Masa berlaku access token (menit)
            </Label>
            <Input
              id="access-ttl"
              type="number"
              min={1}
              className="font-mono"
              value={settings.accessTokenTtlMinutes}
              onChange={(e) =>
                set("accessTokenTtlMinutes", Number(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="refresh-ttl">
              Masa berlaku refresh token (hari)
            </Label>
            <Input
              id="refresh-ttl"
              type="number"
              min={1}
              className="font-mono"
              value={settings.refreshTokenTtlDays}
              onChange={(e) =>
                set("refreshTokenTtlDays", Number(e.target.value) || 0)
              }
            />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 sm:col-span-2">
            <span className="space-y-0.5">
              <span className="block text-sm">Rotasi refresh token</span>
              <span className="block text-xs text-muted-foreground">
                Terbitkan refresh token baru setiap kali dipakai; token lama
                langsung tidak berlaku.
              </span>
            </span>
            <Switch
              checked={settings.refreshRotationEnabled}
              onCheckedChange={(v) => set("refreshRotationEnabled", v)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sesi & housekeeping</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="max-session">
              Batas sesi bersamaan per akun
            </Label>
            <Input
              id="max-session"
              type="number"
              min={1}
              className="font-mono"
              value={settings.maxConcurrentSessions}
              onChange={(e) =>
                set("maxConcurrentSessions", Number(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground">
              Berlaku untuk akun Tim IT. Sesi klinik tetap dikelola agregat per
              tenant.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="retention">
              Retensi housekeeping (hari)
            </Label>
            <Input
              id="retention"
              type="number"
              min={1}
              className="font-mono"
              value={settings.housekeepingRetentionDays}
              onChange={(e) =>
                set("housekeepingRetentionDays", Number(e.target.value) || 0)
              }
            />
            <p className="text-xs text-muted-foreground">
              Tenant nonaktif melewati batas ini dihapus permanen otomatis
              oleh scheduler (lihat SISTEM › Housekeeping).
            </p>
          </div>
        </CardContent>
      </Card>
    </PageBody>
  )
}
