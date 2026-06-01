import Anthropic from '@anthropic-ai/sdk';
import type { VerdictPayload } from '@/lib/types';

// The coach. Server-only. Reads the actual diff, asks one pointed question,
// and judges the answer. Product rule, encoded in the prompts:
//   honesty + understanding keeps the streak (verdict 'good' or 'wrong');
//   evasiveness / bluffing does not (verdict 'none').
// "Strict about the code, on your side about the person."

const MODEL = 'claude-sonnet-4-6';

let _client: Anthropic | null = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
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
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 200,
    system: [
      {
        type: 'text',
        text:
          COACH_PERSONA +
          '\n\nAsk exactly ONE question that probes whether they understand a meaningful ' +
          'decision or tradeoff in THIS diff — not trivia, not something answerable without ' +
          'having written it. Reference something concrete from the diff. Output only the ' +
          'question, no preamble, no quotes.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content:
          `Today's commitment was: "${commitmentBody}"\n\n` +
          `Here is the diff they pushed:\n\n${diff || '(no diff text available)'}`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  return text || 'Walk me through the most important decision in this change — and what you traded off.';
}

interface EvaluateArgs {
  commitmentBody: string;
  diff: string;
  question: string;
  answer: string;
}

const VERDICT_TOOL: Anthropic.Tool = {
  name: 'render_verdict',
  description: 'Render the two-part verdict for the developer.',
  input_schema: {
    type: 'object',
    properties: {
      verdict: {
        type: 'string',
        enum: ['good', 'wrong', 'none'],
        description:
          "'good' = honest and correct understanding; 'wrong' = honest attempt but the " +
          "understanding is off (still counts — being wrong is fine); 'none' = evasive, " +
          'bluffed, or described what the code does without showing understanding (does NOT count).',
      },
      verdict_title: { type: 'string', description: 'Short headline for the streak verdict (<= 8 words).' },
      verdict_body: { type: 'string', description: 'One or two sentences on whether it counts and why. Warm but honest.' },
      lesson_title: { type: 'string', description: 'Short headline for the lesson (<= 8 words).' },
      lesson_body: { type: 'string', description: 'The actual teaching: what they missed or the next level. Specific to the diff.' },
      suggestion: { type: 'string', description: "A concrete, buildable commitment for tomorrow that follows from the lesson." },
    },
    required: ['verdict', 'verdict_title', 'verdict_body', 'lesson_title', 'lesson_body', 'suggestion'],
  },
};

export async function evaluateAnswer({
  commitmentBody,
  diff,
  question,
  answer,
}: EvaluateArgs): Promise<VerdictPayload> {
  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 700,
    system: [
      {
        type: 'text',
        text:
          COACH_PERSONA +
          '\n\nYou asked the developer one question about their diff. Judge their answer ' +
          'against the actual diff and call render_verdict.\n\n' +
          'RULES:\n' +
          "- The streak is about honesty and understanding, NOT correctness. A wrong-but-honest " +
          "answer COUNTS (verdict 'wrong'). Say so plainly so they are not punished for being wrong.\n" +
          "- Only withhold the streak (verdict 'none') when the answer is evasive: it dodges the " +
          'question, merely restates what the code does, or bluffs without real understanding.\n' +
          '- Always give a lesson that teaches the next level, grounded in their specific diff.\n' +
          '- The suggestion must be a concrete thing they could build/push tomorrow.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [VERDICT_TOOL],
    tool_choice: { type: 'tool', name: 'render_verdict' },
    messages: [
      {
        role: 'user',
        content:
          `Commitment: "${commitmentBody}"\n\n` +
          `Diff:\n${diff || '(no diff text available)'}\n\n` +
          `Question asked: ${question}\n\n` +
          `Their answer: ${answer}`,
      },
    ],
  });

  const toolUse = msg.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'render_verdict',
  );
  if (!toolUse) throw new Error('coach did not return a verdict');

  const p = toolUse.input as Partial<VerdictPayload>;
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
