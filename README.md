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

Os comandos `predev` e `prebuild` copiam o motor FFmpeg instalado pelo lockfile para `public/ffmpeg` e os modelos locais RNNoise (aproximadamente 4,6 MB) e DeepFilterNet3 (aproximadamente 33 MB) para `public/audio`. Desenvolvimento e build usam Webpack para compatibilidade com o worker FFmpeg. O motor (~31 MB) é carregado na primeira operação de áudio. Não é necessário token para usar o estúdio local. O core e os workers são servidos pelo próprio domínio, com verificação de integridade de pacotes durante `npm ci` e sem CDNs de runtime.

## O que funciona

- Página pública responsiva com motion, demonstração sonora real, perguntas frequentes e entrada no estúdio.
- Rotas próprias para limpeza, voz, equalização, vento, nivelamento, masterização e mixagem. O layout preserva o projeto durante a navegação.
- EQ em cinco bandas, presets editáveis, biblioteca de presets pessoais por ferramenta e presets de voz com de-esser/hum 50 ou 60 Hz.
- Preset Transmissão + Limite −3 dB, baseado nas duas capturas Premiere fornecidas; implementação documentada em docs/audio-engine.md.
- Desfazer, refazer e restaurar original com histórico e versão ativa persistidos. Novos ajustes podem formar ramificações sem apagar as versões anteriores.
- Importação de WAV, MP3, M4A, FLAC, OGG e áudio de MP4/MOV conforme codec. O conteúdo é decodificado e validado, independentemente da extensão. Máximo de 100 MB, 10 minutos, mono ou estéreo.
- Gravação por microfone, mediante permissão. Máximo de 10 minutos.
- NOSSOM Voice: DeepFilterNet3 em worker local, 48 kHz, intensidade e supressão máxima ajustáveis, atraso compensado. RNNoise é a opção de compatibilidade. O modo espectral atende áudio geral.
- Controles de 0–100%, redução máxima/piso de ruído, presença, compressão, corte de graves, volume final, teto de pico e ducking. Estimativa de piso por análise das janelas silenciosas.
- FFmpeg WebAssembly executado em worker local: redução espectral de ruído contínuo, EQ de presença, passa-altas para vento, compressão, normalização de loudness e mixagem com sidechain ducking.
- Waveform real, busca de posição, seleção de trecho, reprodução A/B sincronizada e compensação de loudness na escuta.
- Preservação do arquivo originalmente enviado. O editor utiliza uma cópia de trabalho WAV PCM 16-bit/48 kHz. Cada tratamento cria uma versão, sem sobrescrever o original.
- Projetos, versões, renomeação, busca e exclusão em IndexedDB. Até 20 projetos e 8 versões processadas por projeto; capacidade real depende da cota do navegador.
- Medição integrada de LUFS, true peak e LRA pelo filtro FFmpeg `loudnorm`, sobre o arquivo resultante. Contagem objetiva de amostras perto da saturação.
- Exportação WAV PCM 16-bit e MP3 192 kbps em 48 kHz, download do arquivo original e relatório JSON com histórico e medições.
- Assistente local por regras de intenção que propõe uma operação, com revisão e aplicação explícita. Não executa comandos livres e não se apresenta como IA generativa.
- Adaptador de conversa ElevenLabs com resposta por voz, estado visual de fala, permissão de microfone e encerramento de sessão ao fechar o painel. Precisa de agente configurado.

## Limites técnicos

A limpeza padrão usa o modelo neural aberto DeepFilterNet3; RNNoise continua disponível para compatibilidade. A cadeia, os presets e a interface são NOSSOM; os modelos de aprendizado não foram treinados do zero por este projeto. O modo geral usa redução espectral adaptativa. Não é o motor do Adobe Podcast v2, e não há comprovação de qualidade igual ou superior ao Adobe. Nenhum dos modos garante reconstrução de fala ausente, remoção total de reverberação ou resultado igual ao Adobe, Resolve ou RX em todas as gravações. Vento combina passa-altas e redução espectral; não se promete recuperar fala ausente. O ducking reage ao sinal da faixa principal e não distingue semanticamente fala de ruído. A trilha de música se repete até a duração da faixa principal. Mixagem multicanal e stems ainda não estão disponíveis.

Todos os tratamentos são serializados para um único motor por aba. A UI apresenta progresso reportado pelo motor quando disponível, pode cancelar a operação e preserva versões salvas em caso de falha. Em dispositivos com pouca memória, use arquivos menores. Original e versões ficam apenas no navegador, sem backup automático, login, sincronização ou isolamento entre pessoas que compartilham o mesmo perfil do navegador.

O volume A/B é igualado atenuando o arquivo mais alto para a menor leitura de LUFS. O ganho de reprodução não altera arquivos exportados. LUFS/LRA podem não ser significativos em sinais muito curtos ou silenciosos. Não há certificação automática de conformidade: os perfis são referências editoriais. TV exige confirmação das especificações do cliente; cinema e ATSC não recebem alvos universais. O relatório mede o WAV renderizado; não certifica o MP3 codificado, cujos picos podem diferir.

