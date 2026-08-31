export type TenantCategory = {
  id: string
  key: string
  label: string
  tenantCount: number
}

/** KATALOG › Kategori tenant (6) */
export const tenantCategories: TenantCategory[] = [
  { id: "cat_01", key: "GENERAL_DENTAL", label: "Klinik gigi umum", tenantCount: 5 },
  { id: "cat_02", key: "ORTHODONTIC", label: "Ortodonti", tenantCount: 2 },
  { id: "cat_03", key: "ORAL_SURGERY", label: "Bedah mulut", tenantCount: 1 },
  { id: "cat_04", key: "PEDIATRIC", label: "Gigi anak", tenantCount: 2 },
  { id: "cat_05", key: "COSMETIC", label: "Estetika gigi", tenantCount: 1 },
  { id: "cat_06", key: "GROUP_PRACTICE", label: "Jaringan klinik", tenantCount: 1 },
]
