import { supabase } from './supabaseClient';
import { HabitData } from '../app/components/HabitControl';
import { Habit } from '../app/components/DailyHabits';
import { MissionCardProps } from '../app/components/MissionCard';

// Função para resetar flag de conclusão das diárias ao detectar novo dia
export async function resetDailyQuestsIfNeeded(userId: string): Promise<void> {
  try {
    const lastResetKey = `lastDailyReset_${userId}`;
    const lastReset = localStorage.getItem(lastResetKey);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10); // yyyy-mm-dd

    if (lastReset === todayStr) return; // Já resetou hoje

    // Resetar todas as diárias para não concluídas
    await supabase
      .from('quests')
      .update({ is_completed: false })
      .eq('user_id', userId)
      .eq('type', 'daily'); // <-- CORREÇÃO: 'type' em vez de 'quest_type'

    localStorage.setItem(lastResetKey, todayStr);
  } catch (e) {
    console.log('DETALHE DO ERRO 400: resetDailyQuestsIfNeeded', JSON.stringify(e, null, 2));
  }
}

// ============================================================================
// HABITS
// ============================================================================

export async function loadHabits(userId: string): Promise<HabitData[]> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return [];
    }

    return data?.map((h: any) => ({
      id: h.id,
      title: h.title,
      attribute: h.attribute,
      rank: (h.rank as any) || 'C',
      direction: (h.direction as any) || 'positive',
      type: h.type || 'habit',
      streak: h.streak ?? 0
    })) || [];
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return [];
  }
}

export async function createHabit(
  userId: string,
  habit: HabitData
): Promise<HabitData | null> {
  try {
    let finalUserId = userId;
    if (!finalUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        finalUserId = authData?.user?.id || '';
      } catch (e) {
        console.log('DETALHE DO ERRO 400: createHabit: failed to retrieve user from supabase.auth', JSON.stringify(e, null, 2));
      }
    }

    if (!finalUserId) {
      finalUserId = '50bbc680-ac42-4409-b635-91350966be33';
      console.warn('createHabit: userId missing, using fallback id', finalUserId);
    }

    const payload: any = {
      title: habit.title,
      type: 'habit',
      attribute: habit.attribute,
      streak: 0,
      user_id: finalUserId
    };

    const { data, error } = await supabase
      .from('habits')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return null;
    }

    return data ? {
      id: data.id,
      title: data.title,
      attribute: data.attribute,
      rank: data.rank,
      direction: data.direction
    } : null;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return null;
  }
}

export async function updateHabit(habitId: string, updates: Partial<HabitData>): Promise<boolean> {
  try {
    const payload: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.attribute !== undefined) payload.attribute = updates.attribute;
    if (updates.rank !== undefined) payload.rank = updates.rank;
    if (updates.direction !== undefined) payload.direction = updates.direction;
    if ((updates as any).type !== undefined) payload.type = String((updates as any).type);

    const { error } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', habitId);

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return false;
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

export async function deleteHabit(habitId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return false;
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

// ============================================================================
// QUESTS (Daily + One-Time Missions)
// ============================================================================

export async function loadQuests(userId: string): Promise<{
  dailies: Habit[];
  missions: MissionCardProps[];
}> {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return { dailies: [], missions: [] };
    }

    const dailies: Habit[] = [];
    const missions: MissionCardProps[] = [];

    data?.forEach((q: any) => {
      // <-- CORREÇÃO: lendo q.type em vez de q.quest_type
      if (q.type === 'daily') {
        dailies.push({
          id: q.id,
          title: q.title,
          completed: q.is_completed || false,
          attribute: q.attribute,
          xp: q.reward_xp || 40,
          gold: q.reward_gold || 20,
          repeatDays: q.repeat_days || [0, 1, 2, 3, 4, 5, 6]
        });
      } else if (q.type === 'mission') {
        missions.push({
          id: q.id,
          title: q.title,
          description: q.description || '',
          attribute: q.attribute,
          rank: q.difficulty || 'C',
          deadline: q.deadline,
          subtasks: q.subtasks || [],
          xp: q.reward_xp || 40,
          gold: q.reward_gold || 20
        } as MissionCardProps);
      }
    });

    return { dailies, missions };
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return { dailies: [], missions: [] };
  }
}

