import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useReaderSettings } from './hooks/useReaderSettings';
import { api } from './api/client';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { ChildProfileModal } from './components/ChildProfileModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { Screen1_Onboarding, ChildRegistrationData } from './screens/Screen1_Onboarding';
import { Screen2_Home } from './screens/Screen2_Home';
import { Screen3_WizardHero, WizardHeroData } from './screens/Screen3_WizardHero';
import { Screen4_WizardDetails } from './screens/Screen4_WizardDetails';
import { Screen5_Reader } from './screens/Screen5_Reader';
import { Screen6_FinalQuestion } from './screens/Screen6_FinalQuestion';
import { Screen7_Library } from './screens/Screen7_Library';
import { Screen8_UpgradeModal } from './screens/Screen8_UpgradeModal';
import { Screen9_Shop } from './screens/Screen9_Shop';
import { Screen10_PaymentSheet } from './screens/Screen10_PaymentSheet';
import { Screen11_Referrals } from './screens/Screen11_Referrals';
import { Screen12_Settings } from './screens/Screen12_Settings';
import { BookDetailsDTO, BookSummaryDTO, ChildProfileDTO } from '@moya-skazka/shared';
import { generateDynamicStory, getFairytaleFallbackIllustration, resolveBookMedia, resolveMediaUrl } from './services/storyGenerator';
import { FairyStarIcon } from './components/FairytaleIcons';
import { Clock } from 'lucide-react';

