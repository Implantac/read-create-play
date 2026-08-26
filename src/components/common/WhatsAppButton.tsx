import { MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const WHATSAPP_NUMBER = "5543998581400";
const WHATSAPP_MESSAGE = encodeURIComponent("Olá! Gostaria de saber mais sobre o Titan Loterias.");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export function WhatsAppButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            bottom: "calc(1.5rem + env(safe-area-inset-bottom))",
            left: "calc(1.5rem + env(safe-area-inset-left))",
          }}
          className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white shadow-lg shadow-[hsl(142,70%,45%)/0.3] hover:shadow-[hsl(142,70%,45%)/0.5] flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="Suporte via WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="right">Suporte via WhatsApp</TooltipContent>
    </Tooltip>
  );
}
