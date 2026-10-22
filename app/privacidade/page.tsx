import Link from 'next/link';
import { Brand } from '@/components/brand';
export default function Privacy() {
  return (
    <main className="privacy-page container">
      <Link href="/" aria-label="Página inicial">
        <Brand />
      </Link>
      <span className="eyebrow">SEU SOM FICA COM VOCÊ</span>
      <h1>
        Privacidade,
        <br />
        com clareza.
      </h1>
      <p>
        Esta versão da NOSSOM é um estúdio local. Não exige cadastro e não envia seus arquivos de
        áudio para um servidor de processamento.
      </p>
      <h2>Arquivos e projetos</h2>
      <p>
        Os arquivos importados, originais, versões e nomes de projetos ficam no armazenamento
        IndexedDB deste navegador. Não há sincronização entre dispositivos ou cópia de segurança na
        nuvem. Exclua um projeto na tela “Meus projetos” para remover seus dados locais. Limpar os
        dados do site no navegador também apaga os projetos. Exporte seus arquivos antes de fazer
        isso.
      </p>
      <p>
        Os presets pessoais ficam no armazenamento local deste navegador. Eles guardam ajustes e
        nomes, sem cópias do áudio. Limpar os dados do site também remove esses presets.
      </p>
      <h2>Processamento local</h2>
      <p>
        O motor FFmpeg e os modelos DeepFilterNet3/RNNoise são baixados do próprio site e executam
        no seu dispositivo. A primeira utilização exige o download desse motor. A decodificação e os
        tratamentos usam memória e processamento locais. Esta versão aceita arquivos mono ou
        estéreo, de até 100 MB e 10 minutos.
      </p>
      <h2>Microfone e assistente</h2>
      <p>
        A gravação no estúdio só acessa o microfone depois de sua permissão e armazena o resultado
        localmente. Sem Claude conectado, as sugestões por texto usam regras locais. Quando você
        conecta sua conta Anthropic e envia um pedido, o texto e as medições disponíveis de
        loudness, pico, duração e canais são enviados à Anthropic para gerar uma sugestão. O arquivo
        de áudio não é enviado ao Claude. As chaves da API ficam somente no servidor. Uma sessão de
        acesso assinada é guardada em cookie HttpOnly por até uma hora. A conversa por voz com
        ElevenLabs é opcional, depende de um agente configurado e só começa após sua ação. Nessa
        conversa, o áudio do microfone é enviado ao ElevenLabs e tratado conforme as políticas e a
        configuração do agente do provedor.
      </p>
      <h2>Dados de acesso</h2>
      <p>
        A hospedagem pode registrar dados técnicos de acesso, como endereço IP, horário e erros,
        conforme suas configurações e políticas. Não instalamos ferramentas de publicidade,
        rastreamento comportamental ou analytics nesta versão.
      </p>
      <h2>Limites e direitos</h2>
      <p>
        Use arquivos que você tenha direito de processar. Preserve o consentimento e a privacidade
        das pessoas gravadas. As medições de áudio são ferramentas de apoio; os perfis de entrega
        não constituem certificação técnica.
      </p>
      <Link className="button primary" href="/studio">
        Voltar ao estúdio ↗
      </Link>
    </main>
  );
}
