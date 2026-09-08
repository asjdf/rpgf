import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { KycStatus } from "../../src/types/kyc.ts";
import {
  formatKycStatusForCsv,
  KYC_STATUS_CSV_LABELS,
} from "../../src/utils/kycCsvLabels.ts";

Deno.test("every KycStatus key has a friendly CSV mapping", () => {
  const statuses = Object.values(KycStatus);
  assertEquals(statuses.length > 0, true);

  for (const status of statuses) {
    const label = formatKycStatusForCsv(status);
    assertEquals(typeof label, "string");
    assertEquals(label.length > 0, true);
    assertEquals(label, KYC_STATUS_CSV_LABELS[status]);
    // Must not leak the raw enum wire value as the CSV label when a
    // friendly mapping exists (e.g. ACTIVE → Verified).
    if (status === KycStatus.Active) {
      assertEquals(label, "Verified");
    }
  }

  // Mapping table must cover exactly the enum keys — no missing, no extras.
  assertEquals(
    Object.keys(KYC_STATUS_CSV_LABELS).sort(),
    statuses.slice().sort(),
  );
});

Deno.test("missing KYC status exports as empty string", () => {
  assertEquals(formatKycStatusForCsv(null), "");
  assertEquals(formatKycStatusForCsv(undefined), "");
});
