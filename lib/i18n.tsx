"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "vi" | "ja";

export interface Translations {
  appName: string;
  appSubtitle: string;
  heroNotice: string;
  heroHeading: string;
  totalQuestions: string;
  totalChapters: string;
  questionsPerSession: string;
  questionsPracticed: string;
  sectionsCount: string;
  practiceAll: string;
  practiceRandom: string;
  reviewMistakes: string;
  practiceEntireChapter: string;
  changeChapter: string;
  sectionsInChapter: string;
  sectionsUnit: string;
  questionsUnit: string;
  searchPlaceholder: string;
  clear: string;
  filterAll: string;
  filterIncomplete: string;
  chapterListTitle: string;
  footerNote: string;
  score: string;
  correct: string;
  wrong: string;
  accuracy: string;
  streak: string;
  prevQuestion: string;
  nextQuestion: string;
  viewResult: string;
  passageTitle: string;
  collapsePassage: string;
  expandPassage: string;
  speakSentence: string;
  speakQuestion: string;
  bookmark: string;
  correctBadge: string;
  correctFeedback: string;
  wrongFeedback: string;
  completeSentence: string;
  quizCompletedTitle: string;
  retrySection: string;
  backHome: string;
  resetTitle: string;
  resetConfirm: string;
  resetConfirmAction: string;
  cancel: string;
  resetTooltip: string;
  soundTooltipOn: string;
  soundTooltipOff: string;
  section1DefaultDesc: string;
  section2DefaultDesc: string;
  section3DefaultDesc: string;
  section1Instruction: string;
  section2Instruction: string;
  section3Instruction: string;
  questionNotFound: string;
  back: string;
  chapterNotFound: string;
  notCompleted: string;
  completedBadge: string;
  all3Sections: string;
  allQuestionsTitle: string;
  allQuestionsSubtitle: string;
  quickQuizTitle: string;
  quickQuizSubtitle: string;
  mistakesReviewTitle: string;
  mistakesReviewSubtitle: string;
  chapterQuizTitle: string;
  pointsUnit: string;
}

