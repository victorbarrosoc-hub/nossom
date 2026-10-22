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
        A NOSSOM exige uma conta Supabase para entrar no estúdio. Contas e cotas ficam na nuvem;
        seus arquivos de áudio continuam neste dispositivo e não são enviados para um servidor de
        processamento.
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
        A gravação só acessa o microfone após sua permissão e salva o resultado localmente. A IA da
        plataforma usa a chave e o agente do administrador, no servidor, sem pedir configuração
        individual. Ao enviar um pedido, texto e medições de loudness, pico, duração e canais vão à
        Anthropic; o arquivo de áudio não vai ao Claude. Cada conversa recebe uma sessão própria,
        separada das outras contas. Ao fechar o painel, solicitamos a exclusão da sessão remota;
        falhas de conexão podem impedir a limpeza. A retenção do provedor continua aplicável.
      </p>
      <p>
        Voz ao vivo, quando habilitada pela plataforma, é opcional e usa ElevenLabs após sua ação e
        permissão de microfone. Nessa conversa, o áudio do microfone vai ao ElevenLabs conforme as
        políticas do provedor. Sem voz habilitada, o assistente funciona por texto.
      </p>
      <h2>Conta e limite semanal</h2>
      <p>
        Supabase Auth guarda seu e-mail, nome de exibição e os dados de autenticação. A aplicação
        não salva sua senha no navegador. Tokens de acesso e renovação ficam criptografados em
        cookie HttpOnly, com SameSite e Secure em produção. O cookie dura até sete dias e pode ser
        renovado durante o uso. Sair da conta apaga o cookie e solicita a revogação da sessão de
        renovação no Supabase. A hospedagem e o provedor podem manter registros técnicos de
        autenticação.
      </p>
      <p>
        Registramos no banco seu ID de usuário, operação, identificador e horário de cada
        autorização de tratamento para aplicar 10 usos semanais, renovados na segunda-feira à 0h de
        Brasília. A conta administrativa com e-mail confirmado é isenta dessa cota. Aplicações
        iniciadas consomem uso; cancelamentos e falhas após a autorização não devolvem
        automaticamente a cota. Importação, reprodução, exportação e histórico não consomem usos.
      </p>
      <p>
        Projetos e presets são separados por conta no navegador. A primeira conta que entrar mantém
        o workspace local anterior. Isso não criptografa os áudios contra acesso físico ou às
        ferramentas de desenvolvimento no mesmo perfil de navegador. Entrar em outro aparelho
        recupera a conta e o saldo, mas não os arquivos. Limpar os dados locais apaga os projetos e
        presets, sem apagar sua conta Supabase ou reiniciar o contador. Para exclusão da conta e
        registros associados, solicite ao administrador da plataforma; apagar o usuário Supabase
        elimina os registros de uso vinculados.
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
