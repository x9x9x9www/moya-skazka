import React, { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { useReaderSettings } from './hooks/useReaderSettings';
import { api } from './api/client';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { ChildProfileModal } from './components/ChildProfileModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { Screen1_Onboarding } from './screens/Screen1_Onboarding';
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
import { generateDynamicStory } from './services/storyGenerator';

export const App: React.FC = () => {
  const { initData, startParam, haptic } = useTelegram();
  const { settings, updateSetting } = useReaderSettings();

  // Основные состояния приложения
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [balance, setBalance] = useState<number>(1);
  const [canClaimFree, setCanClaimFree] = useState<boolean>(true);
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
    qualifiedFriends: 2,
    giftCredits: 2,
  });

  // Авторизация и начальная загрузка
  useEffect(() => {
    bootstrapApp();
  }, [initData]);

  const bootstrapApp = async () => {
    try {
      await api.loginWithTelegram(initData, startParam);
      const me = await api.getMe();
      setBalance(me.balance.available);
      setCanClaimFree(me.can_claim_free_story);

      const childrenList = await api.getChildren();
      if (childrenList.length > 0) {
        setChildren(childrenList);
        setActiveChildId(childrenList[0].id);
        setWizardData((prev) => ({
          ...prev,
          childName: childrenList[0].name,
          age: childrenList[0].age,
          interests: (childrenList[0].interests as string[]) || prev.interests,
        }));
        loadDailyIdea(childrenList[0].id);
      } else {
        // Создаем дефолтного героя при первом старте
        const defaultChild = await api.createChild({
          name: 'Миша',
          age: 4,
          interests: ['динозавры', 'космос'],
          appearance: { avatar_id: 'boy_1' },
        });
        setChildren([defaultChild]);
        setActiveChildId(defaultChild.id);
        loadDailyIdea(defaultChild.id);
      }

      loadBooks();
      loadReferrals();
    } catch {
      // Инициализируем локальные данные для демонстрации
      const mockChild: ChildProfileDTO = {
        id: 'child_1',
        user_id: 'user_1',
        name: 'Миша',
        age: 4,
        interests: ['Динозавры', 'Космос'],
        appearance: { avatar_id: 'boy_1' },
        is_active: true,
      };
      setChildren([mockChild]);
      setActiveChildId(mockChild.id);
    }
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
        setBooks(list);
        return;
      }
    } catch {}

    const saved = localStorage.getItem('ms_books');
    if (saved && !saved.includes('unsplash')) {
      try {
        setBooks(JSON.parse(saved));
        return;
      } catch {}
    }

    const defaultBooks: BookSummaryDTO[] = [
      {
        id: 'b1',
        child_id: 'child_1',
        child_name: 'Миша',
        title: 'Миша и маленький динозавр Дино',
        status: 'ILLUSTRATED',
        format: 'ILLUSTRATED',
        cover_url: './illustrations/cover_dino.jpg',
        created_at: new Date().toISOString(),
      },
      {
        id: 'b2',
        child_id: 'child_1',
        child_name: 'Миша',
        title: 'Миша и звёздочка',
        status: 'TEXT_READY',
        format: 'TEXT',
        cover_url: './illustrations/cover_star.jpg',
        created_at: new Date().toISOString(),
      },
      {
        id: 'b3',
        child_id: 'child_1',
        child_name: 'Миша',
        title: 'Миша и волшебный лес',
        status: 'ILLUSTRATED',
        format: 'ILLUSTRATED',
        cover_url: './illustrations/cover_forest.jpg',
        created_at: new Date().toISOString(),
      },
    ];
    setBooks(defaultBooks);
    try {
      localStorage.setItem('ms_books', JSON.stringify(defaultBooks));
    } catch {}
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
    setCurrentReadingBook(book);
    setCurrentSceneIndex(1);
    setCurrentScreen('reader');
  };

  // Обработчик создания сказки из визарда: уникальная генерация на каждый запуск
  const handleCreateStorySubmit = async (details: {
    personality: string;
    customWishes: string;
    includeQuestions: boolean;
  }) => {
    setIsCreatingStory(true);
    setJobProgress(15);
    haptic.medium();

    // Плавный визуальный прогресс ожидания ответа ИИ (~30 сек: текст + 4 иллюстрации)
    const progressInterval = setInterval(() => {
      setJobProgress((prev) => (prev < 92 ? prev + 2.5 : prev));
    }, 900);

    try {
      // 1. Прямая генерация через Gemini 3.8 Flash с умным процедурным fallback
      const generatedBook = await generateDynamicStory({
        childName: wizardData.childName,
        age: wizardData.age,
        gender: wizardData.gender,
        theme: wizardData.theme || 'Дружба',
        interests: wizardData.interests,
        personality: details.personality,
        customWishes: details.customWishes,
        includeQuestions: details.includeQuestions,
        appearance: wizardData.appearance,
      });

      clearInterval(progressInterval);
      setJobProgress(100);

      // 2. Сохраняем новую книгу в состояние и локальное хранилище
      const newSummary: BookSummaryDTO = {
        id: generatedBook.id,
        child_id: activeChildId || 'default',
        child_name: wizardData.childName,
        title: generatedBook.title,
        status: 'ILLUSTRATED',
        format: 'ILLUSTRATED',
        cover_url: generatedBook.scenes[0]?.image_url || null,
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

      // 3. Списываем кредит / бесплатную попытку
      if (canClaimFree) {
        setCanClaimFree(false);
      } else {
        setBalance((prev) => Math.max(0, prev - 1));
      }

      // 4. Открываем читалку со свежей уникальной сказкой
      setTimeout(() => {
        setIsCreatingStory(false);
        haptic.success();
        openReader(generatedBook);
      }, 350);
    } catch (err) {
      clearInterval(progressInterval);
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
          onOpenAdmin={() => setAdminModalOpen(true)}
        />
      )}

      {/* Оверлей прогресса генерации книги */}
      {isCreatingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto animate-pulse">
              ✨
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Создаём волшебную сказку...
            </h3>
            <p className="text-xs text-stone-500">
              Пишем 4 добрые сцены и вопросы для {wizardData.childName}
            </p>
            <div className="w-full bg-cream-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${jobProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Роутинг экранов */}
      <main className="flex-1">
        {currentScreen === 'onboarding' && (
          <Screen1_Onboarding onStart={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'home' && (
          <Screen2_Home
            activeChild={activeChild}
            canClaimFreeStory={canClaimFree}
            balance={balance}
            dailyIdea={dailyIdea}
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
            onSubmit={handleCreateStorySubmit}
            onBack={() => setCurrentScreen('wizard_hero')}
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
            onSelectBook={async (id) => {
              const localStory = localStorage.getItem(`ms_story_${id}`);
              if (localStory) {
                try {
                  const parsed = JSON.parse(localStory);
                  const hasBadContent =
                    JSON.stringify(parsed).includes('unsplash') ||
                    JSON.stringify(parsed).includes('построилл');
                  if (!hasBadContent) {
                    openReader(parsed);
                    return;
                  }
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
                      image_url: './illustrations/scene_1.jpg',
                    },
                    {
                      id: 's2',
                      scene_index: 2,
                      text: 'Миша и Дино подошли к большой луже. Дино остановился и испуганно посмотрел на воду. — Я боюсь переходить, — прошептал он. Миша ободряюще улыбнулся, взял друга за лапку и предложил сделать надёжный мостик из крепких веточек.',
                      image_url: './illustrations/scene_2.jpg',
                    },
                    {
                      id: 's3',
                      scene_index: 3,
                      text: 'Они дружно положили веточки через ручеёк. Дино сделал первый смелый шаг и радостно захлопал в ладоши! Малыши забрались в уютный шалаш из тёплых пледов и открыли светящуюся сказочную книгу, полную добрых историй.',
                      image_url: './illustrations/scene_3.jpg',
                    },
                    {
                      id: 's4',
                      scene_index: 4,
                      text: 'Вскоре Дино увидел свою семью. Он радостно обнял маму, а потом повернулся к Мише. — Спасибо! Теперь мы друзья навсегда! — сказал он. Вечером Миша сладко засыпал в своей кроватке, зная, что доброта помогает совершать настоящие чудеса.',
                      image_url: './illustrations/scene_4.jpg',
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
            onClose={() => setCurrentScreen('home')}
            onDeleteAccount={async () => {
              await api.deleteAccount();
              alert('Аккаунт и все связанные данные успешно удалены.');
              bootstrapApp();
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
        onSelectChild={(id) => {
          setActiveChildId(id);
          const c = children.find((item) => item.id === id);
          if (c) {
            setWizardData((prev) => ({
              ...prev,
              childName: c.name,
              age: c.age,
              interests: (c.interests as string[]) || prev.interests,
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
        coverUrl={selectedBookForUpgrade === 'b2' ? './illustrations/cover_star.jpg' : './illustrations/cover_dino.jpg'}
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
                          : b.cover_url || './illustrations/cover_dino.jpg',
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
