# E2E Tests — Titan Loterias

Testes E2E com Playwright que validam navegação e o fallback offline do Service Worker **na versão publicada**.

O Service Worker é intencionalmente desativado em dev/preview do Lovable (ver `src/pwa/registerSW.ts`), então estes testes só fazem sentido contra a URL publicada.

## Como rodar

```bash
# Instalar (uma vez)
npm i -D @playwright/test
npx playwright install chromium

# Rodar contra a versão publicada padrão
npm run test:e2e

# Ou apontando para outra URL publicada
E2E_BASE_URL=https://titanloterias.lovable.app npm run test:e2e
```

## Cobertura

- `navigation.spec.ts` — navega entre `/`, `/login`, `/planos`, `/install`, `/pwa-test` e valida que cada rota carrega HTML.
- `sw-offline.spec.ts` — aguarda o SW ativar, aquece o cache visitando várias rotas, entra em `context.setOffline(true)` e revisita para garantir o fallback do SW; usa `/pwa-test` para rodar a bateria interna offline.
