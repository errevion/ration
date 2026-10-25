export const en = {
  app: {
    title: "Ration",
    subtitle: "Daily Spend Tracker",
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
  tracker: {
    cycleTitle: "Pay Cycle",
    totalBalance: "Total Balance",
    daysLeft: "{days} days left",
    perDay: "{amount} / day",
    spend: "Spend",
    add: "Add",
    deposit: "Deposit",
    today: "Today",
    keypadTitle: "Record Spend",
    addTitle: "Add Funds",
    amountPlaceholder: "0",
    confirm: "Confirm",
    clear: "Clear",
    close: "Close",
    spentToday: "Spent: {amount}",
    dailyBudget: "Daily Budget",
    dayDetails: "Day Details",
    noTransactions: "No transactions",
  },
  weekdays: {
    mon: "M",
    tue: "T",
    wed: "W",
    thu: "T",
    fri: "F",
    sat: "S",
    sun: "S",
  },
} as const;

export type TranslationKey = keyof typeof en;
type StringRecord<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? StringRecord<T[K]> : string;
};

export type Translations = StringRecord<typeof en>;
