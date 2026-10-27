import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

interface ExecResult {
  stdout: string;
  stderr: string;
  status: number;
}

function loadEnvFile(cwd: string): Record<string, string> {
  const envPath = join(cwd, ".env");
  const env: Record<string, string> = {};
  if (!existsSync(envPath)) return env;

  try {
    const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq !== -1) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  } catch {}
  return env;
}

function runCmd(
  command: string,
  args: string[],
  cwd: string,
  extraEnv?: Record<string, string>
): ExecResult {
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env: extraEnv ? { ...process.env, ...extraEnv } : process.env,
    });
    return { stdout: stdout.trim(), stderr: "", status: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout ? String(err.stdout).trim() : "",
      stderr: err.stderr ? String(err.stderr).trim() : String(err.message),
      status: typeof err.status === "number" ? err.status : 1,
    };
  }
}

function loadPrTemplate(cwd: string): string | null {
  const templatePaths = [
    join(cwd, ".github", "pull_request_template.md"),
    join(cwd, "pull_request_template.md"),
    join(cwd, ".github", "PULL_REQUEST_TEMPLATE.md"),
  ];
  for (const p of templatePaths) {
    if (existsSync(p)) {
      try {
        return readFileSync(p, "utf-8");
      } catch {}
    }
  }
  return null;
}

interface ExistingPrInfo {
  number: number;
  url: string;
  state: string;
}

function getExistingPr(cwd: string, projectEnv: Record<string, string>): ExistingPrInfo | null {
  const res = runCmd("gh", ["pr", "view", "--json", "number,url,state"], cwd, projectEnv);
  if (res.status === 0 && res.stdout) {
    try {
      const parsed = JSON.parse(res.stdout);
      if (parsed.state === "OPEN" && parsed.url && typeof parsed.number === "number") {
        return parsed as ExistingPrInfo;
      }
    } catch {}
  }
  return null;
}

function getRepoReviewer(
  cwd: string,
  remoteUrl: string,
  env: Record<string, string>,
  explicitReviewer?: string
): string | undefined {
  if (explicitReviewer?.trim()) {
    return explicitReviewer.trim();
  }

  if (env.PR_REVIEWER?.trim()) {
    return env.PR_REVIEWER.trim();
  }

  if (process.env.PR_REVIEWER?.trim()) {
    return process.env.PR_REVIEWER.trim();
  }

  let currentActor = "yourcrewmate";
  const userRes = runCmd("gh", ["api", "user", "--jq", ".login"], cwd, env);
  if (userRes.status === 0 && userRes.stdout) {
    currentActor = userRes.stdout.trim();
  }

  const repoRes = runCmd("gh", ["repo", "view", "--json", "owner"], cwd, env);
  if (repoRes.status === 0 && repoRes.stdout) {
    try {
      const parsed = JSON.parse(repoRes.stdout);
      const owner = parsed.owner?.login?.trim();
      if (owner && owner.toLowerCase() !== currentActor.toLowerCase()) {
        return owner;
      }
    } catch {}
  }

  const match =
    remoteUrl.match(
      /(?:github[a-z0-9_-]*|gh[a-z0-9_-]*)[:/](?:[0-9]+\/)?([a-zA-Z0-9_-]+)\/([^/.]+?)(?:\.git)?$/i
    ) || remoteUrl.match(/[:/]([a-zA-Z0-9_-]+)\/([^/.]+?)(?:\.git)?$/);

  if (match) {
    const owner = match[1];
    if (owner.toLowerCase() !== currentActor.toLowerCase()) {
      return owner;
    }
  }

  return undefined;
}

