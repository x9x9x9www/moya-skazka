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
    if (saved) {
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
        cover_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
        created_at: new Date().toISOString(),
      },
      {
        id: 'b2',
        child_id: 'child_1',
        child_name: 'Миша',
        title: 'Миша и звёздочка',
        status: 'TEXT_READY',
        format: 'TEXT',
        cover_url: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'b3',
        child_id: 'child_1',
        child_name: 'Миша',
        title: 'Миша и волшебный лес',
        status: 'ILLUSTRATED',
        format: 'ILLUSTRATED',
        cover_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500',
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

    // Плавный визуальный прогресс ожидания ответа ИИ
    const progressInterval = setInterval(() => {
      setJobProgress((prev) => (prev < 88 ? prev + 12 : prev));
    }, 600);

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
                  openReader(JSON.parse(localStory));
                  return;
                } catch {}
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
        bookTitle="Сказка"
        userBalance={balance}
        onUpgrade={async () => {
          if (selectedBookForUpgrade) {
            await api.upgradeBook(selectedBookForUpgrade);
            setBalance((prev) => Math.max(0, prev - 1));
            setUpgradeModalOpen(false);
            loadBooks();
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
