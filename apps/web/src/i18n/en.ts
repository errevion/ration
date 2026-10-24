export const en = {
  app: {
    title: "Ration",
    subtitle: "Ration Management System",
  },
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    back: "Back",
    actions: "Actions",
  },
  items: {
    title: "Ration Items",
    newItem: "New Item",
    empty: "No ration items recorded",
    quota: "Quota",
    remaining: "Remaining",
    unit: "Unit",
    namePlaceholder: "Enter item name",
  },
  distribution: {
    title: "Distribution",
    record: "Record Distribution",
    recipientPlaceholder: "Enter recipient identifier",
    quantityPlaceholder: "Enter quantity",
    notesPlaceholder: "Enter optional notes",
    submit: "Distribute",
  },
  locale: {
    english: "EN",
    indonesian: "ID",
  },
} as const;

export type TranslationKey = keyof typeof en;
export type Translations = typeof en;
