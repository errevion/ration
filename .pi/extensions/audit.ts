import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const DESTRUCTIVE_BASH_PATTERNS = [
  /\brm\b/i,
  /\bmv\b/i,
  /\bcp\b/i,
  /\bmkdir\b/i,
  /\btouch\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bgit\s+(add|commit|push|pull|merge|rebase|reset|checkout|branch\s+-[dD]|stash|cherry-pick|revert)/i,
  /\bsudo\b/i,
];

function isSafeAuditBashCommand(command: string): boolean {
  return !DESTRUCTIVE_BASH_PATTERNS.some((pattern) => pattern.test(command));
}

interface AuditDomain {
  id: string;
  label: string;
  testScript: string;
}

const KNOWN_LABELS: Record<string, string> = {
  contracts: "Contract & Schema Parity",
  i18n: "Localization & Translation Parity",
  mobile: "Mobile Client State & Parity",
  web: "Web Client State & Parity",
  storage: "Client Storage & Persistence",
};

function getDomainTestScript(domainId: string, filename: string): string {
  try {
    const pkgPath = path.resolve("package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.scripts?.[`audit:${domainId}`]) {
        return `npm run audit:${domainId}`;
      }
    }
  } catch {}
  return `npx vitest run tests/audit/${filename}`;
}

function discoverAuditDomains(): AuditDomain[] {
  const auditDir = path.resolve("tests", "audit");
  const domains: AuditDomain[] = [];

  if (fs.existsSync(auditDir)) {
    const entries = fs.readdirSync(auditDir);
    for (const entry of entries) {
      if (entry.endsWith(".test.ts")) {
        const id = entry.replace(/\.test\.ts$/, "");
        domains.push({
          id,
          label: KNOWN_LABELS[id] || `${id.charAt(0).toUpperCase() + id.slice(1)} Domain Audit`,
          testScript: getDomainTestScript(id, entry),
        });
      }
    }
  }

  domains.sort((a, b) => a.id.localeCompare(b.id));

  domains.push({
    id: "all",
    label: "Comprehensive Forensic Sweep",
    testScript: "npm run test:audit",
  });

  return domains;
}

type AuditMode = "forensic" | "sync" | null;

