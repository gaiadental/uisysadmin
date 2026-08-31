import * as React from "react"
import { toast } from "sonner"
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconDatabase,
  IconLock,
  IconRocket,
  IconServer,
} from "@tabler/icons-react"

import { navigate } from "@/router"
import { useDialogs } from "@/components/dialogs/dialogs"
import { tenantCategories } from "@/data/tenant-categories"
import { countries } from "@/data/countries"
import { featureModules } from "@/data/tenant-features"
import { cn } from "@/lib/utils"
import { PageBody, PageHeader } from "@/components/page-header"
import { WizardSteps, type WizardStep } from "@/components/wizard-steps"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STEPS: WizardStep[] = [
  { id: "identitas", title: "Identitas", key: "identity" },
  { id: "penyimpanan", title: "Penyimpanan", key: "storage_mode" },
  { id: "fitur", title: "Fitur aktif", key: "feature_set" },
  { id: "admin", title: "Admin awal", key: "initial_admin" },
  { id: "tinjau", title: "Tinjau & buat", key: "review" },
]

type StorageMode = "MULTI_TENANT" | "DEDICATED"

type FormState = {
  name: string
  code: string
  categoryKey: string
  countryIso2: string
  storageMode: StorageMode
  optionalFlags: Record<string, boolean>
  adminName: string
  adminEmail: string
}

const activeCountries = countries.filter((c) => c.active)

function suggestCode(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8)
}

