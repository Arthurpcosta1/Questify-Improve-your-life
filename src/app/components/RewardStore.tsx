import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Coins, ShoppingBag, Plus, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { NewRewardModal, NewRewardData } from './NewRewardModal';
import { supabase } from '../../utils/supabaseClient';
import { addToInventory } from '../../utils/supabaseTasks';

export interface RewardItem {
  id: string;
  title: string;
  cost: number;
  icon: string; // Emoji or Lucide Icon Name
  description?: string;
  isSystem?: boolean;
  type?: 'heal' | 'reroll' | 'custom' | 'stasis';
}

interface RewardStoreProps {
  personalRewards: RewardItem[];
  onAddReward: (reward: RewardItem) => void;
  onDeleteReward: (id: string) => void;
  userId?: string; // Add userId prop to log purchases
}

export function RewardStore({ personalRewards, onAddReward, onDeleteReward, userId }: RewardStoreProps) {
  const { playerStats, spendGold, healPlayer, activateShield } = useGame();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fixed user ID for development (no auth yet)
  const FIXED_USER_ID = '50bbc680-ac42-4409-b635-91350966be33';

  // Updated Buy Handler with History Logging
  const handlePurchase = async (item: RewardItem) => {
    // Determine the item to buy
    const itemToBuy = item.isSystem 
        ? item 
        : personalRewards.find(r => r.id === item.id);

    if (!itemToBuy) return;

    // Validation
    if (playerStats.gold >= itemToBuy.cost) {
        // Additional Check for Shield
        if (itemToBuy.type === 'stasis' && playerStats.isFrozen) {
            toast.error("Você já possui um Cristal de Estase ativo!");
            return;
        }

        // Success
        spendGold(itemToBuy.cost);
        toast.success("Recompensa resgatada! Aproveite.");
        
        // Effects
        if (itemToBuy.type === 'heal') {
            healPlayer(50);
        } else if (itemToBuy.type === 'reroll') {
            toast.info("Ticket de Reroll adquirido (funcionalidade futura)");
        } else if (itemToBuy.type === 'stasis') {
            activateShield();
            toast.info("Cristal de Estase Ativado! Seu combo está protegido por 1 dia.");
        }

        // Log purchase in history_logs table and add to inventory
        try {
          // Always use fixed user ID for inventory
          await addToInventory(FIXED_USER_ID, itemToBuy.id, itemToBuy.title, itemToBuy.icon, 1);
          
          // Log purchase in history_logs
          const { error } = await supabase
            .from('history_logs')
            .insert({
              action_type: 'Compra no Mercado',
              task_name: itemToBuy.title,
              impact_value: `-${itemToBuy.cost} 🪙`,
              user_id: FIXED_USER_ID,
              created_at: new Date().toISOString()
            });

          if (error) {
            console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
          }
        } catch (error) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
        }
    } else {
        // Block / Error
        toast.error("Ouro insuficiente. Complete mais missões!");
    }
  };

  const handleCreateReward = (data: NewRewardData) => {
      const newReward: RewardItem = {
          id: Date.now().toString(),
          title: data.title,
          cost: data.cost,
          icon: data.icon,
          description: data.description,
          isSystem: false,
          type: 'custom'
      };
      onAddReward(newReward);
      setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Wallet Header */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-[#1a1a1a] p-6 rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
         
         <div className="flex items-center gap-4 mb-4 md:mb-0 relative z-10">
             <div className="p-3 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                 <ShoppingBag className="text-yellow-400" size={28} />
             </div>
             <div>
                 <h2 className="text-2xl font-bold text-foreground">Loja de Recompensas</h2>
                 <p className="text-sm text-muted-foreground">Troque seu ouro por prêmios reais e virtuais</p>
             </div>
         </div>

         <div className="flex items-center gap-8 relative z-10 bg-[#0f0f0f]/50 p-4 rounded-lg border border-border/50 backdrop-blur-sm">
             <div className="text-right">
                 <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">Saldo Atual</span>
                 <div className="flex items-center justify-end gap-2 text-2xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                     <Coins size={24} className="fill-yellow-400/20" />
                     <span>{playerStats.gold}</span>
                 </div>
             </div>

             <div className="h-10 w-px bg-border/50 hidden md:block"></div>

             <div className="text-right opacity-70 group relative cursor-help">
                 <div className="flex items-center gap-2 mb-1 justify-end">
                    <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">EM BREVE</span>
                 </div>
                 <div className="flex items-center justify-end gap-2 text-xl font-bold text-blue-300/50">
                     <span className="grayscale opacity-50">💎</span>
                     <span>0</span>
                 </div>
             </div>
         </div>
      </header>

      {/* 2. Controls */}
      <div className="flex justify-between items-end border-b border-border/50 pb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Recompensas Pessoais
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Itens que você define para se presentear</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-transform active:scale-95"
          >
              <Plus size={16} />
              Criar Recompensa
          </Button>
      </div>

      {/* 3. Personal Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {personalRewards.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-border/30 rounded-xl bg-accent/5 flex flex-col items-center justify-center gap-3">
                  <div className="p-4 bg-accent/10 rounded-full text-muted-foreground/50">
                    <ShoppingBag size={32} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sua lista está vazia</p>
                    <p className="text-sm">Use o botão acima para criar seu primeiro prêmio.</p>
                  </div>
              </div>
          ) : (
              personalRewards.map((reward) => (
                  <RewardCard 
                    key={reward.id} 
                    item={reward} 
                    canAfford={playerStats.gold >= reward.cost}
                    onBuy={() => handlePurchase(reward)}
                    onDelete={() => onDeleteReward(reward.id)}
                  />
              ))
          )}
      </div>

      {/* 4. System Items Section */}
      <div className="pt-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Itens do Sistema
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Consumíveis para ajudar na sua jornada</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <RewardCard 
                  item={{
                      id: 'sys_potion',
                      title: 'Poção de Vida',
                      cost: 50,
                      icon: '🧪',
                      description: 'Recupera 50 HP instantaneamente.',
                      isSystem: true,
                      type: 'heal'
                  }}
                  canAfford={playerStats.gold >= 50}
                  onBuy={() => handlePurchase({ id: 'sys_potion', title: 'Poção de Vida', cost: 50, icon: '🧪', description: 'Recupera 50 HP instantaneamente.', isSystem: true, type: 'heal' })}
              />
               <RewardCard 
                  item={{
                      id: 'sys_reroll',
                      title: 'Ticket de Reroll',
                      cost: 100,
                      icon: '🎟️',
                      description: 'Troca uma missão diária aleatória.',
                      isSystem: true,
                      type: 'reroll'
                  }}
                  canAfford={playerStats.gold >= 100}
                  onBuy={() => handlePurchase({ id: 'sys_reroll', title: 'Ticket de Reroll', cost: 100, icon: '🎟️', description: 'Troca uma missão diária aleatória.', isSystem: true, type: 'reroll' })}
              />
              <RewardCard 
                  item={{
                      id: 'sys_stasis',
                      title: 'Cristal de Estase',
                      cost: 300,
                      icon: '🛡️', // Shield emoji as requested by prompt logic, or lucid icon in code? Using emoji for consistency with card.
                      description: 'Congela o Combo por 1 dia. Previne reset em caso de falha.',
                      isSystem: true,
                      type: 'stasis'
                  }}
                  canAfford={playerStats.gold >= 300}
                  onBuy={() => handlePurchase({ id: 'sys_stasis', title: 'Cristal de Estase', cost: 300, icon: '🛡️', description: 'Congela o Combo por 1 dia. Previne reset em caso de falha.', isSystem: true, type: 'stasis' })}
              />
          </div>
      </div>

      <NewRewardModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onCreateReward={handleCreateReward}
      />
    </div>
  );
}

