import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { loadInventory, removeFromInventory } from '../../utils/supabaseTasks';
import { supabase } from '../../utils/supabaseClient';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { InventoryItem } from '../../utils/supabaseTasks';
import { Backpack, Droplet, Sparkles, Shield, AlertTriangle, Loader2 } from 'lucide-react';

export function Inventory() {
  const { playerStats, healPlayer } = useGame();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [equippedCosmeticId, setEquippedCosmeticId] = useState<string | null>(null);
  
  // Fixed user ID for development (no auth yet)
  const FIXED_USER_ID = '50bbc680-ac42-4409-b635-91350966be33';

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setIsLoading(true);
    try {
      // Load inventory with fixed user ID
      const items = await loadInventory(FIXED_USER_ID);
      setInventoryItems(items);

      // Load equipped cosmetic
      const { data: profile } = await supabase
        .from('profiles')
        .select('equipped_cosmetic_id')
        .eq('id', FIXED_USER_ID)
        .single();

      if (profile?.equipped_cosmetic_id) {
        setEquippedCosmeticId(profile.equipped_cosmetic_id);
      }
    } catch (e) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseItem = async (item: InventoryItem) => {
    try {
      const isConsumable = item.item_name.includes('Poção') || item.item_name.toLowerCase().includes('vida');

      if (isConsumable) {
        // Consumable: restore +20 HP, cap at 100
        const hpRestored = 20;
        const newHp = Math.min(playerStats.hp + hpRestored, 100);

        // Update HP in Supabase
        const { error } = await supabase
          .from('profiles')
          .update({
            hp: newHp,
            updated_at: new Date().toISOString()
          })
          .eq('id', FIXED_USER_ID);

        if (error) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
          toast.error('Erro ao usar poção!');
          return;
        }

        // Update local HP immediately
        healPlayer(hpRestored);

        // Optimistically update inventory state: decrement quantity or remove
        setInventoryItems((prev) =>
          prev
            .map((it) => (it.id === item.id ? { ...it, quantity: it.quantity - 1 } : it))
            .filter((it) => it.quantity > 0)
        );

        // Remove from Supabase inventory (decrements or deletes)
        await removeFromInventory(item.id, 1);

        // Log action
        await supabase.from('history_logs').insert({
          user_id: FIXED_USER_ID,
          action_type: 'Poção Utilizada',
          task_name: item.item_name,
          impact_value: `+${hpRestored} HP`,
          created_at: new Date().toISOString()
        });

        toast.success(`Item utilizado! Recuperaste ${hpRestored} de HP.`);
      } else {
        // Non-consumable (cosmetic/ticket): simple feedback for now
        const { error } = await supabase
          .from('profiles')
          .update({
            equipped_cosmetic_id: item.item_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', FIXED_USER_ID);

        if (error) {
          console.log('DETALHE DO ERRO 400:', JSON.stringify(error, null, 2));
          toast.error('Erro ao equipar item!');
          return;
        }

        setEquippedCosmeticId(item.item_id);

        await supabase.from('history_logs').insert({
          user_id: FIXED_USER_ID,
          action_type: 'Item Usado/Equipado',
          task_name: item.item_name,
          impact_value: 'Utilizado/Equipado',
          created_at: new Date().toISOString()
        });

        toast.success('Item equipado/utilizado com sucesso');
      }
    } catch (e) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
      toast.error('Erro ao usar item!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-400" size={32} />
          <p className="text-muted-foreground">Carregando mochila...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-[#1a1a1a] p-6 rounded-xl border border-border/50 shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex items-center gap-4 mb-4 md:mb-0 relative z-10">
          <div className="p-3 bg-purple-500/20 rounded-full border border-purple-500/30">
            <Backpack className="text-purple-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Saco de Itens</h2>
            <p className="text-sm text-muted-foreground">Seus itens coletados e adquiridos</p>
          </div>
        </div>

        <div className="flex items-center gap-8 relative z-10 bg-[#0f0f0f]/50 p-4 rounded-lg border border-border/50 backdrop-blur-sm">
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">Total de Itens</span>
            <div className="text-2xl font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
              {inventoryItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>

          <div className="h-10 w-px bg-border/50 hidden md:block"></div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">Únicos</span>
            <div className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              {inventoryItems.length}
            </div>
          </div>
        </div>
      </header>

      {/* Empty State */}
      {inventoryItems.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-border/30 rounded-xl bg-accent/5 flex flex-col items-center justify-center gap-3">
          <div className="p-4 bg-accent/10 rounded-full text-muted-foreground/50">
            <Backpack size={32} />
          </div>
          <div>
            <p className="font-medium text-foreground">Sua mochila está vazia</p>
            <p className="text-sm text-muted-foreground">Complete missões e compre itens na Loja para preencher sua mochila.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {inventoryItems.map((item) => {
            const isConsumable = item.item_name.includes('Poção') || item.item_name.toLowerCase().includes('vida');
            const isEquipped = equippedCosmeticId === item.item_id;

            return (
              <div 
                key={item.id}
                className="group relative bg-[#1a1a1a] border border-border/50 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-purple-500/30 flex flex-col h-full overflow-hidden"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                {/* Equipped Badge */}
                {isEquipped && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-1 z-20">
                    <Sparkles size={12} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400">Equipado</span>
                  </div>
                )}

                {/* Item Icon and Name */}
                <div className="mb-4 z-10 flex-1">
                  <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform origin-left duration-300">
                    {item.item_icon}
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 leading-snug">{item.item_name}</h4>
                  
                  {/* Item Type Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {isConsumable ? (
                      <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
                        <Droplet size={12} />
                        Consumível
                      </span>
                    ) : (
                      <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                        <Sparkles size={12} />
                        Cosmético
                      </span>
                    )}
                  </div>

                  {/* Quantity Badge */}
                  <div className="text-sm text-muted-foreground">
                    × <span className="font-bold text-foreground">{item.quantity}</span>
                  </div>
                </div>

                {/* Use Button */}
                <div className="mt-auto pt-4 border-t border-border/30 z-10">
                  <Button 
                    size="sm"
                    onClick={() => handleUseItem(item)}
                    className={`w-full text-xs h-10 transition-all ${
                      isConsumable
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20'
                        : isEquipped
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20'
                    }`}
                  >
                    {isConsumable ? '🧪 Usar' : isEquipped ? '✨ Equipado' : '⭐ Equipar'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips Section */}
      {inventoryItems.length > 0 && (
        <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 flex gap-3">
          <AlertTriangle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">💡 Dica:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Use Poções para restaurar HP durante o jogo</li>
              <li>Equipe itens de cosmético para personalizar seu perfil</li>
              <li>Cada item equipado reflete em seu avatar no ranking</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
