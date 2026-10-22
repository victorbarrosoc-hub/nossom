# Arquitetura e escopo da primeira entrega

## Contas, IA e uso semanal (atualização)

Supabase Auth autentica contas por e-mail/senha. O servidor consulta a identidade, criptografa os tokens no cookie HttpOnly e renova a sessão pelo proxy. Os arquivos continuam locais, em IndexedDB por usuário. O workspace anterior é preservado para a primeira conta no navegador. Não há sincronização de áudio nesta etapa.

O PostgreSQL mantém autorizações de tratamento por semana com RLS e uma função atômica de quota: 10 por usuário, sem limite para o e-mail ADM confirmado. O motor local exige essa autorização antes de iniciar um tratamento. A contabilização de renderização inviolável exigiria processamento em jobs remotos; modelos WASM locais podem ser executados fora da interface.

Todas as contas usam o Managed Agent e a chave Anthropic do servidor. Conversas são isoladas por usuário/login. Motion anima ondas conforme o estado real da interface. A migração e ativação estão em `docs/supabase-setup.md`; configuração do agente em `docs/claude-setup.md`. A descrição abaixo registra a arquitetura inicial do motor, anterior à autenticação.

## Decisões

O repositório inicialmente continha somente um README. Não havia autenticação, banco, bucket, worker externo, projeto Vercel vinculado ou credenciais de ElevenLabs disponíveis. Por isso, a implementação vertical começa por um estúdio local real e preserva a direção do PRD sem simular serviços externos.

Next.js/React/TypeScript entregam a aplicação. FFmpeg WebAssembly roda em um Web Worker: o processo é isolado da interface, com um job por vez por aba. O original é arquivado como Blob; o editor opera sobre WAV PCM 16-bit/48 kHz e preserva mono/estéreo. IndexedDB mantém projetos e versões. `next.config.ts` define headers para o carregamento do motor e restringe câmera, mídia, workers e destinos de conexão.

## Matriz de capacidade

| Área                 | Implementado                                                   | Continuação                                                 |
| -------------------- | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Início e projetos    | Upload/drag-and-drop, gravação, busca, renomeação, exclusão    | Contas, equipes e sincronização                             |
| Editor               | Waveform real, A/B, loudness matching, trecho, versões         | Fade de bordas e edição multitrecho                         |
| Voz                  | DeepFilterNet3/RNNoise, FFT adaptativo, EQ, de-esser, dinâmica | De-reverb dedicado, de-click adaptativo                     |
| Mixagem              | Voz + música com sidechain ducking, nível da trilha            | Multitrilha, efeitos, automação e VAD                       |
| Entrega              | Loudnorm, LUFS, dBTP, LRA, relatório JSON, WAV/MP3             | Perfis por cliente, PDF e homologação por especificação     |
| Assistente           | Regras de intenção e adaptador de conversa ElevenLabs          | Planejador generativo autorizado e ferramentas do agente    |
| Separação            | Identificada como futura                                       | Avaliação de provedor/modelo, licenças, privacidade e custo |
| Plataforma comercial | Acesso local gratuito                                          | Auth, nuvem, créditos, assinaturas, admin e lote            |

## Garantias e limites

Nenhuma operação de texto livre se transforma em comando. `inferPlan` só retorna IDs de uma allowlist, e a aplicação exige revisão e clique em Aplicar. Filtros usam parâmetros enumerados ou números limitados pela UI. O navegador não envia o arquivo a um backend. O único envio de áudio a terceiro ocorre na conversa ElevenLabs iniciada pelo usuário.

As medições pós-processamento vêm de nova análise do WAV final; a saída estimada do primeiro filtro não é usada como medição final. Relatórios representam esse WAV e não certificam formatos derivados. LRA para sinais curtos é apenas informativa. Limiter de pico amostral nos módulos voz/mix não equivale a limitador de true peak; por isso, o resultado é medido novamente.

A reprodução original usa a cópia de trabalho decodificada. O download “Original” recupera os bytes enviados, sem alterações. Nenhuma operação remove esse arquivo. Seleção regional concatena início preservado, trecho tratado e final preservado; regiões não têm crossfade nesta primeira entrega e podem apresentar transições audíveis em tratamentos fortes.

## Custos

| Módulo                                  | Custo de API por minuto                                           |
| --------------------------------------- | ----------------------------------------------------------------- |
| Tratamento, análise e exportação locais | Nenhum; consomem CPU/memória do dispositivo                       |
| Armazenamento de projetos local         | Nenhum; limitado pela cota do navegador                           |
| Hospedagem                              | Depende do plano e do tráfego; primeira carga do motor tem ~31 MB |
| Conversa ElevenLabs                     | Conforme agente/plano do provedor; não configurado nem mensurado  |
| Restauração avançada e nuvem            | Não provisionadas; preço não definido                             |

## Próxima etapa de infraestrutura

Quando houver um projeto Supabase autorizado, introduzir um adaptador de persistência autenticado sem alterar o motor local. As entidades do PRD deverão incluir organizations, memberships, projects, media_assets, asset_versions, processing_jobs, delivery_presets, measurements, subscriptions e usage_ledger. Todas as tabelas de usuário/equipe devem ter RLS com testes de isolamento reais antes de disponibilizar a nuvem.

O armazenamento será privado, com URLs assinadas curtas e autorização no servidor. Jobs de longa duração devem ir para workers CPU/GPU fora de funções Vercel, com idempotência, retries, timeouts, quotas e controle de custo. A chave de service role permanece somente no backend; o cliente jamais recebe privilégios administrativos. Uploads terão validação de conteúdo, duração e tamanho no backend, não apenas na interface.

Migrações, políticas RLS e contratos de worker devem ser implementados e validados contra essa infraestrutura quando disponibilizada. Não há SQL não testado ou fila fictícia nesta entrega. Nenhuma migração de produção, alteração destrutiva ou criação de recurso pago foi realizada.

## Validação manual com fala

Os testes automatizados validam processamento e medições com sinais determinísticos. Antes de lançar uma oferta comercial, avaliar entrevistas, podcasts, vento, reverberação e gravações com diferentes microfones; comparar artefatos e inteligibilidade com escuta em loudness igualado. Nenhuma avaliação perceptual de fala real foi alegada com base no sinal de teste.

## Revisão de áudio e interface

RNNoise roda em worker separado; mantém estado independente por canal, usa PCM 48 kHz, processa quadros de 480 amostras e compensa um quadro de atraso. O mix original/tratado implementa intensidade contínua; 0% faz bypass. Regiões recebem transição de 5 ms e mantêm o restante original. Cancelamento termina ambos os workers. O resultado segue para FFmpeg e medição pós-renderização.

O modo espectral estima piso por percentil inferior de RMS em janelas de 20 ms quando há contraste de nível suficiente. Sem pausas claras, informa incerteza; não apresenta estimativa como identificação garantida de ruído.

A normalização usa análise e render de loudnorm, seguida por ajuste constante apenas quando há margem de true peak medida. A correção final não se aplica a tratamento regional. `Version.processing` e o relatório guardam os controles e motor.

A revisão atual usa DeepFilterNet3 como padrão e RNNoise como compatibilidade. As rotas `/studio/[tool]` preservam o projeto no layout; histórico, presets pessoais e a cadeia multibanda são descritos em [audio-engine.md](audio-engine.md). A integração opcional Sonnet 5.5/high, com acesso privado e retorno estruturado, está em [claude-setup.md](claude-setup.md). Os presets de voz agora incluem de-esser e hum de rede; isso não constitui equivalência a RX/Ozone.
