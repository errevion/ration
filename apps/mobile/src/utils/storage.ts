import {
  type Account,
  type BackupData,
  BackupDataSchema,
  type LoanRecord,
  type MoneyCycle,
  type PlannedPayment,
  type SpendTransaction,
} from "@ration/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const STORAGE_KEY = "@ration_app_state_v1";

export interface PersistedState {
  version: number;
  cycle: MoneyCycle;
  accounts: Account[];
  transactions: SpendTransaction[];
  plannedPayments: PlannedPayment[];
  loans: LoanRecord[];
  referenceDate?: string;
}

export async function loadPersistedState(): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.cycle && Array.isArray(parsed.accounts)) {
      return parsed as PersistedState;
    }
  } catch {}
  return null;
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    const serialized = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch {}
}

export async function exportBackupFile(data: BackupData): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const dateStr = data.exportedAt.slice(0, 10);
    const fileName = `ration-backup-${dateStr}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonStr, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: "Export Ration Backup",
        UTI: "public.json",
      });
      return true;
    }
  } catch {}
  return false;
}

export async function importBackupFile(): Promise<BackupData | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/*"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parsed = JSON.parse(content);
    const validated = BackupDataSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
  } catch {}
  return null;
}
