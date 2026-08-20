// dashboard.html の「冒険の書」エクスポート文（Markdown末尾に埋め込まれたJSONブロック）から
// dateLogs を取り出し、レストラン提案時の重複回避（同じ相手に同じ店・きっかけを繰り返さない）情報を組み立てる。

function extractDateLogsFromText(text) {
  if (typeof text !== 'string') return [];
  const matches = [...text.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (matches.length === 0) return [];
  // 同じ会話内で複数回貼られた場合は最後（最新）のものを採用
  const last = matches[matches.length - 1][1];
  try {
    const data = JSON.parse(last);
    return Array.isArray(data.dateLogs) ? data.dateLogs : [];
  } catch (e) {
    return [];
  }
}

function buildDateLogAvoidanceNote(dateLogs) {
  if (!Array.isArray(dateLogs) || dateLogs.length === 0) return '';

  const byName = {};
  dateLogs.forEach((e) => {
    const name = (e && e.name && e.name.trim()) || '（名前未記入の相手）';
    if (!byName[name]) byName[name] = [];
    byName[name].push(e);
  });

  const lines = Object.entries(byName).map(([name, logs]) => {
    const sorted = [...logs].sort((a, b) => String(a.datetime || '').localeCompare(String(b.datetime || '')));
    const visited = sorted
      .map((e) => {
        const shop = (e.shop || '').trim();
        const tool = (e.tool || '').trim();
        if (!shop) return null;
        return tool ? `${shop}（${tool}経由）` : shop;
      })
      .filter(Boolean);
    const visitCount = sorted.length;
    const lastEntry = sorted[sorted.length - 1] || {};
    const nextVisitNo = (parseInt(lastEntry.visitCount, 10) || visitCount) + 1;
    return `- ${name}（これまで${visitCount}回デート済み、次回は${nextVisitNo}回目想定）: `
      + (visited.length ? `過去に利用した店 → ${visited.join('、')}` : '過去の店情報なし');
  });

  return `【デートログに基づく重複回避情報（冒険の書より）】\n`
    + `レストラン・デートプランを提案する際は、以下の相手について過去に利用した店・きっかけと同じにならないよう配慮してください。\n`
    + lines.join('\n');
}

module.exports = { extractDateLogsFromText, buildDateLogAvoidanceNote };
