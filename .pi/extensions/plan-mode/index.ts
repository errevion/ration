/**
 * Plan Mode Extension
 *
 * Read-only exploration mode for safe code analysis.
 * When enabled, built-in write tools are disabled.
 *
 * Features:
 * - /plan command or Ctrl+Alt+P to toggle
 * - Bash restricted to allowlisted read-only commands
 * - Extracts numbered plan steps from "Plan:" sections
 * - [DONE:n] markers to complete steps during execution
 * - Progress tracking widget during execution
 */

import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { AssistantMessage, TextContent } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Key } from "@earendil-works/pi-tui";
import { extractTodoItems, isSafeCommand, markCompletedSteps, type TodoItem } from "./utils.ts";

// Tools
const PLAN_MODE_TOOLS = ["read", "bash", "grep", "find", "ls", "questionnaire"];
const NORMAL_MODE_TOOLS = ["read", "bash", "edit", "write"];
const PLAN_MODE_DISABLED_TOOLS = new Set<string>(["edit", "write"]);
const PLAN_MANAGED_TOOLS = new Set<string>([...PLAN_MODE_TOOLS, ...NORMAL_MODE_TOOLS]);

interface PlanModeState {
  enabled: boolean;
  todos?: TodoItem[];
  executing?: boolean;
  toolsBeforePlanMode?: string[];
}

// Type guard for assistant messages
function isAssistantMessage(m: AgentMessage): m is AssistantMessage {
  return m.role === "assistant" && Array.isArray(m.content);
}

