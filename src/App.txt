import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Sprout, Leaf, Flower2, Plus, RotateCcw, Sparkles, ArrowRight, Droplets,
  Info, Volume2, Loader2, Trash2, CheckCircle2, BookOpen, Award, Undo2,
  RefreshCw, LogIn, LogOut,
} from "lucide-react";
import { watchAuth, signInWithGoogle, signOutUser, loadGardenState, saveGardenState } from "./firebase";

const PALETTE = {
  paper: "#EFF2E6", paperDeep: "#E4E9D8", ink: "#28371F", inkSoft: "#5B6B4F",
  clay: "#8B6A45", card: "#FBFAF3", bloom: "#C85C7C", bloomDeep: "#A8425F",
  sun: "#DFA83E", wilt: "#B5573A", line: "#D8DCC7",
};

const MAX_STAGE = 4;
const LOCAL_KEY = "word-garden-local-v1";
const WATER_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 6;
const SAVE_DEBOUNCE_MS = 500;
const DEFAULT_EMOJI = "🌿";

const LEVELS = [
  { code: "A1", label: "مبتدئ", desc: "عبارات وكلمات أساسية للحياة اليومية", color: "#B9D6A0" },
  { code: "A2", label: "أساسي", desc: "تواصل بسيط في مواقف روتينية ومألوفة", color: "#8FBE72" },
  { code: "B1", label: "متوسط", desc: "التعبير عن الآراء والخطط بثقة معقولة", color: "#DCB24A" },
  { code: "B2", label: "فوق المتوسط", desc: "نقاش مواضيع معقدة بطلاقة نسبية", color: "#CE8B4C" },
  { code: "C1", label: "متقدم", desc: "استخدام مرن ودقيق في سياقات متعددة", color: "#C36B6F" },
  { code: "C2", label: "إتقان", desc: "فهم وتعبير شبه كامل كمتحدث أصلي", color: "#A8425F" },
];

