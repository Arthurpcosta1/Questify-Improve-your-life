import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { useGame } from "../context/GameContext";
import { Coins, Edit2, Flame, Shield, Trophy } from "lucide-react";
import { EditProfileModal } from "./EditProfileModal";
import { AchievementsModal } from "./AchievementsModal"; // New Import
import avatar1 from '../../assets/images/avatar-1.png';
import avatar2 from '../../assets/images/avatar-2.png';
import avatar3 from '../../assets/images/avatar-3.png';
import avatar4 from '../../assets/images/avatar-4.png';

const avatarMap: { [key: string]: string } = {
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  default: avatar1,
};

export function PlayerProfile() {
  const { playerStats, attributes, updatePlayerProfile } = useGame();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false); // New State

  // Prepare data for Radar Chart
  const chartData = attributes.map((attr) => ({
    subject: attr.code,
    A: attr.level,
    fullMark: 20, // Arbitrary max value for the chart scale
  }));

  const handleSaveProfile = async (name: string, avatar: string) => {
    await updatePlayerProfile(name, avatar);
    setIsEditModalOpen(false);
  };

  // avatar stored as identifier 'avatar1' etc.
  const avatarKey = playerStats.avatar || 'default';
  const avatarUrl = avatarMap[avatarKey] || avatarMap.default;

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-border/50 p-4 md:p-6 space-y-6 md:space-y-8 relative group/profile">
       {/* Top Controls */}
       <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col md:flex-row items-end md:items-center gap-3 z-10">
          
          {/* Achievements Button */}
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="flex items-center gap-2 bg-black/40 hover:bg-yellow-500/10 border border-border/50 hover:border-yellow-500/50 px-3 py-1.5 rounded-full transition-all group/ach"
          >
              <Trophy className="text-gray-400 group-hover/ach:text-yellow-500 transition-colors" size={16} />
              <span className="text-xs font-bold text-gray-400 group-hover/ach:text-yellow-100 hidden md:inline">Conquistas</span>
          </button>

          {/* Gold Display */}
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
             <Coins className="text-yellow-400" size={16} />
             <span className="text-sm font-bold text-yellow-400">{playerStats.gold} Ouro</span>
          </div>
       </div>

      {/* Clickable Header for Edit */}
      <div 
        onClick={() => setIsEditModalOpen(true)}
        className="flex flex-col md:flex-row gap-6 items-start md:items-center cursor-pointer hover:bg-accent/5 p-2 -m-2 rounded-lg transition-colors relative"
        title="Clique para editar perfil"
      >
        {/* Hover Edit Indicator REMOVIDO */}
        {/* Ícone de editar foto removido */}

        {/* Avatar Logic */}
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-blue-500/20 shadow-xl shadow-blue-900/20 overflow-hidden relative bg-[#1a1a1a] transition-transform group-hover/profile:scale-105 shrink-0">
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="flex-1 w-full space-y-4 max-w-2xl mt-4 md:mt-0">
          <div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3 mb-1">
              <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover/profile:text-blue-400 transition-colors">
                {playerStats.name}
              </h2>
              <span className="text-xs md:text-sm font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-fit">
                {playerStats.title}
              </span>
              
              {/* Equipped Title Display (New) */}
              {playerStats.equippedTitle && (
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-yellow-400 bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-500/30 animate-in fade-in slide-in-from-left-4">
                      {playerStats.equippedTitle}
                  </span>
              )}
              
              {/* Streak Display */}
              <div className="flex items-center gap-2 md:ml-4">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${
                      playerStats.currentStreak >= 3 
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                        : 'bg-muted/10 border-muted/30 text-muted-foreground'
                  }`}>
                      <Flame size={14} className={playerStats.currentStreak >= 3 ? 'fill-orange-400' : ''} />
                      <span className="text-xs font-bold">{playerStats.currentStreak} Dias</span>
                  </div>

                  {playerStats.isFrozen && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded border bg-blue-500/10 border-blue-500/30 text-blue-400" title="Proteção de Combo Ativa">
                          <Shield size={14} className="fill-blue-400/20" />
                      </div>
                  )}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-2 mt-2">
              Nível {playerStats.level}
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
              <span className="text-green-500/80">Online</span>
            </p>
          </div>

          {/* Barras de Status Globais */}
          <div className="grid gap-3 max-w-md w-full">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-blue-400">EXP</span>
                <span className="text-muted-foreground">{playerStats.xp}%</span>
              </div>
              <Progress
                value={playerStats.xp}
                className="h-2 bg-accent/30"
                indicatorClassName="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-red-400">HP</span>
                <span className="text-muted-foreground">
                  {playerStats.hp}/{playerStats.maxHp}
                </span>
              </div>
              <Progress
                value={(playerStats.hp / playerStats.maxHp) * 100}
                className="h-2 bg-accent/30"
                indicatorClassName="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Parte Inferior: Status do Sistema */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6 border-b border-border/50 pb-2">
          Status do Sistema
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Coluna Esquerda: Lista de Atributos */}
          <div className="space-y-5">
            {attributes.map((attr) => (
              <div key={attr.id} className="group">
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className={`p-2 rounded-md bg-accent/10 ${attr.color} group-hover:bg-accent/20 transition-colors`}
                  >
                    <attr.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">
                        {attr.label}
                      </span>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {attr.code} <span className="text-blue-400">{attr.level}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pl-[52px]">
                   <Progress
                    value={attr.xp}
                    className="h-1.5 bg-accent/20"
                    indicatorClassName={attr.barColor}
                  />
                  <div className="text-[10px] text-right text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {attr.xp}% para o próximo nível
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coluna Direita: Radar Chart (Hidden on Mobile) */}
          <div className="h-[300px] w-full hidden md:flex items-center justify-center relative">
            {/* Background glow effect */}
             <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
            
            <ResponsiveContainer width="100%" height={250} minHeight={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#333" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 20]} // You might want to make this dynamic or sufficiently large
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Atributos"
                  dataKey="A"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <EditProfileModal 
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        currentName={playerStats.name}
        currentAvatar={playerStats.avatar}
        onSave={handleSaveProfile}
      />

      <AchievementsModal 
        open={isAchievementsOpen}
        onOpenChange={setIsAchievementsOpen}
      />
    </div>
  );
}
