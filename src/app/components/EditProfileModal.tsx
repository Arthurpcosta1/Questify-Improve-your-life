import React, { useState, useEffect, forwardRef } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Check } from 'lucide-react';

import avatar1 from '../../assets/images/avatar-1.png';
import avatar2 from '../../assets/images/avatar-2.png';
import avatar3 from '../../assets/images/avatar-3.png';
import avatar4 from '../../assets/images/avatar-4.png';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentAvatar: string;
  onSave: (name: string, avatar: string) => void;
}

// avatar files to choose from; id corresponds to final string 'avatar1' etc.
const AVATAR_OPTIONS = [
  { id: '1', src: avatar1 },
  { id: '2', src: avatar2 },
  { id: '3', src: avatar3 },
  { id: '4', src: avatar4 },
];

export const EditProfileModal = forwardRef<HTMLDivElement, EditProfileModalProps>(function EditProfileModal({ 
  open, 
  onOpenChange, 
  currentName, 
  currentAvatar, 
  onSave 
}: EditProfileModalProps, ref) {
  const [name, setName] = useState(currentName);
  // selectedAvatar will be string like 'avatar1','avatar2', etc.
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || 'avatar1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setSelectedAvatar(currentAvatar);
    }
  }, [open, currentName, currentAvatar]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    // Save only identifier string
    await onSave(name, selectedAvatar);
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border border-border/50 max-w-md p-6 text-foreground sm:rounded-xl">
        <DialogTitle className="text-xl font-bold text-center mb-2">Editar Ficha de Caçador</DialogTitle>
        <DialogDescription className="text-center text-muted-foreground mb-6">
          Personalize sua identidade no sistema.
        </DialogDescription>
        
        <div className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="hunter-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nome de Caçador
            </Label>
            <Input
              id="hunter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-accent/10 border-border/50 text-foreground h-11"
              placeholder="Digite seu nome..."
            />
          </div>

          {/* Avatar Selection */}
          <div className="space-y-3">
             <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Selecione um Avatar
            </Label>
            <div className="grid grid-cols-2 gap-4 justify-items-center">
                {AVATAR_OPTIONS.map((opt) => {
                    const avatarValue = `avatar${opt.id}`;
                    const isSelected = selectedAvatar === avatarValue;
                    
                    return (
                        <div 
                            key={opt.id}
                            onClick={() => setSelectedAvatar(avatarValue)}
                            className={`
                                relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-4 transition-all shadow-lg
                                ${isSelected 
                                    ? 'border-blue-500 ring-4 ring-blue-500/20 scale-105' 
                                    : 'border-transparent hover:border-white/20 hover:scale-105'}
                            `}
                        >
                            <img src={opt.src} alt="avatar" className="w-full h-full object-cover" />
                            
                            {isSelected && (
                                <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                                    <div className="bg-blue-600 rounded-full p-2 shadow-lg">
                                        <Check size={20} className="text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
          >
            {isSaving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
