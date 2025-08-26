import { NextRequest, NextResponse } from 'next/server';

type Edit = { start: number; end: number; original: string; suggestion: string; reason: string; severity: 'minor'|'major' };

const RULES: Array<[RegExp, (m: RegExpExecArray) => string, string]> = [
  [/\bteh\b/gi, ()=>'the', 'common typo'],
  [/\bdont\b/gi, ()=>"don't", 'apostrophe'],
  [/\boccured\b/gi, ()=>'occurred', 'spelling'],
  [/\bseperate\b/gi, ()=>'separate', 'spelling'],
];

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (typeof text !== 'string') return NextResponse.json({ error: 'text required' }, { status: 400 });

  const edits: Edit[] = [];
  for (const [re, fix, reason] of RULES) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const original = m[0];
      const suggestion = fix(m);
      const start = m.index;
      const end = m.index + m[0].length;
      edits.push({ start, end, original, suggestion, reason, severity: 'minor' });
    }
  }
  return NextResponse.json({ corrected: text, edits });
}