const WORD_BANK_RAW = {
  A1: [["House","منزل","🏠"],["Water","ماء","💧"],["Happy","سعيد","😊"],["Friend","صديق","🧑‍🤝‍🧑"],["Eat","يأكل","🍽️"],["Big","كبير","🐘"],["Cold","بارد","🥶"],["Book","كتاب","📖"],["Cat","قطة","🐱"],["Dog","كلب","🐶"],["Table","طاولة","🍽️"],["Chair","كرسي","🪑"],["Family","عائلة","👨‍👩‍👧‍👦"],["School","مدرسة","🏫"],["Work","عمل","💼"],["Day","يوم","☀️"],["Night","ليل","🌙"],["Food","طعام","🍲"],["Drink","يشرب","🥤"],["Sleep","ينام","😴"],["Walk","يمشي","🚶"],["Run","يجري","🏃"],["Small","صغير","🐜"],["Hot","حار","🔥"],["New","جديد","✨"],["Old","قديم","🕰️"],["Good","جيد","👍"],["Bad","سيء","👎"],["Red","أحمر","🔴"],["Blue","أزرق","🔵"],["Mother","أم","👩"],["Father","أب","👨"],["Child","طفل","🧒"],["Time","وقت","⏰"],["Name","اسم","🏷️"]],
  A2: [["Weather","طقس","⛅"],["Travel","يسافر","✈️"],["Decide","يقرر","🤔"],["Comfortable","مريح","🛋️"],["Neighbor","جار","🏘️"],["Borrow","يستعير","🤝"],["Polite","مهذب","🙏"],["Improve","يحسّن","📈"],["Airport","مطار","🛫"],["Hospital","مستشفى","🏥"],["Weekend","عطلة نهاية الأسبوع","📅"],["Holiday","إجازة","🏖️"],["Shopping","تسوق","🛍️"],["Kitchen","مطبخ","🍳"],["Bedroom","غرفة نوم","🛏️"],["Journey","رحلة","🗺️"],["Enjoy","يستمتع","😄"],["Arrive","يصل","🛬"],["Depart","يغادر","🚪"],["Suggest","يقترح","💡"],["Invite","يدعو","✉️"],["Remember","يتذكر","🧠"],["Forget","ينسى","🤷"],["Explain","يشرح","🗣️"],["Compare","يقارن","⚖️"],["Choose","يختار","👉"],["Prepare","يُحضّر","🧰"],["Continue","يستمر","▶️"],["Exercise","تمرين رياضي","🏋️"],["Health","صحة","💪"],["Medicine","دواء","💊"],["Village","قرية","🏡"],["Countryside","ريف","🌾"],["Traffic","حركة المرور","🚦"],["Population","عدد السكان","👥"]],
  B1: [["Achieve","يحقق","🏆"],["Environment","بيئة","🌍"],["Opportunity","فرصة","🚪"],["Confident","واثق","💪"],["Habit","عادة","🔁"],["Encourage","يشجع","📣"],["Reliable","موثوق","🛡️"],["Awkward","محرج","😬"],["Advantage","ميزة","✅"],["Disadvantage","عيب","❌"],["Ancient","قديم جدًا","🏺"],["Approach","نهج ويقترب","➡️"],["Assume","يفترض","🤷"],["Attitude","موقف ونظرة","🎭"],["Available","متاح","🆓"],["Behavior","سلوك","🎬"],["Benefit","فائدة","🎁"],["Career","مسيرة مهنية","💼"],["Challenge","تحدٍّ","🧗"],["Community","مجتمع","🤝"],["Consequence","نتيجة","💥"],["Consider","يعتبر","🤔"],["Contribute","يساهم","🤲"],["Convince","يقنع","🗣️"],["Create","ينشئ","🛠️"],["Depend","يعتمد","🔗"],["Develop","يطوّر","🌱"],["Discover","يكتشف","🔍"],["Effort","جهد","💦"],["Estimate","يقدّر","🧮"],["Establish","يؤسس","🏗️"],["Evidence","دليل","🔎"],["Experience","خبرة","🎒"],["Increase","يزيد","📈"],["Influence","تأثير","🧲"]],
  B2: [["Perspective","منظور","👀"],["Sustainable","مستدام","♻️"],["Controversy","جدل","⚡"],["Diverse","متنوع","🌈"],["Empathy","تعاطف","❤️‍🩹"],["Skeptical","متشكك","🤨"],["Insight","بصيرة","💡"],["Justify","يبرر","⚖️"],["Accumulate","يراكم","📚"],["Adapt","يتكيف","🦎"],["Ambiguity","غموض","❓"],["Analyze","يحلل","🔬"],["Anticipate","يتوقع","⏳"],["Appropriate","مناسب","✔️"],["Assert","يؤكد بحزم","✊"],["Coherent","متماسك منطقيًا","🧩"],["Comprehensive","شامل","📋"],["Constraint","قيد","⛓️"],["Contradict","يناقض","↔️"],["Correlate","يرتبط بعلاقة","🔗"],["Deprive","يحرم من","🚫"],["Distinct","متميز","🔖"],["Emerge","يظهر تدريجيًا","🌅"],["Facilitate","ييسّر","🤝"],["Fluctuate","يتذبذب","📉"],["Implicit","ضمني","🤫"],["Inevitable","حتمي","⏳"],["Integrate","يدمج","🧩"],["Legitimate","مشروع","✅"],["Notion","فكرة ومفهوم","💭"],["Presume","يفترض مسبقًا","🤔"],["Prevail","يسود وينتصر","🏆"],["Reluctant","متردد","🙅"],["Undermine","يقوّض","⛏️"],["Viable","قابل للتطبيق","🌱"]],
  C1: [["Ambiguous","غامض التأويل","🌫️"],["Meticulous","دقيق جدًا","🔬"],["Resilient","صامد ومتعافٍ بسرعة","🌳"],["Pragmatic","عملي","🧰"],["Discrepancy","تباين","⚖️"],["Nuance","فارق دقيق","🎨"],["Innate","فطري","🧬"],["Deteriorate","يتدهور","📉"],["Alleviate","يخفف","🩹"],["Ascertain","يتحقق من","🔍"],["Coincide","يتزامن","🔀"],["Compelling","مقنع بقوة","🧲"],["Conducive","مؤدٍّ إلى ومهيّئ","🌱"],["Consolidate","يوطّد","🧱"],["Corroborate","يؤكد بأدلة","📎"],["Deviate","ينحرف عن","↩️"],["Discern","يميّز بدقة","👁️"],["Elicit","يستخرج ردة فعل","🎣"],["Empirical","تجريبي","🧪"],["Exacerbate","يفاقم","🔥"],["Impede","يعيق","🚧"],["Inherent","متأصل","🧬"],["Intrinsic","جوهري","💎"],["Mitigate","يخفف من حدة","🛡️"],["Paradox","مفارقة","🔄"],["Plausible","معقول ويُصدَّق","🤔"],["Precarious","هش وغير مستقر","⚠️"],["Refute","يدحض","❌"],["Substantiate","يثبت بالأدلة","📑"],["Tenuous","واهٍ وضعيف","🕸️"],["Unprecedented","غير مسبوق","🌟"],["Volatile","متقلب","🌋"],["Advocate","يدافع عن قضية","📢"],["Contentious","مثير للجدل","⚡"],["Discretion","تقدير شخصي وحكمة","🤐"]],
  C2: [["Ephemeral","زائل سريعًا","🦋"],["Ubiquitous","منتشر بكل مكان","🌐"],["Paradigm","نموذج فكري","🧭"],["Esoteric","غامض ومحدود الفهم","🔮"],["Vindicate","يبرّئ ويثبت الصحة","⚖️"],["Cognizant","مدرك تمامًا","🧠"],["Idiosyncratic","فريد بطابعه الخاص","🎭"],["Quintessential","الأمثل تمثيلًا","💯"],["Abstruse","معقد وغامض","🌀"],["Cacophony","تنافر أصوات صاخب","📢"],["Circumlocution","إطناب وحشو بالكلام","🌀"],["Deleterious","ضار","☠️"],["Ebullient","فائض بالحيوية","🎉"],["Fastidious","دقيق شديد التمحيص","🔍"],["Garrulous","كثير الثرثرة","🗣️"],["Iconoclast","مناهض للتقاليد السائدة","🔨"],["Ineffable","يفوق الوصف","🤍"],["Juxtapose","يضع بجانب للمقارنة","⚔️"],["Laconic","مقتضب بكلامه","🤐"],["Magnanimous","كريم النفس وسمح","👑"],["Obfuscate","يُعمّي ويُشوّش القصد","🌫️"],["Perfunctory","سطحي وروتيني دون اهتمام","🙄"],["Pernicious","مؤذٍ بشكل خفي وتدريجي","☠️"],["Recalcitrant","عنيد ومقاوم للطاعة","🙅"],["Sycophant","متملق","🐍"],["Taciturn","قليل الكلام بطبعه","🤐"],["Truculent","عدواني المزاج","😠"],["Vicissitude","تقلبات الحياة","🎢"],["Winsome","جذاب وساحر بلطف","😊"],["Zeitgeist","روح العصر","🕰️"],["Anachronistic","مخالف لزمنه","⏳"],["Equivocate","يستخدم كلامًا مبهمًا للتهرب","🤷"],["Insidious","خبيث وتدريجي الأذى","🕷️"],["Obsequious","متملق مبالغ بالطاعة","🙇"],["Panacea","الحل السحري الشامل","✨"]],
};

