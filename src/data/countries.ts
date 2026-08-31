export type Country = {
  id: string
  iso2: string
  name: string
  dialCode: string
  tenantCount: number
  active: boolean
}

/** KATALOG › Negara (8) */
export const countries: Country[] = [
  { id: "ctr_id", iso2: "ID", name: "Indonesia", dialCode: "+62", tenantCount: 7, active: true },
  { id: "ctr_my", iso2: "MY", name: "Malaysia", dialCode: "+60", tenantCount: 2, active: true },
  { id: "ctr_sg", iso2: "SG", name: "Singapura", dialCode: "+65", tenantCount: 1, active: true },
  { id: "ctr_th", iso2: "TH", name: "Thailand", dialCode: "+66", tenantCount: 1, active: true },
  { id: "ctr_ph", iso2: "PH", name: "Filipina", dialCode: "+63", tenantCount: 1, active: true },
  { id: "ctr_vn", iso2: "VN", name: "Vietnam", dialCode: "+84", tenantCount: 0, active: true },
  { id: "ctr_bn", iso2: "BN", name: "Brunei Darussalam", dialCode: "+673", tenantCount: 0, active: false },
  { id: "ctr_kh", iso2: "KH", name: "Kamboja", dialCode: "+855", tenantCount: 0, active: false },
]
