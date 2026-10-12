/**
 * Front-end duplicate check for the tenant code. The server stays the
 * authority (a 409 on create is still handled), but a taken code is caught on
 * the first step so the user fixes it before filling the rest.
 */

import { REFERENCE_PAGE_LIMIT, listTenants } from "@/lib/api/modules/tenants"

/**
 * True when a tenant with this code already exists. The comparison is exact and
 * ignores case, whatever the server filter does (exact or "contains"). A failed
 * lookup answers false: the check must not block the wizard when the list is
 * unreachable, and the create call rejects a real duplicate with 409.
 */
export async function isTenantCodeTaken(code: string): Promise<boolean> {
  const wanted = code.trim().toUpperCase()
  if (wanted === "") return false
  try {
    const page = await listTenants({
      code: wanted,
      limit: REFERENCE_PAGE_LIMIT,
    })
    return page.data.some((tenant) => tenant.code.toUpperCase() === wanted)
  } catch {
    return false
  }
}