// Extract text content from an assistant message
function getTextContent(message: AssistantMessage): string {
  return message.content
    .filter((block): block is TextContent => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export default function planModeExtension(pi: ExtensionAPI): void {
  let planModeEnabled = false;
  let executionMode = false;
  let todoItems: TodoItem[] = [];
  let toolsBeforePlanMode: string[] | undefined;

  pi.registerFlag("plan", {
    description: "Start in plan mode (read-only exploration)",
    type: "boolean",
    default: false,
  });

  function updateStatus(ctx: ExtensionContext): void {
    // Footer status
    if (executionMode && todoItems.length > 0) {
      const completed = todoItems.filter((t) => t.completed).length;
      ctx.ui.setStatus(
        "plan-mode",
        ctx.ui.theme.fg("accent", `Plan ${completed}/${todoItems.length}`)
      );
    } else if (planModeEnabled) {
      ctx.ui.setStatus("plan-mode", ctx.ui.theme.fg("warning", "Plan"));
    } else {
      ctx.ui.setStatus("plan-mode", undefined);
    }

    // Widget showing todo list
    if (executionMode && todoItems.length > 0) {
      const lines = todoItems.map((item) => {
        if (item.completed) {
          return (
            ctx.ui.theme.fg("success", "[x] ") +
            ctx.ui.theme.fg("muted", ctx.ui.theme.strikethrough(item.text))
          );
        }
        return `${ctx.ui.theme.fg("muted", "[ ] ")}${item.text}`;
      });
      ctx.ui.setWidget("plan-todos", lines);
    } else {
      ctx.ui.setWidget("plan-todos", undefined);
    }
  }

  function uniqueToolNames(toolNames: string[]): string[] {
    return [...new Set(toolNames)];
  }

  function getPlanModeTools(activeToolNames: string[]): string[] {
    return uniqueToolNames([
      ...activeToolNames.filter((name) => !PLAN_MODE_DISABLED_TOOLS.has(name)),
      ...PLAN_MODE_TOOLS,
    ]);
  }

  function getNormalModeTools(activeToolNames: string[]): string[] {
    return uniqueToolNames([
      ...NORMAL_MODE_TOOLS,
      ...activeToolNames.filter((name) => !PLAN_MANAGED_TOOLS.has(name)),
    ]);
  }

  function enablePlanModeTools(): void {
    if (toolsBeforePlanMode === undefined) {
      toolsBeforePlanMode = pi.getActiveTools();
    }
    pi.setActiveTools(getPlanModeTools(toolsBeforePlanMode));
  }

  function restoreNormalModeTools(): void {
    pi.setActiveTools(toolsBeforePlanMode ?? getNormalModeTools(pi.getActiveTools()));
    toolsBeforePlanMode = undefined;
  }

  function persistState(): void {
    pi.appendEntry("plan-mode", {
      enabled: planModeEnabled,
      todos: todoItems,
      executing: executionMode,
      toolsBeforePlanMode,
    });
  }

  function togglePlanMode(ctx: ExtensionContext): void {
    planModeEnabled = !planModeEnabled;
    executionMode = false;
    todoItems = [];

    if (planModeEnabled) {
      enablePlanModeTools();
      ctx.ui.notify("Plan mode enabled. Built-in write tools disabled.");
    } else {
      restoreNormalModeTools();
      ctx.ui.notify("Plan mode disabled. Full access restored.");
    }
    updateStatus(ctx);
    persistState();
  }

  pi.registerCommand("plan", {
    description: "Toggle plan mode (read-only exploration)",
    handler: async (_args, ctx) => togglePlanMode(ctx),
  });

  pi.registerCommand("todos", {
    description:
      "Show or update current plan todo list (/todos, /todos done <steps>, /todos done all)",
    handler: async (args, ctx) => {
      if (todoItems.length === 0) {
        ctx.ui.notify("No todos. Create a plan first with /plan", "info");
        return;
      }

      const trimmed = args.trim().toLowerCase();
      if (
        trimmed.startsWith("done ") ||
        trimmed === "done" ||
        trimmed === "all" ||
        trimmed === "check all" ||
        trimmed === "done all"
      ) {
        const target = trimmed.replace(/^(done|check)\s*/, "").trim();
        if (target === "all" || !target) {
          for (const item of todoItems) {
            item.completed = true;
          }
          ctx.ui.notify("All plan steps marked as completed.", "info");
        } else {
          const fakeTag = `[DONE: ${target}]`;
          const count = markCompletedSteps(fakeTag, todoItems);
          ctx.ui.notify(`Marked ${count} plan step(s) as completed.`, "info");
        }

        updateStatus(ctx);
        persistState();

        if (executionMode && todoItems.every((t) => t.completed)) {
          const completedList = todoItems.map((t) => `~~${t.text}~~`).join("\n");
          pi.sendMessage(
            {
              customType: "plan-complete",
              content: `**Plan Complete!**\n\n${completedList}`,
              display: true,
            },
            { triggerTurn: false }
          );
          executionMode = false;
          todoItems = [];
          updateStatus(ctx);
          persistState();
        }
        return;
      }

      const list = todoItems
        .map((item, i) => `${i + 1}. ${item.completed ? "[x]" : "[ ]"} ${item.text}`)
        .join("\n");
      ctx.ui.notify(`Plan Progress:\n${list}`, "info");
    },
  });

  pi.registerShortcut(Key.ctrlAlt("p"), {
    description: "Toggle plan mode",
    handler: async (ctx) => togglePlanMode(ctx),
  });

  // Block destructive bash commands in plan mode
  pi.on("tool_call", async (event) => {
    if (!planModeEnabled || event.toolName !== "bash") return;

    const command = event.input.command as string;
    if (!isSafeCommand(command)) {
      return {
        block: true,
        reason: `Plan mode: command blocked (not allowlisted). Use /plan to disable plan mode first.\nCommand: ${command}`,
      };
    }
  });

  // Filter out stale plan mode context when not in plan mode
  pi.on("context", async (event) => {
    if (planModeEnabled) return;

    return {
      messages: event.messages.filter((m) => {
        const msg = m as AgentMessage & { customType?: string };
        if (msg.customType === "plan-mode-context") return false;
        if (msg.role !== "user") return true;

        const content = msg.content;
        if (typeof content === "string") {
          return !content.includes("[PLAN MODE ACTIVE]");
        }
        if (Array.isArray(content)) {
          return !content.some(
            (c) => c.type === "text" && (c as TextContent).text?.includes("[PLAN MODE ACTIVE]")
          );
        }
        return true;
      }),
    };
  });

  // Inject plan/execution context before agent starts
  pi.on("before_agent_start", async () => {
    if (planModeEnabled) {
      return {
        message: {
          customType: "plan-mode-context",
          content: `[PLAN MODE ACTIVE]
You are in plan mode - a read-only exploration mode for safe code analysis.

Restrictions:
- Built-in edit and write tools are disabled
- Other currently active tools remain available
- Bash is restricted to an allowlist of read-only commands

Mandatory Pre-Plan File Inspection:
- ALWAYS read and inspect existing files BEFORE formulating your plan.
- Check AGENTS.md and packages/types/src/index.ts first.
- Explicitly state which existing types, schemas, or utilities will be reused.
- NEVER invent duplicate types, schemas, or utilities without verifying existing code.

Ask clarifying questions using the questionnaire tool if requirements are ambiguous.
Use web search if external research is needed.

Create a detailed numbered plan under a "Plan:" header:

Plan:
1. First step description
2. Second step description
...
N-2. Document architectural changes in AGENTS.md / ARCHITECTURE.md (if applicable)
N-1. Run lint and format check (Biome)
N. Commit changes using conventional commit format

Rules for the plan:
- The third to last step MUST ALWAYS be: "Document architectural changes in AGENTS.md / ARCHITECTURE.md (if applicable)".
- The second to last step MUST ALWAYS be: "Run lint and format check (Biome)".
- The final step MUST ALWAYS be: "Commit changes using conventional commit format".
- Do NOT attempt to make changes while in plan mode - just describe what you would do.`,
          display: false,
        },
      };
    }

    if (executionMode && todoItems.length > 0) {
      const remaining = todoItems.filter((t) => !t.completed);
      const todoList = remaining.map((t) => `${t.step}. ${t.text}`).join("\n");
      return {
        message: {
          customType: "plan-execution-context",
          content: `[EXECUTING PLAN - Full tool access enabled]

Remaining steps:
${todoList}

Execute remaining steps sequentially without stopping until the plan is complete.
After completing each step, or in your final summary once work is done, include the completion tag for each finished step: [DONE:n] (e.g. [DONE:1], [DONE:2]).`,
          display: false,
        },
      };
    }
  });

  // Track progress after each turn
  pi.on("turn_end", async (event, ctx) => {
    if (!executionMode || todoItems.length === 0) return;
    if (!isAssistantMessage(event.message)) return;

    const text = getTextContent(event.message);
    if (markCompletedSteps(text, todoItems) > 0) {
      updateStatus(ctx);
    }
    persistState();
  });

  // Handle plan completion and plan mode UI
  pi.on("agent_end", async (event, ctx) => {
    if (executionMode && todoItems.length > 0) {
      const assistantMessages = event.messages.filter(isAssistantMessage);
      if (assistantMessages.length > 0) {
        const combinedText = assistantMessages.map(getTextContent).join("\n");
        if (markCompletedSteps(combinedText, todoItems) > 0) {
          updateStatus(ctx);
        }
      }

      const lastStep = todoItems[todoItems.length - 1];
      if (lastStep?.completed && !todoItems.every((t) => t.completed)) {
        for (const item of todoItems) {
          item.completed = true;
        }
        updateStatus(ctx);
      }

      if (todoItems.every((t) => t.completed)) {
        const completedList = todoItems.map((t) => `~~${t.text}~~`).join("\n");
        pi.sendMessage(
          {
            customType: "plan-complete",
            content: `**Plan Complete!**\n\n${completedList}`,
            display: true,
          },
          { triggerTurn: false }
        );
        executionMode = false;
        todoItems = [];
        updateStatus(ctx);
        persistState();
      }
      return;
    }

    if (!planModeEnabled || !ctx.hasUI) return;

    // Extract todos from last assistant message
    const lastAssistant = [...event.messages].reverse().find(isAssistantMessage);
    if (lastAssistant) {
      const extracted = extractTodoItems(getTextContent(lastAssistant));
      if (extracted.length > 0) {
        // Separate any existing commit step from the rest of the plan
        const commitIndex = extracted.findIndex((item) =>
          /\b(commit|conventional commit)\b/i.test(item.text)
        );
        let commitItem: TodoItem | undefined;
        if (commitIndex !== -1) {
          commitItem = extracted.splice(commitIndex, 1)[0];
        }

        // Separate any existing Biome lint/format step
        const biomeIndex = extracted.findIndex((item) =>
          /\b(biome|lint|format)\b/i.test(item.text)
        );
        let biomeItem: TodoItem | undefined;
        if (biomeIndex !== -1) {
          biomeItem = extracted.splice(biomeIndex, 1)[0];
        }

        // Ensure the deterministic documentation step is present
        const hasDocStep = extracted.some((item) =>
          /\b(document|documentation|agents\.md|architecture\.md)\b/i.test(item.text)
        );
        if (!hasDocStep) {
          extracted.push({
            step: extracted.length + 1,
            text: "Document architectural changes in AGENTS.md / ARCHITECTURE.md (if applicable)",
            completed: false,
          });
        }

        // Ensure the deterministic Biome lint/format step is present
        extracted.push(
          biomeItem ?? {
            step: extracted.length + 1,
            text: "Run lint and format check (Biome)",
            completed: false,
          }
        );

        // Always append the commit step as the final step
        extracted.push(
          commitItem ?? {
            step: extracted.length + 1,
            text: "Commit changes using conventional commit",
            completed: false,
          }
        );

        // Re-index steps to ensure strictly sequential numbering
        todoItems = extracted.map((item, idx) => ({
          ...item,
          step: idx + 1,
        }));
      }
    }

    if (todoItems.length === 0) return;
    persistState();

    // Show plan steps and prompt for next action
    const todoListText = todoItems.map((t, i) => `${i + 1}. [ ] ${t.text}`).join("\n");
    const planTodoListMessage = {
      customType: "plan-todo-list",
      content: `**Plan Steps (${todoItems.length}):**\n\n${todoListText}`,
      display: true,
    };

    const choice = await ctx.ui.select("Plan mode - what next?", [
      "Execute the plan (track progress)",
      "Stay in plan mode",
      "Refine the plan",
    ]);

    if (choice?.startsWith("Execute")) {
      const firstTodoItem = todoItems[0];
      if (!firstTodoItem) return;

      planModeEnabled = false;
      executionMode = true;
      restoreNormalModeTools();
      updateStatus(ctx);
      persistState();

      const remainingList = todoItems.map((t) => `${t.step}. [ ] ${t.text}`).join("\n");
      const execMessage = `**Plan Steps (${todoItems.length}):**\n\n${remainingList}\n\nExecute the plan. Work through all steps sequentially until complete.\nEmit the completion tag [DONE:n] as each step is completed, or include all completed tags in your response.`;

      pi.sendMessage(
        { customType: "plan-mode-execute", content: execMessage, display: true },
        { triggerTurn: true, deliverAs: "followUp" }
      );
    } else if (choice === "Refine the plan") {
      const refinement = await ctx.ui.editor("Refine the plan:", "");
      if (refinement?.trim()) {
        pi.sendMessage(planTodoListMessage, { deliverAs: "followUp" });
        pi.sendUserMessage(refinement.trim(), { deliverAs: "followUp" });
      }
    }
  });

  // Restore state on session start/resume
  pi.on("session_start", async (_event, ctx) => {
    if (pi.getFlag("plan") === true) {
      planModeEnabled = true;
    }

    const entries = ctx.sessionManager.getEntries();

    // Restore persisted state
    const planModeEntry = entries
      .filter(
        (e: { type: string; customType?: string }) =>
          e.type === "custom" && e.customType === "plan-mode"
      )
      .pop() as { data?: PlanModeState } | undefined;

    if (planModeEntry?.data) {
      planModeEnabled = planModeEntry.data.enabled ?? planModeEnabled;
      todoItems = planModeEntry.data.todos ?? todoItems;
      executionMode = planModeEntry.data.executing ?? executionMode;
      toolsBeforePlanMode = planModeEntry.data.toolsBeforePlanMode ?? toolsBeforePlanMode;
    }

    // On resume: re-scan messages to rebuild completion state
    // Only scan messages AFTER the last "plan-mode-execute" to avoid picking up [DONE:n] from previous plans
    const isResume = planModeEntry !== undefined;
    if (isResume && executionMode && todoItems.length > 0) {
      // Find the index of the last plan-mode-execute entry (marks when current execution started)
      let executeIndex = -1;
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i] as { type: string; customType?: string };
        if (entry.customType === "plan-mode-execute") {
          executeIndex = i;
          break;
        }
      }

      // Only scan messages after the execute marker
      const messages: AssistantMessage[] = [];
      for (let i = executeIndex + 1; i < entries.length; i++) {
        const entry = entries[i];
        if (
          entry.type === "message" &&
          "message" in entry &&
          isAssistantMessage(entry.message as AgentMessage)
        ) {
          messages.push(entry.message as AssistantMessage);
        }
      }
      const allText = messages.map(getTextContent).join("\n");
      markCompletedSteps(allText, todoItems);
    }

    if (planModeEnabled) {
      enablePlanModeTools();
    }
    updateStatus(ctx);
  });
}
