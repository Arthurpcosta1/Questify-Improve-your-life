import { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { supabase } from "../../utils/supabaseClient";
import { toast } from "sonner";

import avatar1 from '../../assets/images/avatar-1.png';
import avatar2 from '../../assets/images/avatar-2.png';
import avatar3 from '../../assets/images/avatar-3.png';
import avatar4 from '../../assets/images/avatar-4.png';

const avatarOptions = [
  { id: "1", src: avatar1 },
  { id: "2", src: avatar2 },
  { id: "3", src: avatar3 },
  { id: "4", src: avatar4 },
];

export function Settings() {
  const { playerStats, updatePlayerProfile } = useGame();

  const [displayName, setDisplayName] = useState(playerStats.name);
  const [selectedAvatar, setSelectedAvatar] = useState(playerStats.avatar || 'avatar1');

  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [animEnabled, setAnimEnabled] = useState(true);

  useEffect(() => {
    // load prefs from localStorage
    setSfxEnabled(localStorage.getItem("sfx") !== "false");
    setAnimEnabled(localStorage.getItem("animations") !== "false");
  }, []);

  const handleSaveProfile = async () => {
    await updatePlayerProfile(displayName, selectedAvatar);
    toast.success("Perfil atualizado");
  };

  const handleAvatarClick = (id: string) => {
    setSelectedAvatar(`avatar${id}`);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    localStorage.setItem("sfx", `${next}`);
  };

  const handleToggleAnim = () => {
    const next = !animEnabled;
    setAnimEnabled(next);
    localStorage.setItem("animations", `${next}`);
  };

  const handleReset = async () => {
    const result = window.confirm(
      "Atenção! Isso irá zerar seu Nível, XP, Ouro e restaurar seu HP para 100. Suas tarefas e histórico serão mantidos. Deseja prosseguir?"
    );
    if (!result) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ level: 1, xp: 0, gold: 0, hp: 100 })
          .eq("id", user.id);
        toast.success("Sistema resetado com sucesso.");
        window.location.reload();
      }
    } catch (e) {
      console.log('DETALHE DO ERRO 400:', JSON.stringify(e, null, 2));
      toast.error("Falha ao resetar o sistema.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Section */}
      <div className="bg-[#1a1a1a] border border-border/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Perfil do Caçador</h2>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <label className="w-full md:w-40 text-sm">Nome de Exibição</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Digite seu nome"
            />
            <Button onClick={handleSaveProfile} className="ml-auto">
              Salvar
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4">
            {avatarOptions.map((opt) => {
              const isActive = selectedAvatar === `custom:avatar:${opt.id}`;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleAvatarClick(opt.id)}
                  className={`p-3 rounded-lg bg-[#121212] hover:bg-[#222] transition-colors flex items-center justify-center ${
                    isActive ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <img src={opt.src} alt="avatar" className="w-6 h-6 object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-[#1a1a1a] border border-border/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Preferências do Sistema</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Efeitos Sonoros (SFX)</span>
            <Switch checked={sfxEnabled} onCheckedChange={handleToggleSfx} />
          </div>
          <div className="flex items-center justify-between">
            <span>Efeitos Visuais (Animações)</span>
            <Switch checked={animEnabled} onCheckedChange={handleToggleAnim} />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1a1a1a] border border-red-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Zona de Perigo</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Esta ação irá redefinir seu progresso de nível, XP, ouro e HP. Não é reversível!
        </p>
        <Button variant="destructive" onClick={handleReset}>
          Resetar Sistema
        </Button>
      </div>
    </div>
  );
}