export default function auditModeExtension(pi: ExtensionAPI): void {
  let currentAuditMode: AuditMode = null;
  let activeDomain = "all";
  let targetDomainForSync: string | undefined;
  let toolsBeforeAuditMode: string[] | undefined;

  pi.registerFlag("audit", {
    description: "Start in autonomous audit mode for resilience testing",
    type: "boolean",
    default: false,
  });

  function updateStatus(ctx: ExtensionContext): void {
    if (currentAuditMode === "sync") {
      ctx.ui.setStatus("audit-mode", ctx.ui.theme.fg("accent", "[AUDIT: ARCHITECT]"));
    } else if (currentAuditMode === "forensic") {
      ctx.ui.setStatus(
        "audit-mode",
        ctx.ui.theme.fg("warning", `[AUDIT: ${activeDomain.toUpperCase()}]`)
      );
    } else {
      ctx.ui.setStatus("audit-mode", undefined);
    }
  }

  function enableForensicTools(): void {
    if (toolsBeforeAuditMode === undefined) {
      toolsBeforeAuditMode = pi.getActiveTools();
    }
    const allowed = toolsBeforeAuditMode.filter((name) => name !== "edit" && name !== "write");
    pi.setActiveTools(allowed);
  }

  function restoreTools(): void {
    if (toolsBeforeAuditMode) {
      pi.setActiveTools(toolsBeforeAuditMode);
      toolsBeforeAuditMode = undefined;
    }
  }

  function persistState(): void {
    pi.appendEntry("audit-mode", {
      mode: currentAuditMode,
      domain: activeDomain,
      targetDomainForSync,
      toolsBeforeAuditMode,
    });
  }

  async function activateAuditForensic(domainId: string, ctx: ExtensionContext): Promise<void> {
    currentAuditMode = "forensic";
    activeDomain = domainId;
    targetDomainForSync = undefined;
    enableForensicTools();
    updateStatus(ctx);
    persistState();

    const domains = discoverAuditDomains();
    const selected = domains.find((d) => d.id === domainId) || domains[domains.length - 1];

    ctx.ui.notify(`Forensic Audit Mode activated: ${selected.label}`, "info");

    const auditPrompt = `Initiate forensic audit sweep for domain: ${selected.label} (${selected.id}).

Domain Test Command:
${selected.testScript}

Protocol:
1. Run diagnostic tests and semantic validation using the domain test command.
2. Trace invariant enforcement, boundary validations, and concurrency risks in source code.
3. Deliver the unvarnished Forensic Dossier with empirical findings, reproduction traces, and severity ratings.
4. Halt immediately upon dossier delivery without writing implementation code or checklists.`;

    pi.sendMessage(
      { customType: "audit-trigger", content: auditPrompt, display: true },
      { triggerTurn: true, deliverAs: "followUp" }
    );
  }

  async function activateAuditSync(ctx: ExtensionContext, targetDomain?: string): Promise<void> {
    currentAuditMode = "sync";
    activeDomain = targetDomain || "all";
    targetDomainForSync = targetDomain;
    restoreTools();
    updateStatus(ctx);
    persistState();

    const targetDesc = targetDomain ? `target domain "${targetDomain}"` : "all project domains";
    ctx.ui.notify(`Audit Architect Mode activated: Exploring and syncing ${targetDesc}`, "info");

    const syncPrompt = `You are operating as an Autonomous Audit Architect.

Objective:
Explore the codebase to discover and scaffold missing domain audit test suites for ${targetDesc}.

Reconnaissance Protocol:
1. Inspect packages/types/src/index.ts, apps/mobile/src/, and apps/web/src/.
2. Inspect tests/audit/ to detect uncovered domain entities and subsystem invariants.
3. For any missing domain coverage:
   - Scaffold a comprehensive domain audit test suite in tests/audit/<domain>.test.ts with adversarial assertions.
   - Register the domain script in package.json under scripts as "audit:<domain>": "vitest run tests/audit/<domain>.test.ts".
   - Document the newly registered audit domain in AGENTS.md ("Check First" Catalog).
4. Deliver a concise Architecture Summary of discovered domains and newly scaffolded audit suites.
5. HALT cleanly without executing the tests. The user will run the tests manually.`;

    pi.sendMessage(
      { customType: "audit-sync-trigger", content: syncPrompt, display: true },
      { triggerTurn: true, deliverAs: "followUp" }
    );
  }

  function deactivateAudit(ctx: ExtensionContext): void {
    currentAuditMode = null;
    targetDomainForSync = undefined;
    restoreTools();
    updateStatus(ctx);
    persistState();
    ctx.ui.notify("Audit mode deactivated. Full tool permissions restored.", "info");
  }

  pi.registerCommand("audit", {
    description: "Launch forensic resilience audit or sync new domain audit suites",
    handler: async (args: string, ctx: ExtensionContext) => {
      const trimmed = args.trim().toLowerCase();

      if (currentAuditMode && !trimmed) {
        deactivateAudit(ctx);
        return;
      }

      if (trimmed === "sync" || trimmed === "explore" || trimmed === "discover") {
        await activateAuditSync(ctx);
        return;
      }

      if (trimmed.startsWith("new ") || trimmed.startsWith("create ")) {
        const target = trimmed.replace(/^(new|create)\s+/, "").trim();
        await activateAuditSync(ctx, target);
        return;
      }

      const domains = discoverAuditDomains();

      if (trimmed) {
        const matched = domains.find(
          (d) => d.id === trimmed || d.label.toLowerCase().includes(trimmed)
        );
        const domainId = matched ? matched.id : "all";
        await activateAuditForensic(domainId, ctx);
        return;
      }

      const choices = [
        "[+] Explore & Sync Project Domains",
        ...domains.map((d) => `${d.label} [${d.id}]`),
        "Cancel",
      ];

      const selectedChoice = await ctx.ui.select("Select audit action or domain:", choices);

      if (!selectedChoice || selectedChoice === "Cancel") {
        return;
      }

      if (selectedChoice.startsWith("[+]")) {
        await activateAuditSync(ctx);
        return;
      }

      const matched = domains.find((d) => selectedChoice.startsWith(d.label));
      if (matched) {
        await activateAuditForensic(matched.id, ctx);
      }
    },
  });

  pi.on("tool_call", async (event) => {
    if (!currentAuditMode) return;

    if (
      currentAuditMode === "forensic" &&
      (event.toolName === "edit" || event.toolName === "write")
    ) {
      return {
        block: true,
        reason:
          "Audit forensic mode is active: code modifications are disabled during forensic audits. Run /audit to exit audit mode.",
      };
    }

    if (event.toolName === "bash") {
      const command = (event.input as { command?: string }).command ?? "";
      if (!isSafeAuditBashCommand(command)) {
        return {
          block: true,
          reason: `Audit mode: destructive command blocked.\nCommand: ${command}`,
        };
      }
    }
  });

  pi.on("before_agent_start", async () => {
    if (!currentAuditMode) return;

    if (currentAuditMode === "sync") {
      return {
        message: {
          customType: "audit-mode-context",
          content: `[AUDIT ARCHITECT MODE ACTIVE]
You are operating as an Autonomous Audit Architect.

Guarantees & Directives:
- You have FULL read, write, and editing tool permissions.
- Conduct thorough reconnaissance across packages/types/src/index.ts, apps/mobile/src/, and apps/web/src/.
- Cross-reference existing suites in tests/audit/.
- Scaffold missing tests/audit/<domain>.test.ts files with high-resilience invariant assertions.
- Register newly scaffolded suites in package.json scripts and document them in AGENTS.md.
- HALT cleanly once files are written and documented without executing the test commands. Return control to the user.`,
          display: false,
        },
      };
    }

    return {
      message: {
        customType: "audit-mode-context",
        content: `[AUDIT MODE ACTIVE - DOMAIN: ${activeDomain.toUpperCase()}]
You are operating as an Autonomous Forensic Auditor.

Guarantees & Directives:
- You are in READ-ONLY mode for production code. Do NOT attempt to edit or write files in apps/ or packages/.
- You have high-privilege testing permissions via bash: execute diagnostic commands, run vitest suites, evaluate client states, and inspect runtime code.
- Operate autonomously: do not prompt the user for architectural assumptions. Infer ground truth from ARCHITECTURE.md, AGENTS.md, schemas, and live test executions.
- Deliver an unvarnished Forensic Dossier:
  1. Target Invariants Evaluated
  2. Empirical Telemetry & Test Assertions (pass/fail traces)
  3. Adversarial Edge Cases & Failure Cascades
  4. Root Cause Analysis
  5. Severity Classification (Level 0: Critical Integrity Fatal to Level 3: Maintainability Debt)
- Once the dossier is delivered, HALT cleanly. Do not generate code fixes or implementation steps. Return full control to the user.`,
        display: false,
      },
    };
  });

  pi.on("session_start", async (_event, ctx) => {
    if (pi.getFlag("audit") === true) {
      currentAuditMode = "forensic";
    }

    const entries = ctx.sessionManager.getEntries();
    const lastEntry = [...entries]
      .reverse()
      .find((e: any) => e.type === "custom" && e.customType === "audit-mode");

    if (lastEntry?.data) {
      currentAuditMode =
        (lastEntry.data as any).mode ?? ((lastEntry.data as any).enabled ? "forensic" : null);
      activeDomain = (lastEntry.data as any).domain ?? activeDomain;
      targetDomainForSync = (lastEntry.data as any).targetDomainForSync;
      toolsBeforeAuditMode = (lastEntry.data as any).toolsBeforeAuditMode ?? toolsBeforeAuditMode;
    }

    if (currentAuditMode === "forensic") {
      enableForensicTools();
    }
    updateStatus(ctx);
  });
}
