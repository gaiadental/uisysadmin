/**
 * The system role key that gates the master-data screens (ARCH-FE-001 D6.2).
 *
 * auth-service maps SYS_PRINCIPAL to the edge role SYSTEM_PRINCIPAL. The
 * gateway copies that value into X-Role and never derives it (ARCH-SEC-001
 * section 9.2 c). SP-DEC-01 (2026-10-10) limits master-data to this role for
 * now. If SEC-OQ-02 changes the mapping, this constant and ARCH-FE-001 D6.2
 * change together.
 */
export const SYS_PRINCIPAL = "SYS_PRINCIPAL"
