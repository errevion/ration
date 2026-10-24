# Plan Mode Extension

Read-only exploration mode for safe code analysis and tracked autonomous execution.

## Features

- **Built-in write tools disabled**: Disables edit/write during planning while preserving read-only tools
- **Bash allowlist**: Only non-destructive bash commands are allowed
- **Plan extraction**: Extracts numbered steps from `Plan:` sections
- **Progress tracking**: Widget and status bar show completion status during execution
- **Resilient step completion tracking**: Supports `[DONE:n]`, flexible whitespace, comma-separated lists (`[DONE: 1, 2]`), range syntax (`[DONE: 1-5]`), and markdown task checkboxes (`1. [x]`)
- **Single-message execution dispatch**: Eliminates follow-up queue race conditions
- **Auto-reconciliation**: Automatically reconciles all remaining steps upon final commit step completion
- **Session persistence**: State survives session resume

## Commands

- `/plan` - Toggle plan mode
- `/todos` - Show current plan progress
- `/todos done <steps>` - Manually mark specific steps complete (e.g. `/todos done 1,2` or `/todos done 3-5`)
- `/todos done all` - Manually mark all steps complete and finalize execution
- `Ctrl+Alt+P` - Toggle plan mode (shortcut)

## Usage

1. Enable plan mode with `/plan` or `--plan` flag
2. Ask the agent to analyze code and create a plan
3. The agent should output a numbered plan under a `Plan:` header:

```
Plan:
1. First step description
2. Second step description
3. Third step description
```

4. Choose "Execute the plan" when prompted
5. During execution, the agent works through all steps sequentially and emits completion tags (`[DONE:n]`, `[DONE: 1-3]`, or `1. [x]`)
6. Progress widget shows live completion status

## How It Works

### Plan Mode (Read-Only)

- Built-in edit/write tools disabled
- Read-only tools remain available
- Bash commands filtered through allowlist
- Agent inspects codebase and creates a plan without making modifications

### Execution Mode

- Full tool access restored
- Agent executes steps sequentially
- Flexible tag parser marks steps completed across intermediate turns or batch summaries
- Final commit step triggers automatic step reconciliation if intermediate tags were batched
- Widget displays real-time progress

### Command Allowlist

Safe commands (allowed):
- File inspection: `cat`, `head`, `tail`, `less`, `more`
- Search: `grep`, `find`, `rg`, `fd`
- Directory: `ls`, `pwd`, `tree`
- Git read: `git status`, `git log`, `git diff`, `git branch`
- Package info: `npm list`, `npm outdated`, `yarn info`
- System info: `uname`, `whoami`, `date`, `uptime`

Blocked commands:
- File modification: `rm`, `mv`, `cp`, `mkdir`, `touch`
- Git write: `git add`, `git commit`, `git push`
- Package install: `npm install`, `yarn add`, `pip install`
- System: `sudo`, `kill`, `reboot`
- Editors: `vim`, `nano`, `code`
