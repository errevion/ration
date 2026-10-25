import { I18nProvider, useI18n } from "./i18n/index.js";
import { TOKENS } from "./theme/tokens.js";

function MainDashboard() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: TOKENS.colors.canvas,
        color: TOKENS.colors.textPrimary,
        padding: TOKENS.spacing.xl,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "960px",
          margin: "0 auto",
          marginBottom: TOKENS.spacing.xxl,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              margin: 0,
              color: TOKENS.colors.textPrimary,
            }}
          >
            {t("app.title")}
          </h1>
          <p
            style={{
              fontSize: "14px",
              margin: 0,
              marginTop: TOKENS.spacing.xs,
              color: TOKENS.colors.textSecondary,
            }}
          >
            {t("app.subtitle")}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            backgroundColor: TOKENS.colors.surfaceSubtle,
            borderRadius: TOKENS.radii.pill,
            padding: "2px",
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
          }}
        >
          <button
            type="button"
            onClick={() => setLocale("en")}
            style={{
              padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.md}`,
              borderRadius: TOKENS.radii.pill,
              border: "none",
              backgroundColor: locale === "en" ? TOKENS.colors.surface : "transparent",
              color: locale === "en" ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {t("locale.english")}
          </button>
          <button
            type="button"
            onClick={() => setLocale("id")}
            style={{
              padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.md}`,
              borderRadius: TOKENS.radii.pill,
              border: "none",
              backgroundColor: locale === "id" ? TOKENS.colors.surface : "transparent",
              color: locale === "id" ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {t("locale.indonesian")}
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            backgroundColor: TOKENS.colors.surface,
            borderRadius: TOKENS.radii.card,
            padding: TOKENS.spacing.xl,
            border: `1px solid ${TOKENS.colors.border}`,
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginTop: 0,
              marginBottom: TOKENS.spacing.sm,
            }}
          >
            {t("items.title")}
          </h2>
          <p
            style={{
              color: TOKENS.colors.textMuted,
              margin: 0,
            }}
          >
            {t("items.empty")}
          </p>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <MainDashboard />
    </I18nProvider>
  );
}
