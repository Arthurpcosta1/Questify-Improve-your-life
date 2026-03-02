import { Sidebar } from './components/Sidebar';
import { DailyHabits, Habit } from './components/DailyHabits';
import { MissionBoard } from './components/MissionBoard';
import { MissionCardProps, Rank } from './components/MissionCard';
import { NewMissionModal, NewTaskData, MissionType } from './components/NewMissionModal';
import { PlayerProfile } from './components/PlayerProfile';
import { RewardStore, RewardItem } from './components/RewardStore';
import { GameOverModal } from './components/GameOverModal';
import { SystemHistory } from './components/SystemHistory';
import { DungeonContent } from './components/DungeonContent';
import { Settings } from './components/Settings';
import { Ranking } from './components/Ranking';
import { Inventory } from './components/Inventory';
import { LoginScreen } from './components/LoginScreen';
// import { WelcomeModal } from './components/WelcomeModal'; // removido
import SystemTutorial from './components/SystemTutorial';
import { HabitControl, HabitData } from './components/HabitControl';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GameProvider, useGame } from './context/GameContext';
import { Toaster, toast } from 'sonner';
import { Button } from './components/ui/button';
import { Bug, Loader2, Menu } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { Session } from '@supabase/supabase-js';
import {
  loadAllGameData,
  createHabit,
  updateHabit,
  deleteHabit,
  createQuest,
  updateQuest,
  updateQuestCompletion,
  deleteQuest,
  addToInventory,
  resetDailyQuestsIfNeeded
} from '../utils/supabaseTasks';

type ViewState = 'dashboard' | 'store' | 'history' | 'dungeon' | 'settings' | 'ranking' | 'inventory';
// Reward Configuration
const REWARD_MAP: Record<Rank, { xp: number, gold: number }> = {
    'E': { xp: 10, gold: 5 },
    'D': { xp: 20, gold: 10 },
    'C': { xp: 40, gold: 20 },
    'B': { xp: 80, gold: 40 },
    'A': { xp: 150, gold: 80 },
    'S': { xp: 300, gold: 150 },
};

interface DashboardContentProps {
  userId: string;
}

