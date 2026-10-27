import {
  type Account,
  type BackupData,
  BackupDataSchema,
  type LoanRecord,
  type MoneyCycle,
  type PlannedPayment,
  type SpendTransaction,
} from "@ration/types";

const STORAGE_KEY = "@ration_web_state_v1";

export interface PersistedState {
  version: number;
  cycle: MoneyCycle;
  accounts: Account[];
  transactions: SpendTransaction[];
  plannedPayments: PlannedPayment[];
  loans: LoanRecord[];
  referenceDate?: string;
}

export function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.cycle && Array.isArray(parsed.accounts)) {
      return parsed as PersistedState;
    }
  } catch {}
  return null;
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function exportBackupFile(data: BackupData): void {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStr = data.exportedAt.slice(0, 10);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ration-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {}
}

export async function importBackupFile(file: File): Promise<BackupData | null> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const validated = BackupDataSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
  } catch {}
  return null;
}