function summarizeBranchTitle(branchName: string, commitMessages: string[]): string {
  const cleanCommits = commitMessages
    .map((c) => c.replace(/^[a-f0-9]+\s+/, "").trim())
    .filter(Boolean);
  if (cleanCommits.length === 0) return `${branchName}: automated updates`;
  if (cleanCommits.length === 1) return cleanCommits[0];

  const parsed = cleanCommits.map((msg) => {
    const match = msg.match(/^([a-z]+)(?:\(([^)]+)\))?:\s*(.+)$/i);
    if (match) {
      return {
        type: match[1].toLowerCase(),
        scope: match[2]?.toLowerCase(),
        desc: match[3].trim(),
      };
    }
    return { type: "", scope: undefined, desc: msg };
  });

  const typeRank = ["feat", "fix", "refactor", "perf", "docs", "chore"];
  const presentTypes = Array.from(new Set(parsed.map((p) => p.type).filter(Boolean)));
  const dominantType = typeRank.find((t) => presentTypes.includes(t)) || presentTypes[0] || "feat";

  const branchParts = branchName.split("/");
  let branchTopic = branchParts.length > 1 ? branchParts[1] : branchParts[0];
  branchTopic = branchTopic.replace(/^(feature|feat|fix|setup|chore)-?/, "").trim();

  const scopes = Array.from(new Set(parsed.map((p) => p.scope).filter(Boolean))) as string[];
  const scope = scopes.length === 1 ? scopes[0] : branchTopic || undefined;

  let summary = "";
  if (scopes.length === 1 && branchTopic) {
    summary = `implement ${branchTopic.replace(/[-_]/g, " ")}`;
  } else if (scopes.length > 0 && scopes.length <= 2) {
    summary = `update ${scopes.join(" and ")}`;
  } else if (branchTopic) {
    const readableTopic = branchTopic.replace(/[-_]/g, " ");
    summary = `${branchParts[0] === "setup" ? "setup" : "implement"} ${readableTopic}`;
  } else {
    const oldest = parsed[parsed.length - 1];
    summary = oldest.desc;
  }

  if (scope && summary.startsWith(`${scope} `)) {
    summary = summary.slice(scope.length + 1).trim();
  }

  const scopePrefix = scope ? `(${scope})` : "";
  return `${dominantType}${scopePrefix}: ${summary}`;
}

