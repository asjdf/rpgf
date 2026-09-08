import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parse, stringify } from "std/csv";
import { KycStatus } from "../../src/types/kyc.ts";
import {
  formatKycStatusForCsv,
  KYC_STATUS_CSV_LABELS,
} from "../../src/utils/kycCsvLabels.ts";
import {
  convertToXlsxBuffer,
  convertXlsxToCsv,
} from "../../src/utils/csv.ts";

Deno.test("formatKycStatusForCsv maps every KycStatus to friendly label", () => {
  assertEquals(formatKycStatusForCsv(KycStatus.Created), "Created");
  assertEquals(formatKycStatusForCsv(KycStatus.UnderReview), "Under Review");
  assertEquals(
    formatKycStatusForCsv(KycStatus.NeedsAdditionalInformation),
    "Needs Additional Information",
  );
  assertEquals(formatKycStatusForCsv(KycStatus.Active), "Verified");
  assertEquals(formatKycStatusForCsv(KycStatus.Rejected), "Rejected");
  assertEquals(formatKycStatusForCsv(KycStatus.Deactivated), "Deactivated");
});

Deno.test("formatKycStatusForCsv returns empty for missing status", () => {
  assertEquals(formatKycStatusForCsv(null), "");
  assertEquals(formatKycStatusForCsv(undefined), "");
});

Deno.test("ACTIVE maps to Verified (issue #42 example)", () => {
  assertEquals(KycStatus.Active, "ACTIVE");
  assertEquals(formatKycStatusForCsv(KycStatus.Active), "Verified");
  assertEquals(KYC_STATUS_CSV_LABELS[KycStatus.Active], "Verified");
});

Deno.test("stringify+parse round-trip keeps KYC labels as single fields", () => {
  // Mimic getApplicationsCsv: header + rows using the same std/csv stringify
  const headers = [
    "ID",
    "Project Name",
    "KYC Status",
    "KYC Email address",
  ];
  const rows = Object.values(KycStatus).map((status, i) => [
    `app-${i}`,
    `Project ${i}`,
    formatKycStatusForCsv(status),
    `user${i}@example.com`,
  ]);
  // also a row with no KYC
  rows.push(["app-empty", "No KYC", formatKycStatusForCsv(null), ""]);

  const csv = stringify([headers, ...rows]);
  assertExists(csv);

  const parsed = parse(csv) as string[][];
  assertEquals(parsed[0], headers);

  const statusCol = headers.indexOf("KYC Status");
  const expected = [
    "Created",
    "Under Review",
    "Needs Additional Information",
    "Verified",
    "Rejected",
    "Deactivated",
    "",
  ];
  for (let i = 0; i < expected.length; i++) {
    assertEquals(parsed[i + 1][statusCol], expected[i]);
    // spaces must not split into extra columns
    assertEquals(parsed[i + 1].length, headers.length);
  }
});

Deno.test("SheetJS xlsx conversion still parses friendly KYC labels", () => {
  const headers = ["KYC Status", "Note"];
  const rows = [
    [formatKycStatusForCsv(KycStatus.Active), "ok"],
    [formatKycStatusForCsv(KycStatus.NeedsAdditionalInformation), "spaces"],
  ];
  const csv = stringify([headers, ...rows]);
  const xlsx = convertToXlsxBuffer(csv);
  // Copy into a real ArrayBuffer for convertXlsxToCsv's typing
  const ab = new ArrayBuffer(xlsx.byteLength);
  new Uint8Array(ab).set(xlsx);
  const back = convertXlsxToCsv(ab);
  const parsed = parse(back) as string[][];
  // SheetJS may normalize; assert labels present as cells
  const flat = parsed.flat().join("|");
  assertEquals(flat.includes("Verified"), true);
  assertEquals(flat.includes("Needs Additional Information"), true);
});