export function TenantCreatePage() {
  const dialogs = useDialogs()
  const [step, setStep] = React.useState(0)
  const [codeEdited, setCodeEdited] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(() => ({
    name: "",
    code: "",
    categoryKey: "",
    countryIso2: "",
    storageMode: "MULTI_TENANT",
    optionalFlags: Object.fromEntries(
      featureModules
        .flatMap((m) => m.flags)
        .filter((f) => !f.core)
        .map((f) => [f.key, f.enabled])
    ),
    adminName: "",
    adminEmail: "",
  }))

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)

  const stepValid: boolean[] = [
    form.name.trim().length >= 3 &&
      /^[A-Z0-9]{2,8}$/.test(form.code) &&
      !!form.categoryKey &&
      !!form.countryIso2,
    !!form.storageMode,
    true,
    form.adminName.trim().length >= 2 && emailValid,
    true,
  ]

  const canNext = stepValid[step]
  const isLast = step === STEPS.length - 1

  function next() {
    if (!canNext) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0))
  }
  function submit() {
    dialogs.open({
      kind: "tenant.createProgress",
      code: form.code,
      onDone: () => {
        toast.success(`Tenant ${form.code} dibuat`)
        navigate("/tenant")
      },
    })
  }

  return (
    <PageBody>
      <PageHeader
        title="Tambah tenant"
        description="Buat tenant baru melalui wizard 5 langkah."
        actions={
          <Button variant="outline" onClick={() => navigate("/tenant")}>
            <IconArrowLeft />
            Batal
          </Button>
        }
      />

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <WizardSteps
            steps={STEPS}
            current={step}
            onStepClick={(i) => setStep(i)}
          />
        </CardHeader>

        <CardContent className="space-y-5 py-2">
          {step === 0 ? (
            <StepIdentitas
              form={form}
              set={set}
              codeEdited={codeEdited}
              setCodeEdited={setCodeEdited}
              suggestCode={suggestCode}
            />
          ) : null}
          {step === 1 ? <StepPenyimpanan form={form} set={set} /> : null}
          {step === 2 ? <StepFitur form={form} set={set} /> : null}
          {step === 3 ? (
            <StepAdmin form={form} set={set} emailValid={emailValid} />
          ) : null}
          {step === 4 ? <StepTinjau form={form} /> : null}
        </CardContent>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            langkah {step + 1}/{STEPS.length} · {STEPS[step].key}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={prev} disabled={step === 0}>
              <IconArrowLeft />
              Sebelumnya
            </Button>
            {isLast ? (
              <Button onClick={submit}>
                <IconRocket />
                Buat tenant
              </Button>
            ) : (
              <Button onClick={next} disabled={!canNext}>
                Lanjut
                <IconArrowRight />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </PageBody>
  )
}

/* ---------- Langkah 1: Identitas ---------- */

function StepIdentitas({
  form,
  set,
  codeEdited,
  setCodeEdited,
  suggestCode,
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  codeEdited: boolean
  setCodeEdited: (v: boolean) => void
  suggestCode: (name: string) => string
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs" htmlFor="w-name">
          Nama tenant
        </Label>
        <Input
          id="w-name"
          value={form.name}
          placeholder="mis. Klinik Gigi Sehat Sentosa"
          onChange={(e) => {
            const name = e.target.value
            set("name", name)
            if (!codeEdited) set("code", suggestCode(name))
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="w-code">
          Kode tenant
        </Label>
        <Input
          id="w-code"
          value={form.code}
          className="font-mono uppercase"
          maxLength={8}
          placeholder="GAIA"
          onChange={(e) => {
            setCodeEdited(true)
            set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }}
        />
        <p className="text-xs text-muted-foreground">
          2–8 karakter <span className="font-mono">[A-Z0-9]</span>, permanen
          setelah dibuat.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Kategori tenant</Label>
        <Select
          value={form.categoryKey}
          onValueChange={(v) => set("categoryKey", v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {tenantCategories.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}{" "}
                <code className="font-mono text-xs text-muted-foreground">
                  {c.key}
                </code>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Negara</Label>
        <Select
          value={form.countryIso2}
          onValueChange={(v) => set("countryIso2", v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih negara" />
          </SelectTrigger>
          <SelectContent>
            {activeCountries.map((c) => (
              <SelectItem key={c.iso2} value={c.iso2}>
                <span className="font-mono text-xs">{c.iso2}</span> {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/* ---------- Langkah 2: Penyimpanan ---------- */

function StepPenyimpanan({
  form,
  set,
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Mode penyimpanan menentukan isolasi data tenant dan tidak dapat diubah
        setelah provisioning.
      </p>
      <RadioGroup
        value={form.storageMode}
        onValueChange={(v) => set("storageMode", v as StorageMode)}
        className="gap-3 sm:grid-cols-2"
      >
        <StorageCard
          value="MULTI_TENANT"
          selected={form.storageMode === "MULTI_TENANT"}
          icon={IconDatabase}
          title="MULTI_TENANT"
          badge={<Badge className="font-mono text-[0.65rem]">Active</Badge>}
          desc="Skema database bersama dengan pemisahan baris per tenant. Provisioning cepat, kuota penyimpanan standar 5 GB."
        />
        <StorageCard
          value="DEDICATED"
          selected={form.storageMode === "DEDICATED"}
          icon={IconServer}
          title="DEDICATED"
          badge={
            <Badge variant="outline" className="font-mono text-[0.65rem]">
              Provisioning manual
            </Badge>
          }
          desc="Instance database terpisah per tenant. Provisioning ditangani manual oleh Tim IT setelah tenant dibuat."
        />
      </RadioGroup>
    </div>
  )
}

function StorageCard({
  value,
  selected,
  disabled,
  icon: Icon,
  title,
  badge,
  desc,
}: {
  value: string
  selected: boolean
  disabled?: boolean
  icon: typeof IconDatabase
  title: string
  badge: React.ReactNode
  desc: string
}) {
  return (
    <Label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        selected && "border-primary ring-1 ring-primary",
        disabled && "cursor-not-allowed opacity-55"
      )}
    >
      <RadioGroupItem value={value} disabled={disabled} className="mt-0.5" />
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <code className="font-mono text-sm font-medium">{title}</code>
          {badge}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Label>
  )
}

/* ---------- Langkah 3: Fitur aktif ---------- */

function StepFitur({
  form,
  set,
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
}) {
  const toggle = (key: string, on: boolean) =>
    set("optionalFlags", { ...form.optionalFlags, [key]: on })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Modul <span className="font-mono">CORE</span> selalu aktif. Pilih modul
        opsional yang diaktifkan saat tenant dibuat.
      </p>
      {featureModules.map((mod) => (
        <div key={mod.key} className="rounded-lg border border-border">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <code className="font-mono text-xs text-muted-foreground">
              {mod.key}
            </code>
            <span className="text-sm font-medium">{mod.label}</span>
          </div>
          <div className="divide-y divide-border">
            {mod.flags.map((flag) => {
              const checked = flag.core
                ? true
                : (form.optionalFlags[flag.key] ?? false)
              return (
                <label
                  key={flag.key}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5",
                    !flag.core && "cursor-pointer hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={flag.core}
                    onCheckedChange={(v) => toggle(flag.key, v === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-2 text-sm">
                      <code className="font-mono text-xs">{flag.key}</code>
                      {flag.core ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 font-mono text-[0.65rem]"
                        >
                          <IconLock className="size-2.5" />
                          CORE
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {flag.label} — {flag.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Langkah 4: Admin awal ---------- */

function StepAdmin({
  form,
  set,
  emailValid,
}: {
  form: FormState
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void
  emailValid: boolean
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Satu akun admin awal disemai untuk tenant. Password sementara akan
        ditampilkan sekali setelah tenant dibuat.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="w-admin-name">
            Nama admin
          </Label>
          <Input
            id="w-admin-name"
            value={form.adminName}
            placeholder="mis. drg. Putri Handayani"
            onChange={(e) => set("adminName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="w-admin-email">
            Email admin
          </Label>
          <Input
            id="w-admin-email"
            type="email"
            value={form.adminEmail}
            placeholder="admin@klinik.example"
            aria-invalid={form.adminEmail.length > 0 && !emailValid}
            onChange={(e) => set("adminEmail", e.target.value)}
          />
          {form.adminEmail.length > 0 && !emailValid ? (
            <p className="text-xs text-destructive">Format email tidak valid.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* ---------- Langkah 5: Tinjau & buat ---------- */

function StepTinjau({ form }: { form: FormState }) {
  const cat = tenantCategories.find((c) => c.key === form.categoryKey)
  const country = countries.find((c) => c.iso2 === form.countryIso2)
  const optionalOn = Object.entries(form.optionalFlags)
    .filter(([, v]) => v)
    .map(([k]) => k)
  const coreCount = featureModules
    .flatMap((m) => m.flags)
    .filter((f) => f.core).length

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Periksa ringkasan berikut sebelum membuat tenant.
      </p>
      <dl className="divide-y divide-border rounded-lg border border-border text-sm">
        <ReviewRow label="Nama" value={form.name} />
        <ReviewRow label="Kode" value={form.code} mono />
        <ReviewRow
          label="Kategori"
          value={`${cat?.label ?? "—"}`}
          hint={cat?.key}
        />
        <ReviewRow
          label="Negara"
          value={`${country?.name ?? "—"}`}
          hint={country?.iso2}
        />
        <ReviewRow label="Mode penyimpanan" value={form.storageMode} mono />
        <ReviewRow
          label="Fitur aktif"
          value={`${coreCount} CORE + ${optionalOn.length} opsional`}
        />
        <ReviewRow label="Admin awal" value={form.adminName} hint={form.adminEmail} />
      </dl>

      {optionalOn.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {optionalOn.map((k) => (
            <Badge key={k} variant="outline" className="gap-1 font-mono text-xs">
              <IconCheck className="size-3" />
              {k}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ReviewRow({
  label,
  value,
  hint,
  mono,
}: {
  label: string
  value: string
  hint?: string
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline gap-4 px-4 py-2.5">
      <dt className="w-36 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("flex-1", mono && "font-mono text-xs")}>
        {value || "—"}
        {hint ? (
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </dd>
    </div>
  )
}
