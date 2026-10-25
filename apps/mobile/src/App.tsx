import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { I18nProvider, useI18n } from "./i18n/index.js";
import { TOKENS } from "./theme/tokens.js";

function MainScreen() {
  const { t, locale, setLocale } = useI18n();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t("app.title")}</Text>
            <Text style={styles.subtitle}>{t("app.subtitle")}</Text>
          </View>
          <View style={styles.localeRow}>
            <TouchableOpacity
              style={[styles.localePill, locale === "en" && styles.localePillActive]}
              onPress={() => setLocale("en")}
            >
              <Text style={[styles.localeText, locale === "en" && styles.localeTextActive]}>
                {t("locale.english")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.localePill, locale === "id" && styles.localePillActive]}
              onPress={() => setLocale("id")}
            >
              <Text style={[styles.localeText, locale === "id" && styles.localeTextActive]}>
                {t("locale.indonesian")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("items.title")}</Text>
            <Text style={styles.cardEmpty}>{t("items.empty")}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <MainScreen />
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.colors.canvas,
  },
  container: {
    flex: 1,
    padding: TOKENS.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: TOKENS.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: TOKENS.colors.textSecondary,
    marginTop: TOKENS.spacing.xs,
  },
  localeRow: {
    flexDirection: "row",
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderRadius: TOKENS.radii.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
  },
  localePill: {
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: TOKENS.spacing.xs,
    borderRadius: TOKENS.radii.pill,
  },
  localePillActive: {
    backgroundColor: TOKENS.colors.surface,
  },
  localeText: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  localeTextActive: {
    color: TOKENS.colors.primary,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: TOKENS.colors.surface,
    borderRadius: TOKENS.radii.card,
    padding: TOKENS.spacing.lg,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: TOKENS.colors.textPrimary,
    marginBottom: TOKENS.spacing.sm,
  },
  cardEmpty: {
    fontSize: 14,
    color: TOKENS.colors.textMuted,
  },
});
