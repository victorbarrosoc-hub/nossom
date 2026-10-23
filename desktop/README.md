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

Os arquivos aparecem em `desktop/dist/` e nos artefatos privados do workflow. Esta configuração não contém certificados de assinatura ou notarização. Não equivale a distribuição assinada pela Apple/Microsoft. Para uma distribuição final assinada, valide os binários em cada sistema, configure certificados do distribuidor e faça a assinatura/notarização. A prévia pública é identificada como versão de teste. A janela limita navegação interna ao domínio da NOSSOM, abre HTTPS externo no navegador e só permite solicitações de microfone da origem autorizada. A permissão do sistema operacional continua necessária.

## Distribuir

O repositório está público. Artefatos de Actions ainda podem exigir login, por isso os instaladores de teste são publicados como assets da release pública `desktop-v0.1.0`. Publique os instaladores aprovados em um armazenamento HTTPS público, como um bucket público dedicado no Supabase Storage, sem incluir credenciais. A página `/apps` lê estas variáveis da Vercel no build:

- `NOSSOM_DOWNLOAD_MAC_ARM64_URL`: arquivo DMG Apple Silicon.
- `NOSSOM_DOWNLOAD_MAC_X64_URL`: arquivo DMG Intel.
- `NOSSOM_DOWNLOAD_WINDOWS_URL`: instalador Windows `.exe`.

As URLs acima substituem os downloads de teste. Os links da prévia 0.1.0 foram habilitados somente após a publicação e verificação HTTP anônima dos três instaladores. A prévia não possui assinatura/notarização nem atualização automática habilitada. Depois de alterar variáveis, faça um deploy. Sem um arquivo publicado, o cartão informa **Instalador em preparação** e não oferece um link falso. A aplicação web/PWA permanece disponível. O bloqueio anterior de minutos privados foi contornado com o repositório público. Windows e as duas arquiteturas Mac foram compilados com sucesso em runners padrão e publicados em Releases.

## Atualizar sem baixar pelo site

O aplicativo inclui `electron-updater`: busca uma versão ao abrir e a cada quatro horas, notifica no sistema e mostra um aviso dentro do estúdio. **Atualizar agora** baixa a atualização verificada. Depois do download, reinicia e instala automaticamente; espera uma gravação ou tratamento em curso terminar. Também é possível buscar novidades pelo sino do aplicativo. A versão web recebe o código publicado ao abrir/recarregar; o navegador não recebe o mecanismo de instalador nativo.

Para gerar distribuições com atualização, configure a variável do repositório `NOSSOM_UPDATE_BASE_URL` com a raiz HTTPS de um armazenamento público dedicado. O build cria um feed independente para `mac-arm64/`, `mac-x64/` e `win-x64/`. Publique em cada diretório todos os artefatos aprovados correspondentes: instalador, ZIP no Mac, blockmaps e `latest-mac.yml`/`latest.yml`. Envie binários primeiro e o manifesto por último. O workflow armazena esses arquivos como artefatos privados; não os publica automaticamente no bucket. Incremente `desktop/package.json` e seu lockfile para cada versão; não substitua uma versão já distribuída.

Atualizações só são habilitadas em builds empacotados com feed. Para esse build, o script exige assinatura: secrets `MAC_CSC_LINK`/`MAC_CSC_KEY_PASSWORD` e `WIN_CSC_LINK`/`WIN_CSC_KEY_PASSWORD`; no Mac, também `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` para notarização. No Windows, a variável `NOSSOM_WINDOWS_PUBLISHER` deve corresponder ao titular do certificado. Não coloque certificados ou senhas no Git. Os builds sem feed continuam gerando instaladores de teste, sem ativar atualizações automáticas.

A verificação de hashes e assinaturas é realizada pelo atualizador nativo; download automático em segundo plano está desativado até o clique do usuário. O preload expõe apenas estado/check/download/install, sem acesso a Node ou URLs arbitrárias; o processo principal valida a origem e o frame remetente do IPC. Não há downgrade ou instalação de prerelease. O fluxo foi testado com doubles do atualizador e bridge de navegador, sem simular uma instalação real em Mac/Windows. Os runners estão executando e as prévias foram publicadas; continuam pendentes certificados e publicação do feed HTTPS.

Para gerar só Mac ou Windows, escolha `platform` no workflow. Marque `publish_preview` para publicar os instaladores disponíveis na release de teste. Arquivos já distribuídos não são sobrescritos; incremente a versão para atualizar binários existentes. Builds Mac usam macOS 15; campos vazios de certificados são removidos para evitar interpretar o diretório como certificado.