const STATIC_BANK = Object.entries(WORD_BANK_RAW).flatMap(([level, list]) =>
  list.map(([en, ar, emoji], i) => ({ id: `${level}-${i}`, en, ar, emoji, level }))
);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function levelMeta(code) { return LEVELS.find((l) => l.code === code) || LEVELS[2]; }
function stageLabel(stage) { return ["بذرة", "براعم", "ساق وأوراق", "برعم زهرة", "إزهار كامل"][stage] || "بذرة"; }
function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h > 0 ? `${h} ساعة${m > 0 ? ` و${m} دقيقة` : ""}` : `${m} دقيقة`;
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error("api_" + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function classifyWord(word, arabic) {
  try {
    const data = await apiPost("/api/classify", { word, arabic });
    return { ...data, ok: true };
  } catch (e) {
    return { level: "B1", arabic: arabic || "", emoji: DEFAULT_EMOJI, ok: false, rateLimited: e && e.status === 429 };
  }
}
async function fetchEnrichment(word, arabic, level) {
  try {
    const data = await apiPost("/api/enrich", { word, arabic, level });
    return { ...data, ok: true };
  } catch (e) {
    return { ok: false, rateLimited: e && e.status === 429 };
  }
}
async function generateMoreWords(level, existing) {
  try {
    const list = await apiPost("/api/generate", { level, existing });
    return (Array.isArray(list) ? list : []).map((w, i) => ({
      id: `${level}-dyn-${Date.now()}-${i}`, en: w.en, ar: w.ar, emoji: w.emoji || DEFAULT_EMOJI, level,
    }));
  } catch (e) {
    return [];
  }
}

function useSpeech() {
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const showNotice = useCallback((msg) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  }, []);
  const speak = useCallback((text) => {
    try {
      if (!window.speechSynthesis) { showNotice("النطق غير مدعوم في هذا المتصفح"); return; }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.88;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
      if (enVoice) utter.voice = enVoice;
      utter.onerror = () => showNotice("تعذّر تشغيل النطق الآن");
      window.speechSynthesis.speak(utter);
    } catch (e) {
      showNotice("النطق غير مدعوم في هذا المتصفح");
    }
  }, [showNotice]);
  return { speak, notice };
}

function PlantMark({ stage, size = 28 }) {
  if (stage <= 0) return <div style={{ width: size, height: size, borderRadius: "50%", background: PALETTE.clay, opacity: 0.55 }} />;
  if (stage === 1) return <Sprout size={size} color={PALETTE.inkSoft} strokeWidth={2} />;
  if (stage === 2) return <Leaf size={size} color="#4C7A3B" strokeWidth={2} />;
  if (stage === 3) return <Flower2 size={size} color={PALETTE.sun} strokeWidth={2} />;
  return <Flower2 size={size} color={PALETTE.bloom} strokeWidth={2.2} />;
}

function LevelFilterRow({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      <button onClick={() => onChange("all")} style={{ background: value === "all" ? PALETTE.ink : "transparent", color: value === "all" ? PALETTE.paper : PALETTE.inkSoft, border: `1.5px solid ${PALETTE.ink}`, borderRadius: "999px" }} className="px-2.5 py-1 text-[11px] font-medium">الكل</button>
      {LEVELS.map((lv) => (
        <button key={lv.code} onClick={() => onChange(lv.code)} style={{ background: value === lv.code ? lv.color : "transparent", color: value === lv.code ? "#fff" : PALETTE.ink, border: `1.5px solid ${lv.color}`, borderRadius: "999px", fontFamily: "monospace" }} className="px-2.5 py-1 text-[11px] font-medium">{lv.code}</button>
      ))}
    </div>
  );
}

