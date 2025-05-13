import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Instance {
  instancia: string;
  nome?: string;
  telefone?: string;
  status?: string;
  mensagem?: string;
}

interface InstanceSelectionDialogProps {
  instances: Instance[];
  open: boolean;
  onSelect: (instance: Instance) => void;
}

export function InstanceSelectionDialog({ instances, open, onSelect }: InstanceSelectionDialogProps) {
  const [selectedInstance, setSelectedInstance] = useState<string>("");

  const handleSelect = () => {
    const instance = instances.find(inst => inst.instancia === selectedInstance);
    if (instance) {
      onSelect(instance);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecione uma Instância</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select onValueChange={setSelectedInstance} value={selectedInstance}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma instância" />
            </SelectTrigger>
            <SelectContent>
              {instances.map((instance) => (
                <SelectItem key={instance.instancia} value={instance.instancia}>
                  {instance.instancia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSelect} disabled={!selectedInstance}>
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
