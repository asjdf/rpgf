import { KycStatus } from "../types/kyc.ts";

/** Human-friendly CSV labels for internal KYC status enums (rpgf#42). */
export const KYC_STATUS_CSV_LABELS: Record<KycStatus, string> = {
  [KycStatus.Created]: "Created",
  [KycStatus.UnderReview]: "Under Review",
  [KycStatus.NeedsAdditionalInformation]: "Needs Additional Information",
  [KycStatus.Active]: "Verified",
  [KycStatus.Rejected]: "Rejected",
  [KycStatus.Deactivated]: "Deactivated",
};

/** Map internal KYC status enums to human-friendly CSV labels. */
export function formatKycStatusForCsv(
  status: KycStatus | undefined | null,
): string {
  if (!status) return "";
  return KYC_STATUS_CSV_LABELS[status] ?? status;
}
