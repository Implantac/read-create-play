import { useState } from "react";
import { Share2, Copy, Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { LotteryConfig } from "@/data/lotteries";

interface ShareBetButtonProps {
  numbers: number[];
  config: LotteryConfig;
  strategy?: string | null;
  grade?: string | null;
  compact?: boolean;
}

export function ShareBetButton({ numbers, config, strategy, grade, compact }: ShareBetButtonProps) {
  const [copied, setCopied] = useState(false);

  const buildText = () => {
    const nums = numbers.map(n => String(n).padStart(2, "0")).join(" - ");
    let text = `🎰 *${config.name}* ${config.icon}\n📋 Números: ${nums}`;
    if (strategy) text += `\n📊 Estratégia: ${strategy}`;
    if (grade) text += `\n⭐ Nota: ${grade}`;
    text += `\n\n⚡ Gerado por Titan Loterias`;
    return text;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(buildText());
    setCopied(true);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(buildText())}`;
    window.open(url, "_blank");
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?text=${encodeURIComponent(buildText())}`;
    window.open(url, "_blank");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${config.name} - Aposta`, text: buildText() });
      } catch { /* cancelled */ }
    } else {
      copyToClipboard();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyToClipboard} className="gap-2 cursor-pointer">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          Copiar texto
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareWhatsApp} className="gap-2 cursor-pointer">
          <MessageCircle className="h-4 w-4 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTelegram} className="gap-2 cursor-pointer">
          <Send className="h-4 w-4 text-blue-400" />
          Telegram
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem onClick={nativeShare} className="gap-2 cursor-pointer">
            <Share2 className="h-4 w-4" />
            Mais opções...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