function DashboardContent({ userId }: DashboardContentProps) {
  const { gainRewards, playerStats, takeDamage, updateDailyStreak } = useGame();
  
  // -- View State --
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // sync view with URL path
  useEffect(() => {
    const syncView = () => {
      const path = window.location.pathname;
      if (path === '/settings') {
        setCurrentView('settings');
      } else if (path === '/dungeon') {
        setCurrentView('dungeon');
      } else if (path === '/history') {
        setCurrentView('history');
      } else if (path === '/store') {
        setCurrentView('store');
      } else if (path === '/inventory') {
        setCurrentView('inventory');
      } else if (path === '/ranking') {
        setCurrentView('ranking');
      } else {
        setCurrentView('dashboard');
      }
    };
    syncView();
    window.addEventListener('popstate', syncView);
    return () => window.removeEventListener('popstate', syncView);
  }, []);

  // -- Data State --
  // 1. Habits (Good/Bad Behavior)
  const [habits, setHabits] = useState<HabitData[]>([]);
  // 2. Dailies (Recurring Missions) - reusing Habit type for structure but treated as Daily
  const [dailies, setDailies] = useState<Habit[]>([]);
  // 3. One-time Missions (To-Do)
  const [missions, setMissions] = useState<MissionCardProps[]>([]);

  const [personalRewards, setPersonalRewards] = useState<RewardItem[]>([
    { id: '1', title: 'Jogar 1h de Videogame', cost: 50, icon: '🎮', type: 'custom' },
    { id: '2', title: 'Pedir Pizza', cost: 200, icon: '🍕', type: 'custom' },
    { id: '3', title: 'Comprar Livro Novo', cost: 150, icon: '📚', type: 'custom' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // fixed user ID for development when auth isn't available
  const FIXED_USER_ID = '50bbc680-ac42-4409-b635-91350966be33';

  // Load all game data from Supabase on component mount
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setIsLoadingData(true);
        const effectiveUserId = userId || FIXED_USER_ID;
        // Resetar diárias se necessário
        await resetDailyQuestsIfNeeded(effectiveUserId);
        const gameData = await loadAllGameData(effectiveUserId);
        setHabits(gameData.habits);
        setDailies(gameData.dailies);
        setMissions(gameData.missions);
        setIsLoadingData(false);
      } catch (e) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
        setIsLoadingData(false);
      }
    };

    loadGameData();
  }, [userId]);

  // -- Derived State for Today's Dailies --
  const today = new Date().getDay();
  const todaysDailies = dailies.filter(daily => 
    !daily.repeatDays || daily.repeatDays.includes(today)
  );

  // -- Onboarding Check --
  useEffect(() => {
    const checkFirstLogin = async () => {
        if (habits.length > 0 || dailies.length > 0 || missions.length > 0) return;

        try {
            const { count, error } = await supabase
                .from('history_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (!error && count === 0) {
                setIsWelcomeModalOpen(true);
            }
        } catch (e) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
        }
    };
    
    const timeout = setTimeout(checkFirstLogin, 1000);
    return () => clearTimeout(timeout);
  }, [userId]); 

  const handleAcceptOnboarding = () => {
      // Create Starter Data
      
      // 1. Habit
      const startHabit: HabitData = {
          id: 'h1',
          title: 'Beber Água',
          attribute: 'VIT',
          rank: 'E',
          direction: 'positive'
      };

      // 2. Daily
      const startDaily: Habit = { 
          id: 'd1', 
          title: 'Ler 10 páginas', 
          completed: false, 
          attribute: 'INT', 
          xp: 20,
          gold: 10,
          repeatDays: [0, 1, 2, 3, 4, 5, 6]
      };

      // 3. Mission
      const startMission: MissionCardProps = {
        id: 'm1',
        title: 'Planejar Semana',
        description: 'Organizar tarefas no Notion.',
        attribute: 'WIS',
        rank: 'D',
        // @ts-ignore
        xp: 20,
        gold: 10
      };

      setHabits([startHabit]);
      setDailies([startDaily]);
      setMissions([startMission]);
      setIsWelcomeModalOpen(false);
      
      toast.success("O Despertar concluído. Tarefas iniciais atribuídas.");
      
      // Sync to Supabase
      Promise.all([
        createHabit(userId, startHabit),
        createQuest(userId, 'daily', startDaily),
        createQuest(userId, 'mission', startMission),
        supabase.from('history_logs').insert({
          user_id: userId,
          action_type: 'Sistema Iniciado',
          task_name: 'O Despertar',
          impact_value: 'Novo Jogador'
        })
      ]).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
  };


  // -- Habit Control Logic (Click +/-) --
  const handleScoreHabit = (id: string, direction: 'positive' | 'negative') => {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;

      if (direction === 'positive') {
          const rewards = REWARD_MAP[habit.rank];
          gainRewards(rewards.xp, rewards.gold, habit.attribute);
          toast.success(`Hábito realizado! +${rewards.xp} XP`);
      } else {
          // Bad Habit Damage
          const damage = 10; // Fixed or scalable? Keeping simple for now.
          takeDamage(damage);
          toast.error(`Hábito negativo! -${damage} HP`);
          if (playerStats.hp - damage <= 0) setIsGameOverOpen(true);
      }
  };

  const handleDeleteHabitControl = (id: string) => {
      setHabits(habits.filter(h => h.id !== id));
      // Sync deletion to Supabase
      deleteHabit(id).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
  };


  // -- Dailies (Recurring) Logic --

  const handleToggleDaily = (id: string) => {
    setDailies(dailies.map(daily => {
      if (daily.id === id) {
        const isCompleting = !daily.completed;
        
        // Calculate reward based on rank if available, else legacy fallback
        // Since `Habit` type doesn't explicitly store Rank in `DailyHabits.tsx` currently, 
        // we might need to assume a default or migrate type. 
        // For now, let's assume 'C' if missing or use the existing xp/gold props.
        const rewardXP = daily.xp || 40;
        const rewardGold = daily.gold || 20;
        
        if (isCompleting) {
          gainRewards(rewardXP, rewardGold, daily.attribute);
        } else {
          gainRewards(-rewardXP, -rewardGold, daily.attribute);
        }
        
        const updatedDaily = { ...daily, completed: isCompleting };
        // Sync to Supabase
        updateQuestCompletion(id, isCompleting).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
        
        return updatedDaily;
      }
      return daily;
    }));
  };

  const handleDeleteDaily = (id: string) => {
    setDailies(dailies.filter(d => d.id !== id));
    // Sync deletion to Supabase
    deleteQuest(id).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
  };

  // -- Mission (One-Time) Logic --

  const handleDeleteMission = (id: string) => {
    setMissions(missions.filter(m => m.id !== id));
    // Sync deletion to Supabase
    deleteQuest(id).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
  };

  const handleCompleteMission = (id: string) => {
    const mission = missions.find(m => m.id === id);
    if (mission) {
      const rewards = REWARD_MAP[mission.rank];
      gainRewards(rewards.xp, rewards.gold, mission.attribute);
      handleDeleteMission(id); 
    }
  }

  // -- Rewards Store Logic --
  
  const handleAddReward = (reward: RewardItem) => {
      setPersonalRewards([...personalRewards, reward]);
  };

  const handleDeleteReward = (id: string) => {
      setPersonalRewards(personalRewards.filter(r => r.id !== id));
  };

  // -- Create / Update Task Logic --

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, type: MissionType) => {
      // Augment item with type for the modal
      setEditingTask({ ...item, type });
      setIsModalOpen(true);
  };

  const handleCreateTask = (task: NewTaskData) => {
    const rewards = REWARD_MAP[task.rank];

    if (task.type === 'habit') {
        const newHabit: HabitData = {
            id: Date.now().toString(),
            title: task.title,
            attribute: task.attribute,
            rank: task.rank,
            direction: task.habitDirection || 'positive'
        };
        setHabits([...habits, newHabit]);
        
        // Sync to Supabase
        createHabit(userId, newHabit).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));

    } else if (task.type === 'recurring') {
        const newDaily: Habit = {
            id: Date.now().toString(),
            title: task.title,
            completed: false,
            attribute: task.attribute,
            xp: rewards.xp,
            gold: rewards.gold,
            repeatDays: task.repeatDays || [0, 1, 2, 3, 4, 5, 6]
        };
        setDailies([...dailies, newDaily]);
        
        // Sync to Supabase
        createQuest(userId, 'daily', newDaily).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));

    } else {
        const newMission: MissionCardProps = {
            id: Date.now().toString(),
            title: task.title,
            description: task.description || '',
            attribute: task.attribute,
            rank: task.rank,
            deadline: task.deadline ? format(task.deadline, "dd MMM, yyyy", { locale: ptBR }) : undefined,
            subtasks: task.subtasks,
            // @ts-ignore
            xp: rewards.xp,
            gold: rewards.gold
        };
        setMissions([...missions, newMission]);
        
        // Sync to Supabase
        createQuest(userId, 'mission', newMission).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
    }
    setIsModalOpen(false);
  };

  const handleUpdateTask = (id: string, task: NewTaskData) => {
      // Delete old version from wherever it was (naive approach: try delete from all, then add new)
      // Better approach: Check previous type or just ID. 
      // Given the complexity of moving types, let's just filter ID from all lists and add to the correct new list.
      
      setHabits(prev => prev.filter(h => h.id !== id));
      setDailies(prev => prev.filter(d => d.id !== id));
      setMissions(prev => prev.filter(m => m.id !== id));

      // Add as new (preserving ID though? logic below generates new ID usually, let's reuse ID)
      const rewards = REWARD_MAP[task.rank];

      if (task.type === 'habit') {
          const updatedHabit: HabitData = {
              id,
              title: task.title,
              attribute: task.attribute,
              rank: task.rank,
              direction: task.habitDirection || 'positive'
          };
          setHabits(prev => [...prev, updatedHabit]);
          
          // Sync to Supabase
          updateHabit(id, updatedHabit).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));

      } else if (task.type === 'recurring') {
          const updatedDaily: Habit = {
              id,
              title: task.title,
              completed: false,
              attribute: task.attribute,
              xp: rewards.xp,
              gold: rewards.gold,
              repeatDays: task.repeatDays
          };
          setDailies(prev => [...prev, updatedDaily]);
          
          // Sync to Supabase
          updateQuest(id, 'daily', updatedDaily).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));

      } else {
          const updatedMission: MissionCardProps = {
              id,
              title: task.title,
              description: task.description || '',
              attribute: task.attribute,
              rank: task.rank,
              deadline: task.deadline ? format(task.deadline, "dd MMM, yyyy", { locale: ptBR }) : undefined,
              subtasks: task.subtasks,
              // @ts-ignore
              xp: rewards.xp,
              gold: rewards.gold
          };
          setMissions(prev => [...prev, updatedMission]);
          
          // Sync to Supabase
          updateQuest(id, 'mission', updatedMission).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
      }
      
      setIsModalOpen(false);
  };

  // -- End of Day Logic --

  const handleSimulateEndOfDay = () => {
    // Only check DAILIES scheduled for TODAY
    const incompleteDailies = todaysDailies.filter(d => !d.completed);
    const damagePerDaily = 15;
    
    // Reset all Dailies
    setDailies(dailies.map(d => ({ ...d, completed: false })));

    if (incompleteDailies.length === 0) {
        updateDailyStreak(true);
    } else {
        const wasFrozen = playerStats.isFrozen;
        updateDailyStreak(false);

        if (wasFrozen) {
            toast.info(`🛡️ CRISTAL DE ESTASE: O dia foi salvo!`);
        } else {
            const totalDamage = incompleteDailies.length * damagePerDaily;
            
            if (playerStats.hp - totalDamage <= 0) {
                setIsGameOverOpen(true);
                takeDamage(totalDamage); 
            } else {
                 toast.error(`⚠️ Você ignorou ${incompleteDailies.length} rotinas. -${totalDamage} HP.`);
                 takeDamage(totalDamage);
            }
        }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderContent = () => {
      if (isLoadingData) {
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        );
      }

      switch(currentView) {
          case 'dashboard':
              return (
                <>
                <section className="tour-profile">
                  <PlayerProfile />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Habits & Dailies */}
                    <div className="space-y-8">
                        <section className="tour-habits">
                          <HabitControl 
                            habits={habits}
                            onScore={handleScoreHabit}
                            onEdit={(id) => handleOpenEdit(habits.find(h => h.id === id), 'habit')}
                            onDelete={handleDeleteHabitControl}
                          />
                        </section>

                        <section className="tour-dailies">
                           <DailyHabits 
                            habits={todaysDailies} 
                            onToggleHabit={handleToggleDaily} 
                            onEdit={(id) => handleOpenEdit(dailies.find(d => d.id === id), 'recurring')}
                            onDelete={handleDeleteDaily}
                           />
                        </section>
                    </div>

                    {/* Right Column: One-Time Missions */}
                    <div className="space-y-8">
                        <section className="tour-dungeon">
                          <MissionBoard 
                            missions={missions} 
                            onOpenCreateModal={handleOpenCreateModal}
                            onOpenEditModal={(mission) => handleOpenEdit(mission, 'onetime')}
                            onDeleteTask={handleDeleteMission}
                            onCompleteTask={handleCompleteMission}
                          />
                        </section>
                    </div>
                </div>

                {playerStats.isAdmin && (
                    <section className="pt-8 border-t border-border/20 flex justify-center">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleSimulateEndOfDay}
                            className="text-xs text-muted-foreground hover:text-red-400"
                        >
                            <Bug size={14} className="mr-2" />
                            [Dev] Simular Fim do Dia
                        </Button>
                    </section>
                )}
                </>
              );
          case 'store':
              return (
                <RewardStore 
                    personalRewards={personalRewards}
                    onAddReward={handleAddReward}
                    onDeleteReward={handleDeleteReward}
                    userId={userId}
                />
              );
          case 'inventory':
              return (
                <Inventory />
              );
          case 'history':
              return (
                  <SystemHistory userId={userId} />
              );
          case 'dungeon':
              return (
                  <DungeonContent />
              );
          case 'settings':
              return <Settings />;
            case 'ranking':
              // Força remount do Ranking ao abrir a tela, usando key única
              return <Ranking userId={userId} key={currentView + Date.now()} />;
          default:
              return null;
      }
  };

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] flex text-foreground font-sans">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => {
            setCurrentView(view as ViewState);
            // push to history
            let path = '/';
            switch(view) {
              case 'dashboard': path = '/'; break;
              case 'store': path = '/store'; break;
              case 'history': path = '/history'; break;
              case 'dungeon': path = '/dungeon'; break;
              case 'settings': path = '/settings'; break;
              case 'ranking': path = '/ranking'; break;
            }
            window.history.pushState({}, '', path);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 overflow-y-auto h-screen relative bg-[#0f0f0f] p-4 md:p-8">
        
        <div className="flex items-center justify-between mb-6 md:hidden">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </Button>
                <h1 className="text-xl font-bold">RPG Dashboard</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sair</Button>
        </div>

        {currentView === 'dashboard' && (
            <header className="hidden md:flex mb-8 justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Painel de Controle</h1>
                    <p className="text-sm text-muted-foreground">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">Sair</Button>
            </header>
        )}
        
        {currentView !== 'dashboard' && (
             <div className="hidden md:block absolute top-8 right-8 z-10">
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="bg-[#0f0f0f]/80 backdrop-blur">Sair</Button>
             </div>
        )}

        <div className="space-y-8 pb-20">
            {renderContent()}
        </div>
      </main>

      <NewMissionModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        initialData={editingTask}
      />
      <GameOverModal open={isGameOverOpen} onOpenChange={setIsGameOverOpen} />
      <SystemTutorial />
      <Toaster />
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
     return (
       <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
       </div>
     );
  }

  if (!session) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  return (
    <GameProvider>
      <DashboardContent userId={session.user.id} />
    </GameProvider>
  );
}