Cada versão recebe a operação, o perfil, os controles e o identificador de sua versão de origem. A versão ativa e a trilha de refazer ficam no projeto, sem reprocessamento para desfazer/refazer. A entrega usa loudnorm em duas passagens, medição do resultado e correção final limitada pela margem de true peak. Se o teto de pico impedir a meta de loudness, o relatório mantém a medição real. Em trechos selecionados, não se aplica correção global que alteraria o restante do arquivo. Ao processar um trecho, a linha do tempo e o restante do áudio são preservados. A mixagem requer o áudio inteiro.

## ElevenLabs

Copie `.env.example` para `.env.local` e preencha apenas `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` com o ID público de um agente de Conversational AI. Reinicie o desenvolvimento ou gere um novo build. Esta variável é pública por projeto; nunca coloque uma API key nela.

No painel ElevenLabs, configure o agente para português, restrinja as origens ao domínio da aplicação e defina limites de custo. A voz envia o microfone ao provedor somente quando o usuário inicia a conversa. Sem o ID, o botão de voz é desabilitado com uma explicação. Não há custo de API nos tratamentos locais. A conversa pode consumir a conta ElevenLabs; nenhum agente foi provisionado ou crédito gasto nesta entrega. A integração de voz só pode ser validada de ponta a ponta com um agente autorizado.

## Vercel

O projeto usa Next.js e pode ser importado diretamente na Vercel. Build: `npm run build`; instalação: `npm ci`. As configurações de headers em `next.config.ts` são necessárias ao worker, à mídia local e à política de recursos.

A aplicação está publicada em **https://nossom-teal.vercel.app**. A integração GitHub–Vercel publica novos commits de `main`. O arquivo `vercel.json` declara explicitamente Next.js, comandos de instalação/build e saída `.next`; isso corrigiu o HTTP 404 observado após o primeiro deploy de um projeto originalmente vazio.

A página inicial, `/studio`, `/privacidade` e o motor WASM foram verificados por HTTPS em produção, com HTTP 200 e os headers esperados. Os fluxos completos de áudio foram validados no Chromium local com o build de produção. A navegação automatizada contra o domínio público não foi concluída devido à configuração de confiança do proxy no navegador do ambiente.

Não é necessário um token Vercel adicional para publicar pela integração existente. Acesso autenticado à CLI/API só é necessário para gerenciar configurações da conta/projeto fora do Git. Nunca imprima tokens ou os coloque no repositório.

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

## Estrutura e identidade visual

O guia SOBEDESCE orienta a hierarquia de telas, peças reutilizáveis, navegação móvel e ritmos de movimento. A identidade é NOSSOM: grafite, prata, luz azul/violeta e ondas fluidas. Os estilos estão separados em tokens, kit, estúdio e site. O estúdio tem tema escuro inicial, claro e automático; a escolha fica no navegador. Reduzir movimento desativa loops e deslocamentos. Demos decorativas só animam visíveis.

## Modelo neural e licenças

DeepFilterNet3 via `@lofcz/deepfilternet-web@0.1.0` (MIT/Apache-2.0), com licença servida em `/audio/DEEPFILTER-LICENSE.txt`; detalhes em [docs/audio-engine.md](docs/audio-engine.md). RNNoise via `@shiguredo/rnnoise-wasm@2025.1.5` (Apache-2.0); núcleo RNNoise (BSD, em `public/licenses/rnnoise.txt`). A licença do wrapper é servida em `/audio/RNNOISE-WASM-LICENSE.txt`. Processamento local, sem nova chave nem cobrança por API. O fixture de regressão usa voz sintética Flite, não gravação de uma pessoa; detalhes em `tests/fixtures/README.md`.

## Claude Sonnet 5.5 · esforço alto

A integração está em `/studio/ia`. Em Vercel → projeto NOSSOM → Settings → Environment Variables, configure em Production:

- `ANTHROPIC_API_KEY`: chave privada do Console Anthropic, com créditos e acesso ao modelo.
- `ANTHROPIC_MODEL=claude-sonnet-5-5`.
- `NOSSOM_AI_ACCESS_CODE`: ao menos 16 caracteres aleatórios, para liberar a sessão no estúdio.

Faça um novo deploy. Abra `/studio/ia`, digite somente o código de acesso e conecte. As chaves nunca são pedidas na interface nem enviadas ao cliente. O servidor verifica acesso ao modelo e envia `thinking: { type: 'adaptive' }` e `output_config: { effort: 'high' }`. A sessão usa cookie HttpOnly assinado de uma hora e o endpoint exige a mesma origem. O limite em memória é adicional; não substitui quotas de conta, gateway ou rate limiting distribuído para um produto multiusuário.

Claude recebe pedido e medições, não o áudio. Retorna uma sugestão restrita de ferramenta/intensidade/preset, que o usuário revisa. Não renderiza a restauração neural, não executa filtros livres e não aplica efeitos automaticamente. Sem configuração, o assistente continua identificado como sugestões locais por intenção. A assinatura do aplicativo Claude não substitui créditos de API.

Os contratos foram conferidos no SDK oficial Anthropic: [Model e OutputConfig](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/messages/messages.ts) e [capacidades dos modelos](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/resources/models.ts). Testes usam um provedor simulado; não houve chamada paga nem validação com credencial real.