export async function createQuest(
  userId: string,
  questType: 'daily' | 'mission',
  quest: Habit | MissionCardProps
): Promise<boolean> {
  try {
    let finalUserId = userId || '';
    if (!finalUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        finalUserId = authData?.user?.id || '';
      } catch (e) {
        console.log('DETALHE DO ERRO 400: createQuest: failed to retrieve user from supabase.auth', JSON.stringify(e, null, 2));
      }
    }
    if (!finalUserId) {
      finalUserId = '50bbc680-ac42-4409-b635-91350966be33';
      console.warn('createQuest: userId missing, using fallback id', finalUserId);
    }

    if (questType === 'daily') {
      const daily = quest as Habit;
      const payload: any = {
        title: daily.title,
        difficulty: (daily as any).rank || 'C',
        is_completed: daily.completed || false,
        type: 'daily',
        reward_xp: daily.xp || 40,
        reward_gold: daily.gold || 20,
        user_id: finalUserId
      };

      const { error } = await supabase.from('quests').insert(payload);
      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    } else {
      const mission = quest as MissionCardProps;
      const payload: any = {
        title: mission.title,
        difficulty: mission.rank || 'C',
        is_completed: false,
        type: 'mission',
        reward_xp: (mission as any).xp || 40,
        reward_gold: (mission as any).gold || 20,
        user_id: finalUserId
      };

      const { error } = await supabase.from('quests').insert(payload);
      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

export async function updateQuest(
  questId: string,
  questType: 'daily' | 'mission',
  updates: Partial<Habit | MissionCardProps>
): Promise<boolean> {
  try {
    if (questType === 'daily') {
      const daily = updates as Partial<Habit>;
      const { error } = await supabase
        .from('quests')
        .update({
          title: daily.title,
          attribute: daily.attribute,
          reward_xp: (daily as any).xp,
          reward_gold: (daily as any).gold,
          is_completed: daily.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', questId);

      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    } else {
      const mission = updates as Partial<MissionCardProps>;
      const { error } = await supabase
        .from('quests')
        .update({
          title: mission.title,
          description: mission.description,
          attribute: mission.attribute,
          difficulty: mission.rank,   
          deadline: mission.deadline,
          reward_xp: (mission as any).xp,
          reward_gold: (mission as any).gold,
          updated_at: new Date().toISOString()
        })
        .eq('id', questId);

      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

export async function updateQuestCompletion(questId: string, isCompleted: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quests')
      .update({
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', questId);

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return false;
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

export async function deleteQuest(questId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId);

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return false;
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

// ============================================================================
// INVENTORY
// ============================================================================

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  item_icon: string;
  quantity: number;
  purchased_at: string;
}

export async function loadInventory(userId: string): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return [];
  }
}

export async function addToInventory(
  userId: string,
  itemId: string,
  itemName: string,
  itemIcon: string,
  quantity: number = 1
): Promise<boolean> {
  try {
    const { data: existing, error: selectError } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId);

    if (selectError && selectError.code !== 'PGRST116') {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(selectError, null, 2));
      return false;
    }

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: existing[0].quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing[0].id);

      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    } else {
      const { error } = await supabase
        .from('inventory')
        .insert({
          user_id: userId,
          item_id: itemId,
          item_name: itemName,
          item_icon: itemIcon,
          quantity: quantity,
          purchased_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

export async function removeFromInventory(
  inventoryId: string,
  quantityToRemove: number = 1
): Promise<boolean> {
  try {
    const { data: item } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', inventoryId)
      .single();

    if (!item) {
      console.log('DETALHE DO ERRO 400: Inventory item not found');
      return false;
    }

    const newQuantity = item.quantity - quantityToRemove;

    if (newQuantity <= 0) {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', inventoryId);

      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    } else {
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryId);

      if (error) {
        console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        return false;
      }
    }

    return true;
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return false;
  }
}

// ============================================================================
// BATCH OPERATIONS (for initial load)
// ============================================================================

export async function loadAllGameData(userId: string) {
  try {
    const [habitsData, questsData, inventoryData] = await Promise.all([
      loadHabits(userId),
      loadQuests(userId),
      loadInventory(userId)
    ]);

    return {
      habits: habitsData,
      dailies: questsData.dailies,
      missions: questsData.missions,
      inventory: inventoryData
    };
  } catch (e) {
    console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    return {
      habits: [],
      dailies: [],
      missions: [],
      inventory: []
    };
  }
}