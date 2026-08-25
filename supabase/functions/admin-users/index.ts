import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUserAuth, corsHeaders, forbidden } from "../_shared/auth.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const VALID_PLANS = ["free", "premium", "professional", "lifetime"];
const VALID_ROLES = ["user", "moderator", "admin", "super_admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireUserAuth(req, { requireAdmin: true });
    if (auth instanceof Response) return auth;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    const logAction = async (act: string, targetUserId: string | null, details: unknown) => {
      await admin.from("admin_audit_logs").insert({
        admin_id: auth.userId,
        action: act,
        target_user_id: targetUserId,
        details: details as never,
      });
    };

    if (action === "create") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const password = String(body?.password ?? "");
      const fullName = String(body?.full_name ?? "").trim();
      const phone = body?.phone_number ? String(body.phone_number).trim() : null;
      const plan = VALID_PLANS.includes(body?.plan) ? body.plan : "lifetime";
      const role = VALID_ROLES.includes(body?.role) ? body.role : "user";

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
        return json({ error: "E-mail inválido" }, 400);
      }
      if (password.length < 8 || password.length > 72) {
        return json({ error: "A senha deve ter entre 8 e 72 caracteres" }, 400);
      }
      if (fullName.length > 120) return json({ error: "Nome muito longo" }, 400);
      if (role === "super_admin" && !auth.isSuperAdmin) {
        return forbidden("Somente Super Admin pode criar outro Super Admin");
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, phone_number: phone },
      });
      if (createErr || !created?.user) {
        return json({ error: createErr?.message ?? "Falha ao criar usuário" }, 400);
      }

      const uid = created.user.id;

      await admin.from("profiles").update({
        full_name: fullName || null,
        phone_number: phone,
        plan,
      }).eq("id", uid);

      if (role !== "user") {
        await admin.from("user_roles").insert({ user_id: uid, role });
      }

      await logAction("user_created", uid, { email, plan, role });
      return json({ success: true, user_id: uid });
    }

    if (action === "reset_password") {
      const userId = String(body?.user_id ?? "");
      const password = String(body?.password ?? "");
      if (!userId) return json({ error: "user_id obrigatório" }, 400);
      if (password.length < 8 || password.length > 72) {
        return json({ error: "A senha deve ter entre 8 e 72 caracteres" }, 400);
      }

      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);

      await logAction("password_reset_by_admin", userId, {});
      return json({ success: true });
    }

    if (action === "delete") {
      if (!auth.isSuperAdmin) return forbidden("Somente Super Admin pode excluir contas");
      const userId = String(body?.user_id ?? "");
      if (!userId) return json({ error: "user_id obrigatório" }, 400);
      if (userId === auth.userId) return json({ error: "Você não pode excluir sua própria conta" }, 400);

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);

      await logAction("user_deleted", userId, {});
      return json({ success: true });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
