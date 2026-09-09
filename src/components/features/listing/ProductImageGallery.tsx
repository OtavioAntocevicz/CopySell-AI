"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  imageUrls: string[];
  productName: string;
};

export function ProductImageGallery({ imageUrls, productName }: Props) {
  if (imageUrls.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotos do produto</CardTitle>
        <CardDescription>
          {imageUrls.length === 1
            ? "Imagem enviada na geração."
            : `${imageUrls.length} imagens enviadas na geração.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={
            imageUrls.length === 1
              ? "relative aspect-square max-w-xs overflow-hidden rounded-lg border"
              : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:max-w-2xl"
          }
        >
          {imageUrls.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={url}
                alt={`${productName} — foto ${i + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 50vw, 240px"
                unoptimized
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
