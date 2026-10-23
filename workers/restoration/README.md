# NOSSOM Restore D: GPU por fila

Este worker executa Resemble Enhance com `lambd=0.5`, `tau=0.1`, Midpoint e NFE 64. É o candidato D escolhido pelo titular do projeto em 23/10/2026; ainda pode alterar fonemas. Não é um modelo treinado pela NOSSOM, nem equivalência comprovada ao Adobe. Entradas estéreo são somadas em mono para restauração de fala. O original é preservado no navegador.

## Ativação

1. Execute `public/setup/cloud-restoration.sql` (combina as duas novas migrações) no SQL Editor do mesmo projeto Supabase. Ela depende da migração de contas/cota existente. O bucket privado guarda partes de até 20 MiB, evitando o limite por objeto de planos menores. O usuário nunca recebe service role ou chave RunPod.
2. Na RunPod, você também pode usar **Deploy from GitHub**, conectar este repositório privado e selecionar o Dockerfile da raiz; o próprio serviço constrói a imagem. Isso evita depender de minutos do GitHub Actions. Alternativamente, execute o workflow **Build restoration GPU worker** no GitHub Actions. Ele publica `ghcr.io/victorbarrosoc-hub/nossom-restoration:COMMIT`. Alternativa em uma máquina com Docker: `docker build -f Dockerfile -t SEU_REGISTRO/nossom-restoration:VERSAO .` e publique a imagem. Os pesos são baixados na construção, não em cada áudio.
3. Na RunPod, crie um endpoint **Serverless / Queue** usando a imagem. Para pacote GHCR privado, cadastre credenciais de leitura do registro na RunPod, ou torne apenas o pacote da imagem público. Não publique segredos na imagem. Escolha GPU compatível (A40 funciona no teste de inferência), **min workers 0**, **max workers 1**, **idle timeout 15 segundos**, **1 trabalho simultâneo por worker** e sem retries automáticos. Use workers Flex, não Active. O preço Serverless é diferente do preço do Pod; confira no painel.
4. No endpoint, cadastre `NOSSOM_STORAGE_ORIGIN=https://iaavcsyoybnswtfnrvtu.supabase.co`. Não cadastre chaves administrativas no worker.
5. Na Vercel, configure **RUNPOD_API_KEY**, **RUNPOD_ENDPOINT_ID** e **SUPABASE_SERVICE_ROLE_KEY**, além das variáveis Supabase/conta já existentes. A chave RunPod fica somente no servidor. Faça redeploy. Cadastre também **CRON_SECRET** com valor aleatório de pelo menos 32 caracteres para limpar objetos abandonados diariamente.
6. Faça login na NOSSOM e valide um trabalho real pequeno: restauração, reprodução, finalização, cancelamento e cota. Confirme no painel RunPod que a fila ficou vazia e os workers voltaram a zero. Depois pare o Pod manual antigo: o endpoint Serverless não desliga Pods independentes.

O servidor autoriza a conta, reserva um trabalho por usuário e desconta da franquia mensal a duração do arquivo, com mínimo de um minuto por restauração, ao despachar; ADM confirmado mantém cota ilimitada. Repetir o mesmo submit não despacha outra GPU. Pedidos cancelados/falhos confirmados pelo provedor devolvem os minutos reservados. Falhas ambíguas de rede durante o despacho não são repetidas automaticamente, para evitar trabalho duplicado; ficam identificadas como `submitting` para reconciliação. O provedor limita execução a 15 minutos e permanência na fila a 30 minutos.

Após download e gravação local, o navegador pede a exclusão dos objetos temporários. O cron diário tenta remover objetos abandonados há mais de 24 horas, em lotes limitados; um acúmulo pode demorar mais. O áudio original e os projetos continuam locais; a restauração envia uma cópia temporária ao Supabase privado e à GPU RunPod. A conversa com Claude continua recebendo somente texto e medições.

## Limites e validação

Até 100 MiB/10 minutos na entrada. Saída WAV float32 mono a 44,1 kHz, com duração verificada e margem de pico amostral de pelo menos 3 dB. Cada objeto é <=20 MiB. O preset D não aplica masterização, EQ, correção de texto, TTS ou normalização posterior. A finalização é opcional no navegador. A segmentação do modelo em arquivos completos pode produzir diferenças em relação ao trecho de teste com contexto 20–75 s.

O build e o serviço GPU precisam de homologação real. Testes locais de contrato e mocks não comprovam cold start, desligamento nem qualidade perceptual na RunPod. Código upstream: https://github.com/resemble-ai/resemble-enhance (MIT); conserve as licenças dos componentes e dos pesos nas distribuições.
