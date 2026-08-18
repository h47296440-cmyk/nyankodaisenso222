export interface StoryParagraph {
  text: string;
  emphasis?: boolean;
}

export interface ChapterStory {
  chapterId: 'japan' | 'future' | 'cosmos';
  type: 'opening' | 'ending';
  title: string;
  subtitle: string;
  chapterName: string;
  bgType: 'japan' | 'future' | 'cosmos';
  paragraphs: string[];
  bannerBadge: string;
}

export const CHAPTER_STORIES: Record<string, ChapterStory> = {
  japan_opening: {
    chapterId: 'japan',
    type: 'opening',
    chapterName: '第1章 日本編',
    title: '第1章 日本編 - オープニング',
    subtitle: 'にゃんこ軍団、日本侵略の狼煙',
    bannerBadge: 'Prologue - 侵略の始まり',
    bgType: 'japan',
    paragraphs: [
      '西暦20XX年、長引く不況と混迷の続く日本列島に、',
      '突如として正体不明の生命体が現れた。',
      'それは…白く、丸く、圧倒的な愛らしさと狂気を秘めた',
      '「にゃんこ軍団」であった。',
      '彼らは九州の長崎県を皮切りに、',
      '全国47都道府県の征服を開始。',
      'わんこ軍団や怪異な敵生物たちが迎え撃つ中、',
      'にゃんこ城から出撃するにゃんこたちの進軍は止まらない！',
      '経済も政治も関係ない！',
      '日本の歴史を塗り替える、前代未聞の「にゃんこ大戦争」が',
      '今、幕を開ける…！',
    ],
  },
  japan_ending: {
    chapterId: 'japan',
    type: 'ending',
    chapterName: '第1章 日本編',
    title: '第1章 日本編 - エンディング',
    subtitle: '日本全土制覇、そして月面基地へ…！',
    bannerBadge: 'Epilogue - 日本制覇',
    bgType: 'japan',
    paragraphs: [
      '激戦の末、日本列島47都道府県すべてを制覇し、',
      'ついに月面の最終要塞「カオル君」をも粉砕したにゃんこ軍団。',
      '日本の人々はにゃんこたちの可愛さと圧倒的な武力に屈し、',
      '日本全土はにゃんこたちの楽園となった。',
      '街にはまたたびの香りが漂い、',
      '猫缶が通貨として流通する平和な時代が訪れた。',
      'しかし、にゃんこたちの野望は日本だけにとどまらなかった…',
      '「次は…時空を超えた未来、そして無限の宇宙だにゃ！」',
      '新たなる戦乱の予兆を胸に、にゃんこ軍団の伝説は未来へと続く――！',
      '―― 第1章 日本編 完 ――',
    ],
  },
  future_opening: {
    chapterId: 'future',
    type: 'opening',
    chapterName: '第2章 未来編',
    title: '第2章 未来編 - オープニング',
    subtitle: 'エイリアン襲来！ 荒廃したサイバー地球',
    bannerBadge: 'Prologue - 時空侵略',
    bgType: 'future',
    paragraphs: [
      '時は流れ、西暦2999年――。',
      '高度なサイバーテクノロジーが発達した未来の地球に、',
      '突如として宇宙深淵から「エイリアン軍団」が襲来した。',
      'シンガポール、ドバイ、そしてニューヨーク…',
      '世界の主要都市は瞬く間にエイリアンの手に落ち、人類は支配された。',
      'だが、時空の歪みからタイムスリップして現れたのは、',
      'かつて日本を征服したあの「にゃんこ軍団」だった！',
      '「地球を侵略していいのは、我々だけだにゃ！」',
      'ネオン光るサイバー未来世界を舞台に、',
      'エイリアンvsにゃんこの時空大戦争が勃発する！',
    ],
  },
  future_ending: {
    chapterId: 'future',
    type: 'ending',
    chapterName: '第2章 未来編',
    title: '第2章 未来編 - エンディング',
    subtitle: 'エイリアン母船撃破！ 未来世界の覇者',
    bannerBadge: 'Epilogue - 未来奪還',
    bgType: 'future',
    paragraphs: [
      '浮遊都市ニューヨークでの壮絶な空中決戦の末、',
      'エイリアンマザーシップと強敵「ぶんぶん先生」を撃滅したにゃんこ軍団。',
      'エイリアンたちはにゃんこたちの圧倒的な力にひれ伏し、',
      '未来の地球にも再び「にゃんこの支配」という名の平和が戻った。',
      'しかしその時、全宇宙を統べる神々の怒りの波動が、',
      '銀河の彼方から届いた…',
      '「神々よ、首を洗って待っているにゃ！ 全銀河を制覇する時が来た！」',
      'にゃんこ軍団の視線は、ついに星々の海、広大な宇宙空間へと向けられた！',
      '―― 第2章 未来編 完 ――',
    ],
  },
  cosmos_opening: {
    chapterId: 'cosmos',
    type: 'opening',
    chapterName: '第3章 宇宙編',
    title: '第3章 宇宙編 - オープニング',
    subtitle: '銀河創世の神々に挑む、宇宙大戦争！',
    bannerBadge: 'Prologue - 宇宙進出',
    bgType: 'cosmos',
    paragraphs: [
      '全知全能の神々が統治する、神秘に満ちた大宇宙――。',
      'ビッグバンの特異点より生まれた邪悪なる宇宙神「ギャラクシー神」が、',
      '星々を次々と闇へと呑み込んでいた。',
      'この宇宙の危機に、ワープ航法エンジンを搭載した',
      '「スペースにゃんこ戦艦」が発進！',
      '火星基地の迎撃網を突破し、',
      '神々の座するビッグバンを目指して全銀河を駆け巡る！',
      '宇宙の理さえも覆す、史上最大の銀河侵略大戦争が',
      '今、始まる――！',
    ],
  },
  cosmos_ending: {
    chapterId: 'cosmos',
    type: 'ending',
    chapterName: '第3章 宇宙編',
    title: '第3章 宇宙編 - エンディング',
    subtitle: '神話の終焉、そして永遠のにゃんこ伝説！',
    bannerBadge: 'Grand Finale - 全銀河制覇',
    bgType: 'cosmos',
    paragraphs: [
      '全宇宙の頂点「ビッグバン」における最終決戦――。',
      '神話の最高神「ギャラクシー神」の猛攻をくぐり抜け、',
      'にゃんこ軍団の必殺砲が炸裂した！',
      '光と共に神は倒れ、全宇宙の数多の星々、銀河、星雲までもが、',
      '温かい肉球の温もりに包まれた。',
      '宇宙のすべての生命体は、にゃんこたちの偉大なる勝利を称え、',
      '永遠の忠誠を誓った。',
      'しかし、にゃんこたちの冒険に終わりはない。',
      '美味しい猫缶とマタタビがある限り、彼らの進撃は永遠に続くのだ…！',
      '『すべての戦士たちへ、心からの感謝を！ にゃんこよ永遠なれ！』',
      '―― 全章完全制覇！ ――',
    ],
  },
};
