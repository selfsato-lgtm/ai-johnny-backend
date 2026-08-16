const { BASE, TYPES, MASTER_TRAITS, ELEMENT_GUIDE } = require('./knowledge');

function buildSystemPrompt() {
  const baseText = Object.entries(BASE)
    .map(([k, b]) => `- ${b.name}(${k}) ${b.elem}｜好む: ${b.like.join('/')}｜嫌う: ${b.weak.join('/')}｜刺さる例: ${b.phrase}`)
    .join('\n');

  const typesText = TYPES.map((t) => `${t.code}（${BASE[t.p].name}×${BASE[t.s].name}）`).join('、');

  const traitsText = TYPES.map((t) => {
    const m = MASTER_TRAITS[t.code] || {};
    const lines = [`### ${t.code}（${BASE[t.p].name}×${BASE[t.s].name}）`];
    const fieldLabels = {
      personality: '性格', values: '価値観', strengths: '長所', weaknesses: '短所',
      loveView: '恋愛観', communication: 'コミュニケーション', relationship: '関係性',
      okWords: '刺さる言葉', ngWords: '避けるべき言葉', dateStyle: 'デート傾向',
    };
    Object.entries(fieldLabels).forEach(([key, label]) => {
      if (Array.isArray(m[key]) && m[key].length) {
        lines.push(`${label}: ${m[key].join('／')}`);
      }
    });
    return lines.join('\n');
  }).join('\n\n');

  const guideText = Object.entries(ELEMENT_GUIDE)
    .map(([k, v]) => `- ${BASE[k].name}(${k}): ${v}`)
    .join('\n');

  return `あなたは「AIジョニー」。恋愛式学（ジョニー式・16タイプ診断）の専門家として、
ユーザーがアップロードした写真・動画のフレーム・プロフィール文章などの手がかりから、
気になる相手のタイプを推測しアドバイスするAIです。

【最重要ルール】
- 診断・説明には必ず「恋愛式学」独自の16タイプ体系（戦士/踊り子/僧侶/魔法使いの4元素とその組み合わせ）だけを使うこと。
- MBTI（ESTJ, INFPなど）や他の性格診断の用語・型式は絶対に一切使わない・言及しないこと。ユーザーがMBTIについて聞いても「恋愛式学は独自の体系です」と伝え、恋愛式学の言葉で答えること。

【4元素（すべての土台）】
${baseText}

【16タイプ一覧（主元素×副元素の組み合わせ）】
${typesText}
※ 主副が同じ（例: 戦士×戦士=狂戦士）は「ド直球」タイプと呼ぶ。

【16タイプ詳細特性（FANTS パーソナル恋愛式学 継承マスター講座資料より）】
${traitsText}

【インパスメソッド：4元素ごとの刺さる言葉・デート・NG・連絡スタイル】
${guideText}

【手がかりの読み方（インパスメソッド）】
写真の表情・仕草、服装・色使い、職業、趣味の「動機」（例: 旅行が計画型か直感型か）、
プロフィール文章の言葉遣い（感情語が多いか、価値観語が多いか、行動語が多いか）などから、
上記4元素それぞれへの傾き（太陽=感情表現が豊か⇔月=冷静、外向=人との写真が多い⇔内向=一人の時間を好む）を読み取り、
最も近い16タイプを仮説として提示すること。職業だけでの断定は避け、複数の手がかりを組み合わせること。

【回答フォーマット（初回診断時）】
以下の構成でMarkdown形式・日本語で回答してください。

# 🔮 タイプ診断
最有力候補のタイプ名と、根拠になった手がかり（写真の表情・服装・文章の言葉遣いなど）

# 💞 相性
診断結果をふまえた、一般的な相性の傾向

# 🍽 おすすめデートプラン
このタイプが喜ぶデートの誘い方・場所

# 🛡 攻略のコツ
刺さる言葉・NGな言動

手がかりが少ない場合は、断定を避け「〜の傾向が強い」といった仮説ベースの表現にすること。
個人を傷つけたり不快にさせたりする表現は避けること。

なお、最初の診断のあとにユーザーから追加の質問が来た場合は、上記の4セクション構成に縛られず、
その質問に自然な会話文（Markdown可）で答えてよい。診断結果を踏まえた具体的なアドバイスを続けること。`;
}

const SYSTEM_PROMPT = buildSystemPrompt();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POSTメソッドのみ対応しています' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'サーバー側にAPIキーが設定されていません' });
    return;
  }

  try {
    let { messages, images, note } = req.body || {};

    // 旧形式（画像・メモのみ）との互換: messagesが無ければ1ターン分を組み立てる
    if (!Array.isArray(messages)) {
      const imageList = Array.isArray(images) ? images : [];
      const noteText = typeof note === 'string' ? note.trim() : '';
      if (imageList.length === 0 && !noteText) {
        res.status(400).json({ error: '画像またはテキストを1つ以上指定してください' });
        return;
      }
      const content = [];
      imageList.slice(0, 8).forEach((img) => {
        if (img && img.data && img.media_type) {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: img.media_type, data: img.data },
          });
        }
      });
      content.push({
        type: 'text',
        text: noteText
          ? `プロフィール文章・メモ:\n${noteText}\n\n上記の画像とテキストから恋愛式学タイプを診断してください。`
          : '上記の画像から恋愛式学タイプを診断してください。',
      });
      messages = [{ role: 'user', content }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messagesが空です' });
      return;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: `Anthropic APIエラー: ${errText}` });
      return;
    }

    const data = await response.json();
    const resultText = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    res.status(200).json({ result: resultText });
  } catch (err) {
    res.status(500).json({ error: `サーバーエラー: ${err.message}` });
  }
};
