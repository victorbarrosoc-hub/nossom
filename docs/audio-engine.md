# Motor NOSSOM e preset de transmissão

NOSSOM Voice combina processamento neural local e estágios de DSP controláveis. O núcleo de restauração padrão é o modelo aberto DeepFilterNet3, distribuído por `@lofcz/deepfilternet-web@0.1.0` (MIT/Apache-2.0). A alternativa leve usa RNNoise. NOSSOM não reivindica ter treinado esses modelos nem reproduzir o código proprietário de Adobe, Blackmagic ou iZotope.

DeepFilterNet3 processa PCM float a 48 kHz em quadros de 480 amostras. O modelo embutido foi inspecionado: FFT 960, hop 480 e look-ahead 2. O worker acrescenta zeros ao final e remove 1.440 amostras de atraso. Há estado independente por canal. O modelo/WASM de aproximadamente 33 MB é servido pelo próprio domínio; a licença acompanha os assets em `/audio/DEEPFILTER-LICENSE.txt`. A intensidade mistura o original com o resultado alinhado. O controle de supressão máxima limita a atenuação solicitada ao modelo. Não há fallback silencioso para um algoritmo diferente.

As ferramentas são páginas próprias com uma fonte de áudio compartilhada. EQ, voz, dinâmica e entrega são estágios separados; aplicar um ajuste produz um snapshot e registra sua versão de origem. Desfazer/refazer seleciona snapshots, sem renderizar novamente ou destruir o histórico. Ramificações e a trilha de refazer são preservadas ao recarregar. Projetos antigos sem identificadores de origem continuam navegáveis por ordem linear.

## Transmissão + Limite −3 dB

Valores transcritos das capturas do usuário:

| Banda         | Limiar   | Ganho | Proporção | Ataque | Liberação |
| ------------- | -------- | ----- | --------- | ------ | --------- |
| Graves        | −20,2 dB | +1 dB | 3:1       | 1 ms   | 100 ms    |
| Médios graves | −17,6 dB | 0 dB  | 2:1       | 1 ms   | 100 ms    |
| Médios agudos | −24,8 dB | 0 dB  | 2:1       | 1 ms   | 100 ms    |
| Agudos        | −25 dB   | +3 dB | 3:1       | 1 ms   | 100 ms    |

Crossovers: **137 / 1.147 / 6.910 Hz**.

Limitador multibanda: limiar −10 dB, margem −0,1 dB, ataque 1 ms, liberação 250 ms, saída 0 dB. O motor limita no limiar e usa compensação para a margem. Essa interpretação é explícita: curvas internas de auto-gain/knee dos plugins Adobe não podem ser deduzidas integralmente pelas imagens.

Limitador final: **modo pico amostral**, entrada +6 dB, teto −3 dBFS, look-ahead 7 ms, liberação 100 ms, canais vinculados. Não é o modo true peak, que estava desmarcado na captura. O relatório mede true peak separadamente.

A implementação usa crossover Linkwitz–Riley de 4ª ordem, compressão RMS por banda com knee duro, soma sem normalização e limitadores com compensação de latência. A via seca da intensidade passa pelo mesmo crossover para preservar a relação de fase na mistura. Os controles são ajustáveis e voltam aos valores das capturas com “Restaurar valores da referência”. Não se aplica normalização LUFS extra depois desse preset: isso alteraria a cadeia e a intenção do teto final.

## EQ e presets de voz

O EQ possui bandas em 100, 250, 1.000, 3.500 e 10.000 Hz, de −12 a +12 dB, e corte de graves ajustável. Os presets Neutro, Corpo e calor, Voz em destaque e Brilho e abertura são pontos de partida editáveis. Reserva-se margem antes dos realces para reduzir o risco de clipping. O gráfico mostra ganhos por banda, não uma medição do espectro ou resposta exata do filtro.

Os presets Diálogo limpo, Locução encorpada, Podcast equilibrado, Sibilância suave e Diálogo com hum de rede combinam a restauração neural com EQ de voz, compressor, limitador e de-esser conforme controles. Hum usa notches na fundamental 50/60 Hz e três harmônicos. Isso não recupera gravações saturadas ou ausentes nem equivale a todas as funções RX/Ozone.

“Meus presets” guarda as configurações por ferramenta no navegador. Não inclui o áudio, não é sincronizado em nuvem e possui limite de 20 presets por ferramenta.

## Qualidade e comparação

O fixture de regressão é fala sintetizada com ruído branco adicionado. A validação verifica bypass, duração, preservação de energia vocal e alinhamento temporal. Não constitui teste perceptual, nem comparação com Adobe Podcast v2, Resolve Voice Isolation ou iZotope. Para estabelecer superioridade são necessários originais reais, saídas das referências com parâmetros conhecidos e avaliações auditivas com volume igualado, além de métricas apropriadas à tarefa.
