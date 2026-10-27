import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

// Safe read-only commands allowed in discussion mode
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

function isSafeBashCommand(command: string): boolean {
  return !DESTRUCTIVE_BASH_PATTERNS.some((pattern) => pattern.test(command));
}

export default function discussModeExtension(pi: ExtensionAPI): void {
  let discussModeEnabled = false;
  let toolsBeforeDiscussMode: string[] | undefined;

  pi.registerFlag("discuss", {
    description: "Start in discussion mode (read-only exploratory conversation)",
    type: "boolean",
    default: false,
  });

  function updateStatus(ctx: ExtensionContext): void {
    if (discussModeEnabled) {
      ctx.ui.setStatus("discuss-mode", ctx.ui.theme.fg("accent", "💬 discuss"));
    } else {
      ctx.ui.setStatus("discuss-mode", undefined);
    }
  }

  function enableDiscussTools(): void {
    if (toolsBeforeDiscussMode === undefined) {
      toolsBeforeDiscussMode = pi.getActiveTools();
    }
    // Filter out write and edit
    const allowed = toolsBeforeDiscussMode.filter((name) => name !== "edit" && name !== "write");
    pi.setActiveTools(allowed);
  }

  function restoreTools(): void {
    if (toolsBeforeDiscussMode) {
      pi.setActiveTools(toolsBeforeDiscussMode);
      toolsBeforeDiscussMode = undefined;
    }
  }

  function persistState(): void {
    pi.appendEntry("discuss-mode", {
      enabled: discussModeEnabled,
      toolsBeforeDiscussMode,
    });
  }

  function toggleDiscussMode(ctx: ExtensionContext): void {
    discussModeEnabled = !discussModeEnabled;

    if (discussModeEnabled) {
      enableDiscussTools();
      ctx.ui.notify("Discussion mode enabled (read-only conversational partner)", "info");
    } else {
      restoreTools();
      ctx.ui.notify("Discussion mode disabled. Full tool access restored.", "info");
    }

    updateStatus(ctx);
    persistState();
  }

  // Register command
  pi.registerCommand("discuss", {
    description: "Toggle discussion mode (read-only conversational brainstorming)",
    handler: async (_args: string, ctx: ExtensionContext) => {
      toggleDiscussMode(ctx);
    },
  });

  // Block edit & write tools defensively
  pi.on("tool_call", async (event) => {
    if (!discussModeEnabled) return;

    if (event.toolName === "edit" || event.toolName === "write") {
      return {
        block: true,
        reason:
          "Discussion mode is active: file modifications are disabled. Use /discuss to exit discussion mode.",
      };
    }

    if (event.toolName === "bash") {
      const command = (event.input as { command?: string }).command ?? "";
      if (!isSafeBashCommand(command)) {
        return {
          block: true,
          reason: `Discussion mode: command blocked. Modifications are disabled in discussion mode.\nCommand: ${command}`,
        };
      }
    }
  });

  // Inject conversational discussion instructions
  pi.on("before_agent_start", async () => {
    if (!discussModeEnabled) return;

    return {
      message: {
        customType: "discuss-mode-context",
        content: `[DISCUSSION MODE ACTIVE]
You are currently in discussion mode.
Your role: Technical advisor, software architect, and collaborative design partner.

Guarantees & Guidelines:
- You are in READ-ONLY mode. Do NOT attempt to edit or write files.
- DO NOT generate rigid numbered implementation plans or step-by-step checklists (that is reserved for /plan mode).
- Focus on free-form dialogue: evaluate architectural options, discuss UX/UI design choices, compare libraries, explore trade-offs, and ask clarifying questions.
- You can inspect files (read, grep, find, ls) and search the web (ninerouter_web_search) to inform the discussion.
- Be thoughtful, concise, and collaborative.`,
        display: false,
      },
    };
  });

  // Restore state on session start / resume
  pi.on("session_start", async (_event, ctx) => {
    if (pi.getFlag("discuss") === true) {
      discussModeEnabled = true;
    }

    const entries = ctx.sessionManager.getEntries();
    const lastEntry = [...entries]
      .reverse()
      .find((e: any) => e.type === "custom" && e.customType === "discuss-mode");

    if (lastEntry?.data) {
      discussModeEnabled = (lastEntry.data as any).enabled ?? discussModeEnabled;
      toolsBeforeDiscussMode =
        (lastEntry.data as any).toolsBeforeDiscussMode ?? toolsBeforeDiscussMode;
    }

    if (discussModeEnabled) {
      enableDiscussTools();
    }
    updateStatus(ctx);
  });
}
