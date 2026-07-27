import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY =
  "BPH-r2jPrjJSEahvHakbzHzeODC3IC-pj3jliv28I4G_OKpG24Oy8FSkBPxt0QR6BdyJkc6E5O6vb1tNt_WIlBo";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Std = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Std);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bufToB64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export type PushCategories = {
  draws: boolean;
  results: boolean;
  closings: boolean;
  system: boolean;
};

const DEFAULT_CATS: PushCategories = { draws: true, results: true, closings: true, system: true };

export function usePushSubscription() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<PushCategories>(DEFAULT_CATS);

  const refresh = useCallback(async () => {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const sub = await reg?.pushManager.getSubscription();
      setIsSubscribed(!!sub);
      if (sub) {
        const { data } = await supabase
          .from("push_subscriptions")
          .select("categories")
          .eq("endpoint", sub.endpoint)
          .maybeSingle();
        if (data?.categories) setCategories({ ...DEFAULT_CATS, ...(data.categories as any) });
      }
    } catch (e) {
      console.warn("[push] refresh failed", e);
    }
  }, [supported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!supported) {
      toast.error("Seu navegador não suporta notificações push.");
      return false;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Permissão negada para notificações.");
        return false;
      }

      const reg =
        (await navigator.serviceWorker.getRegistration("/push-sw.js")) ||
        (await navigator.serviceWorker.register("/push-sw.js", { scope: "/" }));

      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      }

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        toast.error("Faça login para ativar notificações.");
        return false;
      }

      const p256dh = bufToB64(sub.getKey("p256dh"));
      const auth = bufToB64(sub.getKey("auth"));

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: uid,
          endpoint: sub.endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          categories,
          enabled: true,
        },
        { onConflict: "endpoint" }
      );
      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Notificações push ativadas!");
      return true;
    } catch (e: any) {
      console.error("[push] subscribe failed", e);
      toast.error("Falha ao ativar push: " + (e?.message || "erro desconhecido"));
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported, categories]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      toast.success("Notificações push desativadas.");
    } catch (e: any) {
      toast.error("Erro ao desativar: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const updateCategories = useCallback(
    async (next: PushCategories) => {
      setCategories(next);
      if (!supported || !isSubscribed) return;
      const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return;
      await supabase
        .from("push_subscriptions")
        .update({ categories: next })
        .eq("endpoint", sub.endpoint);
    },
    [supported, isSubscribed]
  );

  const sendTest = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-push", {
        body: { test: true },
      });
      if (error) throw error;
      toast.success("Notificação de teste enviada.");
    } catch (e: any) {
      toast.error("Falha no teste: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supported,
    isSubscribed,
    loading,
    categories,
    subscribe,
    unsubscribe,
    updateCategories,
    sendTest,
    refresh,
  };
}
