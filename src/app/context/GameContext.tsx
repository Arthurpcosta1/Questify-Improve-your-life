import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { Sword, Brain, Zap, Shield, Activity, LucideIcon, Trophy, Target, Crown, Skull } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { playLevelUpVFX, playTaskCompleteSFX } from '../../utils/gameEffects';

// --- Types ---

export type AttributeCode = 'STR' | 'INT' | 'DEX' | 'WIS' | 'VIT';

export interface AttributeStats {
  id: string;
  code: AttributeCode;
  label: string;
  level: number;
  xp: number;
  icon: LucideIcon;
  color: string;
  barColor: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  reqType: 'total_tasks' | 'level' | 'streak';
  reqValue: number;
}

export interface PlayerStats {
  name: string;
  title: string; // Dynamic Rank Title (e.g., Hunter Rank E)
  equippedTitle: string | null; // Cosmetic Achievement Title (e.g., "The Awakened")
  avatar: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  gold: number;
  gems: number;
  isAdmin: boolean; 
  currentStreak: number;
  isFrozen: boolean;
  completedTasks: number; // Tracked for achievements
}

interface GameContextType {
  playerStats: PlayerStats;
  attributes: AttributeStats[];
  achievements: Achievement[];
  userAchievements: string[]; // List of unlocked achievement IDs
  gainRewards: (xp: number, gold: number, attributeCode: AttributeCode) => void;
  spendGold: (amount: number) => boolean;
  healPlayer: (amount: number) => void;
  takeDamage: (amount: number) => void;
  updatePlayerProfile: (name: string, avatar: string) => Promise<void>;
  updateDailyStreak: (success: boolean) => void;
  activateShield: () => void;
  equipTitle: (titleId: string) => void;
}

// --- Constants / Initial State ---

const LEVEL_THRESHOLD = 100; // XP needed to level up

export const ACHIEVEMENTS: Achievement[] = [
    { id: 'awakened', title: 'O Desperto', description: 'Complete sua primeira missão.', icon: Zap, reqType: 'total_tasks', reqValue: 1 },
    { id: 'hunter_e', title: 'Caçador Novato', description: 'Complete 10 missões.', icon: Target, reqType: 'total_tasks', reqValue: 10 },
    { id: 'hunter_c', title: 'Veterano de Batalha', description: 'Complete 50 missões.', icon: Sword, reqType: 'total_tasks', reqValue: 50 },
    { id: 'shadow_monarch', title: 'Monarca das Sombras', description: 'Alcance o Nível 10.', icon: Crown, reqType: 'level', reqValue: 10 },
    { id: 'immortal', title: 'O Imortal', description: 'Mantenha um combo de 30 dias.', icon: Skull, reqType: 'streak', reqValue: 30 },
    { id: 'master_mind', title: 'Mente Mestra', description: 'Complete 100 missões.', icon: Brain, reqType: 'total_tasks', reqValue: 100 },
];

const INITIAL_PLAYER_STATS: PlayerStats = {
  name: "Sung Jin-Woo",
  title: "Caçador Rank E",
  equippedTitle: null,
  avatar: "custom:avatar:1",
  level: 1,
  xp: 0,
  hp: 100,
  maxHp: 100,
  gold: 0,
  gems: 0,
  isAdmin: false,
  currentStreak: 0,
  isFrozen: false,
  completedTasks: 0,
};

const INITIAL_ATTRIBUTES: AttributeStats[] = [
  { id: "str", label: "Força", code: "STR", level: 1, xp: 0, icon: Sword, color: "text-red-400", barColor: "bg-red-500" },
  { id: "int", label: "Inteligência", code: "INT", level: 1, xp: 0, icon: Brain, color: "text-blue-400", barColor: "bg-blue-500" },
  { id: "dex", label: "Destreza", code: "DEX", level: 1, xp: 0, icon: Zap, color: "text-green-400", barColor: "bg-green-500" },
  { id: "wis", label: "Sabedoria", code: "WIS", level: 1, xp: 0, icon: Shield, color: "text-purple-400", barColor: "bg-purple-500" },
  { id: "vit", label: "Vitalidade", code: "VIT", level: 1, xp: 0, icon: Activity, color: "text-yellow-400", barColor: "bg-yellow-500" },
];

