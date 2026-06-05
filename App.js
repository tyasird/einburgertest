import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import questionsDe from "./data/questions.json";
import questionsMeta from "./data/questions_meta.json";
import questionsAr from "./data/questions_ar.json";
import questionsEn from "./data/questions_en.json";
import questionsEs from "./data/questions_es.json";
import questionsFa from "./data/questions_fa.json";
import questionsRu from "./data/questions_ru.json";
import questionsTr from "./data/questions_tr.json";

const STORAGE_KEY = "ligt_local_v1";
const AUTH_USER_KEY = "authUser";
const AUTH_API_BASE_URL = "https://einbuergertest-auth.tyasird.workers.dev";
const QUESTION_IMAGE_BY_ID = {
  21: require("./assets/question-images/21.png"),
  381: require("./assets/question-images/nrw.png"),
  391: require("./assets/question-images/nrw2.png"),
};

const QUESTION_IMAGE_BY_NUM = {
  21: require("./assets/question-images/21.png"),
  55: require("./assets/question-images/55.png"),
  70: require("./assets/question-images/70.png"),
  130: require("./assets/question-images/130.png"),
  176: require("./assets/question-images/176.png"),
  181: require("./assets/question-images/181.png"),
  187: require("./assets/question-images/187.png"),
  209: require("./assets/question-images/209.png"),
  216: require("./assets/question-images/216.png"),
  226: require("./assets/question-images/226.png"),
  235: require("./assets/question-images/235.png"),
};

const NAV_ITEMS = [
  { key: "home" },
  { key: "favorites" },
  { key: "testSimulation" },
];

const TEST_SOURCE_OPTIONS = [
  { key: "favorites" },
  { key: "all" },
];

const NAV_LABELS = {
  home: "Categories",
  favorites: "Favorites",
  testSimulation: "Test Simulation",
};

const TEST_SOURCE_LABELS = {
  favorites: "Favorites",
  all: "All Questions",
};

const LANGUAGE_OPTIONS = [
  { key: "de", label: "Deutsch", shortLabel: "DE" },
  { key: "tr", label: "Turkce", shortLabel: "TR" },
  { key: "en", label: "English", shortLabel: "EN" },
  { key: "es", label: "Espanol", shortLabel: "ES" },
  { key: "ar", label: "العربية", shortLabel: "AR" },
  { key: "fa", label: "فارسی", shortLabel: "FA" },
  { key: "ru", label: "Русский", shortLabel: "RU" },
];

const RTL_LANGS = new Set(["ar", "fa"]);
const DEFAULT_LANGUAGE = "tr";
const LANGUAGE_DISPLAY_LABELS = {
  de: "Deutsch",
  tr: "Turkce",
  en: "English",
  es: "Spanish",
  ar: "Arabic",
  fa: "Persian",
  ru: "Russian",
};
const isValidLanguage = (value) => LANGUAGE_OPTIONS.some((option) => option.key === value);

const GENERAL_CATS = [
  ["Verfassungsorgane", "Politik in der Demokratie"],
  ["Verfassungsprinzipien", "Politik in der Demokratie"],
  ["Föderalismus", "Politik in der Demokratie"],
  ["Sozialsystem", "Politik in der Demokratie"],
  ["Grundrechte", "Politik in der Demokratie"],
  ["Wahlen und Beteiligung", "Politik in der Demokratie"],
  ["Parteien", "Politik in der Demokratie"],
  ["Aufgaben des Staates", "Politik in der Demokratie"],
  ["Pflichten", "Politik in der Demokratie"],
  ["Staatssymbole", "Politik in der Demokratie"],
  ["Kommune", "Politik in der Demokratie"],
  ["Recht und Alltag", "Politik in der Demokratie"],
  ["Der Nationalsozialismus und seine Folgen", "Geschichte und Verantwortung"],
  ["Wichtige Stationen nach 1945", "Geschichte und Verantwortung"],
  ["Wiedervereinigung", "Geschichte und Verantwortung"],
  ["Deutschland in Europa", "Geschichte und Verantwortung"],
  ["Religiöse Vielfalt", "Mensch und Gesellschaft"],
  ["Bildung", "Mensch und Gesellschaft"],
  ["Migrationsgeschichte", "Mensch und Gesellschaft"],
  ["Interkulturelles Zusammenleben", "Mensch und Gesellschaft"],
  ["Recently Added Questions", "Recently Added Questions"],
];

const STATE_SECTIONS = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

const DE_BY_ID = new Map(questionsDe.map((q) => [Number(q.id), q]));
const QUESTION_TRANSLATIONS_BY_LANG = {
  tr: new Map((questionsTr || []).map((q) => [Number(q.id), q])),
  en: new Map((questionsEn || []).map((q) => [Number(q.id), q])),
  es: new Map((questionsEs || []).map((q) => [Number(q.id), q])),
  ar: new Map((questionsAr || []).map((q) => [Number(q.id), q])),
  fa: new Map((questionsFa || []).map((q) => [Number(q.id), q])),
  ru: new Map((questionsRu || []).map((q) => [Number(q.id), q])),
};
const ALL_QUESTIONS = questionsMeta
  .map((m) => {
    const id = Number(m.id);
    const de = DE_BY_ID.get(id);
    if (!de || !Array.isArray(de.opts) || de.opts.length !== 4) return null;
    return {
      id,
      num: Number(m.num || m.id),
      section: m.section || "Allgemein",
      category: m.category || m.section || "Allgemein",
      correctIndex: Number(m.correct),
      isImage: Boolean(m.is_image),
      imageSource: QUESTION_IMAGE_BY_ID[id] || QUESTION_IMAGE_BY_NUM[Number(m.num || m.id)] || null,
      text: de.q,
      options: de.opts,
    };
  })
  .filter(Boolean);

