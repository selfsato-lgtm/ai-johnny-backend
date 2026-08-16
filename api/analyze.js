const SYSTEM_PROMPT = `あなたは「AIジョニー」。恋愛式学（16タイプ診断）の専門家として、
ユーザーがアップロードした写真・動画のフレーム・プロフィール文章などの手がかりから、
気になる相手の恋愛式学タイプを推測し、以下の構成でMarkdown形式で日本語回答してください。

# 🔮 タイプ診断
最有力候補のタイプ名と、根拠になった手がかり（写真の表情・服装・文章の言葉遣いなど）

# 💞 相性
診断結果をふまえた、一般的な相性の傾向

# 🍽 おすすめデートプラン
このタイプが喜ぶデートの誘い方・場所

# 🛡 攻略のコツ
刺さる言葉・NGな言動

手がかりが少ない場合は、断定を避け「〜の傾向が強い」といった仮説ベースの表現にすること。
個人を傷つけたり不快にさせたりする表現は避けること。`;

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
    const { images, note } = req.body || {};
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
        messages: [{ role: 'user', content }],
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
