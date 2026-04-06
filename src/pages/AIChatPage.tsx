import { useState, useRef, useEffect, useCallback } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLearning } from "@/hooks/useUserLearning";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { MessageCircle, Send, Trash2, Sparkles, Bot, User, StopCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const QUICK_PROMPTS = [
  { emoji: "🔥", text: "Quais os números mais quentes?" },
  { emoji: "🎯", text: "Gere 5 jogos equilibrados" },
  { emoji: "📊", text: "Analise os padrões recentes" },
  { emoji: "❄️", text: "Quais números estão atrasados?" },
  { emoji: "🧮", text: "Explique a estratégia de fechamento" },
  { emoji: "🔄", text: "Como funciona a análise de ciclos?" },
  { emoji: "💡", text: "Me dê uma estratégia conservadora" },
  { emoji: "⚡", text: "Qual a melhor abordagem para hoje?" },
  { emoji: "❓", text: "Como usar o Titan Loterias?" },
];

async function streamChat({
  messages,
  lotteryId,
  userContext,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  messages: { role: string; content: string }[];
  lotteryId: string;
  userContext?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, lotteryId }),
      signal,
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        onError("⏳ Limite de requisições atingido. Aguarde alguns instantes.");
        return;
      }
      if (resp.status === 402) {
        onError("💳 Créditos de IA esgotados.");
        return;
      }
      onError(errData.error || "Erro ao conectar com a IA.");
      return;
    }

    if (!resp.body) { onError("Resposta vazia da IA."); return; }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Flush remaining
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name === "AbortError") {
      onDone();
      return;
    }
    onError(err.message || "Erro de conexão.");
  }
}

const AIChatPage = () => {
  const { config } = useLotteryContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const assistantBufferRef = useRef("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const copyMessage = useCallback((content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: msg, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    assistantBufferRef.current = "";

    const controller = new AbortController();
    abortRef.current = controller;

    const upsertAssistant = (chunk: string) => {
      assistantBufferRef.current += chunk;
      const content = assistantBufferRef.current;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        }
        return [...prev, { role: "assistant", content, timestamp: new Date() }];
      });
    };

    await streamChat({
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      lotteryId: config.id,
      onDelta: upsertAssistant,
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        toast.error(err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `❌ ${err}`, timestamp: new Date() },
        ]);
        setIsStreaming(false);
      },
      signal: controller.signal,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Chat com Titan IA"
        description="Converse com a IA para análises personalizadas e estratégias inteligentes"
        icon={MessageCircle}
        badge="STREAMING"
      />
      <LotteryContextBanner />

      <div className="flex flex-col h-[calc(100vh-280px)] border border-border rounded-xl bg-card overflow-hidden shadow-lg">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Olá! Sou o Titan IA 🎯</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                  Seu assistente especialista em loterias brasileiras. Pergunte sobre análises,
                  estratégias ou peça jogos personalizados.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Loteria atual: <span className="font-medium text-primary">{config.name}</span>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => sendMessage(prompt.text)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/30 transition-all duration-200 group"
                  >
                    <span className="mr-2">{prompt.emoji}</span>
                    <span className="group-hover:text-primary transition-colors">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>table]:text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "assistant" && !isStreaming && (
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <button
                      onClick={() => copyMessage(msg.content, i)}
                      className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1 rounded"
                      title="Copiar resposta"
                    >
                      {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-[10px] text-muted-foreground/40">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 mt-1">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border p-3 bg-background/80 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setMessages([]); stopStreaming(); }}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                title="Limpar conversa"
                disabled={isStreaming}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "Aguardando resposta..." : "Digite sua pergunta..."}
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button
                onClick={stopStreaming}
                size="icon"
                variant="destructive"
                className="shrink-0"
                title="Parar geração"
              >
                <StopCircle className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            Titan IA pode cometer erros. Loterias são jogos de azar — jogue com responsabilidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
