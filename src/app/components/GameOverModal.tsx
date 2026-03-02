//oi

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { AlertTriangle, Skull } from "lucide-react";

interface GameOverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameOverModal({ open, onOpenChange }: GameOverModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-red-950/90 border-red-500/50 text-red-100 max-w-md text-center">
        <DialogHeader className="flex flex-col items-center gap-4">
          <div className="p-4 bg-red-500/20 rounded-full border border-red-500/50 animate-pulse">
            <Skull size={48} className="text-red-500" />
          </div>
          <DialogTitle className="text-2xl font-bold text-red-500 uppercase tracking-widest">
            Falha Crítica
          </DialogTitle>
          <DialogDescription className="text-red-200/80 text-lg">
            Você não sobreviveu à Zona de Punição.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
           <p className="font-mono text-sm bg-black/40 p-3 rounded border border-red-900/50">
             SYSTEM_ALERT: VITAL_SIGNS_CRITICAL
             <br/>
             INITIATING_EMERGENCY_RESET...
           </p>
           
           <div className="flex items-center justify-center gap-2 text-red-300 font-semibold mt-4">
              <AlertTriangle size={18} />
              <span>Penalidade Aplicada: -1 Nível Global</span>
           </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={() => onOpenChange(false)}
            variant="destructive"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold tracking-wider"
          >
            ACEITAR PUNIÇÃO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
