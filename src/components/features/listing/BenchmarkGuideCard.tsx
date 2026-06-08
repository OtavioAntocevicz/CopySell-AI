import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QUALITY_ISSUE_LABELS, QUALITY_ISSUE_TAGS } from "@/domains/listing/quality-feedback";

const BENCHMARK_CATEGORIES = [
  "eletrônicos",
  "ferramentas",
  "moda",
  "casa e decoração",
  "esporte",
  "beleza",
  "automotivo",
  "outros",
];

export function BenchmarkGuideCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Guia de benchmark (15 produtos)</CardTitle>
        <CardDescription>
          Varie categorias e fotos reais. Depois de cada geração, abra o anúncio
          e use &quot;Avaliar qualidade&quot; nos piores casos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-2 font-medium">
            Sugestão de categorias para cobrir:
          </p>
          <p className="text-muted-foreground">
            {BENCHMARK_CATEGORIES.join(" · ")}
          </p>
        </div>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5">
          {QUALITY_ISSUE_TAGS.map((tag) => (
            <li key={tag}>{QUALITY_ISSUE_LABELS[tag]}</li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">
          Nos piores resultados, clique em Editar, ajuste como publicaria e Salvar
          - isso alimenta o painel Admin → IA.
        </p>
      </CardContent>
    </Card>
  );
}
