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
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  loadAllGameData,
  createHabit,
  updateHabit,
  deleteHabit,
  createQuest,
  updateQuest,
  updateQuestCompletion,
  deleteQuest,
  resetDailyQuestsIfNeeded
} from '../utils/supabaseTasks';

type ViewState = 'dashboard' | 'store' | 'history' | 'dungeon' | 'settings' | 'ranking' | 'inventory';

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
  
  // -- React Router Hooks --
  const navigate = useNavigate();
  const location = useLocation();

  // Deriva a vista atual diretamente da URL
  const currentView = (location.pathname.substring(1) || 'dashboard') as ViewState;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [dailies, setDailies] = useState<Habit[]>([]);
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

  const FIXED_USER_ID = '50bbc680-ac42-4409-b635-91350966be33';

  useEffect(() => {
    const loadGameData = async () => {
      try {
        setIsLoadingData(true);
        const effectiveUserId = userId || FIXED_USER_ID;
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

  const today = new Date().getDay();
  const todaysDailies = dailies.filter(daily => 
    !daily.repeatDays || daily.repeatDays.includes(today)
  );

  useEffect(() => {
    const checkFirstLogin = async () => {
        if (habits.length > 0 || dailies.length > 0 || missions.length > 0) return;
        try {
            const { count, error } = await supabase
                .from('history_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (!error && count === 0) setIsWelcomeModalOpen(true);
        } catch (e) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
        }
    };
    const timeout = setTimeout(checkFirstLogin, 1000);
    return () => clearTimeout(timeout);
  }, [userId]); 

  const handleScoreHabit = (id: string, direction: 'positive' | 'negative') => {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;

      if (direction === 'positive') {
          const rewards = REWARD_MAP[habit.rank];
          gainRewards(rewards.xp, rewards.gold, habit.attribute);
          toast.success(`Hábito realizado! +${rewards.xp} XP`);
      } else {
          const damage = 10;
          takeDamage(damage);
          toast.error(`Hábito negativo! -${damage} HP`);
          if (playerStats.hp - damage <= 0) setIsGameOverOpen(true);
      }
  };

  const handleDeleteHabitControl = (id: string) => {
      setHabits(habits.filter(h => h.id !== id));
      deleteHabit(id).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
  };

  const handleToggleDaily = (id: string) => {
    setDailies(dailies.map(daily => {
      if (daily.id === id) {
        const isCompleting = !daily.completed;
        const rewardXP = daily.xp || 40;
        const rewardGold = daily.gold || 20;
        
        if (isCompleting) gainRewards(rewardXP, rewardGold, daily.attribute);
        else gainRewards(-rewardXP, -rewardGold, daily.attribute);
        
        const updatedDaily = { ...daily, completed: isCompleting };
        updateQuestCompletion(id, isCompleting).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
        return updatedDaily;
      }
      return daily;
    }));
  };

  const handleDeleteDaily = (id: string) => {
    setDailies(dailies.filter(d => d.id !== id));
    deleteQuest(id).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
  };

  const handleDeleteMission = (id: string) => {
    setMissions(missions.filter(m => m.id !== id));
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

  const handleAddReward = (reward: RewardItem) => setPersonalRewards([...personalRewards, reward]);
  const handleDeleteReward = (id: string) => setPersonalRewards(personalRewards.filter(r => r.id !== id));

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any, type: MissionType) => {
      setEditingTask({ ...item, type });
      setIsModalOpen(true);
  };

  const handleCreateTask = (task: NewTaskData) => {
    const rewards = REWARD_MAP[task.rank];

    if (task.type === 'habit') {
        const newHabit: HabitData = { id: Date.now().toString(), title: task.title, attribute: task.attribute, rank: task.rank, direction: task.habitDirection || 'positive' };
        setHabits([...habits, newHabit]);
        createHabit(userId, newHabit).catch(e => console.log('Erro', e));
    } else if (task.type === 'recurring') {
        const newDaily: Habit = { id: Date.now().toString(), title: task.title, completed: false, attribute: task.attribute, xp: rewards.xp, gold: rewards.gold, repeatDays: task.repeatDays || [0, 1, 2, 3, 4, 5, 6] };
        setDailies([...dailies, newDaily]);
        createQuest(userId, 'daily', newDaily).catch(e => console.log('Erro', e));
    } else {
        const newMission: MissionCardProps = { id: Date.now().toString(), title: task.title, description: task.description || '', attribute: task.attribute, rank: task.rank, deadline: task.deadline ? format(task.deadline, "dd MMM, yyyy", { locale: ptBR }) : undefined, subtasks: task.subtasks, xp: rewards.xp, gold: rewards.gold };
        setMissions([...missions, newMission]);
        createQuest(userId, 'mission', newMission).catch(e => console.log('Erro', e));
    }
    setIsModalOpen(false);
  };

  const handleUpdateTask = (id: string, task: NewTaskData) => {
      setHabits(prev => prev.filter(h => h.id !== id));
      setDailies(prev => prev.filter(d => d.id !== id));
      setMissions(prev => prev.filter(m => m.id !== id));

      const rewards = REWARD_MAP[task.rank];

      if (task.type === 'habit') {
          const updatedHabit: HabitData = { id, title: task.title, attribute: task.attribute, rank: task.rank, direction: task.habitDirection || 'positive' };
          setHabits(prev => [...prev, updatedHabit]);
          updateHabit(id, updatedHabit).catch(e => console.log('Erro', e));
      } else if (task.type === 'recurring') {
          const updatedDaily: Habit = { id, title: task.title, completed: false, attribute: task.attribute, xp: rewards.xp, gold: rewards.gold, repeatDays: task.repeatDays };
          setDailies(prev => [...prev, updatedDaily]);
          updateQuest(id, 'daily', updatedDaily).catch(e => console.log('Erro', e));
      } else {
          const updatedMission: MissionCardProps = { id, title: task.title, description: task.description || '', attribute: task.attribute, rank: task.rank, deadline: task.deadline ? format(task.deadline, "dd MMM, yyyy", { locale: ptBR }) : undefined, subtasks: task.subtasks, xp: rewards.xp, gold: rewards.gold };
          setMissions(prev => [...prev, updatedMission]);
          updateQuest(id, 'mission', updatedMission).catch(e => console.log('Erro', e));
      }
      setIsModalOpen(false);
  };

  const handleSimulateEndOfDay = () => {
    const incompleteDailies = todaysDailies.filter(d => !d.completed);
    const damagePerDaily = 15;
    
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

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] flex text-foreground font-sans">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => {
            let path = '/';
            switch(view) {
              case 'dashboard': path = '/'; break;
              case 'store': path = '/store'; break;
              case 'history': path = '/history'; break;
              case 'dungeon': path = '/dungeon'; break;
              case 'settings': path = '/settings'; break;
              case 'ranking': path = '/ranking'; break;
              case 'inventory': path = '/inventory'; break;
            }
            navigate(path);
            setIsSidebarOpen(false);
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
            {isLoadingData ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <Routes>
                    <Route path="/" element={
                        <>
                            <section className="tour-profile">
                                <PlayerProfile />
                            </section>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <section className="tour-habits">
                                        <HabitControl habits={habits} onScore={handleScoreHabit} onEdit={(id) => handleOpenEdit(habits.find(h => h.id === id), 'habit')} onDelete={handleDeleteHabitControl} />
                                    </section>
                                    <section className="tour-dailies">
                                        <DailyHabits habits={todaysDailies} onToggleHabit={handleToggleDaily} onEdit={(id) => handleOpenEdit(dailies.find(d => d.id === id), 'recurring')} onDelete={handleDeleteDaily} />
                                    </section>
                                </div>
                                <div className="space-y-8">
                                    <section className="tour-dungeon">
                                        <MissionBoard missions={missions} onOpenCreateModal={handleOpenCreateModal} onOpenEditModal={(mission) => handleOpenEdit(mission, 'onetime')} onDeleteTask={handleDeleteMission} onCompleteTask={handleCompleteMission} />
                                    </section>
                                </div>
                            </div>
                            {playerStats.isAdmin && (
                                <section className="pt-8 border-t border-border/20 flex justify-center">
                                    <Button variant="ghost" size="sm" onClick={handleSimulateEndOfDay} className="text-xs text-muted-foreground hover:text-red-400">
                                        <Bug size={14} className="mr-2" />
                                        [Dev] Simular Fim do Dia
                                    </Button>
                                </section>
                            )}
                        </>
                    } />
                    <Route path="/store" element={<RewardStore personalRewards={personalRewards} onAddReward={handleAddReward} onDeleteReward={handleDeleteReward} userId={userId} />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/history" element={<SystemHistory userId={userId} />} />
                    <Route path="/dungeon" element={<DungeonContent />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/ranking" element={<Ranking userId={userId} key={Date.now()} />} />
                </Routes>
            )}
        </div>
      </main>

      <NewMissionModal open={isModalOpen} onOpenChange={setIsModalOpen} onCreateTask={handleCreateTask} onUpdateTask={handleUpdateTask} initialData={editingTask} />
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
    <BrowserRouter>
      <GameProvider>
        <DashboardContent userId={session.user.id} />
      </GameProvider>
    </BrowserRouter>
  );
}