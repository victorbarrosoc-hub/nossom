# NOSSOM

**Tudo acontece no som.** Estúdio de áudio para criadores, editores e equipes de audiovisual.

Esta entrega implementa um MVP local funcional e a página pública com a identidade NOSSOM: preto profundo, prata, azul, superfícies translúcidas e ondas animadas. O símbolo foi reconstruído em SVG a partir da prancha visual fornecida. Não é um arquivo vetorial oficial extraído do anexo.

## Executar

Requisitos: Node.js 22.9+ (validado em Node 24), npm e navegador moderno com Web Audio, WebAssembly, Workers e IndexedDB.

```sh
npm ci
npm run dev
```

Produção:

```sh
npm run build
npm run start
```

Os comandos `predev` e `prebuild` copiam o motor FFmpeg instalado pelo lockfile para `public/ffmpeg`. O motor (~31 MB) é carregado na primeira operação de áudio. Não é necessário token para usar o estúdio local. O core e os workers são servidos pelo próprio domínio, com verificação de integridade de pacotes durante `npm ci` e sem CDNs de runtime.

## O que funciona

- Página pública responsiva com motion, demonstração sonora real, perguntas frequentes e entrada no estúdio.
- Importação de WAV, MP3, M4A, FLAC, OGG e áudio de MP4/MOV conforme codec. O conteúdo é decodificado e validado, independentemente da extensão. Máximo de 100 MB, 10 minutos, mono ou estéreo.
- Gravação por microfone, mediante permissão. Máximo de 10 minutos.
- FFmpeg WebAssembly executado em worker local: redução espectral de ruído contínuo, EQ de presença, passa-altas para vento, compressão, normalização de loudness e mixagem com sidechain ducking.
- Waveform real, busca de posição, seleção de trecho, reprodução A/B sincronizada e compensação de loudness na escuta.
- Preservação do arquivo originalmente enviado. O editor utiliza uma cópia de trabalho WAV PCM 16-bit/48 kHz. Cada tratamento cria uma versão, sem sobrescrever o original.
- Projetos, versões, renomeação, busca e exclusão em IndexedDB. Até 20 projetos e 8 versões processadas por projeto; capacidade real depende da cota do navegador.
- Medição integrada de LUFS, true peak e LRA pelo filtro FFmpeg `loudnorm`, sobre o arquivo resultante. Contagem objetiva de amostras perto da saturação.
- Exportação WAV PCM 16-bit e MP3 192 kbps em 48 kHz, download do arquivo original e relatório JSON com histórico e medições.
- Assistente local por regras de intenção que propõe uma operação, com revisão e aplicação explícita. Não executa comandos livres e não se apresenta como IA generativa.
- Adaptador de conversa ElevenLabs com resposta por voz, estado visual de fala, permissão de microfone e encerramento de sessão ao fechar o painel. Precisa de agente configurado.

## Limites técnicos

A redução de ruído é DSP espectral, não restauração neural. Vento é atenuado por passa-altas; não se promete recuperar fala ausente. O ducking reage ao sinal da faixa principal e não distingue semanticamente fala de ruído. A trilha de música se repete até a duração da faixa principal. Mixagem multicanal e stems ainda não estão disponíveis.

Todos os tratamentos são serializados para um único motor por aba. A UI apresenta progresso reportado pelo motor quando disponível, pode cancelar a operação e preserva versões salvas em caso de falha. Em dispositivos com pouca memória, use arquivos menores. Original e versões ficam apenas no navegador, sem backup automático, login, sincronização ou isolamento entre pessoas que compartilham o mesmo perfil do navegador.

O volume A/B é igualado atenuando o arquivo mais alto para a menor leitura de LUFS. O ganho de reprodução não altera arquivos exportados. LUFS/LRA podem não ser significativos em sinais muito curtos ou silenciosos. Não há certificação automática de conformidade: os perfis são referências editoriais. TV exige confirmação das especificações do cliente; cinema e ATSC não recebem alvos universais. O relatório mede o WAV renderizado; não certifica o MP3 codificado, cujos picos podem diferir.

Cada versão recebe a operação e o perfil aplicados. Ao processar um trecho, a linha do tempo e o restante do áudio são preservados. A mixagem requer o áudio inteiro.

## ElevenLabs

Copie `.env.example` para `.env.local` e preencha apenas `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` com o ID público de um agente de Conversational AI. Reinicie o desenvolvimento ou gere um novo build. Esta variável é pública por projeto; nunca coloque uma API key nela.

No painel ElevenLabs, configure o agente para português, restrinja as origens ao domínio da aplicação e defina limites de custo. A voz envia o microfone ao provedor somente quando o usuário inicia a conversa. Sem o ID, o botão de voz é desabilitado com uma explicação. Não há custo de API nos tratamentos locais. A conversa pode consumir a conta ElevenLabs; nenhum agente foi provisionado ou crédito gasto nesta entrega. A integração de voz só pode ser validada de ponta a ponta com um agente autorizado.

## Vercel

O projeto usa Next.js e pode ser importado diretamente na Vercel. Build: `npm run build`; instalação: `npm ci`. As configurações de headers em `next.config.ts` são necessárias ao worker, à mídia local e à política de recursos.

O endereço desejado é `nossom-teal.vercel.app`; sua disponibilidade e vinculação precisam ser verificadas na conta Vercel. A autorização para publicar já foi fornecida pelo usuário. Neste ambiente, não há sessão Vercel ou `VERCEL_TOKEN` injetado, e as APIs/referências externas retornaram bloqueio da política de rede. Não houve deploy confirmado.

Depois de disponibilizar acesso seguro à conta, execute o deploy a partir desta pasta usando a CLI oficial autenticada ou importe o repositório no projeto Vercel. Não imprima tokens e não os coloque no Git. Nunca considere um build local como evidência de publicação.

## Validação

```sh
npm run typecheck
npm test
npm run build
npm run start
# Em outro terminal; Chromium já instalado neste ambiente:
npm run test:e2e
```

`CHROMIUM_PATH` permite indicar outro Chromium. Os testes E2E usam arquivos WAV reais sintetizados no teste, mono/estéreo, e verificam importação inválida, ruído, seleção, mixagem, medições pós-masterização, downloads WAV/MP3/JSON, persistência, renomeação, exclusão, navegação e layout móvel. Capturas e traces ficam em `test-results/`, fora do Git.

## Estrutura

- `app/`: páginas, metadados, tema e estilos responsivos.
- `components/landing.tsx`: experiência pública e demonstração sonora.
- `components/studio.tsx`: jornada de projetos, gravação, processamento e exportação.
- `components/wave-player.tsx`: waveform, seleção, A/B e compensação de volume.
- `components/assistant.tsx`: interpretação local e adaptador ElevenLabs.
- `lib/audio.ts`: validação, FFmpeg, medições, codecs e exportação.
- `lib/presets.ts`: operações permitidas e perfis versionados.
- `lib/storage.ts`: repositório local IndexedDB.
- `docs/architecture.md`: decisões e continuação das fases do PRD.

## Licenças

As dependências permanecem sujeitas às respectivas licenças. FFmpeg core inclui componentes sob GPL; revise `THIRD_PARTY_NOTICES.md` antes de redistribuir uma versão modificada do motor. O SDK ElevenLabs não concede direitos sobre vozes. Esta entrega não utiliza gravações, depoimentos, métricas comerciais ou logotipos de terceiros como prova social.
