import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Your local LM Studio endpoint
const LM_URL = 'http://127.0.0.1:1234/v1/chat/completions';

// ✅ Match your locally loaded model name exactly as shown in LM Studio
const MODEL = 'qwen3-8b';

function extractTS(raw) {
  if (!raw) return '';
  // Drop any <think> tags and keep only code/fence/import onwards
  let out = raw.replace(/<\/?think>/gi, '');

  const fenceMatch = out.match(/```[a-zA-Z-]*\n([\s\S]*?)```/);
  if (fenceMatch) out = fenceMatch[1];

  const importNeedle = "import { test, expect } from '@playwright/test'";
  const i = out.indexOf(importNeedle);
  if (i >= 0) out = out.slice(i);

  return out.replace(/```/g, '').trim();
}

function looksLikePlaywright(ts) {
  return (
    ts.includes("import { test, expect } from '@playwright/test'") &&
    /test\s*\(\s*['"`]/.test(ts)
  );
}

function fallbackFromYaml(story) {
  const title = `${story?.id ?? 'US-XXX'} ${story?.title ?? 'Generated test'}`;
  // Uses baseURL + httpCredentials from playwright.config.ts → goto('/')
  return `import { test, expect } from '@playwright/test';

test('${title}', async ({ page }) => {
  await page.goto('/');

  await page.fill('#email', 'demo@bank.test');
  await page.fill('#password', 'demo123');

  // Try common locators for the login action
  const loginBtn = page.getByRole('button', { name: /login/i });
  if (await loginBtn.isVisible()) {
    await loginBtn.click();
  } else if (await page.locator('text=Login').first().isVisible()) {
    await page.locator('text=Login').first().click();
  } else if (await page.locator('#login, #login-btn').first().isVisible()) {
    await page.locator('#login, #login-btn').first().click();
  }

  await expect(page.locator('#token')).toHaveText('demo-token');

  await page.click('#loadAccounts');

  // Try to read JSON from common containers
  const pre = page.locator('pre, #accounts, textarea').first();
  await expect(pre).toBeVisible({ timeout: 5000 });
  const text = (await pre.textContent()) || '';

  try {
    const obj = JSON.parse(text);
    const s = JSON.stringify(obj);
    expect(s).toContain('ACC-001');
    expect(s).toContain('ACC-002');
  } catch {
    expect(text).toContain('ACC-001');
    expect(text).toContain('ACC-002');
  }
});`;
}

async function callLLM({ prompt, temperature }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const resp = await fetch(LM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lm-studio',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              "You generate ONLY Playwright TypeScript tests. Output a single fenced ts block starting with: import { test, expect } from '@playwright/test'; Do NOT include explanations or <think>.",
          },
          { role: 'user', content: prompt },
        ],
        temperature,
        stream: false,
        max_tokens: 1200,
        // NOTE: no "stop" param — avoids LM Studio 400 bug
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`LM Studio HTTP ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: npm run generate -- requirements/US-001-login.yaml');
    process.exit(1);
  }

  const abs = path.resolve(process.cwd(), input);
  const raw = await fs.readFile(abs, 'utf-8');
  const story = YAML.parse(raw);

  const prompt = `
You are a senior QA engineer generating a Playwright test (TypeScript) for a tiny banking app.
Output ONLY a single \`\`\`ts code block. No explanations, no comments, no <think> text.

Constraints:
- Use Playwright config baseURL (or http://demo:secret@localhost:3001 if needed)
- Fill #email and #password, click Login, wait for token "demo-token" in #token
- Click #loadAccounts and expect JSON to include ACC-001 and ACC-002
- Name the test: "${story.id} ${story.title}"
- Use: import { test, expect } from '@playwright/test';

YAML:
${raw}
`.trim();

  console.log('→ Calling LM Studio at http://127.0.0.1:1234/v1/chat/completions …');

  let code = '';
  try {
    // Try 1
    let rawOut = await callLLM({ prompt, temperature: 0.2 });
    code = extractTS(rawOut);

    // Validate; if bad, Retry once at temp 0
    if (!looksLikePlaywright(code)) {
      console.warn("(!) Model didn't return clean TS. Retrying…");
      const retryPrompt =
        prompt +
        '\n\nReturn ONLY a fenced ```ts block that starts with the import line.';
      rawOut = await callLLM({ prompt: retryPrompt, temperature: 0 });
      code = extractTS(rawOut);
    }
  } catch (e) {
    console.warn('(!) LLM call failed, using deterministic fallback.');
    code = '';
  }

  // Final guard: fallback template if invalid or empty
  if (!looksLikePlaywright(code)) {
    code = fallbackFromYaml(story);
  }

  const outPath = path.join(process.cwd(), 'tests', 'e2e', `${story.id}.spec.ts`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, code, 'utf-8');

  console.log('\n--- GENERATED TEST ---\n');
  console.log(code);
  console.log(`\nSaved to ${outPath}`);
}

main().catch((err) => {
  console.error('\n✖ Failed to generate test.');
  console.error(err);
  process.exit(1);
});
