# Validação da revisão visual e de áudio — 22/10/2026

Ambiente: Node.js 24, Next.js 16, Chromium Linux, FFmpeg core 0.12.10. Os testes de navegador foram executados localmente. O deploy Vercel e as respostas HTTPS públicas também foram verificados; isso não comprova restauração em nova tarefa ou sessão ElevenLabs.

- TypeScript: sem erros.
- Build de produção: concluído; páginas /, /studio e /privacidade pré-renderizadas.
- Testes unitários: 5 aprovados (incluindo piso de ruído, bypass e limites de parâmetros).
- Fluxos E2E: 8 aprovados em uma execução sobre o build de produção.
- Importação de arquivo inválido: rejeitada com mensagem; nova tentativa válida funciona.
- Áudio mono e estéreo: importados, medidos e preservados nos formatos suportados.
- RNNoise para fala, redução espectral adaptativa, clareza, passa-altas de vento, ganho adaptativo, compressão, loudnorm em duas passagens e mixagem com ducking: executados pelos motores reais.
- Masterização do sinal estéreo de teste: leitura pós-renderização dentro de ±1 LU do alvo de -16 LUFS e true peak abaixo do teto de teste.
- Seleção de trecho: tratamento concluído com arquivo de saída válido.
- Exportação: WAV com cabeçalho RIFF válido e conteúdo; MP3 não vazio; JSON de medições lido e verificado.
- Persistência: projeto recuperado após reload, renomeado e excluído.
- Cancelamento: importação interrompida sem salvar projeto parcial, seguida de nova importação bem-sucedida.
- Microfone: gravação via MediaRecorder com dispositivo sintético Chromium, importação e tratamentos concluídos. Não é teste de um microfone físico.
- Responsividade: 1440, 1000 e 390 px; temas claro/escuro, persistência da preferência, navegação móvel e sem overflow nos fluxos verificados. Reduzir movimento deixa as demonstrações em quadro fixo.
- Acessibilidade: axe-core WCAG 2 A/AA e 2.1 AA sem violações nas páginas inicial e estúdio inicial verificadas. Isso não constitui certificação de acessibilidade completa.
- Formatação: Prettier aprovado.
- Dependências de produção: `npm audit --omit=dev --audit-level=high` retornou zero vulnerabilidades conhecidas no momento da consulta.

## Produção

A integração Vercel confirmou “Deployment has completed” após declarar o framework em `vercel.json` (commit `460e517`). Em **https://nossom-teal.vercel.app**, `/`, `/studio`, `/privacidade` e `/ffmpeg/ffmpeg-core.wasm` responderam HTTP 200, com títulos/conteúdos esperados e headers COOP/COEP. O motor WASM servido tem 32.232.419 bytes. A integração GitHub–Vercel já dispõe da autenticação necessária para novos deploys.

## Não verificado

- Qualidade perceptual em gravações reais de fala, vento e reverberação.
- Navegadores Safari/Firefox, dispositivos físicos móveis ou arquivos próximos dos limites de memória.
- Voz ElevenLabs: ausência do ID de agente autorizado.
- Conta, armazenamento de nuvem, colaboração, billing e restauração generativa: fora do MVP local, identificados como futuros.
- Navegação automatizada contra o domínio público: não concluída devido à confiança do proxy no Chromium. A verificação de certificados não foi desativada; os testes E2E foram executados no build local.

O workflow CI foi adicionado ao repositório. A execução remota não chegou a iniciar por uma restrição da conta GitHub; o job não executou testes nem build. A validação acima foi executada localmente.

## Regressão da limpeza neural

A amostra usa fala sintetizada pelo Flite com ruído branco de semente fixa, não uma gravação real. Em intensidade 100%, o ruído RMS no intervalo conhecido sem fala caiu 54,52 dB; a energia RMS no intervalo de fala correspondeu a 97,87% da referência limpa. A duração foi preservada. Em 0%, o desvio máximo ficou abaixo de duas unidades PCM16. Energia preservada não comprova inteligibilidade, naturalidade ou ausência de artefatos.

A comparação de qualidade com Adobe Podcast v2 **não foi realizada**. RNNoise é supressão de ruído neural, não reconstrução generativa de fala. Reverberação, distorção severa, vento saturado e gravações reais ainda precisam de avaliação auditiva comparativa.

Na entrega do teste estéreo, a medição final foi −16,0 LUFS e −1,22 dBTP. O volume final recebe correção pela leitura do render, limitada pela margem de true peak. A meta de loudness pode não ser alcançável sem comprimir mais sinais com alto fator de crista; o relatório preserva os valores reais.

## Identidade visual

Estrutura de navegação, hierarquia de cartões e comportamento inspirados no guia SOBEDESCE. Paleta, ondas, iluminação e superfícies seguem a identidade escura NOSSOM das referências do usuário. A versão clara é uma opção do estúdio, não a identidade padrão do site. Capturas desktop/mobile foram inspecionadas localmente.
