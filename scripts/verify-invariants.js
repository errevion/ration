import fs from "node:fs";
import path from "node:path";

const SCAN_DIRS = ["apps", "packages"];
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

const ALLOWED_COMMENT_PATTERNS = [
  /^\/\/\s*biome-ignore\b/,
  /^\/\/\/\s*<reference\b/,
  /^\/\/\s*@ts-/,
  /^\/\/\s*eslint-disable/,
];

function getSourceFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === "build" ||
        entry.name === "android" ||
        entry.name === "ios" ||
        entry.name === ".expo"
      ) {
        continue;
      }
      files.push(...getSourceFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext) && !entry.name.endsWith(".d.ts")) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const errors = [];

  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    if (EMOJI_REGEX.test(line)) {
      errors.push({
        line: lineNum,
        type: "EMOJI",
        message: "Emoji character detected. Emojis are strictly forbidden.",
        snippet: line.trim(),
      });
    }

    const trimmed = line.trim();

    if (inBlockComment) {
      if (trimmed.includes("*/")) {
        inBlockComment = false;
      }
      errors.push({
        line: lineNum,
        type: "COMMENT",
        message: "Block comment detected. Code must be self-documenting without comments.",
        snippet: trimmed,
      });
      continue;
    }

    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) {
        inBlockComment = true;
      }
      errors.push({
        line: lineNum,
        type: "COMMENT",
        message: "Block comment detected. Code must be self-documenting without comments.",
        snippet: trimmed,
      });
      continue;
    }

    if (trimmed.startsWith("//")) {
      const isAllowed = ALLOWED_COMMENT_PATTERNS.some((pattern) => pattern.test(trimmed));
      if (!isAllowed) {
        errors.push({
          line: lineNum,
          type: "COMMENT",
          message: "Line comment detected. Code must be self-documenting without comments.",
          snippet: trimmed,
        });
      }
    }

    const normalizedPath = filePath.split(String.fromCharCode(92)).join("/");
    if (normalizedPath.endsWith(".tsx") && normalizedPath.includes("apps/")) {
      const placeholderMatch = line.match(/placeholder="([^"]+)"/);
      if (placeholderMatch && !placeholderMatch[1].startsWith("{")) {
        errors.push({
          line: lineNum,
          type: "UNTRANSLATED_STRING",
          message:
            "Hardcoded placeholder string literal detected. Use placeholder={t(...)} instead.",
          snippet: line.trim(),
        });
      }
    }
  }

  const normalizedPath = filePath.split(String.fromCharCode(92)).join("/");
  if (normalizedPath.endsWith(".tsx") && normalizedPath.includes("apps/")) {
    const allowedLiterals = ["EN", "ID", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const textMatches = content.matchAll(/<Text[^>]*>([^<{}]+)<\/Text>/gs);
    for (const match of textMatches) {
      const textVal = match[1].trim();
      if (textVal && !allowedLiterals.includes(textVal) && /[a-zA-Z]{2,}/.test(textVal)) {
        const offset = match.index ?? 0;
        const lineNum = content.slice(0, offset).split(/\r?\n/).length;
        errors.push({
          line: lineNum,
          type: "UNTRANSLATED_STRING",
          message: "Direct text literal detected in <Text>. Use t(...) translation hook.",
          snippet: textVal,
        });
      }
    }
  }

  return errors;
}

function run() {
  const allFiles = SCAN_DIRS.flatMap(getSourceFiles);
  let hasErrors = false;

  for (const file of allFiles) {
    const errors = checkFile(file);
    if (errors.length > 0) {
      hasErrors = true;
      console.error(`\n[INVARIANT VIOLATION] ${file}`);
      for (const err of errors) {
        console.error(`  Line ${err.line} [${err.type}]: ${err.message}`);
        console.error(`    > ${err.snippet}`);
      }
    }
  }

  if (hasErrors) {
    console.error("\nInvariant check failed! Please fix the violations above.\n");
    process.exit(1);
  } else {
    console.log(
      `[Invariant Check Passed] Scanned ${allFiles.length} files. Zero emojis, zero redundant comments, and zero untranslated UI strings.`
    );
  }
}

run();