const ORDERED_CATEGORIES = [
  ...GENERAL_CATS.map(([cat]) => cat),
  ...STATE_SECTIONS,
].filter((cat, i, arr) => arr.indexOf(cat) === i);

const PALETTE = [
  "#005AB5",
  "#7F3C8D",
  "#0E7490",
  "#C2410C",
  "#1D4ED8",
  "#6D28D9",
  "#0F766E",
  "#B45309",
  "#7F3C8D",
  "#0EA5E9",
  "#374151",
];

export default function App() {
  const isWeb = Platform.OS === "web";

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [user, setUser] = useState({ username: "Guest", isGuest: true });
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBundesland, setRegBundesland] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [activeView, setActiveView] = useState("home");
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [favoriteStudyIndex, setFavoriteStudyIndex] = useState(0);
  const [showFavoriteAnswers, setShowFavoriteAnswers] = useState(false);
  const [favoriteStudyAttempts, setFavoriteStudyAttempts] = useState({});
  const [pendingFavoriteRemovalId, setPendingFavoriteRemovalId] = useState(null);
  const [testSource, setTestSource] = useState("favorites");
  const [testQuestions, setTestQuestions] = useState([]);
  const [testAnswers, setTestAnswers] = useState({});
  const [testQuestionIndex, setTestQuestionIndex] = useState(0);
  const [testFinished, setTestFinished] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [answers, setAnswers] = useState({});
  const [lastPos, setLastPos] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const categories = useMemo(
    () =>
      ORDERED_CATEGORIES.map((cat) => {
        const qs = ALL_QUESTIONS.filter((q) => q.category === cat || q.section === cat);
        return {
          id: cat,
          name: cat,
          description: qs[0]?.section || "Question category",
          questions: qs,
        };
      }).filter((c) => c.questions.length > 0),
    []
  );

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || null;
  const currentQuestion = activeCategory?.questions[currentQuestionIndex] || null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const currentTestQuestion = testQuestions[testQuestionIndex] || null;
  const selectedLanguageOption =
    LANGUAGE_OPTIONS.find((option) => option.key === selectedLanguage) || LANGUAGE_OPTIONS[0];
  const selectedTranslationMap =
    selectedLanguage === "de" ? null : QUESTION_TRANSLATIONS_BY_LANG[selectedLanguage] || null;
  const isSelectedLanguageRtl = RTL_LANGS.has(selectedLanguage);
  const canShowTranslation = Boolean(selectedTranslationMap);
  const shouldShowTranslation = canShowTranslation && showTranslation;
  const testScore = useMemo(
    () =>
      testQuestions.reduce(
        (score, question) => score + (testAnswers[question.id] === question.correctIndex ? 1 : 0),
        0
      ),
    [testQuestions, testAnswers]
  );
  const answeredTestCount = useMemo(
    () => testQuestions.filter((question) => testAnswers[question.id] !== undefined).length,
    [testQuestions, testAnswers]
  );
  const categoryColorMap = useMemo(
    () =>
      Object.fromEntries(
        ORDERED_CATEGORIES.map((cat, idx) => [cat, PALETTE[idx % PALETTE.length]])
      ),
    []
  );
  const getQuestionTranslation = (question) => {
    if (!question || !selectedTranslationMap) return null;
    return selectedTranslationMap.get(question.id) || null;
  };
  const currentQuestionTranslation = getQuestionTranslation(currentQuestion);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setFavorites(Array.isArray(parsed.favorites) ? parsed.favorites : []);
          setAnswers(parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {});
          setLastPos(parsed.lastPos && typeof parsed.lastPos === "object" ? parsed.lastPos : {});
          setSelectedLanguage(isValidLanguage(parsed.language) ? parsed.language : DEFAULT_LANGUAGE);
          setShowTranslation(Boolean(parsed.showTranslation));
          setUser(
            parsed[AUTH_USER_KEY] && parsed[AUTH_USER_KEY].username
              ? parsed[AUTH_USER_KEY]
              : { username: "Guest", isGuest: true }
          );
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        favorites,
        answers,
        lastPos,
        language: selectedLanguage,
        showTranslation,
        [AUTH_USER_KEY]: user,
      })
    ).catch(() => {});
  }, [favorites, answers, lastPos, selectedLanguage, showTranslation, user, loaded]);

  const authRequest = async (path, payload) => {
    const baseUrl = AUTH_API_BASE_URL.replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const response = await fetch(`${baseUrl}${normalizedPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "Authentication request failed.");
    }
    return data;
  };

  const allStudyQuestions = useMemo(
    () =>
      categories
        .flatMap((category) =>
          category.questions.map((question, index) => ({
            ...question,
            categoryId: category.id,
            categoryName: category.name,
            index,
          }))
        ),
    [categories]
  );

  const favoriteQuestions = useMemo(
    () => allStudyQuestions.filter((q) => favorites.includes(q.id)),
    [allStudyQuestions, favorites]
  );

  useEffect(() => {
    setFavoriteStudyIndex((idx) => Math.min(idx, Math.max(favoriteQuestions.length - 1, 0)));
  }, [favoriteQuestions.length]);

  useEffect(() => {
    if (pendingFavoriteRemovalId && !favorites.includes(pendingFavoriteRemovalId)) {
      setPendingFavoriteRemovalId(null);
    }
  }, [favorites, pendingFavoriteRemovalId]);

  const openCategory = (categoryId, startIndex) => {
    const idx = typeof startIndex === "number" ? startIndex : lastPos[categoryId] || 0;
    setActiveCategoryId(categoryId);
    setCurrentQuestionIndex(idx);
    setActiveView("quiz");
  };

  const toggleFavorite = (questionId) => {
    setFavorites((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const selectQuestionAnswer = (question, selectedIndex, onCorrect) => {
    if (!question) return;
    const isCorrect = selectedIndex === question.correctIndex;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { selectedIndex, isCorrect },
    }));
    if (isCorrect && onCorrect) {
      setTimeout(() => {
        onCorrect();
      }, 1000);
    }
  };

  const selectAnswer = (selectedIndex) => {
    selectQuestionAnswer(currentQuestion, selectedIndex, () => gotoQuestion(currentQuestionIndex + 1));
  };

  const gotoQuestion = (nextIndex) => {
    if (!activeCategory) return;
    const bounded = Math.max(0, Math.min(activeCategory.questions.length - 1, nextIndex));
    setCurrentQuestionIndex(bounded);
    setLastPos((prev) => ({ ...prev, [activeCategory.id]: bounded }));
  };

  const gotoStudyQuestion = (setIndex, total, nextIndex) => {
    if (!total) return;
    const bounded = Math.max(0, Math.min(total - 1, nextIndex));
    setIndex(bounded);
  };

  const toggleFavoriteAnswerVisibility = () => {
    if (showFavoriteAnswers) {
      setFavoriteStudyAttempts({});
    }
    setShowFavoriteAnswers((prev) => !prev);
  };

  const startTestSimulation = (source = testSource) => {
    const pool = source === "all" ? allStudyQuestions : favoriteQuestions;
    if (pool.length === 0) return;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setTestSource(source);
    setTestQuestions(shuffled.slice(0, Math.min(30, shuffled.length)));
    setTestAnswers({});
    setTestQuestionIndex(0);
    setTestFinished(false);
  };

  const selectTestAnswer = (questionId, selectedIndex) => {
    setTestAnswers((prev) => ({
      ...prev,
      [questionId]: selectedIndex,
    }));
  };

  const gotoTestQuestion = (nextIndex) => {
    if (!testQuestions.length) return;
    const bounded = Math.max(0, Math.min(testQuestions.length - 1, nextIndex));
    setTestQuestionIndex(bounded);
  };

  const doLogin = async () => {
    setAuthError("");
    const username = loginUsername.trim();
    const password = loginPassword.trim();
    if (!username || !password) {
      setAuthError("Please enter username and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const result = await authRequest("/auth/login", { username, password });
      setUser(result.user);
      setLoginPassword("");
      setShowLoginModal(false);
    } catch (error) {
      setAuthError(error.message || "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const doRegister = async () => {
    setAuthError("");
    const username = regUsername.trim();
    const password = regPassword.trim();
    const bundesland = regBundesland.trim();
    if (!username || !password) {
      setAuthError("Username and password are required for registration.");
      return;
    }
    setAuthLoading(true);
    try {
      const result = await authRequest("/auth/register", { username, password, bundesland });
      setUser(result.user);
      setRegUsername("");
      setRegPassword("");
      setRegBundesland("");
      setAuthTab("login");
      setShowLoginModal(false);
    } catch (error) {
      setAuthError(error.message || "Registration failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const continueAsGuest = () => {
    setAuthError("");
    setUser({ username: "Guest", isGuest: true });
    setShowLoginModal(false);
  };

  const logout = () => {
    setAuthError("");
    setUser({ username: "Guest", isGuest: true });
    setLoginUsername("");
    setLoginPassword("");
  };

  const renderLoginContent = () => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Sign In</Text>
      <View style={styles.nav}>
        <Pressable style={styles.navItem} onPress={() => setAuthTab("login")}>
          <Text style={[styles.navText, authTab === "login" && styles.navTextActive]}>Sign In</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setAuthTab("register")}>
          <Text style={[styles.navText, authTab === "register" && styles.navTextActive]}>Register</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => setAuthTab("guest")}>
          <Text style={[styles.navText, authTab === "guest" && styles.navTextActive]}>Guest</Text>
        </Pressable>
      </View>

      {authError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{authError}</Text>
        </View>
      ) : null}

      {authTab === "login" ? (
        <View style={styles.section}>
          <TextInput
            value={loginUsername}
            onChangeText={setLoginUsername}
            placeholder="Username"
            style={styles.input}
            autoCapitalize="none"
            editable={!authLoading}
          />
          <TextInput
            value={loginPassword}
            onChangeText={setLoginPassword}
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            editable={!authLoading}
          />
          <Pressable style={styles.primaryBtn} onPress={doLogin}>
            <Text style={styles.primaryBtnText}>{authLoading ? "Signing In..." : "Sign In"}</Text>
          </Pressable>
        </View>
      ) : null}

      {authTab === "register" ? (
        <View style={styles.section}>
          <TextInput
            value={regUsername}
            onChangeText={setRegUsername}
            placeholder="Username"
            style={styles.input}
            autoCapitalize="none"
            editable={!authLoading}
          />
          <TextInput
            value={regPassword}
            onChangeText={setRegPassword}
            placeholder="Password"
            style={styles.input}
            secureTextEntry
            editable={!authLoading}
          />
          <TextInput
            value={regBundesland}
            onChangeText={setRegBundesland}
            placeholder="State (optional)"
            style={styles.input}
            editable={!authLoading}
          />
          <Pressable style={styles.primaryBtn} onPress={doRegister}>
            <Text style={styles.primaryBtnText}>{authLoading ? "Creating..." : "Create Account"}</Text>
          </Pressable>
        </View>
      ) : null}

      {authTab === "guest" ? (
        <View style={styles.section}>
          <View style={styles.cardMuted}>
            <Text style={styles.mutedText}>In guest mode, data is stored locally on this device.</Text>
          </View>
          <Pressable style={styles.primaryBtn} onPress={continueAsGuest}>
            <Text style={styles.primaryBtnText}>Continue as Guest</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const renderStudySet = (
    items,
    title,
    emptyText,
    index,
    setIndex,
    onClear,
    advanceOnCorrect = true,
    showAnswerFeedback = true,
    headerAction = null,
    confirmFavoriteRemoval = false,
    revealedAnswerIds = null,
    onStudyAnswer = null
  ) => {
    const item = items[index] || null;
    const studyAnswer = item ? answers[item.id] : null;
    const studyTranslation = getQuestionTranslation(item);
    const translatedOptions = Array.isArray(studyTranslation?.opts) ? studyTranslation.opts : [];
    const accentColor = item ? categoryColorMap[item.categoryId] || "#374151" : "#374151";
    const revealCurrentAnswer = showAnswerFeedback || Boolean(item && revealedAnswerIds?.[item.id]);

    return (
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.listHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.meta}>{items.length} question{items.length === 1 ? "" : "s"}</Text>
            </View>
            {headerAction || (items.length > 0 && onClear) ? (
              <View style={styles.headerActions}>
                {headerAction}
                {items.length > 0 && onClear ? (
                  <Pressable style={styles.secondaryBtn} onPress={onClear}>
                    <Text style={styles.secondaryBtnText}>Clear</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {!item ? (
          <View style={styles.cardMuted}>
            <Text style={styles.mutedText}>{emptyText}</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={[styles.quizTopAccent, { backgroundColor: accentColor }]} />
              <View style={styles.quizHeaderRow}>
                <View style={[styles.categoryBadge, { borderColor: accentColor }]}>
                  <View style={[styles.categoryBadgeDot, { backgroundColor: accentColor }]} />
                  <Text style={styles.categoryBadgeText}>{item.categoryName}</Text>
                </View>
                <Text style={styles.progressText}>
                  {index + 1} / {items.length}
                </Text>
              </View>

              <Text style={styles.questionText}>{item.text}</Text>
              {item.imageSource ? (
                <Image source={item.imageSource} style={styles.questionImage} resizeMode="contain" />
              ) : null}
              {shouldShowTranslation && studyTranslation?.q ? (
                <Text
                  style={[
                    styles.translationText,
                    isSelectedLanguageRtl && styles.translationTextRtl,
                    isSelectedLanguageRtl && styles.rtlText,
                  ]}
                >
                  {studyTranslation.q}
                </Text>
              ) : null}

              {item.options.map((option, optionIndex) => {
                const selected = studyAnswer?.selectedIndex === optionIndex;
                const showCorrect = revealCurrentAnswer && studyAnswer && optionIndex === item.correctIndex;
                const showWrong = revealCurrentAnswer && studyAnswer && selected && optionIndex !== item.correctIndex;
                const translatedOption = translatedOptions[optionIndex] || "";

                return (
                  <Pressable
                    key={`${item.id}-${optionIndex}`}
                    onPress={() => {
                      if (onStudyAnswer) {
                        onStudyAnswer(item.id);
                      }
                      selectQuestionAnswer(
                        item,
                        optionIndex,
                        advanceOnCorrect
                          ? () => gotoStudyQuestion(setIndex, items.length, index + 1)
                          : null
                      );
                    }}
                    style={[
                      styles.optionBtn,
                      showCorrect && styles.optionCorrect,
                      showWrong && styles.optionWrong,
                    ]}
                  >
                    <Text style={[styles.optionText, showCorrect && styles.optionTextOnDark]}>{option}</Text>
                    {shouldShowTranslation && translatedOption ? (
                      <Text
                        style={[
                          styles.optionTranslation,
                          isSelectedLanguageRtl && styles.rtlText,
                          showCorrect && styles.optionTextOnDark,
                        ]}
                      >
                        {translatedOption}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}

              <View style={styles.row}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => gotoStudyQuestion(setIndex, items.length, index - 1)}
                >
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </Pressable>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => gotoStudyQuestion(setIndex, items.length, index + 1)}
                >
                  <Text style={styles.secondaryBtnText}>Next</Text>
                </Pressable>
              </View>
              <View style={styles.rowSecondary}>
                {canShowTranslation ? (
                  <Pressable
                    style={[styles.secondaryBtn, styles.translationBtn, showTranslation && styles.translationBtnActive]}
                    onPress={() => setShowTranslation((prev) => !prev)}
                  >
                    <Text
                      style={[
                        styles.secondaryBtnText,
                        styles.translationBtnText,
                        showTranslation && styles.translationBtnTextActive,
                      ]}
                    >
                      {showTranslation ? "Hide Translation" : "Show Translation"}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={confirmFavoriteRemoval && favorites.includes(item.id) ? styles.secondaryBtn : styles.primaryBtn}
                  onPress={() =>
                    confirmFavoriteRemoval && favorites.includes(item.id)
                      ? setPendingFavoriteRemovalId(item.id)
                      : toggleFavorite(item.id)
                  }
                >
                  <Text
                    style={
                      confirmFavoriteRemoval && favorites.includes(item.id)
                        ? styles.secondaryBtnText
                        : styles.primaryBtnText
                    }
                  >
                    {favorites.includes(item.id)
                      ? confirmFavoriteRemoval
                        ? "Remove Favorite"
                        : "Favorited"
                      : "Add Favorite"}
                  </Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={() => openCategory(item.categoryId, item.index)}>
                  <Text style={styles.secondaryBtnText}>Open Category</Text>
                </Pressable>
              </View>
              {confirmFavoriteRemoval && pendingFavoriteRemovalId === item.id ? (
                <View style={styles.removeConfirm}>
                  <Text style={styles.removeConfirmText}>Remove this question from Favorites?</Text>
                  <View style={styles.row}>
                    <Pressable style={styles.secondaryBtn} onPress={() => setPendingFavoriteRemovalId(null)}>
                      <Text style={styles.secondaryBtnText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => {
                        toggleFavorite(item.id);
                        setPendingFavoriteRemovalId(null);
                      }}
                    >
                      <Text style={styles.primaryBtnText}>Confirm Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={[styles.card, styles.numCard]}>
              <View style={styles.numGrid}>
                {items.map((q, i) => {
                  const entry = answers[q.id];
                  const isCurrent = i === index;
                  const revealEntry = showAnswerFeedback || Boolean(revealedAnswerIds?.[q.id]);
                  const isCorrect = revealEntry && entry?.isCorrect;
                  const isWrong = revealEntry && entry && !entry.isCorrect;

                  return (
                    <Pressable
                      key={`study-num-${q.id}`}
                      onPress={() => gotoStudyQuestion(setIndex, items.length, i)}
                      style={[
                        styles.numBtn,
                        isCurrent && styles.numBtnCurrent,
                        !isCurrent && isCorrect && styles.numBtnCorrect,
                        !isCurrent && isWrong && styles.numBtnWrong,
                      ]}
                    >
                      <Text style={[styles.numBtnText, isCurrent && styles.numBtnTextCurrent]}>{i + 1}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderTestSimulation = () => {
    const total = testQuestions.length;
    const percent = total ? Math.round((testScore / total) * 100) : 0;
    const sourceLabel = TEST_SOURCE_LABELS[testSource] || TEST_SOURCE_LABELS.favorites;

    if (testFinished && total) {
      return (
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Test Simulation</Text>
            <Text style={styles.meta}>{total} question{total === 1 ? "" : "s"}</Text>
            <Text style={styles.mutedText}>Source: {sourceLabel}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreText}>
              {testScore} / {total}
            </Text>
            <Text style={styles.mutedText}>{percent}% correct</Text>
            <Text style={[styles.meta, { marginTop: 8 }]}>
              {answeredTestCount} / {total} answered
            </Text>
            <View style={styles.row}>
              <Pressable style={styles.primaryBtn} onPress={() => startTestSimulation(testSource)}>
                <Text style={styles.primaryBtnText}>Start New Test</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => setTestFinished(false)}>
                <Text style={styles.secondaryBtnText}>Review Questions</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    if (!currentTestQuestion) {
      const favoriteCount = favoriteQuestions.length;
      const allCount = allStudyQuestions.length;
      const availableCount = testSource === "all" ? allCount : favoriteCount;
      const testSize = Math.min(30, availableCount);
      const summaryText =
        testSource === "favorites"
          ? availableCount
            ? `${testSize} random favorite question${testSize === 1 ? "" : "s"}`
            : "No favorite questions yet."
          : `${testSize} random question${testSize === 1 ? "" : "s"} from all questions`;

      return (
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Test Simulation</Text>
            <Text style={styles.meta}>Choose source</Text>
            <View style={styles.sourceSwitch}>
              {TEST_SOURCE_OPTIONS.map((item) => {
                const count = item.key === "favorites" ? favoriteCount : allCount;
                const isActive = testSource === item.key;
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.sourceSwitchBtn, isActive && styles.sourceSwitchBtnActive]}
                    onPress={() => setTestSource(item.key)}
                  >
                    <Text style={[styles.sourceSwitchBtnText, isActive && styles.sourceSwitchBtnTextActive]}>
                      {TEST_SOURCE_LABELS[item.key]}
                    </Text>
                    <Text style={[styles.sourceSwitchCount, isActive && styles.sourceSwitchCountActive]}>
                      {count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.mutedText}>{summaryText}</Text>
            <View style={styles.row}>
              <Pressable
                disabled={!availableCount}
                style={[styles.primaryBtn, !availableCount && styles.btnDisabled]}
                onPress={() => startTestSimulation(testSource)}
              >
                <Text style={[styles.primaryBtnText, !availableCount && styles.btnDisabledText]}>
                  Start Test
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    const selectedAnswer = testAnswers[currentTestQuestion.id];
    const accentColor = categoryColorMap[currentTestQuestion.categoryId] || "#374151";
    const testQuestionTranslation = getQuestionTranslation(currentTestQuestion);
    const translatedTestOptions = Array.isArray(testQuestionTranslation?.opts)
      ? testQuestionTranslation.opts
      : [];

    return (
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.listHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Test Simulation</Text>
              <Text style={styles.meta}>
                {answeredTestCount} / {total} answered
              </Text>
              <Text style={styles.mutedText}>Source: {sourceLabel}</Text>
            </View>
            <Pressable style={styles.secondaryBtn} onPress={() => startTestSimulation(testSource)}>
              <Text style={styles.secondaryBtnText}>New Test</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.quizTopAccent, { backgroundColor: accentColor }]} />
          <View style={styles.quizHeaderRow}>
            <View style={[styles.categoryBadge, { borderColor: accentColor }]}>
              <View style={[styles.categoryBadgeDot, { backgroundColor: accentColor }]} />
              <Text style={styles.categoryBadgeText}>{currentTestQuestion.categoryName}</Text>
            </View>
            <Text style={styles.progressText}>
              {testQuestionIndex + 1} / {total}
            </Text>
          </View>

          <Text style={styles.questionText}>{currentTestQuestion.text}</Text>
          {currentTestQuestion.imageSource ? (
            <Image source={currentTestQuestion.imageSource} style={styles.questionImage} resizeMode="contain" />
          ) : null}
          {shouldShowTranslation && testQuestionTranslation?.q ? (
            <Text
              style={[
                styles.translationText,
                isSelectedLanguageRtl && styles.translationTextRtl,
                isSelectedLanguageRtl && styles.rtlText,
              ]}
            >
              {testQuestionTranslation.q}
            </Text>
          ) : null}

          {currentTestQuestion.options.map((option, optionIndex) => {
            const selected = selectedAnswer === optionIndex;
            const translatedOption = translatedTestOptions[optionIndex] || "";

            return (
              <Pressable
                key={`test-${currentTestQuestion.id}-${optionIndex}`}
                onPress={() => selectTestAnswer(currentTestQuestion.id, optionIndex)}
                style={[styles.optionBtn, selected && styles.optionSelected]}
              >
                <Text style={styles.optionText}>{option}</Text>
                {shouldShowTranslation && translatedOption ? (
                  <Text style={[styles.optionTranslation, isSelectedLanguageRtl && styles.rtlText]}>
                    {translatedOption}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}

          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => gotoTestQuestion(testQuestionIndex - 1)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => gotoTestQuestion(testQuestionIndex + 1)}>
              <Text style={styles.secondaryBtnText}>Next</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => setTestFinished(true)}>
              <Text style={styles.primaryBtnText}>Finish Test</Text>
            </Pressable>
          </View>
          {canShowTranslation ? (
            <View style={styles.rowSecondary}>
              <Pressable
                style={[styles.secondaryBtn, styles.translationBtn, showTranslation && styles.translationBtnActive]}
                onPress={() => setShowTranslation((prev) => !prev)}
              >
                <Text
                  style={[
                    styles.secondaryBtnText,
                    styles.translationBtnText,
                    showTranslation && styles.translationBtnTextActive,
                  ]}
                >
                  {showTranslation ? "Hide Translation" : "Show Translation"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, styles.numCard]}>
          <View style={styles.numGrid}>
            {testQuestions.map((q, i) => {
              const isCurrent = i === testQuestionIndex;
              const isAnswered = testAnswers[q.id] !== undefined;

              return (
                <Pressable
                  key={`test-num-${q.id}`}
                  onPress={() => gotoTestQuestion(i)}
                  style={[
                    styles.numBtn,
                    isCurrent && styles.numBtnCurrent,
                    !isCurrent && isAnswered && styles.numBtnCorrect,
                  ]}
                >
                  <Text style={[styles.numBtnText, isCurrent && styles.numBtnTextCurrent]}>{i + 1}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, isWeb && styles.safeWeb]}>
      <StatusBar style="dark" />
      <View style={[styles.appFrame, isWeb && styles.appFrameWeb]}>
        <View style={styles.header}>
          <Text style={styles.logo}>E</Text>
          <Text style={styles.title}>Einbuergertest</Text>
          <View style={styles.headerControls}>
            <Pressable style={styles.secondaryBtn} onPress={() => setShowLanguageModal(true)}>
              <Text style={styles.secondaryBtnText}>{selectedLanguageOption.shortLabel}</Text>
            </Pressable>

            {isWeb ? (
              user?.isGuest ? (
                <Pressable style={styles.secondaryBtn} onPress={() => setShowLoginModal(true)}>
                  <Text style={styles.secondaryBtnText}>Login</Text>
                </Pressable>
              ) : (
                <View style={styles.headerUserRow}>
                  <Text style={[styles.meta, styles.headerMeta]}>{user?.username}</Text>
                  <Pressable style={styles.secondaryBtn} onPress={logout}>
                    <Text style={styles.secondaryBtnText}>Logout</Text>
                  </Pressable>
                </View>
              )
            ) : (
              <Text style={[styles.meta, styles.headerMeta]}>{user?.username}</Text>
            )}
          </View>
        </View>

        <View style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Pressable key={item.key} onPress={() => setActiveView(item.key)} style={styles.navItem}>
              <Text style={[styles.navText, activeView === item.key && styles.navTextActive]}>
                {NAV_LABELS[item.key]}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
        {activeView === "home" &&
          categories
            .filter((category) => !STATE_SECTIONS.includes(category.id))
            .map((category) => (
            <Pressable key={category.id} onPress={() => openCategory(category.id)} style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryAccentBar,
                  { backgroundColor: categoryColorMap[category.id] || "#374151" },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDesc}>{category.description}</Text>
              </View>
              <Text style={styles.meta}>{category.questions.length} questions</Text>
            </Pressable>
          ))}

        {activeView === "quiz" && currentQuestion ? (
          <View style={styles.card}>
            <View
              style={[
                styles.quizTopAccent,
                { backgroundColor: categoryColorMap[activeCategory?.id] || "#374151" },
              ]}
            />
            <View style={styles.quizHeaderRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { borderColor: categoryColorMap[activeCategory?.id] || "#374151" },
                ]}
              >
                <View
                  style={[
                    styles.categoryBadgeDot,
                    { backgroundColor: categoryColorMap[activeCategory?.id] || "#374151" },
                  ]}
                />
                <Text style={styles.categoryBadgeText}>{activeCategory?.name}</Text>
              </View>
              <Text style={styles.progressText}>
                {currentQuestionIndex + 1} / {activeCategory?.questions.length}
              </Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
            {currentQuestion.imageSource ? (
              <Image
                source={currentQuestion.imageSource}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : null}
            {shouldShowTranslation && currentQuestionTranslation?.q ? (
              <Text
                style={[
                  styles.translationText,
                  isSelectedLanguageRtl && styles.translationTextRtl,
                  isSelectedLanguageRtl && styles.rtlText,
                ]}
              >
                {currentQuestionTranslation.q}
              </Text>
            ) : null}

            {currentQuestion.options.map((option, index) => {
              const selected = currentAnswer?.selectedIndex === index;
              const showCorrect = currentAnswer && index === currentQuestion.correctIndex;
              const showWrong = currentAnswer && selected && index !== currentQuestion.correctIndex;
              const translatedOption = currentQuestionTranslation?.opts?.[index] || "";
              return (
                <Pressable
                  key={`${currentQuestion.id}-${index}`}
                  onPress={() => selectAnswer(index)}
                  style={[
                    styles.optionBtn,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                  ]}
                >
                  <Text style={[styles.optionText, showCorrect && styles.optionTextOnDark]}>{option}</Text>
                  {shouldShowTranslation && translatedOption ? (
                    <Text
                      style={[
                        styles.optionTranslation,
                        isSelectedLanguageRtl && styles.rtlText,
                        showCorrect && styles.optionTextOnDark,
                      ]}
                    >
                      {translatedOption}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}

            <View style={styles.row}>
              <Pressable style={styles.secondaryBtn} onPress={() => gotoQuestion(currentQuestionIndex - 1)}>
                <Text style={styles.secondaryBtnText}>Back</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => gotoQuestion(currentQuestionIndex + 1)}>
                <Text style={styles.secondaryBtnText}>Next</Text>
              </Pressable>
            </View>
            <View style={styles.rowSecondary}>
              {canShowTranslation ? (
                <Pressable
                  style={[styles.secondaryBtn, styles.translationBtn, showTranslation && styles.translationBtnActive]}
                  onPress={() => setShowTranslation((prev) => !prev)}
                >
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      styles.translationBtnText,
                      showTranslation && styles.translationBtnTextActive,
                    ]}
                  >
                    {showTranslation ? "Hide Translation" : "Show Translation"}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.primaryBtn} onPress={() => toggleFavorite(currentQuestion.id)}>
                <Text style={styles.primaryBtnText}>
                  {favorites.includes(currentQuestion.id) ? "Favorited" : "Add Favorite"}
                </Text>
              </Pressable>
            </View>

          </View>
        ) : null}

        {activeView === "quiz" && currentQuestion ? (
          <View style={[styles.card, styles.numCard]}>
            <View style={styles.numGrid}>
              {activeCategory?.questions.map((q, i) => {
                const entry = answers[q.id];
                const isCurrent = i === currentQuestionIndex;
                const isCorrect = entry?.isCorrect;
                const isWrong = entry && !entry.isCorrect;
                return (
                  <Pressable
                    key={`num-${q.id}`}
                    onPress={() => gotoQuestion(i)}
                    style={[
                      styles.numBtn,
                      isCurrent && styles.numBtnCurrent,
                      !isCurrent && isCorrect && styles.numBtnCorrect,
                      !isCurrent && isWrong && styles.numBtnWrong,
                    ]}
                  >
                    <Text style={[styles.numBtnText, isCurrent && styles.numBtnTextCurrent]}>{i + 1}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {activeView === "favorites" &&
          renderStudySet(
            favoriteQuestions,
            "Favorites",
            "No favorite questions yet.",
            favoriteStudyIndex,
            setFavoriteStudyIndex,
            null,
            true,
            showFavoriteAnswers,
            <Pressable style={styles.secondaryBtn} onPress={toggleFavoriteAnswerVisibility}>
              <Text style={styles.secondaryBtnText}>
                {showFavoriteAnswers ? "Hide Answers" : "Show Answers"}
              </Text>
            </Pressable>,
            true,
            favoriteStudyAttempts,
            (questionId) => setFavoriteStudyAttempts((prev) => ({ ...prev, [questionId]: true }))
          )}

        {activeView === "testSimulation" && renderTestSimulation()}
        </ScrollView>
      </View>

      {isWeb ? (
        <Modal visible={showLoginModal} transparent animationType="fade" onRequestClose={() => setShowLoginModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {renderLoginContent()}
              <Pressable style={[styles.secondaryBtn, { marginTop: 8 }]} onPress={() => setShowLoginModal(false)}>
                <Text style={styles.secondaryBtnText}>Kapat</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
      <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Language</Text>
              <Text style={styles.mutedText}>German is always shown. Choose the translation language.</Text>
              <View style={styles.languageOptions}>
                {LANGUAGE_OPTIONS.map((option) => {
                  const isActive = option.key === selectedLanguage;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.languageOption, isActive && styles.languageOptionActive]}
                      onPress={() => {
                        setSelectedLanguage(option.key);
                        setShowLanguageModal(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.languageOptionTitle, RTL_LANGS.has(option.key) && styles.rtlText]}>
                          {LANGUAGE_DISPLAY_LABELS[option.key]}
                        </Text>
                        <Text style={styles.languageOptionMeta}>
                          {option.key === "de"
                            ? "German only"
                            : `German + ${LANGUAGE_DISPLAY_LABELS[option.key]}`}
                        </Text>
                      </View>
                      <Text style={[styles.languageOptionShort, isActive && styles.languageOptionShortActive]}>
                        {option.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable style={[styles.secondaryBtn, { marginTop: 12 }]} onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.secondaryBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7f7f5" },
  safeWeb: { alignItems: "center" },
  appFrame: { flex: 1, width: "100%" },
  appFrameWeb: {
    maxWidth: 760,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#f7f7f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  logo: {
    width: 34,
    height: 34,
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: "#000",
    color: "#fff",
    fontWeight: "700",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#000" },
  headerControls: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  headerUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  headerMeta: {
    marginBottom: 0,
  },
  nav: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
  },
  navItem: { paddingHorizontal: 10, paddingVertical: 12 },
  navText: { color: "rgba(0,0,0,0.5)" },
  navTextActive: { color: "#000", fontWeight: "600" },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  scrollArea: { flex: 1 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    paddingVertical: 14,
  },
  categoryAccentBar: {
    width: 7,
    alignSelf: "stretch",
    borderRadius: 999,
    marginRight: 10,
  },
  categoryName: { fontSize: 17, fontWeight: "600", color: "#000" },
  categoryDesc: { color: "rgba(0,0,0,0.55)", marginTop: 4 },
  section: { gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    padding: 14,
  },
  quizTopAccent: {
    height: 7,
    borderRadius: 999,
    marginBottom: 10,
  },
  quizHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  categoryBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  progressText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.55)",
    fontWeight: "700",
  },
  cardMuted: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.15)",
    padding: 18,
  },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#000", marginBottom: 8 },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
  removeConfirm: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.14)",
    backgroundColor: "#f7f7f5",
    padding: 12,
    marginTop: 12,
  },
  removeConfirmText: { color: "#111827", fontWeight: "600" },
  questionText: { fontSize: 16, color: "#000", marginBottom: 8, lineHeight: 24 },
  questionImage: {
    width: "100%",
    height: 220,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
  },
  translationText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.65)",
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(0,0,0,0.15)",
    paddingLeft: 10,
  },
  translationTextRtl: {
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderRightColor: "rgba(0,0,0,0.15)",
    paddingLeft: 0,
    paddingRight: 10,
  },
  meta: { fontSize: 12, color: "rgba(0,0,0,0.45)", marginBottom: 8 },
  optionBtn: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
  },
  optionCorrect: { backgroundColor: "#000", borderColor: "#000" },
  optionWrong: { backgroundColor: "#e4e4e7", borderColor: "rgba(0,0,0,0.2)" },
  optionSelected: { backgroundColor: "#f4f4f5", borderColor: "#000" },
  optionText: { color: "#000" },
  optionTranslation: { marginTop: 4, color: "rgba(0,0,0,0.58)", fontSize: 13 },
  optionTextOnDark: { color: "#fff" },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 },
  rowSecondary: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 },
  primaryBtn: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  btnDisabled: {
    backgroundColor: "#a1a1aa",
    borderColor: "#a1a1aa",
  },
  btnDisabledText: { color: "#f4f4f5" },
  removeBtn: {
    backgroundColor: "#991b1b",
    borderWidth: 1,
    borderColor: "#991b1b",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  secondaryBtnText: { color: "#000", fontSize: 13, fontWeight: "500" },
  translationBtn: {
    borderColor: "#0ea5e9",
    backgroundColor: "#e0f2fe",
  },
  translationBtnActive: {
    backgroundColor: "#0ea5e9",
    borderColor: "#0284c7",
  },
  translationBtnText: {
    color: "#0c4a6e",
    fontWeight: "700",
  },
  translationBtnTextActive: {
    color: "#fff",
  },
  sourceSwitch: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.14)",
    marginBottom: 10,
    overflow: "hidden",
  },
  sourceSwitchBtn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 2,
  },
  sourceSwitchBtnActive: {
    backgroundColor: "#000",
  },
  sourceSwitchBtnText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  sourceSwitchBtnTextActive: {
    color: "#fff",
  },
  sourceSwitchCount: {
    color: "rgba(0,0,0,0.5)",
    fontSize: 12,
  },
  sourceSwitchCountActive: {
    color: "rgba(255,255,255,0.72)",
  },
  numGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 0,
    paddingTop: 0,
  },
  numCard: {
    marginTop: 10,
  },
  numBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  numBtnCurrent: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  numBtnCorrect: {
    backgroundColor: "#f4f4f5",
    borderColor: "rgba(0,0,0,0.12)",
  },
  numBtnWrong: {
    backgroundColor: "#e4e4e7",
    borderColor: "rgba(0,0,0,0.2)",
  },
  numBtnText: { color: "#111827", fontSize: 11, fontWeight: "600" },
  numBtnTextCurrent: { color: "#fff" },
  scoreLabel: { color: "rgba(0,0,0,0.55)", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  scoreText: { color: "#000", fontSize: 42, fontWeight: "800", marginBottom: 4 },
  mutedText: { color: "rgba(0,0,0,0.55)" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "#fff",
    color: "#000",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    backgroundColor: "#f4f4f5",
    padding: 10,
    marginTop: 12,
  },
  errorText: { color: "#111827", fontSize: 13 },
  languageOptions: {
    marginTop: 14,
    gap: 8,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  languageOptionActive: {
    borderColor: "#000",
    backgroundColor: "#f4f4f5",
  },
  languageOptionTitle: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
  languageOptionMeta: {
    color: "rgba(0,0,0,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  languageOptionShort: {
    color: "rgba(0,0,0,0.55)",
    fontSize: 12,
    fontWeight: "700",
  },
  languageOptionShortActive: {
    color: "#000",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
});
