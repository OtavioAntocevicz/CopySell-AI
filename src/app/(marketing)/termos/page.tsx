import { LegalDocumentLayout } from "@/components/marketing/LegalDocumentLayout";

export const metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso do CopySell AI.",
};

export default function TermosPage() {
  return (
    <LegalDocumentLayout title="Termos de Uso" updatedAt="8 de junho de 2026">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Aceitação</h2>
        <p className="text-muted-foreground">
          Ao criar uma conta ou utilizar o CopySell AI, você concorda com estes
          Termos de Uso. Se não concordar, não utilize o serviço.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. O serviço</h2>
        <p className="text-muted-foreground">
          O CopySell AI é uma plataforma que utiliza inteligência artificial
          para auxiliar na criação de textos de anúncios para marketplaces a
          partir de informações e imagens fornecidas pelo usuário. Os resultados
          são sugestões: cabe ao usuário revisar, editar e validar o conteúdo
          antes de publicar em qualquer marketplace.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Conta e responsabilidades</h2>
        <p className="text-muted-foreground">
          Você é responsável por manter a confidencialidade das credenciais de
          acesso, por informar dados corretos no cadastro e por todo conteúdo
          enviado à plataforma (imagens, nomes de produtos, descrições e notas).
          Não utilize o serviço para fins ilícitos ou que violem direitos de
          terceiros.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Planos, limites e pagamentos</h2>
        <p className="text-muted-foreground">
          O uso do serviço pode estar sujeito a limites conforme o plano
          contratado. Valores, ciclos de cobrança e benefícios de cada plano
          estão descritos na página de planos. Alterações de plano podem seguir
          fluxo de solicitação conforme disponibilizado na plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Propriedade intelectual</h2>
        <p className="text-muted-foreground">
          A marca, interface e software do CopySell AI pertencem ao operador do
          serviço. O conteúdo gerado a partir dos seus insumos é disponibilizado
          para seu uso comercial na medida em que você possua direitos sobre as
          imagens e informações enviadas.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Limitação de responsabilidade</h2>
        <p className="text-muted-foreground">
          O serviço é fornecido &quot;como está&quot;. Não garantimos resultados
          específicos de vendas, posicionamento ou aprovação em marketplaces. A
          IA pode produzir informações imprecisas; revise sempre o conteúdo
          antes de publicar.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. Suspensão e encerramento</h2>
        <p className="text-muted-foreground">
          Podemos suspender ou encerrar contas em caso de violação destes termos,
          uso abusivo, inadimplência ou exigência legal. Você pode solicitar o
          encerramento da conta pelos canais de suporte disponíveis na
          plataforma.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. Alterações e contato</h2>
        <p className="text-muted-foreground">
          Estes termos podem ser atualizados periodicamente. O uso continuado após
          alterações constitui aceitação da nova versão. Dúvidas podem ser
          encaminhadas pelo formulário de suporte na área logada.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
