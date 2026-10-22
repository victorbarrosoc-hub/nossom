# NOSSOM para Mac e Windows

Wrapper Electron com sandbox, isolamento de contexto e sem Node no renderer. Abre o domínio NOSSOM em uma janela própria; usa a mesma conta/IA/cota do site. Não há servidor de áudio embutido nem promessa de funcionamento offline. Projetos IndexedDB pertencem ao perfil do aplicativo e não são copiados automaticamente do Safari/Chrome.

## Gerar

O workflow **Build NOSSOM installers** (`.github/workflows/desktop.yml`) é iniciado manualmente em GitHub → Actions → Run workflow. Gera DMG Apple Silicon, DMG Intel e instalador NSIS `.exe` x64 em runners Mac/Windows. O lockfile é próprio: `npm ci` dentro de `desktop/`.

Localmente, em cada sistema suportado:

```sh
npm ci
npm run dist -- --mac --arm64
# Ou --mac --x64, no Mac; --win --x64 no Windows.
```

Os arquivos aparecem em `desktop/dist/` e nos artefatos privados do workflow. Esta configuração não contém certificados de assinatura ou notarização. Não equivale a distribuição assinada pela Apple/Microsoft. Antes de liberar downloads públicos, valide os binários em cada sistema, configure certificados do distribuidor e faça a assinatura/notarização. A janela limita navegação interna ao domínio da NOSSOM, abre HTTPS externo no navegador e só permite solicitações de microfone da origem autorizada. A permissão do sistema operacional continua necessária.

## Distribuir

O repositório é privado: URLs de artefatos do GitHub não funcionam para usuários anônimos. Publique os instaladores aprovados em um armazenamento HTTPS público, como um bucket público dedicado no Supabase Storage, sem incluir credenciais. A página `/apps` lê estas variáveis da Vercel no build:

- `NOSSOM_DOWNLOAD_MAC_ARM64_URL`: arquivo DMG Apple Silicon.
- `NOSSOM_DOWNLOAD_MAC_X64_URL`: arquivo DMG Intel.
- `NOSSOM_DOWNLOAD_WINDOWS_URL`: instalador Windows `.exe`.

Depois faça um deploy. Sem uma URL publicada, o cartão informa **Instalador em preparação** e não oferece um link falso. A aplicação web/PWA permanece disponível. O diagnóstico anterior do GitHub Actions informou bloqueio por falha de pagamento/limite de gastos; essa configuração não remove restrições de cobrança da conta.
