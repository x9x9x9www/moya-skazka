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
    interests: ['Динозавры', 'Космос'],
    theme: 'Дружба',
    appearance: { avatar_id: 'boy_1', hair: 'светлые', clothing: 'уютный свитер' },
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

  const loadBooks = async () => {
    try {
      const list = await api.getBooks();
      setBooks(list);
    } catch {
      // Моковые книги для демонстрации из макета 7
      setBooks([
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
      ]);
    }
  };

  const loadDailyIdea = async (childId: string) => {
    try {
      const idea = await api.getDailyIdea(childId);
      setDailyIdea(idea);
    } catch {}
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

          // Открываем созданную книгу в читалке
          const bookDetails = await api.getBook(job.job_id);
          openReader(bookDetails);
        } else if (job.status.includes('FAILED')) {
          clearInterval(interval);
          setActiveJobId(null);
          setIsCreatingStory(false);
          alert('Ошибка генерации: зарезервированный кредит возвращён на баланс.');
        }
      } catch {
        // Fallback завершения для демо
        setJobProgress((p) => {
          if (p >= 90) {
            clearInterval(interval);
            setActiveJobId(null);
            setIsCreatingStory(false);
            haptic.success();
            openMockStory();
            return 100;
          }
          return p + 25;
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobId]);

  const openMockStory = () => {
    const demoBook: BookDetailsDTO = {
      id: 'demo_book',
      title: `${wizardData.childName} и тайна звездного ручья`,
      status: 'ILLUSTRATED',
      format: canClaimFree ? 'TEXT' : 'ILLUSTRATED',
      can_upgrade: canClaimFree,
      scenes: [
        {
          id: 's1',
          scene_index: 1,
          text: `Жил-был добрый и смелый ${wizardData.childName}. Больше всего на свете он любил изучать звёзды и слушать шелест листьев в волшебном саду. Однажды перед сном в окно заглянул крошечный лучик света.`,
          image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        },
        {
          id: 's2',
          scene_index: 2,
          text: `${wizardData.childName} побежал за лучиком и на лесной полянке встретил маленького динозаврика Дино. Дино сидел возле большой лужи и тихо вздыхал: «Я боюсь переходить, там слишком глубоко!» ${wizardData.childName} подумал и предложил сделать крепкий мостик из веточек.`,
          image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800',
        },
        {
          id: 's3',
          scene_index: 3,
          text: `Вместе они бережно уложили ветки и сделали мост. Дино сделал первый шаг, почувствовал поддержку друга и смело перебежал на другой берег. «Спасибо! Теперь мы настоящие друзья!» — радостно закричал динозаврик.`,
          image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
        },
        {
          id: 's4',
          scene_index: 4,
          text: `Вскоре Дино вернулся к своей маме, а ${wizardData.childName} с улыбкой смотрел на звёздное небо. Вечером ${wizardData.childName} засыпал в своей тёплой кроватке, зная, что доброта и смелость помогают совершать настоящие чудеса.`,
          image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800',
        },
      ],
      questions: [
        {
          id: 'q1',
          after_scene: 2,
          question: `Как ты думаешь, почему Дино испугался?`,
          parent_hint: `Выслушайте ответ. Можно спросить: «А что помогло ему почувствовать себя смелее?»`,
          skill_tag: 'emotions',
        },
        {
          id: 'q2',
          after_scene: 5,
          question: `Что тебе больше всего понравилось в этой истории?`,
          parent_hint: `Предложите рассказать, что запомнилось. Спросите, как бы малыш поступил на месте героя.`,
          skill_tag: 'reflection',
        },
      ],
    };
    openReader(demoBook);
  };

  const openReader = (book: BookDetailsDTO) => {
    setCurrentReadingBook(book);
    setCurrentSceneIndex(1);
    setCurrentScreen('reader');
  };

  // Обработчик создания сказки из визарда
  const handleCreateStorySubmit = async (details: {
    personality: string;
    customWishes: string;
    includeQuestions: boolean;
  }) => {
    setIsCreatingStory(true);
    setJobProgress(15);
    haptic.medium();

    try {
      if (canClaimFree) {
        const res = await api.createFreeBook({
          child_id: activeChildId || 'default',
          theme: wizardData.theme,
          interests: wizardData.interests,
          custom_wishes: details.customWishes,
          include_questions: details.includeQuestions,
        });
        setActiveJobId(res.job_id);
        setCanClaimFree(false);
      } else {
        const res = await api.createPaidBook({
          child_id: activeChildId || 'default',
          theme: wizardData.theme,
          interests: wizardData.interests,
          custom_wishes: details.customWishes,
          include_questions: details.includeQuestions,
        });
        setActiveJobId(res.job_id);
        setBalance((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Имитируем генерацию для мгновенного теста UI
      setTimeout(() => {
        setJobProgress(60);
        setTimeout(() => {
          setIsCreatingStory(false);
          haptic.success();
          openMockStory();
        }, 1200);
      }, 1000);
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
            onRefreshIdea={() => activeChildId && api.refreshDailyIdea(activeChildId).then(setDailyIdea)}
            onSaveIdea={() => haptic.success()}
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
              try {
                const book = await api.getBook(id);
                openReader(book);
              } catch {
                openMockStory();
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
