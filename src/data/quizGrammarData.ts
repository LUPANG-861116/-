// 日檢專屬文法題庫：助詞填空 (助詞選択) 與 動詞/形容詞活用形態 (活用・文法形式)
import type { JLPTLevel } from '../types';

export interface GrammarQuizItem {
  id: string;
  level: JLPTLevel;
  type: 'particle' | 'conjugation';
  prompt: string;          // 題目（含空欄 ＿＿＿）
  promptZh: string;        // 題目中文
  options: string[];       // 4 個選項
  correctAnswer: number;   // 0 ~ 3
  explanationZh: string;   // 詳細解析說明
  categoryName: string;    // 分類標籤 (如: 助詞選択、動詞可能形、受身形等)
}

export const allGrammarQuizData: GrammarQuizItem[] = [
  // ===================== 助詞選択 (Particles) =====================
  {
    id: 'g_p_01',
    level: 'N5',
    type: 'particle',
    prompt: '毎朝、七時（　）起きます。',
    promptZh: '每天早上七點起床。',
    options: ['に', 'で', 'を', 'が'],
    correctAnswer: 0,
    explanationZh: '具體明確的時間點後面要接時間助詞「に」，故選「に」。',
    categoryName: '時間助詞 に'
  },
  {
    id: 'g_p_02',
    level: 'N5',
    type: 'particle',
    prompt: '図書館（　）日本語を勉強します。',
    promptZh: '在圖書館學習日語。',
    options: ['で', 'に', 'へ', 'を'],
    correctAnswer: 0,
    explanationZh: '表示動作進行的場所時使用助詞「で」，故選「で」。',
    categoryName: '動作場所 で'
  },
  {
    id: 'g_p_03',
    level: 'N5',
    type: 'particle',
    prompt: '電車（　）会社へ行きます。',
    promptZh: '搭乘電車去公司。',
    options: ['で', 'に', 'を', 'と'],
    correctAnswer: 0,
    explanationZh: '表示交通工具或手段工具時使用助詞「で」，故選「で」。',
    categoryName: '交通手段 で'
  },
  {
    id: 'g_p_04',
    level: 'N5',
    type: 'particle',
    prompt: '明日、友達（　）会います。',
    promptZh: '明天要跟朋友見面。',
    options: ['に', 'を', 'で', 'へ'],
    correctAnswer: 0,
    explanationZh: '動詞「会う（見面）」的對象必須使用助詞「に」（友達に会う），故選「に」。',
    categoryName: '對象助詞 に'
  },
  {
    id: 'g_p_05',
    level: 'N5',
    type: 'particle',
    prompt: '机の上に 本（　）ノートがあります。',
    promptZh: '桌上有書本和筆記本。',
    options: ['と', 'や', 'で', 'に'],
    correctAnswer: 0,
    explanationZh: '完全列舉多個名詞時使用並列助詞「と（和、與）」，故選「と」。',
    categoryName: '並列助詞 と'
  },
  {
    id: 'g_p_06',
    level: 'N4',
    type: 'particle',
    prompt: '部屋（　）入るときは、ノックをしてください。',
    promptZh: '進入房間時請敲門。',
    options: ['に', 'を', 'で', 'へ'],
    correctAnswer: 0,
    explanationZh: '進入特定空間或到達目的地時，著落點使用助詞「に（～に入る）」，故選「に」。',
    categoryName: '進入點 に'
  },
  {
    id: 'g_p_07',
    level: 'N4',
    type: 'particle',
    prompt: '電車（　）降りて、バスに乗り換えます。',
    promptZh: '下電車後換乘公車。',
    options: ['を', 'に', 'で', 'から'],
    correctAnswer: 0,
    explanationZh: '離開場所或下車時，出發點/離去點使用助詞「を（～を降りる）」，故選「を」。',
    categoryName: '離去點 を'
  },
  {
    id: 'g_p_08',
    level: 'N4',
    type: 'particle',
    prompt: '公園（　）散歩しながら、音楽を聴きます。',
    promptZh: '在公園邊散步邊聽音樂。',
    options: ['を', 'で', 'に', 'へ'],
    correctAnswer: 0,
    explanationZh: '通過、經過或移動的場所（如散歩する、歩く、渡る）使用助詞「を」，故選「を」。',
    categoryName: '移動通過 を'
  },
  {
    id: 'g_p_09',
    level: 'N3',
    type: 'particle',
    prompt: '先生（　）褒められて、とても嬉しかったです。',
    promptZh: '被老師稱讚了，非常高興。',
    options: ['に', 'を', 'で', 'と'],
    correctAnswer: 0,
    explanationZh: '被動句（受身文）中，動作的主體/發起者使用助詞「に（～に褒められる）」，故選「に」。',
    categoryName: '被動主體 に'
  },
  {
    id: 'g_p_10',
    level: 'N3',
    type: 'particle',
    prompt: '台風（　）よって、多くの電車が止まりました。',
    promptZh: '由於颱風的影響，許多電車停駛了。',
    options: ['に', 'で', 'を', 'と'],
    correctAnswer: 0,
    explanationZh: '表示原因、理由或手段時常使用片語「～によって」，此處接助詞「に」，故選「に」。',
    categoryName: '原因片語 ～によって'
  },
  {
    id: 'g_p_11',
    level: 'N2',
    type: 'particle',
    prompt: '環境問題（　）関する調査を始めました。',
    promptZh: '開始了關於環境問題的調查。',
    options: ['に', 'を', 'で', 'と'],
    correctAnswer: 0,
    explanationZh: '表示「關於/有關...」的句型為「～に関する / ～に関して」，前面接助詞「に」，故選「に」。',
    categoryName: '相關片語 ～に関する'
  },
  {
    id: 'g_p_12',
    level: 'N1',
    type: 'particle',
    prompt: '理由の如何（　）かかわらず、遅刻は認められません。',
    promptZh: '無論理由為何，遲到都是不被容許的。',
    options: ['に', 'を', 'で', 'と'],
    correctAnswer: 0,
    explanationZh: 'N1 經典文法「～に関わらず / ～に拘わらず（無論...與否）」固定接助詞「に」，故選「に」。',
    categoryName: 'N1 文法 ～にかかわらず'
  },

  // ===================== 活用・文法形態 (Conjugations) =====================
  {
    id: 'g_c_01',
    level: 'N5',
    type: 'conjugation',
    prompt: '昨日、家でテレビを（　）。',
    promptZh: '昨天在家看了電視。',
    options: ['見ました', '見ます', '見て', '見ない'],
    correctAnswer: 0,
    explanationZh: '時間詞「昨日（昨天）」表示過去發生的事情，動詞需使用過去式「見ました」，故選第一項。',
    categoryName: '動詞過去式 (～ました)'
  },
  {
    id: 'g_c_02',
    level: 'N5',
    type: 'conjugation',
    prompt: '日本へ旅行に（　）たいです。',
    promptZh: '我想去日本旅行。',
    options: ['行き', '行く', '行って', '行った'],
    correctAnswer: 0,
    explanationZh: '表達第一人稱願望的「～たい」需接在動詞連用形（ます形去ます）之後：行きます ➜「行き」たい，故選「行き」。',
    categoryName: '願望形 (～たい)'
  },
  {
    id: 'g_c_03',
    level: 'N5',
    type: 'conjugation',
    prompt: 'ここで写真を（　）はいけません。',
    promptZh: '這裡不可以拍照。',
    options: ['撮って', '撮り', '撮る', '撮った'],
    correctAnswer: 0,
    explanationZh: '禁止句型「～てはいけません（不可以...）」需接動詞 て 形：撮る ➜「撮って」，故選「撮って」。',
    categoryName: '禁止形 (～てはいけません)'
  },
  {
    id: 'g_c_04',
    level: 'N4',
    type: 'conjugation',
    prompt: '富士山に（　）ことがあります。',
    promptZh: '我曾經爬過富士山。',
    options: ['登った', '登る', '登って', '登り'],
    correctAnswer: 0,
    explanationZh: '表達過去經驗的句型「～たことがあります」必須接動詞 た 形（過去式）：登る ➜「登った」，故選「登った」。',
    categoryName: '經驗形 (～たことがある)'
  },
  {
    id: 'g_c_05',
    level: 'N4',
    type: 'conjugation',
    prompt: '風邪を引いたので、早く（　）ほうがいいです。',
    promptZh: '因為感冒了，最好早點睡覺。',
    options: ['寝た', '寝る', '寝て', '寝ない'],
    correctAnswer: 0,
    explanationZh: '表示肯定建議的句型「～たほうがいいです（最好做...）」需接動詞 た 形：寝る ➜「寝た」，故選「寝た」。',
    categoryName: '建議形 (～たほうがいい)'
  },
  {
    id: 'g_c_06',
    level: 'N4',
    type: 'conjugation',
    prompt: '一人で漢字を（　）ことができます。（可能表達）',
    promptZh: '能夠自己一個人寫漢字。',
    options: ['書く', '書いて', '書いた', '書き'],
    correctAnswer: 0,
    explanationZh: '能力句型「～ことができる」前面必須接動詞辭書形（原形）：故選「書く」。',
    categoryName: '能力句型 (～辞書形+ことができる)'
  },
  {
    id: 'g_c_07',
    level: 'N3',
    type: 'conjugation',
    prompt: '明日、雨が（　）たら、試合は中止になります。',
    promptZh: '明天如果下雨的話，比賽將會中止。',
    options: ['降っ', '降る', '降り', '降れば'],
    correctAnswer: 0,
    explanationZh: '假定條件句型「～たら」接在動詞 た 形之後：降る ➜ 降った ➜「降ったら」，故選「降っ」。',
    categoryName: '假定條件形 (～たら)'
  },
  {
    id: 'g_c_08',
    level: 'N3',
    type: 'conjugation',
    prompt: '先生に難しい質問を（　）ました。（被動受身）',
    promptZh: '被老師問了很困難的問題。',
    options: ['聞かれ', '聞き', '聞いて', '聞かせ'],
    correctAnswer: 0,
    explanationZh: '動詞「聞く」的被動受身形為 一類動詞 a段+れる ➜「聞かれる」➜ 聞かれました，故選「聞かれ」。',
    categoryName: '受身被動形 (～れる / ～られる)'
  },
  {
    id: 'g_c_09',
    level: 'N3',
    type: 'conjugation',
    prompt: '母は子供に野菜を（　）せました。（使役形）',
    promptZh: '母親讓孩子吃蔬菜。',
    options: ['食べさ', '食べて', '食べた', '食べら'],
    correctAnswer: 0,
    explanationZh: '二類動詞「食べる」的使役形為 去る+させる ➜「食べさせる」➜ 食べさせました，故選「食べさ」。',
    categoryName: '使役形 (～せる / ～させる)'
  },
  {
    id: 'g_c_10',
    level: 'N2',
    type: 'conjugation',
    prompt: '証拠が見つかった以上、罪を（　）ざるを得ない。',
    promptZh: '既然證據已經找到，就不得不認罪了。',
    options: ['認め', '認める', '認めた', '認めて'],
    correctAnswer: 0,
    explanationZh: 'N2 句型「～ざるを得ない（不得不...）」接動詞 未然形（ない形去ない）：認める ➜「認め」ざるを得ない，故選「認め」。',
    categoryName: 'N2 句型 ～ざるを得ない'
  },
  {
    id: 'g_c_11',
    level: 'N1',
    type: 'conjugation',
    prompt: '合否の結果を（　）が早いか、彼は両親に電話した。',
    promptZh: '剛一看到錄取結果，他就立刻給父母打了電話。',
    options: ['見る', '見て', '見た', '見'],
    correctAnswer: 0,
    explanationZh: 'N1 句型「～が早いか（剛一...就立刻...）」前面必須接動詞辭書形（原形）：故選「見る」。',
    categoryName: 'N1 句型 ～が早いか'
  },
  {
    id: 'g_c_12',
    level: 'N1',
    type: 'conjugation',
    prompt: '台風により、飛行機の運行は中止を（　）なくされた。',
    promptZh: '受到颱風影響，航班被迫不得不中止運行。',
    options: ['余儀', '余計', '遠慮', '容認'],
    correctAnswer: 0,
    explanationZh: 'N1 慣用句型「～を余儀なくされる（被迫不得不...）」，故選「余儀」。',
    categoryName: 'N1 句型 ～を余儀なくされる'
  }
];
