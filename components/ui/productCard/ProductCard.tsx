"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCardProps } from "./types";

export default function ProductCard({
  id,
  imageSrc,
  title,
  originalPrice,
  discountedPrice,
  discountPercentage,
  installments,
  installmentPrice,
  taxFreePrice,
  showPointsBadge = false,
  colorHex = "#f5ebd9",
  productUrl = "#",
}: ProductCardProps) {
  // Estado para saber si el producto está en favoritos o no
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="w-full max-w-[320px] flex flex-col gap-3 font-sans group">
      <div className="relative background rounded-md p-5 flex justify-center items-center overflow-hidden border border-zinc-100">
        {discountPercentage && (
          <div className="absolute top-3 left-3 bg-tatan-primario2 text-zinc-800 rounded-full w-12 h-12 flex flex-col items-center justify-center text-center text-[11px] font-bold leading-tight z-10 shadow-sm">
            <span>{discountPercentage}%</span>
            <span>OFF</span>
          </div>
        )}

        {/* Botón de favoritos con la lógica de estado */}
        <button
          onClick={(e) => {
            e.preventDefault(); // Evita que se abra el link del producto al hacer clic en el corazón
            setIsFavorite(!isFavorite);
          }}
          className={`absolute top-3 right-3 transition-colors z-10 ${
            isFavorite ? "text-red-600" : "text-zinc-800 hover:text-zinc-500"
          }`}
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"} // Se rellena de rojo si es favorito
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        <Link href={productUrl} className="w-full h-full block">
          <Image
            src={imageSrc}
            alt={title}
            width={300}
            height={400}
            className="w-full h-auto object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        </Link>

        {showPointsBadge && (
          <div className="absolute bottom-3 right-3 bg-tatan-primario1 text-zinc-800 rounded-full w-[55px] h-[55px] flex flex-col items-center justify-center text-[10px] leading-tight z-10 shadow-sm">
            <span>Sumá</span>
            <strong className="font-bold">POINTS</strong>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1">
        <Link
          href={productUrl}
          className="hover:underline decoration-zinc-400 underline-offset-4"
        >
          <h3 className="text-sm text-zinc-700 uppercase m-0">{title}</h3>
        </Link>

        <div className="flex items-baseline gap-2 mt-0.5">
          {originalPrice && (
            <span className="text-[13px] text-zinc-400 line-through">
              $ {originalPrice.toLocaleString("es-AR")}
            </span>
          )}
        
          <span className="text-base text-[#4da96c] font-bold">
            $ {discountedPrice.toLocaleString("es-AR")}
          </span>
        </div>

        {installments && installmentPrice && (
          <p className="text-xs text-zinc-600 m-0">
            {installments} cuotas sin interés de{" "}
            <strong className="font-semibold">
              ${installmentPrice.toLocaleString("es-AR")}
            </strong>
          </p>
        )}

        {taxFreePrice && (
          <p className="text-[11px] text-zinc-500 m-0">
            Precio sin impuestos nacionales ${" "}
            {taxFreePrice.toLocaleString("es-AR")}
          </p>
        )}

        <div className="mt-2">
          <button
            className="w-5 h-5 rounded-full border border-zinc-400 cursor-pointer p-0 hover:ring-2 ring-offset-2 ring-zinc-300 transition-all"
            style={{ backgroundColor: colorHex }}
            aria-label={`Color del producto`}
          />
        </div>
      </div>
    </div>
  );
}