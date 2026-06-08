import { LegalDocumentLayout } from "@/components/marketing/LegalDocumentLayout";

export const metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade do CopySell AI.",
};

export default function PrivacidadePage() {
  return (
    <LegalDocumentLayout
      title="Política de Privacidade"
      updatedAt="8 de junho de 2026"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Introdução</h2>
        <p className="text-muted-foreground">
          Esta Política descreve como o CopySell AI trata dados pessoais em
          conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº
          13.709/2018).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Dados que coletamos</h2>
        <ul className="text-muted-foreground list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Cadastro:</strong> nome, e-mail,
            telefone, segmento de venda e, opcionalmente, nome da empresa.
          </li>
          <li>
            <strong className="text-foreground">Uso do produto:</strong> imagens
            de produtos, nomes, categorias, notas enviadas à IA, anúncios
            gerados e edições realizadas.
          </li>
          <li>
            <strong className="text-foreground">Técnicos:</strong> logs de
            acesso, identificadores de sessão e métricas de uso para operação e
            segurança.
          </li>
          <li>
            <strong className="text-foreground">Pagamentos:</strong> informações
            relacionadas a planos e solicitações de upgrade, conforme o fluxo
            disponibilizado na plataforma.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Finalidades do tratamento</h2>
        <ul className="text-muted-foreground list-disc space-y-2 pl-5">
          <li>Autenticar usuários e prestar o serviço contratado;</li>
          <li>Gerar e armazenar anúncios com base nos dados enviados;</li>
          <li>Aplicar limites de plano, billing e suporte;</li>
          <li>Melhorar a qualidade do produto e da IA (incluindo análise agregada de edições);</li>
          <li>Cumprir obrigações legais e prevenir fraudes ou abusos.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Compartilhamento</h2>
        <p className="text-muted-foreground">
          Utilizamos provedores de infraestrutura e serviços essenciais, como
          hospedagem, banco de dados, autenticação e API de inteligência
          artificial, sempre na medida necessária para operar o produto. Não
          vendemos seus dados pessoais.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Retenção e segurança</h2>
        <p className="text-muted-foreground">
          Mantemos os dados enquanto sua conta estiver ativa ou conforme exigido
          por lei. Aplicamos controles técnicos e organizacionais razoáveis para
          proteger as informações, incluindo controle de acesso e criptografia em
          trânsito quando aplicável.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Seus direitos</h2>
        <p className="text-muted-foreground">
          Nos termos da LGPD, você pode solicitar confirmação de tratamento,
          acesso, correção, anonimização, portabilidade, eliminação de dados
          desnecessários, informação sobre compartilhamentos e revogação de
          consentimento, quando aplicável. Solicitações podem ser feitas pelo
          suporte na área logada.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Cookies e sessão</h2>
        <p className="text-muted-foreground">
          Utilizamos cookies e armazenamento local estritamente necessários para
          manter sua sessão autenticada e preferências básicas da interface.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Alterações</h2>
        <p className="text-muted-foreground">
          Esta política pode ser atualizada. A data da última revisão será
          indicada no topo desta página. Recomendamos revisá-la periodicamente.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
