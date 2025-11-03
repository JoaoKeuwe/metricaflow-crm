import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SoundControlsProps {
  isMuted: boolean;
  volume: number;
  onMuteToggle: () => void;
  onVolumeChange: (value: number) => void;
}

export function SoundControls({
  isMuted,
  volume,
  onMuteToggle,
  onVolumeChange,
}: SoundControlsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-50 bg-card/80 backdrop-blur-sm"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Efeitos Sonoros</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMuteToggle}
            >
              {isMuted ? "Ativar" : "Desativar"}
            </Button>
          </div>
          
          {!isMuted && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Volume</label>
              <Slider
                value={[volume * 100]}
                onValueChange={([value]) => onVolumeChange(value / 100)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
