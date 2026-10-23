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

As URLs acima substituem os downloads de teste. Os links da prévia 0.1.1 foram habilitados somente após a publicação e verificação HTTP anônima dos três instaladores. A prévia Mac 0.1.1 possui assinatura ad-hoc de integridade, sem certificado Developer ID ou notarização Apple; atualizações automáticas permanecem desabilitadas. O workflow verifica a assinatura completa e a integridade do DMG e testa a abertura quando a arquitetura coincide com o runner. A versão 0.1.0 tinha assinatura inválida/ausente e foi substituída por uma nova versão, sem sobrescrever os arquivos antigos. As instruções de instalação, autorização pelo macOS e remoção do atributo de quarentena somente deste app estão em `/apps`. Depois de alterar variáveis, faça um deploy. Sem um arquivo publicado, o cartão informa **Instalador em preparação** e não oferece um link falso. A aplicação web/PWA permanece disponível. O bloqueio anterior de minutos privados foi contornado com o repositório público. Windows e as duas arquiteturas Mac foram compilados com sucesso em runners padrão e publicados em Releases.

## Atualizações automáticas

A próxima distribuição assinada é a 0.2.0. Ao abrir e a cada quatro horas, o programa consulta atualizações estáveis e baixa uma versão nova automaticamente. A instalação espera o término de gravações/tratamentos e 30 segundos sem interação com o aplicativo. Se o programa for encerrado, uma atualização já baixada também pode ser instalada ao sair. Falhas preservam a versão atual e permitem nova tentativa. Não há downgrade nem atualização para prévias.

A prévia pública 0.1.1 não tem canal de atualização nativo habilitado. Para migrar, o usuário precisará instalar a primeira distribuição assinada uma vez. As melhorias do estúdio também chegam ao app 0.1.1 sem trocar o DMG: a tela compara o identificador público de deploy com `/api/desktop/version` ao abrir, retomar o foco e a cada minuto. Ao detectar uma publicação, espera o término de gravação/tratamento, 30 segundos sem interação, campos sem foco e diálogos fechados antes de recarregar. A consulta não envia chaves, áudio nem URLs de instaladores. Falhas de conexão preservam a versão atual. Isso atualiza o estúdio online, separadamente da troca do binário Electron.

### Publicar a distribuição assinada

No GitHub → Settings → Secrets and variables → Actions, configure:

- Secrets `MAC_CSC_LINK` (certificado Developer ID Application .p12 em base64), `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.
- Secrets `WIN_CSC_LINK` (certificado de assinatura de código .pfx em base64), `WIN_CSC_KEY_PASSWORD`.
- Variable `NOSSOM_WINDOWS_PUBLISHER` correspondente ao titular do certificado Windows.

Não envie certificados, chaves ou senhas pelo chat ou pelo Git. A disponibilidade de certificados não pôde ser confirmada nesta sessão: a API de secrets/variables do repositório retornou 403. As prévias publicadas até aqui são ad-hoc no Mac e não têm o canal habilitado.

Execute **Build NOSSOM installers**, `platform=all`, `publish_signed=true`, `publish_preview=false`. O build exige certificados e notarização, valida a assinatura completa e o DMG no Mac, a aprovação do Gatekeeper/notarização e a assinatura Authenticode no Windows. Uma falha em qualquer plataforma impede a publicação estável.

O job monta os feeds `latest-mac.yml` (ZIPs arm64 e Intel) e `latest.yml` (Windows) com SHA-512 e tamanho dos arquivos realmente gerados. Publica todos os instaladores e manifestos em uma release draft `v0.2.0`, ativando-a como Latest somente depois do upload completo. O endereço HTTPS embutido é `https://github.com/victorbarrosoc-hub/nossom/releases/latest/download/`. Não precisa configurar outro armazenamento ou feeds manualmente. Versões existentes não são sobrescritas: incremente `desktop/package.json` e o lockfile para cada atualização.

Para distribuição em armazenamento próprio, `NOSSOM_UPDATE_BASE_URL` continua disponível nos builds sem `publish_signed`, com feeds separados por `mac-arm64/`, `mac-x64/` e `win-x64/`. Envie binários antes dos manifestos. Os mesmos requisitos de assinatura/notarização se aplicam.

O fluxo de download e instalação foi testado com doubles do atualizador e bridge de navegador, incluindo a espera durante gravação. Não foi realizada uma atualização nativa entre dois instaladores assinados, pois os certificados ainda não estão acessíveis nesta sessão.