const EMPTY_STATE = { selectedLevels: ["A1"], customWords: [], dynamicBank: {}, plantedIds: [], knownIds: [], progress: {} };

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out
  const [authBusy, setAuthBusy] = useState(false);
  const [tab, setTab] = useState("library");
  const [selectedLevels, setSelectedLevels] = useState(["A1"]);
  const [customWords, setCustomWords] = useState([]);
  const [dynamicBank, setDynamicBank] = useState({});
  const [plantedIds, setPlantedIds] = useState([]);
  const [knownIds, setKnownIds] = useState([]);
  const [progress, setProgress] = useState({});
  const [showLevels, setShowLevels] = useState(true);
  const [gardenFilter, setGardenFilter] = useState("all");
  const [knownFilter, setKnownFilter] = useState("all");
  const [activeId, setActiveId] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [enrichment, setEnrichment] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newEn, setNewEn] = useState("");
  const [newAr, setNewAr] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [generatingLevels, setGeneratingLevels] = useState([]);
  const [nowTick, setNowTick] = useState(Date.now());
  const { speak, notice } = useSpeech();

  useEffect(() => { const t = setInterval(() => setNowTick(Date.now()), 60000); return () => clearInterval(t); }, []);

  // auth
  useEffect(() => watchAuth(setUser), []);

  // load state: from Firestore if signed in, else localStorage
  useEffect(() => {
    if (user === undefined) return;
    let cancelled = false;
    (async () => {
      let data = null;
      if (user) {
        try { data = await loadGardenState(user.uid); } catch (e) { /* fall through */ }
      }
      if (!data) {
        try { const raw = localStorage.getItem(LOCAL_KEY); if (raw) data = JSON.parse(raw); } catch (e) { /* ignore */ }
      }
      const final = data || EMPTY_STATE;
      if (!cancelled) {
        setSelectedLevels(final.selectedLevels || ["A1"]);
        setCustomWords(final.customWords || []);
        setDynamicBank(final.dynamicBank || {});
        setPlantedIds(final.plantedIds || []);
        setKnownIds(final.knownIds || []);
        setProgress(final.progress || {});
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const stateRef = useRef({});
  stateRef.current = { selectedLevels, customWords, dynamicBank, plantedIds, knownIds, progress };
  const saveTimer = useRef(null);

  const saveAll = useCallback((patch) => {
    const cur = stateRef.current;
    const next = {
      selectedLevels: patch.selectedLevels ?? cur.selectedLevels,
      customWords: patch.customWords ?? cur.customWords,
      dynamicBank: patch.dynamicBank ?? cur.dynamicBank,
      plantedIds: patch.plantedIds ?? cur.plantedIds,
      knownIds: patch.knownIds ?? cur.knownIds,
      progress: patch.progress ?? cur.progress,
    };
    if (patch.selectedLevels) setSelectedLevels(patch.selectedLevels);
    if (patch.customWords) setCustomWords(patch.customWords);
    if (patch.dynamicBank) setDynamicBank(patch.dynamicBank);
    if (patch.plantedIds) setPlantedIds(patch.plantedIds);
    if (patch.knownIds) setKnownIds(patch.knownIds);
    if (patch.progress) setProgress(patch.progress);

    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); } catch (e) { /* storage full or blocked */ }

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (user) saveGardenState(user.uid, next).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
  }, [user]);

  async function handleSignIn() {
    setAuthBusy(true);
    try { await signInWithGoogle(); } catch (e) { /* user closed popup etc */ }
    setAuthBusy(false);
  }
  async function handleSignOut() { await signOutUser(); }

  const allWords = useMemo(() => {
    const dyn = Object.values(dynamicBank).flat();
    return [...STATIC_BANK, ...dyn, ...customWords];
  }, [dynamicBank, customWords]);
  const wordById = useMemo(() => { const m = {}; allWords.forEach((w) => (m[w.id] = w)); return m; }, [allWords]);

  const libraryWords = useMemo(() => allWords.filter((w) => selectedLevels.includes(w.level) && !w.custom && !plantedIds.includes(w.id) && !knownIds.includes(w.id)), [allWords, selectedLevels, plantedIds, knownIds]);
  const gardenWordsAll = useMemo(() => plantedIds.filter((id) => !knownIds.includes(id)).map((id) => wordById[id]).filter(Boolean).map((w) => ({ ...w, ...(progress[w.id] || { stage: 0, lastWatered: 0 }) })), [plantedIds, knownIds, wordById, progress]);
  const gardenWords = useMemo(() => (gardenFilter === "all" ? gardenWordsAll : gardenWordsAll.filter((w) => w.level === gardenFilter)), [gardenWordsAll, gardenFilter]);
  const knownWordsAll = useMemo(() => knownIds.map((id) => wordById[id]).filter(Boolean), [knownIds, wordById]);
  const knownWords = useMemo(() => (knownFilter === "all" ? knownWordsAll : knownWordsAll.filter((w) => w.level === knownFilter)), [knownWordsAll, knownFilter]);
  const bloomCount = gardenWordsAll.filter((w) => w.stage === MAX_STAGE).length;

  useEffect(() => {
    if (tab !== "library" || !ready) return;
    selectedLevels.forEach((level) => {
      if (generatingLevels.includes(level)) return;
      const levelPool = allWords.filter((w) => w.level === level);
      const available = levelPool.filter((w) => !plantedIds.includes(w.id) && !knownIds.includes(w.id));
      if (available.length < LOW_STOCK_THRESHOLD) {
        setGeneratingLevels((g) => [...g, level]);
        generateMoreWords(level, levelPool.map((w) => w.en)).then((newWords) => {
          setGeneratingLevels((g) => g.filter((l) => l !== level));
          if (newWords.length === 0) return;
          const nextDynamic = { ...stateRef.current.dynamicBank, [level]: [...(stateRef.current.dynamicBank[level] || []), ...newWords] };
          saveAll({ dynamicBank: nextDynamic });
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, ready, selectedLevels, allWords.length, plantedIds.length, knownIds.length]);

  function toggleLevel(code) { saveAll({ selectedLevels: selectedLevels.includes(code) ? selectedLevels.filter((c) => c !== code) : [...selectedLevels, code] }); }
  function plantWord(id) { if (plantedIds.includes(id)) return; saveAll({ plantedIds: [...plantedIds, id], progress: { ...progress, [id]: progress[id] || { stage: 0, lastWatered: 0 } } }); }
  function markKnownFromLibrary(id) { saveAll({ knownIds: knownIds.includes(id) ? knownIds : [...knownIds, id] }); }
  function markKnownFromGarden(id) {
    const nextProgress = { ...progress }; delete nextProgress[id];
    saveAll({ knownIds: knownIds.includes(id) ? knownIds : [...knownIds, id], plantedIds: plantedIds.filter((p) => p !== id), progress: nextProgress });
    if (activeId === id) closeWord();
  }
  function unmarkKnown(id) { saveAll({ knownIds: knownIds.filter((k) => k !== id) }); }
  function deleteFromGarden(id) {
    const nextProgress = { ...progress }; delete nextProgress[id];
    saveAll({ plantedIds: plantedIds.filter((p) => p !== id), progress: nextProgress });
    if (activeId === id) closeWord();
  }
  function openWord(id) { setActiveId(id); setFlipped(false); setQuiz(null); }
  function closeWord() { setActiveId(null); setFlipped(false); setQuiz(null); }

  const activeWord = activeId ? gardenWordsAll.find((w) => w.id === activeId) : null;

  const runEnrichment = useCallback((w) => {
    setEnrichment((prev) => ({ ...prev, [w.id]: { loading: true } }));
    fetchEnrichment(w.en, w.ar, w.level).then((res) => setEnrichment((prev) => ({ ...prev, [w.id]: { ...res, loading: false } })));
  }, []);
  function onFlip() { setFlipped((f) => { const n = !f; if (n && activeWord && !enrichment[activeWord.id]) runEnrichment(activeWord); return n; }); }
  function retryEnrichment() { if (activeWord) runEnrichment(activeWord); }

  function startQuiz() {
    const sameLevel = allWords.filter((w) => w.level === activeWord.level && w.id !== activeWord.id);
    const pool = sameLevel.length >= 2 ? sameLevel : allWords.filter((w) => w.id !== activeWord.id);
    const others = shuffle(pool).slice(0, 2).map((w) => w.ar);
    setQuiz({ options: shuffle([activeWord.ar, ...others]), correctAr: activeWord.ar, picked: null, result: null });
  }
  function pickOption(opt) {
    if (quiz.picked) return;
    const correct = opt === quiz.correctAr;
    setQuiz({ ...quiz, picked: opt, result: correct ? "correct" : "wrong" });
    const cur = progress[activeWord.id] || { stage: 0, lastWatered: 0 };
    const nextStage = correct ? Math.min(MAX_STAGE, cur.stage + 1) : Math.max(0, cur.stage - 1);
    saveAll({ progress: { ...progress, [activeWord.id]: { stage: nextStage, lastWatered: Date.now() } } });
  }

  async function addWord() {
    const en = newEn.trim(), arInput = newAr.trim();
    if (!en) return;
    setAdding(true); setAddError(null);
    const { level, arabic, emoji, ok, rateLimited } = await classifyWord(en, arInput);
    if (!arabic) {
      setAddError(rateLimited ? "تم الوصول للحد الأقصى من الطلبات مؤقتًا، حاول بعد قليل." : ok ? "لم يصل رد كافٍ، الرجاء إدخال الترجمة يدويًا." : "تعذّر الاتصال بخدمة التصنيف، الرجاء إدخال الترجمة يدويًا.");
      setAdding(false); return;
    }
    const id = `custom-${Date.now()}`;
    saveAll({
      customWords: [...customWords, { id, en, ar: arabic, level, emoji, custom: true }],
      selectedLevels: selectedLevels.includes(level) ? selectedLevels : [...selectedLevels, level],
      plantedIds: [...plantedIds, id],
      progress: { ...progress, [id]: { stage: 0, lastWatered: 0 } },
    });
    setNewEn(""); setNewAr(""); setShowAdd(false); setAdding(false); setTab("garden");
  }

  if (user === undefined || !ready) {
    return <div dir="rtl" style={{ background: PALETTE.paper, minHeight: "100vh", fontFamily: "sans-serif" }} className="flex items-center justify-center"><p style={{ color: PALETTE.inkSoft }}>...جارٍ تجهيز الحديقة</p></div>;
  }

  return (
    <div dir="rtl" style={{ background: `linear-gradient(180deg, ${PALETTE.paper} 0%, ${PALETTE.paperDeep} 100%)`, minHeight: "100vh", fontFamily: "sans-serif", color: PALETTE.ink }} className="pb-10">
      <div className="px-5 pt-7 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 style={{ color: PALETTE.ink }} className="text-3xl font-semibold">مزرعة الكلمات</h1>
          {tab === "garden" && <span style={{ fontFamily: "monospace", color: PALETTE.inkSoft }} className="text-xs">{bloomCount}/{gardenWordsAll.length} مزهرة</span>}
        </div>
        <div className="flex items-center justify-between mt-1">
          <p style={{ color: PALETTE.inkSoft }} className="text-sm">
            {tab === "library" && "تصفّح المكتبة واختر الكلمات لتزرعها."}
            {tab === "garden" && "مزرعتك الخاصة — راجع كلماتك وارعَها."}
            {tab === "known" && "الكلمات التي أتقنتها بالفعل."}
          </p>
          {user ? (
            <button onClick={handleSignOut} style={{ color: PALETTE.inkSoft }} className="flex items-center gap-1 text-xs flex-shrink-0">
              <LogOut size={13} /> {user.displayName ? user.displayName.split(" ")[0] : "خروج"}
            </button>
          ) : (
            <button onClick={handleSignIn} disabled={authBusy} style={{ background: PALETTE.ink, color: PALETTE.paper, borderRadius: "999px" }} className="flex items-center gap-1 text-xs px-3 py-1.5 flex-shrink-0">
              {authBusy ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />} تسجيل دخول بجوجل
            </button>
          )}
        </div>
        {!user && <p style={{ color: PALETTE.clay }} className="text-[11px] mt-1">أنت ضيف الآن — تقدمك محفوظ على هذا الجهاز فقط. سجّل دخولك لحفظه بحسابك والوصول له من أي جهاز.</p>}
        {notice && <p style={{ color: PALETTE.wilt }} className="text-xs mt-1">{notice}</p>}
      </div>

      <div className="px-5 mb-4 flex gap-1.5">
        <button onClick={() => { setTab("library"); closeWord(); }} style={{ background: tab === "library" ? PALETTE.ink : "transparent", color: tab === "library" ? PALETTE.paper : PALETTE.inkSoft, border: `1.5px solid ${PALETTE.ink}`, borderRadius: "12px" }} className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1"><BookOpen size={14} /> المكتبة</button>
        <button onClick={() => { setTab("garden"); closeWord(); }} style={{ background: tab === "garden" ? PALETTE.bloom : "transparent", color: tab === "garden" ? "#fff" : PALETTE.inkSoft, border: `1.5px solid ${PALETTE.bloom}`, borderRadius: "12px" }} className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1"><Sprout size={14} /> مزرعتي {gardenWordsAll.length > 0 && <span style={{ fontFamily: "monospace" }} className="text-[10px]">({gardenWordsAll.length})</span>}</button>
        <button onClick={() => { setTab("known"); closeWord(); }} style={{ background: tab === "known" ? PALETTE.sun : "transparent", color: tab === "known" ? "#fff" : PALETTE.inkSoft, border: `1.5px solid ${PALETTE.sun}`, borderRadius: "12px" }} className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1"><Award size={14} /> أعرفها {knownIds.length > 0 && <span style={{ fontFamily: "monospace" }} className="text-[10px]">({knownIds.length})</span>}</button>
      </div>

      {tab === "library" && activeId === null && (
        <LibraryTab selectedLevels={selectedLevels} toggleLevel={toggleLevel} showLevels={showLevels} setShowLevels={setShowLevels} libraryWords={libraryWords} plantWord={plantWord} markKnownFromLibrary={markKnownFromLibrary} speak={speak} generatingLevels={generatingLevels} showAdd={showAdd} setShowAdd={setShowAdd} newEn={newEn} setNewEn={setNewEn} newAr={newAr} setNewAr={setNewAr} adding={adding} addError={addError} addWord={addWord} />
      )}
      {tab === "garden" && activeId === null && (
        <GardenTab gardenWords={gardenWords} gardenFilter={gardenFilter} setGardenFilter={setGardenFilter} openWord={openWord} speak={speak} markKnown={markKnownFromGarden} deleteFromGarden={deleteFromGarden} setTab={setTab} isEmpty={gardenWordsAll.length === 0} />
      )}
      {tab === "known" && (
        <KnownTab knownWords={knownWords} knownFilter={knownFilter} setKnownFilter={setKnownFilter} speak={speak} unmarkKnown={unmarkKnown} setTab={setTab} isEmpty={knownWordsAll.length === 0} />
      )}
      {activeId !== null && activeWord && (
        <DetailView word={activeWord} flipped={flipped} onFlip={onFlip} enrichment={enrichment[activeWord.id]} onRetryEnrichment={retryEnrichment} quiz={quiz} startQuiz={startQuiz} pickOption={pickOption} onBack={closeWord} speak={speak} nowTick={nowTick} markKnown={markKnownFromGarden} onNextRound={() => { setFlipped(false); setQuiz(null); }} />
      )}
    </div>
  );
}

function LibraryTab({ selectedLevels, toggleLevel, showLevels, setShowLevels, libraryWords, plantWord, markKnownFromLibrary, speak, generatingLevels, showAdd, setShowAdd, newEn, setNewEn, newAr, setNewAr, adding, addError, addWord }) {
  return (
    <>
      <div className="px-5 mb-4">
        <button onClick={() => setShowLevels((s) => !s)} style={{ color: PALETTE.inkSoft }} className="flex items-center gap-1 text-xs mb-2"><Info size={13} />{showLevels ? "إخفاء شرح المستويات" : "ما معنى هذه المستويات؟"}</button>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((lv) => {
            const on = selectedLevels.includes(lv.code);
            return <button key={lv.code} onClick={() => toggleLevel(lv.code)} style={{ background: on ? lv.color : "transparent", border: `1.5px solid ${lv.color}`, color: on ? "#fff" : PALETTE.ink, borderRadius: "999px" }} className="px-3 py-1.5 text-xs font-medium flex items-center gap-1"><span style={{ fontFamily: "monospace" }}>{lv.code}</span><span>{lv.label}</span>{generatingLevels.includes(lv.code) && <Loader2 size={11} className="animate-spin" />}</button>;
          })}
        </div>
        {showLevels && (
          <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, borderRadius: "12px" }} className="mt-3 p-3 flex flex-col gap-1.5">
            {LEVELS.map((lv) => <div key={lv.code} className="flex items-start gap-2 text-xs"><span style={{ color: lv.color, fontFamily: "monospace", minWidth: "24px" }} className="font-semibold">{lv.code}</span><span style={{ color: PALETTE.inkSoft }}><b style={{ color: PALETTE.ink }}>{lv.label}</b> — {lv.desc}</span></div>)}
          </div>
        )}
      </div>
      {libraryWords.length === 0 ? (
        <div className="px-5"><div style={{ background: PALETTE.card, border: `1px dashed ${PALETTE.clay}`, borderRadius: "14px" }} className="p-6 text-center text-sm"><p style={{ color: PALETTE.inkSoft }}>اختر مستوى واحدًا على الأقل من الأعلى لتصفّح كلماته.</p></div></div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3">
          {libraryWords.map((w) => {
            const lm = levelMeta(w.level);
            return (
              <div key={w.id} style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, borderRadius: "14px" }} className="relative flex flex-col items-center gap-1 p-4">
                <span style={{ position: "absolute", top: 8, insetInlineStart: 8, background: lm.color, color: "#fff", fontFamily: "monospace", borderRadius: "6px" }} className="text-[9px] px-1.5 py-0.5">{lm.code}</span>
                <button onClick={() => speak(w.en)} style={{ position: "absolute", top: 6, insetInlineEnd: 6, color: PALETTE.inkSoft }} className="p-1"><Volume2 size={15} /></button>
                <span className="text-2xl mt-3">{w.emoji || DEFAULT_EMOJI}</span>
                <span dir="ltr" className="text-base font-medium">{w.en}</span>
                <span style={{ color: PALETTE.inkSoft }} className="text-xs">{w.ar}</span>
                <div className="flex gap-1.5 w-full mt-1">
                  <button onClick={() => plantWord(w.id)} style={{ flex: 1, background: PALETTE.ink, color: PALETTE.paper, borderRadius: "10px" }} className="py-1.5 text-[11px] font-medium flex items-center justify-center gap-1"><Sprout size={12} /> ازرع</button>
                  <button onClick={() => markKnownFromLibrary(w.id)} style={{ flex: 1, border: `1px solid ${PALETTE.sun}`, color: "#8A6A1D", borderRadius: "10px" }} className="py-1.5 text-[11px] font-medium flex items-center justify-center gap-1"><Award size={12} /> أعرفها</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="px-5 mt-5">
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)} style={{ border: `1.5px dashed ${PALETTE.clay}`, color: PALETTE.clay, borderRadius: "14px" }} className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium"><Plus size={16} /> أضف كلمتك الخاصة</button>
        ) : (
          <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, borderRadius: "14px" }} className="p-4 flex flex-col gap-2">
            <input dir="ltr" value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="English word" disabled={adding} style={{ border: `1px solid ${PALETTE.line}`, borderRadius: "10px", background: "#fff" }} className="px-3 py-2 text-sm outline-none" />
            <input value={newAr} onChange={(e) => setNewAr(e.target.value)} placeholder="الترجمة (اختياري)" disabled={adding} style={{ border: `1px solid ${PALETTE.line}`, borderRadius: "10px", background: "#fff" }} className="px-3 py-2 text-sm outline-none" />
            {addError && <p style={{ color: PALETTE.wilt }} className="text-xs">{addError}</p>}
            <div className="flex gap-2 mt-1">
              <button onClick={addWord} disabled={adding || !newEn.trim()} style={{ background: PALETTE.ink, color: PALETTE.paper, borderRadius: "10px", opacity: adding || !newEn.trim() ? 0.6 : 1 }} className="flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2">{adding ? <><Loader2 size={14} className="animate-spin" /> جارٍ...</> : "إضافة وزراعة"}</button>
              <button onClick={() => { setShowAdd(false); setNewEn(""); setNewAr(""); }} disabled={adding} style={{ border: `1px solid ${PALETTE.line}`, borderRadius: "10px", color: PALETTE.inkSoft }} className="px-4 py-2 text-sm">إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function GardenTab({ gardenWords, gardenFilter, setGardenFilter, openWord, speak, markKnown, deleteFromGarden, setTab, isEmpty }) {
  if (isEmpty) return <div className="px-5"><div style={{ background: PALETTE.card, border: `1px dashed ${PALETTE.clay}`, borderRadius: "14px" }} className="p-6 text-center text-sm flex flex-col items-center gap-3"><p style={{ color: PALETTE.inkSoft }}>مزرعتك فارغة. تصفّح المكتبة واضغط "ازرع".</p><button onClick={() => setTab("library")} style={{ background: PALETTE.ink, color: PALETTE.paper, borderRadius: "10px" }} className="px-4 py-2 text-xs font-medium flex items-center gap-1.5"><BookOpen size={14} /> الذهاب للمكتبة</button></div></div>;
  return (
    <div className="px-5">
      <LevelFilterRow value={gardenFilter} onChange={setGardenFilter} />
      {gardenWords.length === 0 ? <p style={{ color: PALETTE.inkSoft }} className="text-xs text-center py-6">لا توجد كلمات بهذا المستوى.</p> : (
        <div className="grid grid-cols-2 gap-3">
          {gardenWords.map((w) => {
            const lm = levelMeta(w.level);
            return (
              <div key={w.id} style={{ background: PALETTE.card, border: w.custom ? `1.5px dashed ${lm.color}` : `1px solid ${PALETTE.line}`, borderRadius: "14px" }} className="relative flex flex-col items-center gap-1.5 p-4">
                <span style={{ position: "absolute", top: 8, insetInlineStart: 8, background: lm.color, color: "#fff", fontFamily: "monospace", borderRadius: "6px" }} className="text-[9px] px-1.5 py-0.5">{lm.code}</span>
                <button onClick={() => speak(w.en)} style={{ position: "absolute", top: 6, insetInlineEnd: 6, color: PALETTE.inkSoft }} className="p-1"><Volume2 size={15} /></button>
                <button onClick={() => openWord(w.id)} className="flex flex-col items-center gap-1.5 w-full mt-2">
                  <span className="text-xl">{w.emoji || DEFAULT_EMOJI}</span>
                  <PlantMark stage={w.stage} size={28} />
                  <span dir="ltr" className="text-base font-medium">{w.en}</span>
                  <span style={{ fontFamily: "monospace", color: PALETTE.inkSoft }} className="text-[10px]">{stageLabel(w.stage)}</span>
                </button>
                <div className="flex gap-3 mt-1">
                  <button onClick={() => markKnown(w.id)} style={{ color: "#8A6A1D" }}><Award size={15} /></button>
                  <button onClick={() => deleteFromGarden(w.id)} style={{ color: PALETTE.wilt }}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KnownTab({ knownWords, knownFilter, setKnownFilter, speak, unmarkKnown, setTab, isEmpty }) {
  if (isEmpty) return <div className="px-5"><div style={{ background: PALETTE.card, border: `1px dashed ${PALETTE.clay}`, borderRadius: "14px" }} className="p-6 text-center text-sm flex flex-col items-center gap-3"><p style={{ color: PALETTE.inkSoft }}>لم تُتقن أي كلمة بعد.</p><button onClick={() => setTab("library")} style={{ background: PALETTE.ink, color: PALETTE.paper, borderRadius: "10px" }} className="px-4 py-2 text-xs font-medium flex items-center gap-1.5"><BookOpen size={14} /> الذهاب للمكتبة</button></div></div>;
  return (
    <div className="px-5">
      <LevelFilterRow value={knownFilter} onChange={setKnownFilter} />
      <div className="grid grid-cols-2 gap-3">
        {knownWords.map((w) => {
          const lm = levelMeta(w.level);
          return (
            <div key={w.id} style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, borderRadius: "14px" }} className="relative flex flex-col items-center gap-1 p-4">
              <span style={{ position: "absolute", top: 8, insetInlineStart: 8, background: lm.color, color: "#fff", fontFamily: "monospace", borderRadius: "6px" }} className="text-[9px] px-1.5 py-0.5">{lm.code}</span>
              <button onClick={() => speak(w.en)} style={{ position: "absolute", top: 6, insetInlineEnd: 6, color: PALETTE.inkSoft }} className="p-1"><Volume2 size={15} /></button>
              <span className="text-xl mt-3">{w.emoji || DEFAULT_EMOJI}</span>
              <Award size={20} color={PALETTE.sun} />
              <span dir="ltr" className="text-base font-medium">{w.en}</span>
              <span style={{ color: PALETTE.inkSoft }} className="text-xs">{w.ar}</span>
              <button onClick={() => unmarkKnown(w.id)} style={{ color: PALETTE.inkSoft }} className="flex items-center gap-1 text-[11px] mt-1"><Undo2 size={12} /> إرجاع للمكتبة</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailView({ word, flipped, onFlip, enrichment, onRetryEnrichment, quiz, startQuiz, pickOption, onBack, speak, nowTick, markKnown, onNextRound }) {
  const lm = levelMeta(word.level);
  const onCooldown = word.lastWatered > 0 && nowTick - word.lastWatered < WATER_COOLDOWN_MS;
  const remain = onCooldown ? formatRemaining(WATER_COOLDOWN_MS - (nowTick - word.lastWatered)) : null;
  return (
    <div className="px-5 pt-1">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} style={{ color: PALETTE.inkSoft }} className="flex items-center gap-1 text-sm"><ArrowRight size={16} /> رجوع</button>
        <button onClick={() => markKnown(word.id)} style={{ color: "#8A6A1D" }} className="flex items-center gap-1 text-xs"><Award size={14} /> أعرفها</button>
      </div>
      <div onClick={() => !quiz && onFlip()} style={{ perspective: "1000px" }} className="w-full h-44 cursor-pointer">
        <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d", transition: "transform 0.5s", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", background: PALETTE.card, border: `1px solid ${PALETTE.line}`, borderRadius: "18px" }} className="flex flex-col items-center justify-center gap-2">
            <span style={{ position: "absolute", top: 10, insetInlineStart: 10, background: lm.color, color: "#fff", fontFamily: "monospace", borderRadius: "6px" }} className="text-[10px] px-2 py-0.5">{lm.code}</span>
            <button onClick={(e) => { e.stopPropagation(); speak(word.en); }} style={{ position: "absolute", top: 8, insetInlineEnd: 8, color: PALETTE.inkSoft }} className="p-1.5"><Volume2 size={18} /></button>
            <span className="text-3xl">{word.emoji || DEFAULT_EMOJI}</span>
            <PlantMark stage={word.stage} size={30} />
            <span dir="ltr" className="text-2xl font-semibold">{word.en}</span>
            <span style={{ color: PALETTE.inkSoft }} className="text-xs">اضغط لكشف الترجمة</span>
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: PALETTE.ink, borderRadius: "18px" }} className="flex flex-col items-center justify-center gap-2">
            <span style={{ color: PALETTE.paper }} className="text-2xl">{word.ar}</span>
            <span dir="ltr" style={{ color: PALETTE.paperDeep }} className="text-xs">{word.en}</span>
          </div>
        </div>
      </div>
      <p style={{ color: PALETTE.inkSoft }} className="text-xs text-center mt-3">مرحلة النمو: {stageLabel(word.stage)}</p>
      {flipped && (
        <div style={{ background: PALETTE.card, border: `1px solid ${PALETTE.line}`, borderRadius: "12px" }} className="mt-4 p-4 flex flex-col gap-2">
          {!enrichment || enrichment.loading ? (
            <p style={{ color: PALETTE.inkSoft }} className="text-xs flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> جارٍ تحضير النطق والمعنى والمثال...</p>
          ) : enrichment.ok === false ? (
            <div className="flex items-center justify-between gap-2">
              <p style={{ color: PALETTE.wilt }} className="text-xs">{enrichment.rateLimited ? "تم الوصول للحد الأقصى مؤقتًا." : "تعذّر تحضير الشرح الآن."}</p>
              <button onClick={onRetryEnrichment} style={{ color: PALETTE.bloomDeep }} className="flex items-center gap-1 text-xs flex-shrink-0"><RefreshCw size={13} /> إعادة المحاولة</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ color: PALETTE.inkSoft }} className="text-[10px] font-medium">النطق:</span>
                <span dir="ltr" style={{ color: PALETTE.ink, fontFamily: "monospace" }} className="text-sm">{enrichment.phonetic_ipa}</span>
                <span style={{ color: PALETTE.bloomDeep }} className="text-sm">({enrichment.phonetic_ar})</span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: PALETTE.line }}>
                <p style={{ color: PALETTE.inkSoft }} className="text-[10px] font-medium mb-0.5">المعنى</p>
                <p dir="ltr" style={{ color: PALETTE.ink }} className="text-sm">{enrichment.definition_en}</p>
                <p style={{ color: PALETTE.inkSoft }} className="text-sm">{enrichment.definition_ar}</p>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: PALETTE.line }}>
                <p style={{ color: PALETTE.inkSoft }} className="text-[10px] font-medium mb-0.5">مثال</p>
                <p dir="ltr" style={{ color: PALETTE.ink, fontStyle: "italic" }} className="text-sm">{enrichment.example_en}</p>
                <p style={{ color: PALETTE.inkSoft }} className="text-sm">{enrichment.example_ar}</p>
              </div>
            </>
          )}
        </div>
      )}
      {flipped && !quiz && (onCooldown ? (
        <div style={{ background: "#F1EDE3", border: `1px dashed ${PALETTE.clay}`, borderRadius: "12px", color: PALETTE.clay }} className="w-full py-3 mt-4 text-center text-xs">سقيت هذه النبتة اليوم بالفعل — عودة بعد {remain}</div>
      ) : (
        <button onClick={startQuiz} style={{ background: PALETTE.bloom, color: "#fff", borderRadius: "12px" }} className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-sm font-medium"><Droplets size={16} /> اسقِ النبتة بالاختبار</button>
      ))}
      {quiz && (
        <div className="mt-5 flex flex-col gap-3">
          <p style={{ color: PALETTE.ink }} className="text-sm font-medium text-center">ما معنى <span dir="ltr">{word.en}</span>؟</p>
          <div className="flex flex-col gap-2">
            {quiz.options.map((opt) => {
              const isPicked = quiz.picked === opt, isCorrectOpt = opt === quiz.correctAr;
              let bg = PALETTE.card, border = PALETTE.line;
              if (quiz.result) { if (isCorrectOpt) { bg = "#E8F0DE"; border = "#4C7A3B"; } else if (isPicked) { bg = "#F4E2DC"; border = PALETTE.wilt; } }
              return <button key={opt} disabled={!!quiz.picked} onClick={() => pickOption(opt)} style={{ background: bg, border: `1.5px solid ${border}`, color: PALETTE.ink, borderRadius: "12px" }} className="px-4 py-3 text-sm text-right">{opt}</button>;
            })}
          </div>
          {quiz.result && (
            <div className="flex flex-col items-center gap-3 mt-2">
              {quiz.result === "correct" ? <p style={{ color: "#4C7A3B" }} className="text-sm font-medium flex items-center gap-1"><Sparkles size={16} /> أحسنت، النبتة نمت خطوة!</p> : <p style={{ color: PALETTE.wilt }} className="text-sm font-medium">للأسف، النبتة ذبلت قليلاً</p>}
              <p style={{ color: PALETTE.inkSoft }} className="text-xs">يمكنك سقي هذه الكلمة مرة أخرى بعد 24 ساعة</p>
              <button onClick={onNextRound} style={{ border: `1px solid ${PALETTE.line}`, color: PALETTE.inkSoft, borderRadius: "10px" }} className="flex items-center gap-1 px-4 py-2 text-xs"><RotateCcw size={13} /> إغلاق البطاقة</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