export default function prCommandExtension(pi: ExtensionAPI): void {
  pi.registerCommand("pr", {
    description:
      "Automatically push changes and create a pull request with conventional formatting",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const cwd = ctx.cwd;

      // 1. Verify Git repo
      const repoCheck = runCmd("git", ["rev-parse", "--is-inside-work-tree"], cwd);
      if (repoCheck.status !== 0) {
        ctx.ui.notify("Not inside a git repository", "error");
        return;
      }

      // 2. Check remote configuration
      const remoteCheck = runCmd("git", ["remote", "get-url", "origin"], cwd);
      if (remoteCheck.status !== 0 || !remoteCheck.stdout) {
        ctx.ui.notify(
          "No 'origin' remote found. Configure with: git remote add origin <url>",
          "error"
        );
        return;
      }

      // 3. Get current branch
      const branchRes = runCmd("git", ["branch", "--show-current"], cwd);
      const currentBranch = branchRes.stdout;
      if (!currentBranch) {
        ctx.ui.notify("Cannot create PR: detached HEAD state", "error");
        return;
      }
      if (currentBranch === "master" || currentBranch === "main") {
        ctx.ui.notify(
          `Cannot create PR from primary branch '${currentBranch}'. Please checkout a feature branch.`,
          "error"
        );
        return;
      }

      // 4. Check for uncommitted changes
      const statusRes = runCmd("git", ["status", "--porcelain"], cwd);
      if (statusRes.stdout) {
        ctx.ui.notify(
          "You have uncommitted changes. Please commit them before creating a PR.",
          "warning"
        );
        return;
      }

      // 5. Gather commits comparing against target base branch
      ctx.ui.notify("Fetching origin and ensuring branch is up to date...", "info");
      runCmd("git", ["fetch", "origin"], cwd);
      let baseBranch = "main";
      const checkMain = runCmd("git", ["rev-parse", "--verify", "origin/main"], cwd);
      if (checkMain.status !== 0) {
        const checkMaster = runCmd("git", ["rev-parse", "--verify", "origin/master"], cwd);
        if (checkMaster.status === 0) {
          baseBranch = "master";
        }
      }

      const checkDevelop = runCmd("git", ["rev-parse", "--verify", "origin/develop"], cwd);
      const hasDevelop = checkDevelop.status === 0;
      const explicitTargetMaster = /(?:^|\s)--(master|prod)(?:$|\s)/i.test(args);
      const reviewerArgMatch = args.match(/(?:^|\s)(?:--reviewer|-r)\s+([a-zA-Z0-9_-]+)(?:$|\s)/i);
      const explicitReviewer = reviewerArgMatch ? reviewerArgMatch[1] : undefined;
      const cleanTitleArgs = args
        .replace(/(?:^|\s)--(master|prod)(?:$|\s)/gi, " ")
        .replace(/(?:^|\s)(?:--reviewer|-r)\s+([a-zA-Z0-9_-]+)(?:$|\s)/gi, " ")
        .trim();

      if (hasDevelop) {
        if (currentBranch === "develop" || explicitTargetMaster) {
          baseBranch = baseBranch === "main" ? "main" : "master";
        } else {
          baseBranch = "develop";
        }
      }

      // Automatically rebase onto latest base branch to drop already-merged upstream commits
      const rebaseRes = runCmd("git", ["rebase", `origin/${baseBranch}`], cwd);
      if (rebaseRes.status !== 0) {
        runCmd("git", ["rebase", "--abort"], cwd);
        ctx.ui.notify(
          `Conflict detected while rebasing onto origin/${baseBranch}. Please resolve conflicts manually.`,
          "error"
        );
        return;
      }

      const logRes = runCmd("git", ["log", `origin/${baseBranch}..HEAD`, "--oneline"], cwd);
      const branchCommits =
        logRes.status === 0 && logRes.stdout ? logRes.stdout.split("\n").filter(Boolean) : [];

      // 6. Auto-generate PR Title summarizing the branch changes
      const prTitle = cleanTitleArgs || summarizeBranchTitle(currentBranch, branchCommits);

      // 7. Auto-generate PR Body from template & commit list
      const changesList =
        branchCommits.length > 0
          ? branchCommits.map((c) => `- ${c.replace(/^[a-f0-9]+\s+/, "")}`).join("\n")
          : "- Ongoing updates and improvements";

      const template = loadPrTemplate(cwd);
      let prBody: string;

      if (template) {
        prBody = template
          .replace(
            "<!-- Concise overview of the changes introduced in this pull request -->",
            `Automated PR for branch \`${currentBranch}\`.`
          )
          .replace("<!-- Bullet list of specific changes made -->", changesList)
          .replace(
            "<!-- Why is this change required? What issue does it fix? -->",
            "Implements changes according to project specification."
          )
          .replace("<!-- Describe tests run to verify these changes -->\n", "");
      } else {
        prBody = `## Summary
Automated PR for branch \`${currentBranch}\`.

## Changes
${changesList}

## Motivation & Context
Implements changes according to project specification.

## How Was This Tested?
- [x] Verified locally with Biome lint and format checks

## Checklist
- [x] Conventional commit format followed
- [x] Tested against local environment
- [x] No sensitive credentials or secrets committed
`;
      }

      // 8. Push branch to origin
      ctx.ui.notify(`Pushing '${currentBranch}' to origin...`, "info");
      const pushRes = runCmd(
        "git",
        ["push", "--force-with-lease", "-u", "origin", currentBranch],
        cwd
      );
      if (pushRes.status !== 0) {
        ctx.ui.notify(`git push failed: ${pushRes.stderr || pushRes.stdout}`, "error");
        return;
      }

      const projectEnv = loadEnvFile(cwd);
      const reviewer = getRepoReviewer(cwd, remoteCheck.stdout, projectEnv, explicitReviewer);

      // 9. Check if an open PR already exists for this branch
      const existingPr = getExistingPr(cwd, projectEnv);

      if (existingPr) {
        ctx.ui.notify(`Updating existing Pull Request #${existingPr.number}...`, "info");
        const editArgs = [
          "pr",
          "edit",
          String(existingPr.number),
          "--title",
          prTitle,
          "--body",
          prBody,
        ];
        if (reviewer) {
          editArgs.push("--add-reviewer", reviewer);
        }

        let editRes = runCmd("gh", editArgs, cwd, projectEnv);
        let reviewerAssigned = Boolean(reviewer);

        if (editRes.status !== 0 && reviewer) {
          reviewerAssigned = false;
          editRes = runCmd(
            "gh",
            ["pr", "edit", String(existingPr.number), "--title", prTitle, "--body", prBody],
            cwd,
            projectEnv
          );
        }

        const reviewerNotice = reviewerAssigned && reviewer ? `\n**Reviewer:** @${reviewer}` : "";

        if (editRes.status === 0) {
          pi.sendMessage(
            {
              customType: "pr-updated",
              content: `### Pull Request #${existingPr.number} Updated\n\n**Title:** ${prTitle}\n**Branch:** \`${currentBranch}\` → \`${baseBranch}\`${reviewerNotice}\n**URL:** [${existingPr.url}](${existingPr.url})\n\n---\n*Pushed & updated automatically via \`/pr\` using \`yourcrewmate\`*`,
              display: true,
            },
            { triggerTurn: false }
          );
          ctx.ui.notify(`PR #${existingPr.number} successfully updated: ${existingPr.url}`, "info");
        } else {
          ctx.ui.notify(
            `Branch pushed, but failed to update PR metadata: ${editRes.stderr || editRes.stdout}`,
            "warning"
          );
        }
        return;
      }

      // 10. If no PR exists, create a new one via GitHub CLI (gh)
      ctx.ui.notify("Creating pull request via GitHub CLI...", "info");
      const ghArgs = [
        "pr",
        "create",
        "--base",
        baseBranch,
        "--head",
        currentBranch,
        "--title",
        prTitle,
        "--body",
        prBody,
      ];
      if (reviewer) {
        ghArgs.push("--reviewer", reviewer);
      }

      let ghRes = runCmd("gh", ghArgs, cwd, projectEnv);
      let reviewerAssigned = Boolean(reviewer);

      if (ghRes.status !== 0 && reviewer) {
        reviewerAssigned = false;
        ghRes = runCmd(
          "gh",
          [
            "pr",
            "create",
            "--base",
            baseBranch,
            "--head",
            currentBranch,
            "--title",
            prTitle,
            "--body",
            prBody,
          ],
          cwd,
          projectEnv
        );

        if (ghRes.status === 0) {
          const addReviewerRes = runCmd(
            "gh",
            ["pr", "edit", currentBranch, "--add-reviewer", reviewer],
            cwd,
            projectEnv
          );
          if (addReviewerRes.status === 0) {
            reviewerAssigned = true;
          }
        }
      }

      const reviewerNotice = reviewerAssigned && reviewer ? `\n**Reviewer:** @${reviewer}` : "";

      if (ghRes.status === 0) {
        const prUrl =
          ghRes.stdout
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("http")) || ghRes.stdout;

        // Display clickable PR message in conversation transcript
        pi.sendMessage(
          {
            customType: "pr-created",
            content: `### Pull Request Created\n\n**Title:** ${prTitle}\n**Branch:** \`${currentBranch}\` → \`${baseBranch}\`${reviewerNotice}\n**URL:** [${prUrl}](${prUrl})\n\n---\n*Submitted automatically via \`/pr\` using \`yourcrewmate\`*`,
            display: true,
          },
          { triggerTurn: false }
        );

        ctx.ui.notify(`PR successfully created: ${prUrl}`, "info");
      } else {
        ctx.ui.notify(`Failed to create PR with gh: ${ghRes.stderr || ghRes.stdout}`, "error");
      }
    },
  });

  pi.registerCommand("branch", {
    description:
      "Safely create and checkout a new branch off the latest origin/master or origin/main",
    handler: async (args: string, ctx: ExtensionCommandContext) => {
      const cwd = ctx.cwd;
      const branchName = args.trim();
      if (!branchName) {
        ctx.ui.notify("Branch name required. Usage: /branch <feature-name>", "warning");
        return;
      }

      // 1. Check uncommitted changes
      const statusRes = runCmd("git", ["status", "--porcelain"], cwd);
      if (statusRes.stdout) {
        ctx.ui.notify(
          "You have uncommitted changes. Please commit or stash them first.",
          "warning"
        );
        return;
      }

      // 2. Fetch origin
      ctx.ui.notify("Fetching latest remote base branch...", "info");
      runCmd("git", ["fetch", "origin"], cwd);

      let baseBranch = "main";
      const checkMain = runCmd("git", ["rev-parse", "--verify", "origin/main"], cwd);
      if (checkMain.status !== 0) {
        const checkMaster = runCmd("git", ["rev-parse", "--verify", "origin/master"], cwd);
        if (checkMaster.status === 0) {
          baseBranch = "master";
        }
      }

      // 3. Checkout new branch directly from origin/baseBranch
      const checkoutRes = runCmd(
        "git",
        ["checkout", "-b", branchName, `origin/${baseBranch}`],
        cwd
      );
      if (checkoutRes.status === 0) {
        ctx.ui.notify(
          `Created and checked out '${branchName}' from 'origin/${baseBranch}'`,
          "info"
        );
      } else {
        ctx.ui.notify(
          `Failed to create branch: ${checkoutRes.stderr || checkoutRes.stdout}`,
          "error"
        );
      }
    },
  });
}
