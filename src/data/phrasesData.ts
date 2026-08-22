export interface JapanesePhrase {
  id: string;
  phrase: string;          // 片語/句型 (如: ～てください)
  reading: string;         // 假名 (如: ～てください)
  meaning: string;         // 繁體中文釋義 (如: 請做...)
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  category: '請求與指示' | '許可與禁止' | '願望與打算' | '經驗與狀態' | '日常必備寒暄' | '原因與假定' | '中高級文法' | '商務與邏輯';
  example: string;         // 例句
  exampleMeaning: string;  // 例句中文
  explanation: string;     // 用法重點
}

export const allPhrases: JapanesePhrase[] = [
  // ================= N5 必備片語與常用句型 =================
  {
    id: 'phrase_n5_01',
    phrase: '～てください',
    reading: '～てください',
    meaning: '請...（禮貌請求）',
    level: 'N5',
    category: '請求與指示',
    example: 'ここに名前を書いてください。',
    exampleMeaning: '請在這裡寫下名字。',
    explanation: '接動詞 て 形，用於客氣地請求或指示對方做某個動作。'
  },
  {
    id: 'phrase_n5_02',
    phrase: '～てはいけません',
    reading: '～てはいけません',
    meaning: '不可以...（禁止）',
    level: 'N5',
    category: '許可與禁止',
    example: 'ここで写真を撮ってはいけません。',
    exampleMeaning: '這裡不可以拍照。',
    explanation: '接動詞 て 形，表示強烈的規則禁止或規勸。'
  },
  {
    id: 'phrase_n5_03',
    phrase: '～てもいいです',
    reading: '～てもいいです',
    meaning: '可以...（許可）',
    level: 'N5',
    category: '許可與禁止',
    example: '窓を開けてもいいですか。',
    exampleMeaning: '我可以打開窗戶嗎？',
    explanation: '接動詞 て 形，用於徵詢許可或給予對方許可。'
  },
  {
    id: 'phrase_n5_04',
    phrase: '～たいです',
    reading: '～たいです',
    meaning: '想要...（自己意願）',
    level: 'N5',
    category: '願望與打算',
    example: '日本へ旅行に行きたいです。',
    exampleMeaning: '我想要去日本旅行。',
    explanation: '接動詞 ます 形去 ます，表示第一人稱想做某事的強烈願望。'
  },
  {
    id: 'phrase_n5_05',
    phrase: '～ないでください',
    reading: '～ないでください',
    meaning: '請不要...（委婉禁止）',
    level: 'N5',
    category: '請求與指示',
    example: 'まだ帰らないでください。',
    exampleMeaning: '請先不要回去。',
    explanation: '接動詞 ない 形，用於委婉地拜託或要求對方不要做某事。'
  },
  {
    id: 'phrase_n5_06',
    phrase: '～ています',
    reading: '～ています',
    meaning: '正在... / 處於...狀態',
    level: 'N5',
    category: '經驗與狀態',
    example: '今、日本語を勉強しています。',
    exampleMeaning: '現在正在學習日語。',
    explanation: '接動詞 て 形，可表示正在進行的動作，或是動作完成後留下的持續狀態。'
  },
  {
    id: 'phrase_n5_07',
    phrase: 'よろしくお願いします',
    reading: 'よろしくおねがいします',
    meaning: '請多關照、拜託了',
    level: 'N5',
    category: '日常必備寒暄',
    example: '初めまして、よろしくお願いします。',
    exampleMeaning: '初次見面，請多指教。',
    explanation: '初次見面、拜託他人做事或合作時最常用的萬用禮貌句。'
  },
  {
    id: 'phrase_n5_08',
    phrase: 'お疲れ様でした',
    reading: 'おつかれさまでした',
    meaning: '您辛苦了',
    level: 'N5',
    category: '日常必備寒暄',
    example: '今日の仕事は終わりです。お疲れ様でした！',
    exampleMeaning: '今天工作結束了。大家辛苦了！',
    explanation: '下班、結束活動或完成任務時向同儕、同事表達慰勞的常用語。'
  },

  // ================= N4 進階常用片語與句型 =================
  {
    id: 'phrase_n4_01',
    phrase: '～たことがあります',
    reading: '～たことがあります',
    meaning: '曾經有過...的經驗',
    level: 'N4',
    category: '經驗與狀態',
    example: '富士山に登ったことがあります。',
    exampleMeaning: '我曾經爬過富士山。',
    explanation: '接動詞 た 形（過去式），用於描述個人過去曾經有過的經驗。'
  },
  {
    id: 'phrase_n4_02',
    phrase: '～ほうがいいです',
    reading: '～ほうがいいです',
    meaning: '最好...（建議）',
    level: 'N4',
    category: '請求與指示',
    example: '風邪を引いたので、早く寝たほうがいいです。',
    exampleMeaning: '因為感冒了，最好早點睡覺。',
    explanation: '肯定建議接動詞 た 形（～たほうがいい），否定建議接 ない 形（～ないほうがいい）。'
  },
  {
    id: 'phrase_n4_03',
    phrase: '～つもりです',
    reading: '～つもりです',
    meaning: '打算...（計畫）',
    level: 'N4',
    category: '願望與打算',
    example: '来年、日本に留学するつもりです。',
    exampleMeaning: '我打算明年去日本留學。',
    explanation: '接動詞辭書形或 ない 形，表示說話者心中已有的計畫或打算。'
  },
  {
    id: 'phrase_n4_04',
    phrase: '～たり～たりします',
    reading: '～たり～たりします',
    meaning: '有時...有時... / 做做...做做...',
    level: 'N4',
    category: '經驗與狀態',
    example: '休日は本を読んだり、散歩したりします。',
    exampleMeaning: '放假時我會看看書、散散步等等。',
    explanation: '列舉多項動作中的代表性項目，接動詞 た 形加 り。'
  },
  {
    id: 'phrase_n4_05',
    phrase: '～すぎます',
    reading: '～すぎます',
    meaning: '太過於...（過度）',
    level: 'N4',
    category: '經驗與狀態',
    example: 'ご飯を食べすぎました。',
    exampleMeaning: '飯吃得太撐、太多了。',
    explanation: '動詞連用形或形容詞去 い/な 加 すぎる，表示某個狀態超過了適當限度。'
  },
  {
    id: 'phrase_n4_06',
    phrase: '～やすい / ～にくい',
    reading: '～やすい / ～にくい',
    meaning: '容易... / 難以...',
    level: 'N4',
    category: '經驗與狀態',
    example: 'このペンはとても書きやすいです。',
    exampleMeaning: '這支筆非常滑順好寫。',
    explanation: '接動詞 ます 形去 ます，表示進行該動作的難易程度或性質。'
  },
  {
    id: 'phrase_n4_07',
    phrase: 'お世話になります',
    reading: 'おせわになります',
    meaning: '承蒙關照、受您照顧了',
    level: 'N4',
    category: '日常必備寒暄',
    example: 'いつも大変お世話になっております。',
    exampleMeaning: '平時承蒙您的諸多關照。',
    explanation: '商務、日常拜訪或寫信時最常用的敬語寒暄句。'
  },
  {
    id: 'phrase_n4_08',
    phrase: '気をつけてください',
    reading: 'きをつけてください',
    meaning: '請小心、請多保重',
    level: 'N4',
    category: '日常必備寒暄',
    example: '道が滑りやすいので、気をつけてください。',
    exampleMeaning: '路面很滑，請多加小心。',
    explanation: '叮嚀對方注意安全或天氣變化時的溫暖問候。'
  },

  // ================= N3 中級核心常用片語與句型 =================
  {
    id: 'phrase_n3_01',
    phrase: '～わけにはいかない',
    reading: '～わけにはいかない',
    meaning: '不能... / 無法（因情理或道義而不行）',
    level: 'N3',
    category: '中高級文法',
    example: '大事な会議があるので、休むわけにはいかない。',
    exampleMeaning: '因為有重大會議，所以我絕不能請假。',
    explanation: '接動詞辭書形，表示受社會常理、道德或特定情境約束而「不能去做某事」。'
  },
  {
    id: 'phrase_n3_02',
    phrase: '～わりに（は）',
    reading: '～わりに（は）',
    meaning: '雖然...卻意外地... / 相較之下...',
    level: 'N3',
    category: '中高級文法',
    example: '彼は年のわりには若く見えます。',
    exampleMeaning: '他以年齡來說，看起來相當年輕。',
    explanation: '表示從前項的事實來衡量，後項的結果出乎意料地不相稱。'
  },
  {
    id: 'phrase_n3_03',
    phrase: '～たとたん（に）',
    reading: '～たとたん（に）',
    meaning: '一...立刻就...',
    level: 'N3',
    category: '中高級文法',
    example: 'ドアを開けたとたんに、猫が飛び出しました。',
    exampleMeaning: '門一打開的瞬間，貓就衝了出來。',
    explanation: '接動詞 た 形，表示在前一個動作發生的那一剎那，意外地發生了後續動作。'
  },
  {
    id: 'phrase_n3_04',
    phrase: '～おそれがある',
    reading: '～おそれがある',
    meaning: '恐怕會... / 有...的危險（負面可能性）',
    level: 'N3',
    category: '中高級文法',
    example: 'このままでは台風で洪水が起きるおそれがある。',
    exampleMeaning: '這樣下去恐怕會有颱風引發洪水的危險。',
    explanation: '常用於新聞、氣象或警示，表示擔心會發生某種不良後果。'
  },
  {
    id: 'phrase_n3_05',
    phrase: '～に違いない',
    reading: '～にちがいない',
    meaning: '必定是... / 肯定是...',
    level: 'N3',
    category: '中高級文法',
    example: '明日はきっといい天気に違いない。',
    exampleMeaning: '明天肯定會是個好天氣。',
    explanation: '表示說話者根據客觀根據所做出的高度肯定推論。'
  },
  {
    id: 'phrase_n3_06',
    phrase: '～に関して / ～に関する',
    reading: '～にかんして',
    meaning: '關於... / 有關...',
    level: 'N3',
    category: '商務與邏輯',
    example: '新しいプロジェクトに関して説明します。',
    exampleMeaning: '針對新的專案項目進行說明。',
    explanation: '書面語或商務上用於引出說明的核心主題。'
  },

  // ================= N2 中高級進階片語與句型 =================
  {
    id: 'phrase_n2_01',
    phrase: '～にほかならない',
    reading: '～にほかならない',
    meaning: '無非是... / 正是...（強調原因或本質）',
    level: 'N2',
    category: '商務與邏輯',
    example: '彼の成功は日々の努力の結果にほかならない。',
    exampleMeaning: '他的成功無非正是每日努力所累積的結果。',
    explanation: '強烈斷定某個原因就是最關鍵、唯一的根本原因。'
  },
  {
    id: 'phrase_n2_02',
    phrase: '～を契機に（して）',
    reading: '～をけいきに',
    meaning: '以...為契機 / 藉由...為轉折點',
    level: 'N2',
    category: '商務與邏輯',
    example: '大学卒業を契機に、一人暮らしを始めた。',
    exampleMeaning: '以大學畢業為契機，開始了一個人的獨立生活。',
    explanation: '表示以某個重大事件為轉捩點，帶來了後續嶄新的行為或變化。'
  },
  {
    id: 'phrase_n2_03',
    phrase: '～ざるを得ない',
    reading: '～ざるをえない',
    meaning: '不得不... / 逼不得已只好...',
    level: 'N2',
    category: '中高級文法',
    example: '証拠が見つかった以上、認めざるを得ない。',
    exampleMeaning: '既然證據已經找到，就不得不承認了。',
    explanation: '接動詞 ない 形去 ない 加 ざるを得ない（する 變 せざるを得ない），表示非出於本意但情況逼迫只能如此。'
  },
  {
    id: 'phrase_n2_04',
    phrase: '～を踏まえて',
    reading: '～をふまえて',
    meaning: '根據... / 鑑於...（立足於前述前提）',
    level: 'N2',
    category: '商務與邏輯',
    example: '前回の反省を踏まえて、新しい計画を立てよう。',
    exampleMeaning: '根據上次的反省與經驗，來制定新的計畫吧。',
    explanation: '常用於會議、商務提案中，表示參考歷史數據或前提經驗來採取行動。'
  },
  {
    id: 'phrase_n2_05',
    phrase: '～をめぐって',
    reading: '～をめぐって',
    meaning: '圍繞著... / 針對...（爭論或議論）',
    level: 'N2',
    category: '商務與邏輯',
    example: '新しい政策をめぐって、激しい議論が続いている。',
    exampleMeaning: '圍繞著新政策，持續進行著激烈的辯論。',
    explanation: '表示多方圍繞著某個爭議性話題展開討論、爭論或對立。'
  },
  {
    id: 'phrase_n2_06',
    phrase: '～にすぎない',
    reading: '～にすぎない',
    meaning: '只不過是... / 僅僅是...',
    level: 'N2',
    category: '商務與邏輯',
    example: 'それは一時的な解決策にすぎない。',
    exampleMeaning: '那只不過是暫時性的應急對策而已。',
    explanation: '表示程度不高、評價不高，僅僅達到某種程度罷了。'
  },

  // ================= N1 高級必考句型與文法 =================
  {
    id: 'phrase_n1_01',
    phrase: '～極まりない / ～極まる',
    reading: '～きわまりない / ～きわまる',
    meaning: '極其... / 無比...（表示達到極限）',
    level: 'N1',
    category: '中高級文法',
    example: '彼の無責任な態度は、不愉快極まりない。',
    exampleMeaning: '他那不負責任的態度，令人感到極其不愉快。',
    explanation: '接形容動詞詞幹或名詞，用於強調程度達到了極致，多帶有強烈的感情色彩。'
  },
  {
    id: 'phrase_n1_02',
    phrase: '～であれ～であれ',
    reading: '～であれ～であれ',
    meaning: '無論是...還是... / 不管是...',
    level: 'N1',
    category: '商務與邏輯',
    example: '理由が何であれ、不正行為は認められない。',
    exampleMeaning: '無論理由為何，違規作弊行為都是絕不容許的。',
    explanation: '列舉同類或對比事物，表示後項的結論在任何情況下都成立。'
  },
  {
    id: 'phrase_n1_03',
    phrase: '～を余儀なくされる',
    reading: '～をよぎなくされる',
    meaning: '被迫不得不... / 無奈只能...',
    level: 'N1',
    category: '中高級文法',
    example: '台風の影響で、イベントの中止を余儀なくされた。',
    exampleMeaning: '受到颱風的影響，被迫不得不中止了活動。',
    explanation: '表示因外部不可抗力的客觀因素，使得當事人別無選擇、被迫採取某個行動。'
  },
  {
    id: 'phrase_n1_04',
    phrase: '～といったらない',
    reading: '～といったらない',
    meaning: '難以言表 / 無法形容地...（無比）',
    level: 'N1',
    category: '中高級文法',
    example: '合格の知らせを聞いたときの喜びといったらなかった。',
    exampleMeaning: '聽到錄取通知那一刻的喜悅，真是難以言表。',
    explanation: '表示程度高到無法用言語充分表達，多用於強烈抒發主觀感受。'
  },
  {
    id: 'phrase_n1_05',
    phrase: '～が早いか',
    reading: '～がはやいか',
    meaning: '剛一...就立刻...（緊接著）',
    level: 'N1',
    category: '中高級文法',
    example: 'ベルが鳴るが早いか、生徒たちは教室を飛び出した。',
    exampleMeaning: '下課鈴聲剛一響起，學生們就立刻衝出了教室。',
    explanation: '接動詞辭書形，表示前一個動作完成的瞬間，幾乎同時發生了下一個突發動作。'
  },
  {
    id: 'phrase_n1_06',
    phrase: '～ずくめ',
    reading: '～ずくめ',
    meaning: '盡是... / 滿是...（全是某種事物）',
    level: 'N1',
    category: '經驗與狀態',
    example: '今年は昇進や結婚など、いいことずくめの一年だった。',
    exampleMeaning: '今年升職又結婚，真是盡是好事的一年。',
    explanation: '接名詞，表示整體情況被該名詞所代表的事物完全充滿。'
  }
];
