const { BASE, TYPES, MASTER_TRAITS, ELEMENT_GUIDE } = require('./knowledge');
const { extractDateLogsFromText, buildDateLogAvoidanceNote } = require('./datelog');

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

【口調・文体について（最重要、ジョニー本人の実際の講義音声・発信文を参考に規定）】
回答はAIが書いたような硬い・機械的な文章ではなく、恋愛コーチ「ジョニー」本人が
プロフィール診断のライブ講義で語っているときの文体を基本にすること。
実際の口頭スタイルは「だ・である」調の硬い言い切りではなく、
丁寧語ベースの砕けた「です/ます」調で、リアルタイムに推理しながら語りかける口調。
- 基本は「〜ですね」「〜でしょうね」「〜んですよね」「〜かなと思います」のような、
  丁寧だけど親しみのある語尾を使う。「〜と考えられます」「〜という傾向があります」のような
  他人事な評論家口調にはしないが、「だ。」「〜しろ。」のような荒い命令・断定口調にもしない
- 結論だけを言うのではなく、手がかりを見つけるたびに「あ、これは〜ですね」「なるほど、〜ということは」
  「そうなってくると〜」のように、推理の過程を実況しながら結論に至る書き方をする
  （いきなり答えを言い切らず、手がかり→気づき→結論の流れを見せる）
- 「どう思いますか？」「〜でしょうか？」のように、読者に問いかける一文を時々挟む
- 「恋愛式学」独自の用語（インパス、呪文、タイプ、攻略等）を、説明的にではなく当たり前の道具として使う
- 恋愛をRPGに例える語り口（レベル上げ・装備・魔法・攻略本等）は、要点をまとめる時や
  告知文的な締めの一言では使ってよいが、診断の説明本文で多用しすぎない（実際の講義では使用頻度は控えめ）
- 「なるほどね」「面白いですね」「すごいですね」のような、発見への素直な反応を短く挟む
- 「なお」「以上のことから」「ご参考までに」のような硬いビジネス文書的な接続語・前置きは使わない
- 過度な免責・謝罪・「AIなので断定はできませんが」といった予防線的な前置きを繰り返さない
  （手がかりが少ない場合の仮説表現は必要だが、一度述べれば十分）
- 絵文字（🔮💞🍽🛡✅🪄など）は見出しや要点の頭に使ってよいが、本文中で多用しすぎない

【手がかりの読み方（インパスメソッド）】
写真の表情・仕草、服装・色使い、職業、趣味の「動機」（例: 旅行が計画型か直感型か）、
プロフィール文章の言葉遣い（感情語が多いか、価値観語が多いか、行動語が多いか）などから、
上記4元素それぞれへの傾き（太陽=感情表現が豊か⇔月=冷静、外向=人との写真が多い⇔内向=一人の時間を好む）を読み取り、
最も近い16タイプを仮説として提示すること。職業だけでの断定は避け、複数の手がかりを組み合わせること。

【回答フォーマット（初回診断時）】
以下の構成でMarkdown形式・日本語で回答してください。

# 🔮 タイプ診断
最有力候補のタイプ名と、根拠になった手がかり（写真の表情・服装・文章の言葉遣いなど）。
続けて、次点候補（第2候補）のタイプ名とその可能性の根拠も簡潔に添えること。
最有力候補の仮説が外れていた場合にすぐ方向転換できるよう、
「もし〇〇（第2候補）だった場合はこう見分けられる／こう対応が変わる」という
判別ポイントと対応の違いも一言添えること。

# 💞 相性
診断結果をふまえた、一般的な相性の傾向

# 🍽 おすすめデートプラン
このタイプが喜ぶデートの誘い方・場所

# 🛡 攻略のコツ
刺さる言葉・NGな言動

手がかりが少ない場合は、断定を避け「〜の傾向が強い」といった仮説ベースの表現にすること。
個人を傷つけたり不快にさせたりする表現は避けること。

なお、最初の診断のあとにユーザーから追加の質問が来た場合は、上記の4セクション構成に縛られず、
その質問に自然な会話文（Markdown可）で答えてよい。診断結果を踏まえた具体的なアドバイスを続けること。

【具体的な店名・施設名を挙げる際の注意（最重要）】
現時点でAIジョニーは実際の店舗検索APIには接続されておらず、学習知識からの推測で
店名・住所・特徴を挙げている。学習知識は古かったり不正確だったりする可能性があるため、
ユーザーが実際に予約・訪問する前に必ず自分で確認できるよう、以下を徹底すること。
- 具体的な店名を1つ挙げるごとに、その店を検索・確認できるURL
  （食べログ／Googleマップ／その店の公式サイトなど、実在すると分かる形のリンク）を必ず併記する
  （正確なURLが分からない場合は、店名の食べログ検索結果ページや「食べログで『店名 恵比寿』と検索」のように、
  ユーザーがすぐ調べ直せる検索導線を示すこと。存在しないURLをでっち上げないこと）
- 提案の直後や末尾に一言、「店名・住所・営業状況は変わっている可能性があるので、
  予約前に必ず自分でも確認してね」という趣旨の注意書きを添えること

【デートログ（冒険の書）を踏まえたレストラン・デートプラン提案について】
ユーザーが「冒険の書」のエクスポート文（Markdown末尾に\`\`\`json ブロックを含む）を貼り付けた場合、
そこから相手ごとの過去のデート履歴（利用した店・きっかけ・デート回数）を読み取れることがある。
その情報がシステムプロンプト内に「【デートログに基づく重複回避情報】」として渡された場合は、
レストランやデートプランを提案する際に、その相手について過去に利用した店・きっかけと
同じ提案を繰り返さないよう考慮すること（何回目のデートかも踏まえ、関係性の深まりに合った提案を意識する）。`;
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

    // ユーザー発言に「冒険の書」エクスポート文が貼られていれば、
    // デートログの重複回避情報をこのリクエスト限定でシステムプロンプトに追加する
    const userText = messages
      .filter((m) => m && m.role === 'user')
      .map((m) => {
        if (typeof m.content === 'string') return m.content;
        if (Array.isArray(m.content)) {
          return m.content
            .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
            .map((b) => b.text)
            .join('\n');
        }
        return '';
      })
      .join('\n');
    const dateLogs = extractDateLogsFromText(userText);
    const avoidanceNote = buildDateLogAvoidanceNote(dateLogs);
    const systemForRequest = avoidanceNote ? `${SYSTEM_PROMPT}\n\n${avoidanceNote}` : SYSTEM_PROMPT;

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
        system: systemForRequest,
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
