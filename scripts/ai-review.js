import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';

const LM_URL = 'http://127.0.0.1:1234/v1/chat/completions';
const MODEL = 'qwen/qwen3-8b';

function mdEscape(s) {
  return s.replace(/```/g, '\\`\\`\\`');
}

async function callLLM(prompt) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(LM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lm-studio'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are a senior QA reviewer. Output ONLY concise Markdown. No code fences unless showing code.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        stream: false,
        max_tokens: 800
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.choices?.[0]?.message?.content ?? '').trim();
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const yamlPath = process.argv[2] || 'requirements/US-001-login.yaml';
  const rawYaml = await fs.readFile(yamlPath, 'utf-8');
  const story = YAML.parse(rawYaml);
  const specPath = path.join('tests', 'e2e', `${story.id}.spec.ts`);

  const code = await fs.readFile(specPath, 'utf-8').catch(() => '');
  if (!code) {
    console.error(`Spec not found: ${specPath}. Generate it first.`);
    process.exit(1);
  }

  const prompt = `
Review the Playwright test below against the YAML story.
Return a **short markdown report** with these sections (bulleted, max 2–3 bullets each):
- Correctness gaps (missing steps/assertions)
- Selector quality & stability (suggest resilient alternatives)
- Assertions quality (what else to assert?)
- Flakiness risks & how to harden (timeouts, waits, retries)
- Security/data notes (secrets, PII, basic-auth, token handling)
- Top 3 concrete improvements (with tiny code hints)

YAML Story:
${mdEscape(rawYaml)}

Playwright Test:
${mdEscape(code)}
`.trim();

  const review = await callLLM(prompt).catch(e => `**AI review unavailable:** ${String(e)}\n\n- Ensure LM Studio is running.\n- Endpoint: ${LM_URL}\n`);

  const out = `# AI Test Review – ${story.id} ${story.title}

- Spec file: \`${specPath}\`
- Model: \`${MODEL}\`
- Generated: ${new Date().toISOString()}

${review}
`;

  await fs.mkdir('reports', { recursive: true });
  const outPath = path.join('reports', `ai-review-${story.id}.md`);
  await fs.writeFile(outPath, out, 'utf-8');
  console.log(`Wrote ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