export const App: React.FC = () => {
  const { initData, startParam, haptic } = useTelegram();
  const { settings, updateSetting } = useReaderSettings();

  // 0. Обработка флага полного сброса для проверки опыта нового пользователя (?reset=1)
  const isResetRequested = (() => {
    if (typeof window === 'undefined') return false;
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('reset') === '1' || sp.get('reset') === 'true' || sp.get('action') === 'reset';
    } catch {
      return false;
    }
  })();

  if (isResetRequested && typeof window !== 'undefined') {
    try {
      const savedApi = localStorage.getItem('ms_api_url');
      localStorage.clear();
      if (savedApi) localStorage.setItem('ms_api_url', savedApi);
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }

  // Проверка завершения онбординга/регистрации первого ребёнка
  const [, setIsOnboardingCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ms_onboarding_completed') === 'true';
    } catch {
      return false;
    }
  });

  // При первом входе вылазит окно регистрации (Слайд 1), иначе сразу главный экран (Слайд 2)
  const [currentScreen, setCurrentScreen] = useState<string>(() => {
    try {
      return localStorage.getItem('ms_onboarding_completed') === 'true' ? 'home' : 'onboarding';
    } catch {
      return 'onboarding';
    }
  });

  // Режим добавления второго ребёнка родителем
  const [isRegisteringSecondChild, setIsRegisteringSecondChild] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('home');
  // Для демо баланс храним локально, чтобы он не сбрасывался при перезагрузке.
  // Когда backend станет источником истины, значение придёт из /me.
  const [balance, setBalance] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('ms_balance');
      return raw === null ? 1 : Math.max(0, parseInt(raw, 10) || 0);
    } catch {
      return 1;
    }
  });
  // Единоразовая бесплатная первая сказка: сохраняется в localStorage
  const [canClaimFree, setCanClaimFree] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ms_free_claimed') !== 'true';
    } catch {
      return true;
    }
  });
  const [children, setChildren] = useState<ChildProfileDTO[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [books, setBooks] = useState<BookSummaryDTO[]>([]);
  const [dailyIdea, setDailyIdea] = useState<any>(null);

  // Состояния визарда создания сказки
  const [wizardData, setWizardData] = useState<WizardHeroData>({
    childName: 'Миша',
    age: 4,
    gender: 'boy',
    interests: ['Динозавры', 'Космос'],
    theme: 'Дружба',
    appearance: {
      avatar_id: 'hero_custom',
      hairColor: 'светлые',
      hairType: 'кудрявые',
      clothingItem: 'уютный свитер',
      clothingColor: 'изумрудный',
      toy: 'плюшевый динозаврик',
    },
  });
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [creationStage, setCreationStage] = useState<'writing' | 'drawing' | 'finishing'>('writing');
  const [creationMessage, setCreationMessage] = useState<string>('Создаём волшебную сказку...');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(35);

  // Читалка
  const [currentReadingBook, setCurrentReadingBook] = useState<BookDetailsDTO | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(1);

  // Модальные окна
  const [childModalOpen, setChildModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedBookForUpgrade, setSelectedBookForUpgrade] = useState<string | null>(null);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState<'single_book_1' | 'pack_5'>('pack_5');

  // Рефералы
  const [referralStats, setReferralStats] = useState({
    link: 'https://t.me/MoyaSkazkaBot?startapp=ref_demo',
    qualifiedFriends: 0,
    giftCredits: 0,
  });

  // Баланс демо-кредитов переживает перезагрузку страницы.
  useEffect(() => {
    try {
      localStorage.setItem('ms_balance', String(balance));
    } catch {}
  }, [balance]);

  // Авторизация и начальная загрузка
  useEffect(() => {
    bootstrapApp();
  }, [initData]);

  const bootstrapApp = async () => {
    if (isResetRequested) {
      try {
        await api.deleteAccount();
      } catch {}
      return;
    }
    try {
      await api.loginWithTelegram(initData, startParam);
      const me = await api.getMe();
      if (me?.balance) {
        const available = me.balance.available ?? me.balance.total;
        if (typeof available === 'number') setBalance(available);
      }
      const isClaimedLocally = localStorage.getItem('ms_free_claimed') === 'true';
      if (isClaimedLocally) {
        setCanClaimFree(false);
      } else {
        setCanClaimFree(me?.can_claim_free_story ?? true);
      }

      const childrenList = await api.getChildren();
      let effectiveChildren: ChildProfileDTO[] = [];

      const savedChildrenStr = localStorage.getItem('ms_children');
      if (savedChildrenStr) {
        try {
          const parsed = JSON.parse(savedChildrenStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            effectiveChildren = parsed;
          }
        } catch {}
      }

      if (childrenList && childrenList.length > 0) {
        effectiveChildren = childrenList;
      }

      if (effectiveChildren.length > 0) {
        setChildren(effectiveChildren);
        const savedActiveId = localStorage.getItem('ms_active_child_id');
        const active = effectiveChildren.find((c) => c.id === savedActiveId) || effectiveChildren[0];
        setActiveChildId(active.id);
        const app = (active.appearance as any) || {};
        setWizardData((prev) => ({
          ...prev,
          childName: active.name,
          age: active.age,
          gender: app.gender || (active.name.endsWith('а') || active.name.endsWith('я') ? 'girl' : 'boy'),
          interests: (active.interests as string[]) || prev.interests,
          appearance: {
            ...prev.appearance,
            hairColor: app.hairColor || prev.appearance.hairColor,
            hairType: app.hairType || prev.appearance.hairType,
            hairLength: app.hairLength || prev.appearance.hairLength,
            hairStructure: app.hairStructure || prev.appearance.hairStructure,
            eyeColor: app.eyeColor || 'карие',
            skinTone: app.skinTone || 'персиковая',
            toy: app.toy || prev.appearance.toy,
          },
        }));
        loadDailyIdea(active.id);
      } else {
        // Если детей ещё нет и регистрация не завершена — остаёмся на слайде 1 (онбординг)
        if (!localStorage.getItem('ms_onboarding_completed')) {
          setCurrentScreen('onboarding');
        }
      }

      loadBooks();
      loadReferrals();
    } catch {
      const savedChildrenStr = localStorage.getItem('ms_children');
      if (savedChildrenStr) {
        try {
          const parsed: ChildProfileDTO[] = JSON.parse(savedChildrenStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChildren(parsed);
            const savedActiveId = localStorage.getItem('ms_active_child_id');
            const active = parsed.find((c) => c.id === savedActiveId) || parsed[0];
            setActiveChildId(active.id);
            const app = (active.appearance as any) || {};
            setWizardData((prev) => ({
              ...prev,
              childName: active.name,
              age: active.age,
              gender: app.gender || (active.name.endsWith('а') || active.name.endsWith('я') ? 'girl' : 'boy'),
              interests: (active.interests as string[]) || prev.interests,
              appearance: {
                ...prev.appearance,
                hairColor: app.hairColor || prev.appearance.hairColor,
                hairType: app.hairType || prev.appearance.hairType,
                hairLength: app.hairLength || prev.appearance.hairLength,
                hairStructure: app.hairStructure || prev.appearance.hairStructure,
                eyeColor: app.eyeColor || 'карие',
                skinTone: app.skinTone || 'персиковая',
                toy: app.toy || prev.appearance.toy,
              },
            }));
            return;
          }
        } catch {}
      }

      if (!localStorage.getItem('ms_onboarding_completed')) {
        setCurrentScreen('onboarding');
      }
    }
  };

  // Обработчик успешного завершения быстрой регистрации ребёнка (Слайд 1 -> Слайд 2)
  const handleCompleteRegistration = async (data: ChildRegistrationData) => {
    haptic.success();
    const newChildId = `child_${Date.now()}`;
    const newChild: ChildProfileDTO = {
      id: newChildId,
      user_id: 'user_1',
      name: data.name.trim() || (data.gender === 'girl' ? 'Алиса' : 'Миша'),
      age: data.age,
      interests: data.interests.length > 0 ? data.interests : ['Динозавры', 'Волшебство'],
      appearance: {
        avatar_id: data.gender === 'girl' ? 'girl_custom' : 'boy_custom',
        gender: data.gender,
        hair: `${data.hairColor} волосы`,
        clothing: data.gender === 'girl' ? 'платьице' : 'уютный свитер',
        personality: data.personality,
        hairColor: data.hairColor,
        hairType: data.hairType || 'короткие',
        hairLength: data.hairLength,
        hairStructure: data.hairStructure,
        clothingItem: data.gender === 'girl' ? 'платьице' : 'уютный свитер',
        clothingColor: 'изумрудный',
        toy: data.toy,
        eyeColor: data.eyeColor,
        skinTone: data.skinTone,
        storyPreference: data.storyPreference,
        bedtimeRitual: data.bedtimeRitual,
      } as any,
      is_active: true,
    };

    try {
      await api.createChild({
        name: newChild.name,
        age: newChild.age,
        interests: newChild.interests,
        appearance: newChild.appearance,
      });
    } catch {}

    const updatedChildren = isRegisteringSecondChild ? [...children, newChild] : [newChild];
    setChildren(updatedChildren);
    setActiveChildId(newChild.id);

    try {
      localStorage.setItem('ms_children', JSON.stringify(updatedChildren));
      localStorage.setItem('ms_active_child_id', newChild.id);
      localStorage.setItem('ms_onboarding_completed', 'true');
    } catch {}

    setWizardData((prev) => ({
      ...prev,
      childName: newChild.name,
      age: newChild.age,
      gender: data.gender,
      interests: newChild.interests,
      theme: data.storyPreference.includes('Уютные') ? 'Спокойный сон' : 'Дружба',
      appearance: {
        avatar_id: newChild.appearance.avatar_id,
        hairColor: data.hairColor,
        hairType: data.hairType || 'короткие',
        hairLength: data.hairLength,
        hairStructure: data.hairStructure,
        clothingItem: data.gender === 'girl' ? 'платьице' : 'уютный свитер',
        clothingColor: 'изумрудный',
        toy: data.toy,
        eyeColor: data.eyeColor,
        skinTone: data.skinTone,
      },
    }));

    setIsRegisteringSecondChild(false);
    setIsOnboardingCompleted(true);
    setCurrentScreen('home'); // Мгновенный переход на Слайд 2 (Экран Home)
    setActiveTab('home');
  };

  const DAILY_IDEAS = [
    {
      title: 'Миша и потерянная звёздочка',
      blurb: 'Добрая сказка о смелости, дружбе и о том, как зажечь свет в темноте.',
      theme: 'Смелость',
    },
    {
      title: 'Миша и тайна сонного облачка',
      blurb: 'Уютная терапевтическая история для мягкого и спокойного отхода ко сну.',
      theme: 'Спокойный сон',
    },
    {
      title: 'Динозаврик, который научился дружить',
      blurb: 'О том, как весело и радостно делиться игрушками и играть вместе.',
      theme: 'Дружба',
    },
    {
      title: 'Миша и волшебный огонёк доброты',
      blurb: 'Сказка о заботе, внимании к окружающим и теплых словах поддержки.',
      theme: 'Доброта и забота',
    },
    {
      title: 'Куда прячутся солнечные зайчики?',
      blurb: 'Увлекательное приключение любознательного исследователя.',
      theme: 'Любознательность',
    },
  ];

  const loadBooks = async () => {
    try {
      const list = await api.getBooks();
      if (list && list.length > 0) {
        setBooks(list.map((book) => ({ ...book, cover_url: resolveMediaUrl(book.cover_url) })));
        return;
      }
    } catch {}

    const saved = localStorage.getItem('ms_books');
    if (saved && !saved.includes('unsplash')) {
      try {
        const parsed: BookSummaryDTO[] = JSON.parse(saved);
        const repaired = parsed.map((b) => ({
          ...b,
          cover_url: resolveMediaUrl(b.cover_url) || getFairytaleFallbackIllustration(b.title),
        }));
        setBooks(repaired);
        return;
      } catch {}
    }

    setBooks([]);
  };

  const loadDailyIdea = async (childId: string) => {
    try {
      const idea = await api.getDailyIdea(childId);
      setDailyIdea(idea);
    } catch {
      setDailyIdea(DAILY_IDEAS[0]);
    }
  };

  const refreshLocalDailyIdea = () => {
    const nextIndex = Math.floor(Math.random() * DAILY_IDEAS.length);
    setDailyIdea(DAILY_IDEAS[nextIndex]);
    haptic.selection();
  };

  const loadReferrals = async () => {
    try {
      const data = await api.getReferrals();
      setReferralStats({
        link: data.referral_link,
        qualifiedFriends: data.qualified_friends_count,
        giftCredits: data.gift_credits_earned,
      });
    } catch {}
  };

  const activeChild = children.find((c) => c.id === activeChildId) || null;

  // Поллинг статуса фоновой генерации книги
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const job = await api.getJobStatus(activeJobId);
        setJobProgress(job.progress_percentage);

        if (job.status === 'COMPLETED') {
          clearInterval(interval);
          setActiveJobId(null);
          setIsCreatingStory(false);
          haptic.success();
          loadBooks();

          const bookDetails = await api.getBook(job.job_id);
          openReader(bookDetails);
        } else if (job.status.includes('FAILED')) {
          clearInterval(interval);
          setActiveJobId(null);
          setIsCreatingStory(false);
          alert('Ошибка генерации: зарезервированный кредит возвращён на баланс.');
        }
      } catch {
        clearInterval(interval);
        setActiveJobId(null);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobId]);

  const openReader = (book: BookDetailsDTO) => {
    setCurrentReadingBook(resolveBookMedia(book));
    setCurrentSceneIndex(1);
    setCurrentScreen('reader');
  };

  // Обработчик создания сказки из визарда: уникальная генерация на каждый запуск
  const handleCreateStorySubmit = async (details: {
    personality: string;
    customWishes: string;
    includeQuestions: boolean;
  }) => {
    if (!canClaimFree && balance <= 0) {
      alert('У вас закончились книжные кредиты. Перейдите в магазин, чтобы пополнить баланс.');
      setCurrentScreen('shop');
      setActiveTab('shop');
      return;
    }

    setIsCreatingStory(true);
    setJobProgress(15);
    setCreationStage('writing');
    setCreationMessage('Сочиняем уникальный сюжет и character bible...');
    const TOTAL_ESTIMATED_SEC = 120;
    setRemainingSeconds(TOTAL_ESTIMATED_SEC);
    haptic.medium();

    // Плавный монотонный таймер обратного отсчёта
    const startTime = Date.now();
    const countdownInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const left = Math.max(0, Math.ceil(TOTAL_ESTIMATED_SEC - elapsed));
      setRemainingSeconds(left);
      setJobProgress((prev) => (prev < 90 ? Math.min(88, prev + 1.2) : prev));
    }, 500);

    try {
      // 1. Story Engine: текст, character bible, обложка и 4 иллюстрации
      const generatedBook = await generateDynamicStory(
        {
          childName: wizardData.childName,
          age: wizardData.age,
          gender: wizardData.gender,
          theme: wizardData.theme || 'Дружба',
          interests: wizardData.interests,
          personality: details.personality,
          customWishes: details.customWishes,
          includeQuestions: details.includeQuestions,
          appearance: wizardData.appearance,
        },
        (update) => {
          setCreationStage(update.stage);
          setCreationMessage(update.message);
          setJobProgress((prev) => Math.max(prev, update.progress));
        }
      );

      clearInterval(countdownInterval);
      setRemainingSeconds(0);
      setCreationStage('finishing');
      setCreationMessage('Сказка готова!');
      setJobProgress(100);

      // 2. Сохраняем новую книгу в состояние и локальное хранилище с гарантированной обложкой
      const newSummary: BookSummaryDTO = {
        id: generatedBook.id,
        child_id: activeChildId || 'default',
        child_name: wizardData.childName,
        title: generatedBook.title,
        status: 'ILLUSTRATED',
        format: 'ILLUSTRATED',
        cover_url: resolveMediaUrl(generatedBook.cover_url || generatedBook.scenes[0]?.image_url) || getFairytaleFallbackIllustration(wizardData.theme || generatedBook.title),
        created_at: new Date().toISOString(),
      };

      setBooks((prev) => {
        const updated = [newSummary, ...prev];
        try {
          localStorage.setItem('ms_books', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      try {
        localStorage.setItem(`ms_story_${generatedBook.id}`, JSON.stringify(generatedBook));
      } catch {}

      // 3. Единоразовое списание бесплатной первой сказки или кредита
      if (canClaimFree) {
        setCanClaimFree(false);
        try {
          localStorage.setItem('ms_free_claimed', 'true');
        } catch {}
      } else {
        setBalance((prev) => Math.max(0, prev - 1));
      }

      // 4. Открываем читалку только после ПОЛНОЙ загрузки всех иллюстраций в память браузера
      setTimeout(() => {
        setIsCreatingStory(false);
        haptic.success();
        openReader(generatedBook);
      }, 350);
    } catch (err) {
      clearInterval(countdownInterval);
      setIsCreatingStory(false);
      alert('Произошла ошибка при генерации сказки. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Переход по табам
  const handleTabChange = (tab: string) => {
    haptic.selection();
    setActiveTab(tab);
    if (tab === 'home') setCurrentScreen('home');
    else if (tab === 'create') {
      setCurrentScreen('wizard_hero');
    } else if (tab === 'books') setCurrentScreen('library');
    else if (tab === 'shop') setCurrentScreen('shop');
    else if (tab === 'friends') setCurrentScreen('referrals');
  };

  return (
    <div className="min-h-screen bg-cream-100 font-sans flex flex-col justify-between max-w-md mx-auto shadow-2xl relative overflow-x-hidden">
      {/* Шапка (кроме читалки и онбординга) */}
      {currentScreen !== 'reader' && currentScreen !== 'final_question' && currentScreen !== 'onboarding' && (
        <Header
          currentScreen={currentScreen}
          activeChild={activeChild}
          balance={balance}
          onBack={() => {
            if (currentScreen === 'wizard_details') setCurrentScreen('wizard_hero');
            else setCurrentScreen('home');
          }}
          onOpenChildModal={() => setChildModalOpen(true)}
          onOpenSettings={() => setCurrentScreen('settings')}
        />
      )}

      {/* Оверлей прогресса генерации книги с таймером и этапами */}
      {isCreatingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-5 transition-all">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-amber-100">
            {/* Иконка */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
              <FairyStarIcon className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Создаём сказку для {wizardData.childName || 'малыша'}
              </h3>
              <p className="text-xs text-stone-600 font-medium min-h-[32px] flex items-center justify-center">
                {creationMessage}
              </p>
            </div>

            {/* Таймер с примерным временем ожидания */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
              <span>
                {remainingSeconds > 0 && creationStage !== 'finishing'
                  ? `Примерное ожидание: ~${remainingSeconds} сек`
                  : 'Завершаем оформление книги...'}
              </span>
            </div>

            {/* Индикаторы этапов */}
            <div className="bg-stone-50 rounded-2xl p-3 text-left space-y-2 border border-stone-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-700 flex items-center gap-2">
                  {creationStage === 'writing' ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  ) : (
                    <span className="text-emerald-500 font-bold">✓</span>
                  )}
                  <span>1. Сюжет и character bible</span>
                </span>
                <span className="text-[11px] text-stone-500">
                  {creationStage === 'writing' ? 'сочиняем...' : 'готов'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-700 flex items-center gap-2">
                  {creationStage === 'writing' ? (
                    <span className="w-4 h-4 rounded-full bg-stone-200 flex items-center justify-center text-[9px] text-stone-600">
                      2
                    </span>
                  ) : creationStage === 'drawing' ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
                  ) : (
                    <span className="text-emerald-500 font-bold">✓</span>
                  )}
                  <span>2. Обложка + 4 иллюстрации (Nano-Banana-2)</span>
                </span>
                <span className="text-[11px] text-stone-500">
                  {creationStage === 'writing'
                    ? 'в очереди'
                    : creationStage === 'drawing'
                    ? 'рисуем...'
                    : 'готовы'}
                </span>
              </div>
            </div>

            {/* Полоса прогресса */}
            <div className="space-y-1">
              <div className="w-full bg-cream-200 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-400 via-brand-500 to-brand-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, jobProgress))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 font-medium px-1">
                <span>Прогресс</span>
                <span>{Math.round(jobProgress)}%</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-tight">
              Каждая сказка и все 4 иллюстрации создаются нейросетью с нуля специально для вашего ребёнка. Никаких шаблонов!
            </p>
          </div>
        </div>
      )}

      {/* Роутинг экранов */}
      <main className="flex-1">
        {currentScreen === 'onboarding' && (
          <Screen1_Onboarding
            isSecondChild={isRegisteringSecondChild}
            onComplete={handleCompleteRegistration}
            onBack={() => {
              setIsRegisteringSecondChild(false);
              setCurrentScreen('home');
            }}
          />
        )}

        {currentScreen === 'home' && (
          <Screen2_Home
            activeChild={activeChild}
            canClaimFreeStory={canClaimFree}
            balance={balance}
            dailyIdea={dailyIdea}
            booksCount={books.length}
            onStartCreateStory={() => setCurrentScreen('wizard_hero')}
            onNavigateTab={handleTabChange}
            onRefreshIdea={refreshLocalDailyIdea}
            onSaveIdea={() => {
              if (dailyIdea?.theme) {
                setWizardData((prev) => ({ ...prev, theme: dailyIdea.theme }));
              }
              haptic.success();
              setCurrentScreen('wizard_hero');
            }}
          />
        )}

        {currentScreen === 'wizard_hero' && (
          <Screen3_WizardHero
            data={wizardData}
            onChange={setWizardData}
            onNext={() => setCurrentScreen('wizard_details')}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'wizard_details' && (
          <Screen4_WizardDetails
            heroData={wizardData}
            canClaimFreeStory={canClaimFree}
            isSubmitting={isCreatingStory}
            remainingSeconds={remainingSeconds}
            creationMessage={creationMessage}
            onSubmit={handleCreateStorySubmit}
          />
        )}

        {currentScreen === 'reader' && currentReadingBook && (
          <Screen5_Reader
            book={currentReadingBook}
            currentSceneIndex={currentSceneIndex}
            settings={settings}
            childName={wizardData.childName}
            theme={wizardData.theme}
            interest={wizardData.interests[0] || 'Волшебство'}
            appearance={wizardData.appearance}
            onToggleQuestions={() => updateSetting('showQuestions', !settings.showQuestions)}
            onPrevScene={() => {
              haptic.light();
              setCurrentSceneIndex((prev) => Math.max(1, prev - 1));
            }}
            onNextScene={() => {
              haptic.light();
              if (currentSceneIndex < 4) {
                setCurrentSceneIndex((prev) => prev + 1);
              } else {
                setCurrentScreen('final_question');
              }
            }}
            onClose={() => setCurrentScreen('library')}
          />
        )}

        {currentScreen === 'final_question' && currentReadingBook && (
          <Screen6_FinalQuestion
            book={currentReadingBook}
            settings={settings}
            onRestart={() => {
              setCurrentSceneIndex(1);
              setCurrentScreen('reader');
            }}
            onGoToLibrary={() => {
              if (currentReadingBook.can_upgrade) {
                setSelectedBookForUpgrade(currentReadingBook.id);
                setUpgradeModalOpen(true);
              }
              setCurrentScreen('library');
            }}
          />
        )}

        {currentScreen === 'library' && (
          <Screen7_Library
            books={books}
            canClaimFreeStory={canClaimFree}
            onSelectBook={async (id) => {
              const localStory = localStorage.getItem(`ms_story_${id}`);
              if (localStory) {
                try {
                  const parsed = JSON.parse(localStory);
                  // Самовосстановление: если в ранее сгенерированной истории у сцен не было картинок
                  if (parsed.scenes && Array.isArray(parsed.scenes)) {
                    let updated = false;
                    parsed.scenes.forEach((sc: any, idx: number) => {
                      if (!sc.image_url) {
                        sc.image_url = getFairytaleFallbackIllustration(parsed.title || wizardData.theme, idx + 1);
                        updated = true;
                      }
                    });
                    if (updated) {
                      try {
                        localStorage.setItem(`ms_story_${id}`, JSON.stringify(parsed));
                      } catch {}
                    }
                  }
                  openReader(parsed);
                  return;
                } catch {}
              }

              // Каноническая иллюстрированная история про Мишу и Дино из макета
              if (id === 'b1') {
                const dinoStory: BookDetailsDTO = {
                  id: 'b1',
                  title: 'Миша и маленький динозавр Дино',
                  status: 'ILLUSTRATED',
                  format: 'ILLUSTRATED',
                  can_upgrade: false,
                  scenes: [
                    {
                      id: 's1',
                      scene_index: 1,
                      text: 'Миша и его верный друг, маленький динозаврик Дино, уютно сидели на мягкой лесной полянке. Дино бережно прижимался к Мише, а на вечернем небе мягко светили сказочные звёздочки и золотистый полумесяц. Начиналось самое тёплое вечернее приключение!',
                      image_url: './illustrations/cover_dino.jpg',
                    },
                    {
                      id: 's2',
                      scene_index: 2,
                      text: 'Миша и Дино подошли к большой луже. Дино остановился и испуганно посмотрел на воду. — Я боюсь переходить, — прошептал он. Миша ободряюще улыбнулся, взял друга за лапку и предложил сделать надёжный мостик из крепких веточек.',
                      image_url: './illustrations/cover_dino.jpg',
                    },
                    {
                      id: 's3',
                      scene_index: 3,
                      text: 'Они дружно положили веточки через ручеёк. Дино сделал первый смелый шаг и радостно захлопал в ладоши! Малыши забрались в уютный шалаш из тёплых пледов и открыли светящуюся сказочную книгу, полную добрых историй.',
                      image_url: './illustrations/cover_dino.jpg',
                    },
                    {
                      id: 's4',
                      scene_index: 4,
                      text: 'Вскоре Дино увидел свою семью. Он радостно обнял маму, а потом повернулся к Мише. — Спасибо! Теперь мы друзья навсегда! — сказал он. Вечером Миша сладко засыпал в своей кроватке, зная, что доброта помогает совершать настоящие чудеса.',
                      image_url: './illustrations/cover_dino.jpg',
                    },
                  ],
                  questions: [
                    {
                      id: 'q1',
                      after_scene: 2,
                      question: 'Как ты думаешь, почему Дино испугался? А что помогло ему почувствовать себя смелее?',
                      parent_hint: 'Выслушайте ребёнка. Обсудите, как поддержка друга помогает преодолеть любой страх.',
                      skill_tag: 'emotions',
                    },
                    {
                      id: 'q2',
                      after_scene: 5,
                      question: 'Что тебе больше всего понравилось в этой истории? Как бы ты поступил на месте Миши?',
                      parent_hint: 'Обнимите малыша, похвалите за добрые рассуждения и пожелайте сказочных снов.',
                      skill_tag: 'reflection',
                    },
                  ],
                };
                localStorage.setItem('ms_story_b1', JSON.stringify(dinoStory));
                openReader(dinoStory);
                return;
              }

              // Каноническая текстовая сказка про звёздочку из макета (Экран 7)
              if (id === 'b2') {
                const isUpgraded = books.find((b) => b.id === 'b2')?.format === 'ILLUSTRATED';
                const starStory: BookDetailsDTO = {
                  id: 'b2',
                  title: 'Миша и звёздочка',
                  status: isUpgraded ? 'ILLUSTRATED' : 'TEXT_READY',
                  format: isUpgraded ? 'ILLUSTRATED' : 'TEXT',
                  can_upgrade: !isUpgraded,
                  scenes: [
                    {
                      id: 's1',
                      scene_index: 1,
                      text: 'Миша сидел у тёплого вечернего окна и смотрел на тёмно-синее небо. Вдруг среди мерцающих созвездий вспыхнула крошечная золотистая искорка. Она плавно скользнула вниз и тихо опустилась прямо на деревянный подоконник.',
                      image_url: isUpgraded ? './illustrations/cover_star.jpg' : null,
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. A cute 4-year-old toddler boy looking at a tiny glowing friendly baby star on a cozy bedroom windowsill, golden hour magical dusk, starry sky, modern 3D CGI render, Pixar RenderMan aesthetic, no text.',
                    },
                    {
                      id: 's2',
                      scene_index: 2,
                      text: 'Звёздочка тихонько звенела, как хрустальный колокольчик. Она потеряла дорогу к своей маме — Большой Медведице. Миша бережно подставил ладошки: — Не бойся, звёздочка, я помогу тебе вернуться домой! — ласково прошептал он.',
                      image_url: isUpgraded ? './illustrations/cover_star.jpg' : null,
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. Toddler boy gently cupping a radiant glowing little star creature in hands, comforting smile, volumetric lighting, no text.',
                    },
                    {
                      id: 's3',
                      scene_index: 3,
                      text: 'Миша поднялся на цыпочках, взял свой любимый телескоп и построил лесенку из мягких подушек. Он протянул ручки к ночному небу и помог звёздочке поймать лёгкое дуновение попутного звёздного ветерка.',
                      image_url: isUpgraded ? './illustrations/cover_star.jpg' : null,
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. Cute boy standing on pillow ladder near open attic window, releasing glowing star into starry night, no text.',
                    },
                    {
                      id: 's4',
                      scene_index: 4,
                      text: 'Звёздочка взмыла высоко в небо и радостно засияла рядом с Большой Медведицей. С тех пор каждый вечер она светила в окно Миши самым добрым золотистым лучиком, охраняя его сказочные сны.',
                      image_url: isUpgraded ? './illustrations/cover_star.jpg' : null,
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. Boy sleeping peacefully under cozy blanket, radiant golden star shining warmly through window, cozy bedtime vibe, no text.',
                    },
                  ],
                  questions: [
                    {
                      id: 'q1',
                      after_scene: 2,
                      question: 'Как ты думаешь, почему звёздочка сначала грустила? А что помогло ей снова заулыбаться?',
                      parent_hint: 'Выслушайте ребёнка. Обсудите, как чуткость и готовность прийти на помощь согревают сердца.',
                      skill_tag: 'emotions',
                    },
                    {
                      id: 'q2',
                      after_scene: 5,
                      question: 'А если бы к тебе в гости прилетела волшебная звёздочка, о чём бы вы поговорили перед сном?',
                      parent_hint: 'Помечтайте вместе с малышом о звёздах и пожелайте друг другу спокойной ночи.',
                      skill_tag: 'reflection',
                    },
                  ],
                };
                localStorage.setItem('ms_story_b2', JSON.stringify(starStory));
                openReader(starStory);
                return;
              }

              // Каноническая иллюстрированная сказка про волшебный лес из макета (Экран 7)
              if (id === 'b3') {
                const forestStory: BookDetailsDTO = {
                  id: 'b3',
                  title: 'Миша и волшебный лес',
                  status: 'ILLUSTRATED',
                  format: 'ILLUSTRATED',
                  can_upgrade: false,
                  scenes: [
                    {
                      id: 's1',
                      scene_index: 1,
                      text: 'Миша шагал по мягкой тропинке, усыпанной золотыми осенними листьями. В волшебном лесу тихо шелестели вековые дубы, сквозь ветви пробивались тёплые лучи заходящего солнца, а в воздухе кружились светлячки.',
                      image_url: './illustrations/cover_forest.jpg',
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. A cute 4-year-old toddler boy in overalls walking along a sun-dappled enchanted autumn forest path with glowing fireflies, no text.',
                    },
                    {
                      id: 's2',
                      scene_index: 2,
                      text: 'Вдруг под кустом папоротника Миша заметил пушистого рыжего лисёнка с большими любопытными глазками. Лисёнок уронил корзинку со спелой земляникой и никак не мог собрать рассыпавшиеся ягодки.',
                      image_url: './illustrations/cover_forest.jpg',
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. Toddler boy crouching down near an adorable fluffy baby fox in mossy woods, warm sunbeams, no text.',
                    },
                    {
                      id: 's3',
                      scene_index: 3,
                      text: 'Миша присел на корточки, ласково улыбнулся и помог собрать все ягодки до единой. В благодарность лисёнок угостил его самой сладкой земляникой и показал Мише тайную поляну с весёлыми зверятами.',
                      image_url: './illustrations/cover_forest.jpg',
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. Boy and happy baby fox sharing sweet wild strawberries, woodland friends smiling in background, no text.',
                    },
                    {
                      id: 's4',
                      scene_index: 4,
                      text: 'Солнышко скрылось за горизонтом, и лес озарился мягким лунным светом. Миша вернулся домой в свою тёплую постель, вспоминая доброго лисёнка и зная, что в волшебном лесу его всегда ждут друзья.',
                      image_url: './illustrations/cover_forest.jpg',
                      image_prompt:
                        'A breathtaking 3D Disney Pixar animation style movie still for a children fairy tale book. Boy cozily tucked in warm bed at night, smiling peacefully with a toy fox nearby, no text.',
                    },
                  ],
                  questions: [
                    {
                      id: 'q1',
                      after_scene: 2,
                      question: 'Кому Миша помог в лесу? Как ты думаешь, что почувствовал лисёнок, когда они собирали ягодки вместе?',
                      parent_hint: 'Обсудите с ребёнком радость взаимопомощи и дружеской поддержки.',
                      skill_tag: 'emotions',
                    },
                    {
                      id: 'q2',
                      after_scene: 5,
                      question: 'Какого лесного зверька ты хотел бы встретить на прогулке? Какую игру ты бы ему предложил?',
                      parent_hint: 'Обнимите ребёнка, похвалите его фантазию и пожелайте сказочных снов.',
                      skill_tag: 'reflection',
                    },
                  ],
                };
                localStorage.setItem('ms_story_b3', JSON.stringify(forestStory));
                openReader(forestStory);
                return;
              }

              try {
                const book = await api.getBook(id);
                openReader(book);
              } catch {
                const targetBook = books.find((b) => b.id === id);
                const generated = await generateDynamicStory({
                  childName: targetBook?.child_name || wizardData.childName,
                  age: wizardData.age,
                  theme: targetBook?.title || wizardData.theme,
                  interests: wizardData.interests,
                  personality: 'Добрый',
                  includeQuestions: true,
                });
                try {
                  localStorage.setItem(`ms_story_${id}`, JSON.stringify(generated));
                } catch {}
                openReader(generated);
              }
            }}
            onCreateNewStory={() => setCurrentScreen('wizard_hero')}
            onUpgradeBook={(id) => {
              setSelectedBookForUpgrade(id);
              setUpgradeModalOpen(true);
            }}
          />
        )}

        {currentScreen === 'shop' && (
          <Screen9_Shop
            onBuySku={(sku) => {
              setSelectedSku(sku);
              setPaymentSheetOpen(true);
            }}
          />
        )}

        {currentScreen === 'referrals' && (
          <Screen11_Referrals
            referralLink={referralStats.link}
            qualifiedFriendsCount={referralStats.qualifiedFriends}
            giftCreditsEarned={referralStats.giftCredits}
          />
        )}

        {currentScreen === 'settings' && (
          <Screen12_Settings
            settings={settings}
            onUpdateSetting={updateSetting}
            onOpenAdmin={() => setAdminModalOpen(true)}
            onDeleteAccount={async () => {
              try {
                await api.deleteAccount();
              } catch {}
              try {
                const savedApi = localStorage.getItem('ms_api_url');
                localStorage.clear();
                if (savedApi) localStorage.setItem('ms_api_url', savedApi);
              } catch {}
              setIsOnboardingCompleted(false);
              setCanClaimFree(true);
              setBalance(1);
              setChildren([]);
              setActiveChildId(null);
              setBooks([]);
              setDailyIdea(null);
              setCurrentScreen('onboarding');
              setActiveTab('home');
              alert('Аккаунт и все связанные данные успешно удалены.');
            }}
          />
        )}
      </main>

      {/* Нижний Tab Bar (скрыт во время чтения и онбординга) */}
      {currentScreen !== 'reader' && currentScreen !== 'final_question' && currentScreen !== 'onboarding' && (
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Модальное окно профилей детей */}
      <ChildProfileModal
        isOpen={childModalOpen}
        childrenList={children}
        activeChildId={activeChildId}
        onClose={() => setChildModalOpen(false)}
        onOpenSettings={() => setCurrentScreen('settings')}
        onAddNewChild={() => {
          setChildModalOpen(false);
          setIsRegisteringSecondChild(true);
          setCurrentScreen('onboarding');
        }}
        onSelectChild={(id) => {
          setActiveChildId(id);
          try {
            localStorage.setItem('ms_active_child_id', id);
          } catch {}
          const c = children.find((item) => item.id === id);
          if (c) {
            const app = (c.appearance as any) || {};
            setWizardData((prev) => ({
              ...prev,
              childName: c.name,
              age: c.age,
              gender: app.gender || (c.name.endsWith('а') || c.name.endsWith('я') ? 'girl' : 'boy'),
              interests: (c.interests as string[]) || prev.interests,
              appearance: {
                ...prev.appearance,
                hairColor: app.hairColor || prev.appearance.hairColor,
                hairType: app.hairType || prev.appearance.hairType,
                hairLength: app.hairLength || prev.appearance.hairLength,
                hairStructure: app.hairStructure || prev.appearance.hairStructure,
                eyeColor: app.eyeColor || 'карие',
                skinTone: app.skinTone || 'персиковая',
                toy: app.toy || prev.appearance.toy,
              },
            }));
            loadDailyIdea(c.id);
          }
        }}
        onCreateChild={async (data) => {
          const newChild = await api.createChild(data);
          setChildren((prev) => [...prev, newChild]);
          setActiveChildId(newChild.id);
        }}
      />

      {/* Модальное окно апгрейда книги (Экран 8) */}
      <Screen8_UpgradeModal
        isOpen={upgradeModalOpen}
        bookTitle={books.find((b) => b.id === selectedBookForUpgrade)?.title || 'Сказка'}
        coverUrl={selectedBookForUpgrade === 'b2' ? './illustrations/cover_star.jpg' : getFairytaleFallbackIllustration(books.find((b) => b.id === selectedBookForUpgrade)?.title)}
        userBalance={balance}
        onUpgrade={async () => {
          if (selectedBookForUpgrade) {
            try {
              await api.upgradeBook(selectedBookForUpgrade);
            } catch {}
            setBooks((prev) => {
              const updated = prev.map((b) =>
                b.id === selectedBookForUpgrade
                  ? {
                      ...b,
                      format: 'ILLUSTRATED' as const,
                      status: 'ILLUSTRATED' as const,
                      cover_url:
                        b.id === 'b2'
                          ? './illustrations/cover_star.jpg'
                          : b.cover_url || getFairytaleFallbackIllustration(b.title),
                    }
                  : b
              );
              try {
                localStorage.setItem('ms_books', JSON.stringify(updated));
              } catch {}
              return updated;
            });
            setBalance((prev) => Math.max(0, prev - 1));
            setUpgradeModalOpen(false);
            haptic.success();
          }
        }}
        onOpenShop={() => {
          setUpgradeModalOpen(false);
          setCurrentScreen('shop');
          setActiveTab('shop');
        }}
        onClose={() => setUpgradeModalOpen(false)}
      />

      {/* Bottom Sheet оплаты Stars (Экран 10) */}
      <Screen10_PaymentSheet
        isOpen={paymentSheetOpen}
        sku={selectedSku}
        onClose={() => setPaymentSheetOpen(false)}
        onPaymentSuccess={() => {
          setBalance((prev) => prev + (selectedSku === 'single_book_1' ? 1 : 5));
          loadBooks();
        }}
      />

      {/* Админ-панель */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </div>
  );
};
