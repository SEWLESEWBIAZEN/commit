import OpenAI from 'openai';
import type { VerdictPayload } from '@/lib/types';

// The coach. Server-only. Reads the actual diff, asks one pointed question,
// and judges the answer. Product rule, encoded in the prompts:
//   honesty + understanding keeps the streak (verdict 'good' or 'wrong');
//   evasiveness / bluffing does not (verdict 'none').
// "Strict about the code, on your side about the person."
//
// Backed by an OpenAI-compatible endpoint (NVIDIA-hosted gpt-oss).

const MODEL = 'openai/gpt-oss-20b';

let _client: OpenAI | null = null;
function client() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY!,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }
  return _client;
}

const COACH_PERSONA =
  'You are the coach in Commit, a daily discipline app for self-taught developers. ' +
  'You read the real git diff the developer just pushed and hold them to a high bar on ' +
  'the engineering — but you are always on their side as a person. You are concise, ' +
  'direct, and never flattering.';

interface QuestionArgs {
  commitmentBody: string;
  diff: string;
}

// One pointed question about the actual change. Returns a single sentence.
export async function generateQuestion({ commitmentBody, diff }: QuestionArgs): Promise<string> {
  const completion = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.7,
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content:
          COACH_PERSONA +
          '\n\nAsk exactly ONE question that probes whether they understand a meaningful ' +
          'decision or tradeoff in THIS diff — not trivia, not something answerable without ' +
          'having written it. Reference something concrete from the diff. Output only the ' +
          'question, no preamble, no quotes.',
      },
      {
        role: 'user',
        content:
          `Today's commitment was: "${commitmentBody}"\n\n` +
          `Here is the diff they pushed:\n\n${diff || '(no diff text available)'}`,
      },
    ],
  });

  const text = (completion.choices[0]?.message?.content ?? '').trim();
  return text || 'Walk me through the most important decision in this change — and what you traded off.';
}

interface EvaluateArgs {
  commitmentBody: string;
  diff: string;
  question: string;
  answer: string;
  // A short, human-readable summary of the developer's recent mood/energy
  // check-ins (e.g. "energy has been low (avg 2/5) over the last 5 days").
  // Used to shape the lesson + tomorrow's suggestion, never the verdict.
  moodContext?: string;
}

// Pull the first JSON object out of a model response (which may be wrapped in
// code fences or preceded by prose/reasoning).
function extractJson(raw: string): Record<string, unknown> {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('coach returned no JSON');
  return JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
}

const VERDICT_INSTRUCTIONS =
  COACH_PERSONA +
  '\n\nYou asked the developer one question about their diff. Judge their answer ' +
  'against the actual diff.\n\n' +
  'RULES:\n' +
  "- The streak is about honesty and understanding, NOT correctness. A wrong-but-honest " +
  "answer COUNTS (verdict 'wrong'). Say so plainly so they are not punished for being wrong.\n" +
  "- Only withhold the streak (verdict 'none') when the answer is evasive: it dodges the " +
  'question, merely restates what the code does, or bluffs without real understanding.\n' +
  '- Always give a lesson that teaches the next level, grounded in their specific diff.\n' +
  '- The suggestion must be a concrete thing they could build/push tomorrow.\n' +
  '- You may be given recent mood/energy context. NEVER let it affect the verdict. Use it ' +
  "only to right-size tomorrow's suggestion (lighter scope on a low-energy run, a stretch " +
  "when they're flying) and, when it clearly fits, to add one brief, non-preachy line of " +
  'human encouragement in the lesson. If no context is given, ignore this rule.\n\n' +
  'Respond with ONLY a single JSON object (no prose, no code fences) with exactly these keys:\n' +
  '  "verdict": one of "good" | "wrong" | "none"\n' +
  "    ('good' = honest and correct understanding; 'wrong' = honest attempt but the " +
  "understanding is off — still counts; 'none' = evasive, bluffed, or just restated what " +
  'the code does — does NOT count)\n' +
  '  "verdict_title": short headline for the streak verdict (<= 8 words)\n' +
  '  "verdict_body": one or two sentences on whether it counts and why — warm but honest\n' +
  '  "lesson_title": short headline for the lesson (<= 8 words)\n' +
  '  "lesson_body": the actual teaching — what they missed or the next level, specific to the diff\n' +
  '  "suggestion": a concrete, buildable commitment for tomorrow that follows from the lesson';

export async function evaluateAnswer({
  commitmentBody,
  diff,
  question,
  answer,
  moodContext,
}: EvaluateArgs): Promise<VerdictPayload> {
  const completion = await client().chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: VERDICT_INSTRUCTIONS },
      {
        role: 'user',
        content:
          `Commitment: "${commitmentBody}"\n\n` +
          `Diff:\n${diff || '(no diff text available)'}\n\n` +
          `Question asked: ${question}\n\n` +
          `Their answer: ${answer}` +
          (moodContext ? `\n\nRecent mood/energy (context only, not for the verdict): ${moodContext}` : ''),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '';
  const p = extractJson(raw) as Partial<VerdictPayload>;

  if (!p.verdict || !['good', 'wrong', 'none'].includes(p.verdict)) {
    throw new Error('coach returned an invalid verdict');
  }

  return {
    verdict: p.verdict,
    verdict_title: p.verdict_title ?? '',
    verdict_body: p.verdict_body ?? '',
    lesson_title: p.lesson_title ?? '',
    lesson_body: p.lesson_body ?? '',
    suggestion: p.suggestion ?? '',
  };
}