// --- Helper: Calculate Rank ---
const getRank = (level: number) => {
  if (level <= 10) return "Caçador Rank E";
  if (level <= 20) return "Caçador Rank D";
  if (level <= 30) return "Caçador Rank C";
  if (level <= 40) return "Caçador Rank B";
  if (level <= 50) return "Caçador Rank A";
  return "Caçador Rank S";
};

// --- Context ---

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerStats, setPlayerStats] = useState<PlayerStats>(INITIAL_PLAYER_STATS);
  const [attributes, setAttributes] = useState<AttributeStats[]>(INITIAL_ATTRIBUTES);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);

  // Função pública para forçar reload do perfil
  const reloadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // allow fallback to dev id if auth is missing
      const finalUserId = user?.id || '50bbc680-ac42-4409-b635-91350966be33';

      // Fetch Profile
      let profile: any = null;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', finalUserId)
        .single();

      // If no profile exists, create default one
      if (profileError?.code === 'PGRST116' || !profileData) {
        const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: finalUserId,
              display_name: user?.user_metadata?.full_name || "Caçador",
              avatar_url: "avatar1",
              level: 1,
              xp: 0,
              hp: 100,
              gold: 0,
              role: 'user'
            });
        
        if (insertError) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(insertError, null, 2));
        } else {
          profile = { display_name: user.user_metadata?.full_name || "Caçador", avatar_url: "avatar1" };
        }
      } else if (profileError) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(profileError, null, 2));
      } else {
        profile = profileData;
      }

      // Fetch Achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', finalUserId);
      
      if (achievementsError) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(achievementsError, null, 2));
      }
      
      // Fetch Logs count for Total Tasks
      const { count: taskCount, error: countError } = await supabase
        .from('history_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', finalUserId)
          .or('action_type.eq.Tarefa Concluída,action_type.eq.Masmorra Concluída');
      
      if (countError) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(countError, null, 2));
      }

      const finalName = profile?.display_name || user?.user_metadata?.full_name || "Caçador";
      const finalAvatar = profile?.avatar_url || "avatar1";
      const unlocked = achievementsData?.map((a: any) => a.achievement_id) || [];

      setPlayerStats(prev => ({
          ...prev,
          name: finalName,
          avatar: finalAvatar,
          title: getRank(prev.level),
          equippedTitle: profile?.equipped_title || null,
          isAdmin: profile?.role === 'admin',
          currentStreak: profile?.current_streak || 0,
          isFrozen: profile?.is_frozen || false,
          completedTasks: taskCount || 0,
          strength: profile?.strength ?? 0,
          intelligence: profile?.intelligence ?? 0,
          dexterity: profile?.dexterity ?? 0,
          wisdom: profile?.wisdom ?? 0,
          vitality: profile?.vitality ?? 0,
        }));
      
      setUserAchievements(unlocked);
    } catch (e) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    }
  };

  // Load initial profile from Supabase
  useEffect(() => {
    reloadProfile();
  }, []);

  // Expor reloadProfile no contexto
  (GameContext as any)._reloadProfile = reloadProfile;

  const checkAchievements = (currentStats: PlayerStats) => {
      const newUnlocked: string[] = [];

      ACHIEVEMENTS.forEach(ach => {
          if (userAchievements.includes(ach.id)) return;

          let met = false;
          if (ach.reqType === 'total_tasks' && currentStats.completedTasks >= ach.reqValue) met = true;
          if (ach.reqType === 'level' && currentStats.level >= ach.reqValue) met = true;
          if (ach.reqType === 'streak' && currentStats.currentStreak >= ach.reqValue) met = true;

          if (met) {
              newUnlocked.push(ach.id);
              toast("🏆 Conquista Desbloqueada!", {
                  description: `${ach.title} - ${ach.description}`,
                  className: "bg-yellow-900/90 border-yellow-500 text-yellow-100 font-bold"
              });
              
              // Persist to database
              supabase.auth.getUser().then(async ({ data: { user } }) => {
                  if (user) {
                          const finalUserId = user.id || '50bbc680-ac42-4409-b635-91350966be33';
                          const { error } = await supabase.from('user_achievements').insert({
                              user_id: finalUserId,
                              achievement_id: ach.id
                          });
                          if (error) {
                            console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
                          }
                      }
              }).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));
          }
      });

      if (newUnlocked.length > 0) {
          setUserAchievements(prev => [...prev, ...newUnlocked]);
      }
  };

  // --- Helper: Sync Supabase ---
  const syncProfileData = async (payload: any) => { // <-- MUDANÇA AQUI: troquei para "any"
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);
        
      if (error) console.log('Erro no Sync:', error);
    } catch (e) {
      console.log('Erro no Sync:', e);
    }
  };

  const updatePlayerProfile = async (name: string, avatar: string) => {
    setPlayerStats(prev => ({ ...prev, name, avatar }));
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('DETALHE DO ERRO 400: No user authenticated');
          toast.error('Erro: nenhum usuário autenticado');
          return;
        }
        
        const { error } = await supabase.from('profiles').upsert(
          { 
            id: user.id,
            display_name: name, 
            avatar_url: avatar 
          }, 
          { onConflict: 'id' }
        );
        
        if (error) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
          toast.error('Falha ao salvar perfil');
          return;
        }
        
        toast.success('Perfil salvo com sucesso!');
    } catch(e) { 
      console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
      toast.error('Erro inesperado ao salvar perfil');
    }
  };

  const equipTitle = async (titleId: string) => {
      // Allow equipping null to unequip
      if (titleId && !userAchievements.includes(titleId)) return;

      const achievement = ACHIEVEMENTS.find(a => a.id === titleId);
      setPlayerStats(prev => ({ ...prev, equippedTitle: achievement ? achievement.title : null }));
      
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.log('DETALHE DO ERRO 400: No user authenticated');
            toast.error('Erro: nenhum usuário autenticado');
            return;
          }
          
          const { error } = await supabase.from('profiles').upsert(
            { 
              id: user.id,
              equipped_title: achievement ? achievement.title : null 
            },
            { onConflict: 'id' }
          );
          
          if (error) {
            console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
            toast.error('Falha ao equipar título');
            return;
          }
          
          toast.success(`Título equipado: ${achievement?.title || 'Nenhum'}`);
      } catch (e) { 
        console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
        toast.error('Erro ao equipar título');
      }
  };

  const gainRewards = (xpReward: number, goldReward: number, attributeCode: AttributeCode) => {
    // sound effect when gaining positive XP (task completion)
    if (xpReward > 0) playTaskCompleteSFX();

    let updatedAttributes: AttributeStats[] = [];

    setPlayerStats((prev) => {
      // ... XP Logic (reused) ...
      let multiplier = 1;
      let bonusMessage = "";
      if (xpReward > 0) {
          if (prev.currentStreak >= 7) { multiplier = 2; bonusMessage = " (x2 Combo!)"; } 
          else if (prev.currentStreak >= 3) { multiplier = 1.5; bonusMessage = " (x1.5 Combo!)"; }
      }

      const finalXpReward = Math.floor(xpReward * multiplier);
      let newXp = prev.xp + finalXpReward;
      let newLevel = prev.level;
      let leveledUp = false;

      while (newXp >= LEVEL_THRESHOLD) {
        newXp -= LEVEL_THRESHOLD;
        newLevel += 1;
        leveledUp = true;
      }
      
      // Update Attributes (Simplified for brevity - assumes logic exists)
      setAttributes((prevAttributes) => {
        return prevAttributes.map((attr) => {
          if (attr.code === attributeCode) {
            // Incrementa +1 no atributo ao completar tarefa/hábito
            const updated = { ...attr, level: attr.level + 1 };
            updatedAttributes.push(updated);
            return updated;
          }
          updatedAttributes.push(attr);
          return attr;
        });
      });

      if (leveledUp) {
        playLevelUpVFX();
        toast.success(`Level Up! Nível ${newLevel}!`);
      }
      
      const newStats = {
        ...prev,
        gold: Math.max(0, prev.gold + goldReward),
        xp: Math.max(0, newXp),
        level: newLevel,
        title: getRank(newLevel),
        completedTasks: xpReward > 0 ? prev.completedTasks + 1 : prev.completedTasks
      };

      // Check Achievements with NEW stats
      checkAchievements(newStats);

      // Sync to Supabase in background (including attributes)
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        const finalUserId = user?.id || '50bbc680-ac42-4409-b635-91350966be33';
        try {
          // Map attribute codes to profile columns
          const attributeMap: Record<AttributeCode, string> = {
            'STR': 'strength',
            'INT': 'intelligence',
            'DEX': 'dexterity',
            'WIS': 'wisdom',
            'VIT': 'vitality'
          };

          // Build update payload with all attributes
          const updatePayload: any = {
            xp: newStats.xp,
            level: newStats.level,
            gold: newStats.gold,
            hp: newStats.hp,
            updated_at: new Date().toISOString()
          };

          // Sempre sincroniza todos os atributos
          updatedAttributes.forEach(attr => {
            updatePayload[attributeMap[attr.code]] = attr.level;
          });

          const { error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', finalUserId);
          
          if (error) {
            console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
          }
        } catch (e) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
        }
      }).catch(e => console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2)));

      return newStats;
    });
  };

  const spendGold = (amount: number): boolean => {
    if (playerStats.gold < amount) return false;
    const newGold = playerStats.gold - amount;
    
    setPlayerStats(prev => ({ ...prev, gold: newGold }));
    syncProfileData({ gold: newGold }); 
    
    return true;
  };

  const healPlayer = (amount: number) => {
      setPlayerStats(prev => {
          const newHp = Math.min(prev.maxHp, prev.hp + amount);
          syncProfileData({ hp: newHp }); 
          return { ...prev, hp: newHp };
      });
  };

  const takeDamage = (amount: number) => {
      setPlayerStats(prev => {
          const newHp = prev.hp - amount;
          if (newHp <= 0) {
              const newStats = { ...prev, hp: 100, level: 1, title: getRank(1), xp: 0, currentStreak: 0 };
              syncProfileData({ hp: 100, level: 1, xp: 0 });
              return newStats;
          }
          
          syncProfileData({ hp: newHp });
          return { ...prev, hp: newHp };
      });
  };

  const updateDailyStreak = (success: boolean) => {
      setPlayerStats(prev => {
          let newStats;
          if (success) {
              newStats = { ...prev, currentStreak: prev.currentStreak + 1 };
          } else if (prev.isFrozen) {
              toast.info("Escudo de Estase Ativado!");
              newStats = { ...prev, isFrozen: false };
          } else {
              newStats = { ...prev, currentStreak: 0 };
          }
          
          syncProfileData({ 
            current_streak: newStats.currentStreak, 
            is_frozen: newStats.isFrozen 
          });
          
          return newStats;
      });
  };

  const activateShield = () => {
      setPlayerStats(prev => {
          syncProfileData({ is_frozen: true });
          return { ...prev, isFrozen: true };
      });
  };

  return (
    <GameContext.Provider value={{ playerStats, attributes, achievements: ACHIEVEMENTS, userAchievements, gainRewards, spendGold, healPlayer, takeDamage, updatePlayerProfile, updateDailyStreak, activateShield, equipTitle }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
}