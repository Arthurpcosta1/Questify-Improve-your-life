import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export interface NewRewardData {
  title: string;
  cost: number;
  icon: string;
  description?: string;
}

interface NewRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateReward: (reward: NewRewardData) => void;
}

export function NewRewardModal({ open, onOpenChange, onCreateReward }: NewRewardModalProps) {
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(500);
  const [icon, setIcon] = useState("🍔");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
        toast.error("Preencha o título da recompensa");
        return;
    }
    onCreateReward({ title, cost, icon, description });
    // Reset
    setTitle("");
    setCost(500);
    setIcon("🍔");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-border/50 text-foreground max-w-lg p-0 overflow-hidden">
        {/* Visually Hidden Title and Description for Accessibility */}
        <DialogTitle className="sr-only">Nova Recompensa</DialogTitle>
        <DialogDescription className="sr-only">
          Crie um novo item de recompensa para comprar com seu ouro.
        </DialogDescription>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="p-6 space-y-6">
             {/* Header Section */}
             <div className="flex items-start gap-4">
                 {/* Icon Input */}
                 <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center border border-border/50 relative group cursor-pointer overflow-hidden">
                        <Input
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            className="absolute inset-0 w-full h-full text-center text-3xl bg-transparent border-none focus-visible:ring-0 p-0 cursor-pointer"
                            maxLength={2}
                            title="Escolha um emoji"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-white font-medium">EDIT</span>
                        </div>
                    </div>
                 </div>

                 {/* Title Input */}
                 <div className="flex-1 space-y-1">
                     <Label htmlFor="title" className="sr-only">Título</Label>
                     <Input
                        id="title"
                        placeholder="Título da Recompensa..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-2xl font-bold border-none px-0 py-2 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40 bg-transparent rounded-none shadow-none"
                     />
                     <div className="h-px bg-border/50 w-full" />
                 </div>
             </div>

             {/* Cost Input */}
             <div className="space-y-2">
                 <Label htmlFor="cost" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Custo em Ouro
                 </Label>
                 <div className="relative">
                    <Input
                        id="cost"
                        type="number"
                        min={1}
                        value={cost}
                        onChange={(e) => setCost(Number(e.target.value))}
                        className="pl-10 bg-[#0f0f0f] border-border/50 text-yellow-500 font-bold text-lg h-12"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 text-lg">
                        🪙
                    </div>
                 </div>
             </div>

             {/* Description Input */}
             <div className="space-y-2">
                 <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Descrição (Opcional)
                 </Label>
                 <Textarea
                    id="description"
                    placeholder="Adicione detalhes sobre sua recompensa..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-[#0f0f0f] border-border/50 min-h-[100px] resize-none"
                 />
             </div>
          </div>

          {/* Footer */}
          <div className="bg-[#151515] p-4 flex justify-end gap-3 border-t border-border/50">
             <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="hover:bg-accent/20 text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2 px-6"
            >
              Criar Recompensa
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