const translations: Record<Language, Translations> = {
  vi: {
    appName: "Ôn tập ngữ pháp",
    appSubtitle: "NHẬT NGỮ N2 · JLPT",
    heroNotice: "Toàn bộ nội dung từ bộ đề gốc",
    heroHeading: "Chọn phần muốn ôn hôm nay",
    totalQuestions: "Tổng số câu",
    totalChapters: "Chapter",
    questionsPerSession: "Câu mỗi lượt",
    questionsPracticed: "Đã ôn tập",
    sectionsCount: "Số phần thi",
    practiceAll: "Luyện tập tất cả câu hỏi",
    practiceRandom: "Luyện nhanh 20 câu",
    reviewMistakes: "Ôn lại {count} câu sai",
    practiceEntireChapter: "Luyện toàn bộ {chapter} ({count} câu hỏi)",
    changeChapter: "Đổi Chapter",
    sectionsInChapter: "Các phần trong {chapter}",
    sectionsUnit: "phần",
    questionsUnit: "câu",
    searchPlaceholder: "Tìm theo ngữ pháp, câu hỏi, chapter (VD: 第1回, あげく, 毎晩...)",
    clear: "Xóa",
    filterAll: "Tất cả",
    filterIncomplete: "Chưa hoàn thành",
    chapterListTitle: "Danh sách Chapter",
    footerNote: "Dữ liệu và đáp án được lấy trực tiếp từ file nguồn JLPT N2.",
    score: "Score",
    correct: "Số câu đúng",
    wrong: "Số câu sai",
    accuracy: "Độ chính xác",
    streak: "Chuỗi đúng cao nhất",
    prevQuestion: "Câu trước",
    nextQuestion: "Câu tiếp",
    viewResult: "Xem kết quả",
    passageTitle: "Đoạn văn đọc hiểu",
    collapsePassage: "Thu gọn",
    expandPassage: "Xem đầy đủ",
    speakSentence: "Nghe cả câu",
    speakQuestion: "Phát âm câu hỏi",
    bookmark: "Lưu câu hỏi này",
    correctBadge: "Đáp án đúng",
    correctFeedback: "Chính xác! (+10 điểm)",
    wrongFeedback: "Chưa đúng! Đáp án đúng là {ans}",
    completeSentence: "Câu hoàn chỉnh (Thứ tự: {order}):",
    quizCompletedTitle: "Hoàn thành bài luyện tập!",
    retrySection: "Luyện lại phần này",
    backHome: "Về màn hình chính",
    resetTitle: "Đặt lại toàn bộ tiến độ?",
    resetConfirm: "Hành động này sẽ xóa điểm số, lịch sử làm bài và các câu hỏi đã đánh dấu. Bạn có chắc chắn muốn đặt lại không?",
    resetConfirmAction: "Đặt lại tiến độ",
    cancel: "Hủy",
    resetTooltip: "Đặt lại tiến độ",
    soundTooltipOn: "Tắt âm thanh",
    soundTooltipOff: "Bật âm thanh",
    section1DefaultDesc: "次の文の（ ）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
    section2DefaultDesc: "次の文の★に入る最もよいものを、1・2・3・4から一つ選びなさい。",
    section3DefaultDesc: "Đọc đoạn văn và chọn đáp án đúng",
    section1Instruction: "Chọn đáp án đúng nhất điền vào chỗ trống",
    section2Instruction: "Chọn từ điền vào vị trí ngôi sao ★",
    section3Instruction: "Chọn từ điền vào chỗ trống （ {num} ）",
    questionNotFound: "Không tìm thấy câu hỏi phù hợp.",
    back: "Quay lại",
    chapterNotFound: "Chapter không tồn tại",
    notCompleted: "Chưa hoàn thành",
    completedBadge: "Hoàn thành",
    all3Sections: "Toàn bộ 3 Sections",
    allQuestionsTitle: "Tất cả câu hỏi",
    allQuestionsSubtitle: "Tất cả {count} câu",
    quickQuizTitle: "Luyện nhanh",
    quickQuizSubtitle: "20 câu ngẫu nhiên",
    mistakesReviewTitle: "Ôn lại câu làm sai",
    mistakesReviewSubtitle: "{count} câu sai",
    chapterQuizTitle: "Chapter {chapterId} • {chapterName}",
    pointsUnit: "điểm",
  },
  ja: {
    appName: "文法復習",
    appSubtitle: "日本語能力試験 N2 · JLPT",
    heroNotice: "公式問題集に基づく全コンテンツ",
    heroHeading: "本日の学習項目を選択",
    totalQuestions: "総問題数",
    totalChapters: "総章数",
    questionsPerSession: "出題数/回",
    questionsPracticed: "学習済み",
    sectionsCount: "セクション数",
    practiceAll: "全問題を練習する",
    practiceRandom: "20問スピード練習",
    reviewMistakes: "間違えた{count}問を復習",
    practiceEntireChapter: "{chapter} 全体を練習 ({count}問)",
    changeChapter: "章を変更",
    sectionsInChapter: "{chapter} の問題セクション",
    sectionsUnit: "セクション",
    questionsUnit: "問",
    searchPlaceholder: "文法、問題文、章で検索 (例: 第1回, あげく, 毎晩...)",
    clear: "クリア",
    filterAll: "すべて",
    filterIncomplete: "未完了",
    chapterListTitle: "チャプター一覧",
    footerNote: "データおよび正解はJLPT N2公式問題ファイルに基づきます。",
    score: "スコア",
    correct: "正解数",
    wrong: "不正解数",
    accuracy: "正解率",
    streak: "最高連続正解",
    prevQuestion: "前の問題",
    nextQuestion: "次の問題",
    viewResult: "結果を見る",
    passageTitle: "読解問題の本文",
    collapsePassage: "折りたたむ",
    expandPassage: "全文表示",
    speakSentence: "文を再生",
    speakQuestion: "問題を再生",
    bookmark: "この問題を保存",
    correctBadge: "正解",
    correctFeedback: "正解！ (+10点)",
    wrongFeedback: "不正解！ 正解は {ans} です",
    completeSentence: "完全な文 (順序: {order}):",
    quizCompletedTitle: "練習セッション完了！",
    retrySection: "もう一度挑戦",
    backHome: "ホームに戻る",
    resetTitle: "学習進捗をリセットしますか？",
    resetConfirm: "スコア、解答履歴、保存した問題の記録がすべて消去されます。リセットしてもよろしいですか？",
    resetConfirmAction: "リセットする",
    cancel: "キャンセル",
    resetTooltip: "進捗をリセット",
    soundTooltipOn: "サウンドをオフ",
    soundTooltipOff: "サウンドをオン",
    section1DefaultDesc: "次の文の（ ）に入れるのに最もよいものを、1・2・3・4から一つ選びなさい。",
    section2DefaultDesc: "次の文の★に入る最もよいものを、1・2・3・4から一つ選びなさい。",
    section3DefaultDesc: "文章を読んで、正しい選択肢を選びなさい。",
    section1Instruction: "空欄に入る最もよいものを一つ選びなさい。",
    section2Instruction: "★に入る最もよいものを一つ選びなさい。",
    section3Instruction: "（ {num} ）に入る最もよいものを一つ選びなさい。",
    questionNotFound: "該当する問題が見つかりません。",
    back: "戻る",
    chapterNotFound: "指定された章が存在しません",
    notCompleted: "未完了",
    completedBadge: "完了",
    all3Sections: "全3セクション",
    allQuestionsTitle: "全問題練習",
    allQuestionsSubtitle: "全 {count} 問",
    quickQuizTitle: "スピード練習",
    quickQuizSubtitle: "ランダム20問",
    mistakesReviewTitle: "間違えた問題の復習",
    mistakesReviewSubtitle: "{count}問",
    chapterQuizTitle: "Chapter {chapterId} • {chapterName}",
    pointsUnit: "点",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  formatString: (template: string, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "n2_quiz_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language;
    if (saved === "vi" || saved === "ja") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const formatString = (
    template: string,
    vars: Record<string, string | number>
  ) => {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      return vars[key] !== undefined ? String(vars[key]) : `{${key}}`;
    });
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        formatString,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