// --- Subcomponent: Reward Card ---

interface RewardCardProps {
    item: RewardItem;
    canAfford: boolean;
    onBuy: () => void;
    onDelete?: () => void;
}

function RewardCard({ item, canAfford, onBuy, onDelete }: RewardCardProps) {
    // Only show delete button for personal items
    const showDelete = !item.isSystem && onDelete;

    return (
        <div className="group relative bg-[#1a1a1a] border border-border/50 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-yellow-500/30 flex flex-col h-full overflow-hidden">
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Delete Button (Top Right) */}
            {showDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Remover recompensa"
                >
                    <Plus size={16} className="rotate-45" />
                </button>
            )}

            <div className="mb-4 z-10 flex-1">
                <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform origin-left duration-300">{item.icon}</div>
                <h4 className="font-semibold text-foreground mb-1 leading-snug">{item.title}</h4>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
            </div>

            <div className="mt-auto pt-4 border-t border-border/30 flex items-center justify-between z-10 gap-3">
                <div className={`flex items-center gap-1.5 font-bold font-mono ${canAfford ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    <Coins size={16} className={canAfford ? 'fill-yellow-400/20' : ''} />
                    <span>{item.cost}</span>
                </div>
                
                <Button 
                    size="sm" 
                    // REMOVED disabled={!canAfford} to allow click interaction for error toast
                    onClick={onBuy}
                    className={`
                        text-xs px-3 h-8
                        ${canAfford 
                            ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20' 
                            : 'bg-accent/50 text-muted-foreground hover:bg-accent/50'} 
                        transition-all
                    `}
                >
                    {canAfford ? 'Comprar' : 'Saldo Insuficiente'}
                </Button>
            </div>
        </div>
    );
}