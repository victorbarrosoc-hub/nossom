# Validação da primeira entrega

Ambiente: Node.js 24, Next.js 16, Chromium Linux, FFmpeg core 0.12.10. Os testes de navegador foram executados localmente. O deploy Vercel e as respostas HTTPS públicas também foram verificados; isso não comprova restauração em nova tarefa ou sessão ElevenLabs.

- TypeScript: sem erros.
- Build de produção: concluído; páginas /, /studio e /privacidade pré-renderizadas.
- Testes unitários: 3 aprovados (intenções permitidas, interpretação de medições, rejeição de operação inadequada).
- Fluxos E2E: 6 aprovados (cinco em uma execução e gravação em execução adicional).
- Importação de arquivo inválido: rejeitada com mensagem; nova tentativa válida funciona.
- Áudio mono e estéreo: importados, medidos e preservados nos formatos suportados.
- Denoise, clareza, passa-altas de vento, compressão de volume, loudnorm e mixagem com ducking: executados pelo motor real.
- Masterização do sinal estéreo de teste: leitura pós-renderização dentro de ±1 LU do alvo de -16 LUFS e true peak abaixo do teto de teste.
- Seleção de trecho: tratamento concluído com arquivo de saída válido.
- Exportação: WAV com cabeçalho RIFF válido e conteúdo; MP3 não vazio; JSON de medições lido e verificado.
- Persistência: projeto recuperado após reload, renomeado e excluído.
- Cancelamento: importação interrompida sem salvar projeto parcial, seguida de nova importação bem-sucedida.
- Microfone: gravação via MediaRecorder com dispositivo sintético Chromium, importação e tratamentos concluídos. Não é teste de um microfone físico.
- Responsividade: navegação móvel, editor a 390 px, sem overflow horizontal nos fluxos verificados.
- Acessibilidade: axe-core WCAG 2 A/AA e 2.1 AA sem violações nas páginas inicial e estúdio inicial verificadas. Isso não constitui certificação de acessibilidade completa.
- Formatação: Prettier aprovado.
- Dependências de produção: `npm audit --omit=dev --audit-level=high` retornou zero vulnerabilidades conhecidas no momento da consulta.

## Produção

A integração Vercel confirmou “Deployment has completed” após declarar o framework em `vercel.json` (commit `460e517`). Em **https://nossom-teal.vercel.app**, `/`, `/studio`, `/privacidade` e `/ffmpeg/ffmpeg-core.wasm` responderam HTTP 200, com títulos/conteúdos esperados e headers COOP/COEP. O motor WASM servido tem 32.232.419 bytes. A integração GitHub–Vercel já dispõe da autenticação necessária para novos deploys.

## Não verificado

- Qualidade perceptual em gravações reais de fala, vento e reverberação.
- Navegadores Safari/Firefox, dispositivos físicos móveis ou arquivos próximos dos limites de memória.
- Voz ElevenLabs: ausência do ID de agente autorizado.
- Conta, armazenamento de nuvem, colaboração, billing e IA neural: fora do MVP local, identificados como futuros.
- Navegação automatizada contra o domínio público: não concluída devido à confiança do proxy no Chromium. A verificação de certificados não foi desativada; os testes E2E foram executados no build local.

O workflow CI foi adicionado ao repositório. A execução remota não chegou a iniciar por uma restrição da conta GitHub; o job não executou testes nem build. A validação acima foi executada localmente.
