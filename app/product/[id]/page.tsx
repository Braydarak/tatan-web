import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/ui/Header";
import ProductCard from "@/components/ui/productCard/ProductCard";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Truck,
  Leaf,
  Check,
  Heart,
  Star,
  Ruler,
  RotateCcw,
  Shield,
  Minus,
  Plus,
} from "lucide-react";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

type FullProduct = {
  id: string;
  name: string;
  imageSrc: string;
  price: number;
  originalPrice?: number;
  colorHex: string;
  category: "Body" | "Remera";
  description: string;
  features: string[];
  sizes: string[];
  colorVariants: { name: string; hex: string }[];
  badge?: "Nuevo" | "Top";
  relatedIds: string[];
};

const productImages = {
  bodyOsito:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20baby%20onesie%20body%20beige%20cotton%20with%20teddy%20bear%20print%20soft%20pastel%20colors%20flat%20lay%20kids%20clothing%20photography&image_size=square_hd",
  bodyNubes:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=adorable%20baby%20onesie%20body%20white%20with%20clouds%20and%20stars%20pastel%20blue%20pink%20soft%20cotton%20flat%20lay%20baby%20clothing&image_size=square_hd",
  bodyArcoiris:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20baby%20onesie%20rainbow%20print%20soft%20cream%20color%20cotton%20bodysuit%20flat%20lay%20aesthetic%20kids%20fashion&image_size=square_hd",
  bodyAnimalitos:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=baby%20bodysuit%20onesie%20sage%20green%20with%20cute%20safari%20animals%20print%20soft%20cotton%20flat%20lay%20aesthetic%20baby%20clothing&image_size=square_hd",
  remeraDino:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20kids%20t-shirt%20mustard%20yellow%20with%20cartoon%20dinosaur%20print%20soft%20cotton%20flat%20lay%20children%20clothing%20photography&image_size=square_hd",
  remeraFlores:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=adorable%20little%20girl%20t-shirt%20soft%20pink%20with%20cute%20flowers%20print%20cotton%20flat%20lay%20aesthetic%20kids%20fashion%20pastel&image_size=square_hd",
  remeraCohete:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20boys%20tshirt%20soft%20blue%20with%20rocket%20space%20print%20cotton%20flat%20lay%20kids%20clothing%20photography%20pastel%20colors&image_size=square_hd",
  remeraCorazones:
    "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=kids%20tshirt%20cream%20white%20with%20cute%20little%20hearts%20print%20soft%20cotton%20flat%20lay%20children%20fashion%20aesthetic&image_size=square_hd",
};

const FULL_PRODUCTS: Record<string, FullProduct> = {
  "b-001": {
    id: "b-001",
    name: "Body Osito Amor",
    imageSrc: productImages.bodyOsito,
    price: 12990,
    originalPrice: 15990,
    colorHex: "#F5E6D3",
    category: "Body",
    badge: "Nuevo",
    description:
      "Body de algodón orgánico con estampa de osito en tonos beige. Ideal para uso diario, super suave contra la piel delicada del bebé. Broches en la entrepierna para cambiarlo sin esfuerzo.",
    features: [
      "100% Algodón orgánico peinado",
      "Broches de presión sin níquel",
      "Costuras planas antirozaduras",
      "Pre lavado - no encoge",
    ],
    sizes: ["RN", "1M", "3M", "6M", "9M", "12M", "18M"],
    colorVariants: [
      { name: "Beige Osito", hex: "#F5E6D3" },
      { name: "Rosa Suave", hex: "#F8E0E8" },
      { name: "Menta", hex: "#D8E8D8" },
    ],
    relatedIds: ["b-002", "b-004", "r-004"],
  },
  "b-002": {
    id: "b-002",
    name: "Body Nubes y Estrellas",
    imageSrc: productImages.bodyNubes,
    price: 11990,
    colorHex: "#E8F0F8",
    category: "Body",
    badge: "Top",
    description:
      "Body clásico blanco con estampa de nubes y estrellitas en tonos pastel azul y rosa. Manga corta, escote redondo, ajuste perfecto para dormir o salir.",
    features: [
      "100% Algodón 30/1 extra suave",
      "Sin etiquetas en el cuello",
      "Secado rápido",
      "Reversible en modelos sin estampa",
    ],
    sizes: ["RN", "1M", "3M", "6M", "9M", "12M"],
    colorVariants: [
      { name: "Nubes Celeste", hex: "#E8F0F8" },
      { name: "Nubes Rosa", hex: "#F5EBF2" },
    ],
    relatedIds: ["b-001", "b-003", "r-002"],
  },
  "b-003": {
    id: "b-003",
    name: "Body Arcoiris Mágico",
    imageSrc: productImages.bodyArcoiris,
    price: 13490,
    colorHex: "#F0E8F5",
    category: "Body",
    description:
      "Body color crema con estampa de arcoiris multicolor. Pieza versátil que combina con todo. Regalo ideal para babyshower.",
    features: [
      "Algodón orgánico certificado GOTS",
      "Estampado atóxico sin plomo",
      "Mangas raglán con puños elásticos",
      "Talle amplio para mayor comodidad",
    ],
    sizes: ["RN", "1M", "3M", "6M", "9M", "12M", "18M", "24M"],
    colorVariants: [
      { name: "Crema Arcoiris", hex: "#F0E8F5" },
      { name: "Lila Claro", hex: "#E8E0F2" },
    ],
    relatedIds: ["b-002", "b-004", "r-004"],
  },
  "b-004": {
    id: "b-004",
    name: "Body Safari Animalitos",
    imageSrc: productImages.bodyAnimalitos,
    price: 14490,
    colorHex: "#D8E8D8",
    category: "Body",
    badge: "Nuevo",
    description:
      "Body verde salvia con estampado de animalitos de la selva: leoncitos, elefantitos y jirafitas. Manga larga perfecta para días frescos.",
    features: [
      "Algodón jersey pesado",
      "Manga larga con rib",
      "Broches en espalda para bebés grandotes",
      "Hipoalergénico",
    ],
    sizes: ["3M", "6M", "9M", "12M", "18M", "24M"],
    colorVariants: [
      { name: "Verde Safari", hex: "#D8E8D8" },
      { name: "Mostaza", hex: "#F5E6B8" },
    ],
    relatedIds: ["r-001", "r-003", "b-001"],
  },
  "r-001": {
    id: "r-001",
    name: "Remera Dino Aventura",
    imageSrc: productImages.remeraDino,
    price: 9990,
    originalPrice: 12990,
    colorHex: "#F5E6B8",
    category: "Remera",
    description:
      "Remera mostaza con estampa de dinosaurio aventurero. Unisex, combinable con pantalón jeans o jogging. Tejido fresco para el verano.",
    features: [
      "100% Algodón cardado",
      "Cuello redondo con rib reforzado",
      "Costura en hombros para mayor durabilidad",
      "Lavable a máquina 30°",
    ],
    sizes: ["1-2", "2-4", "4-6", "6-8"],
    colorVariants: [
      { name: "Mostaza Dino", hex: "#F5E6B8" },
      { name: "Verde Oliva", hex: "#D8E8C8" },
    ],
    relatedIds: ["r-003", "b-004", "r-002"],
  },
  "r-002": {
    id: "r-002",
    name: "Remera Flores Boho",
    imageSrc: productImages.remeraFlores,
    price: 10990,
    colorHex: "#F8E0E8",
    category: "Remera",
    badge: "Nuevo",
    description:
      "Remera rosa palo con estampa floreada estilo bohemio. Detalle de volados en mangas. Ideal para princesitas que aman el campo.",
    features: [
      "Algodón peinado 40/1 premium",
      "Volados en mangas con acabado enrollado",
      "Sin etiqueta trasera",
      "Talle entallado elegante",
    ],
    sizes: ["1-2", "2-4", "4-6", "6-8"],
    colorVariants: [
      { name: "Rosa Boho", hex: "#F8E0E8" },
      { name: "Crema", hex: "#FBF4EA" },
      { name: "Lila", hex: "#EBDCF0" },
    ],
    relatedIds: ["r-004", "b-003", "b-002"],
  },
  "r-003": {
    id: "r-003",
    name: "Remera Cohete Espacial",
    imageSrc: productImages.remeraCohete,
    price: 10490,
    originalPrice: 13490,
    colorHex: "#D8E8F5",
    category: "Remera",
    description:
      "Remera azul celeste con estampa de cohete espacial y planetas. Súper canchera para ir al jardín o cumpleaños temáticos.",
    features: [
      "Algodón jersey suave",
      "Estampado vinilo texturizado",
      "Cuello con refuerzo tapeta",
      "No se deforma con los lavados",
    ],
    sizes: ["2-4", "4-6", "6-8", "8-10"],
    colorVariants: [
      { name: "Celeste Cohete", hex: "#D8E8F5" },
      { name: "Gris", hex: "#E6E6EA" },
    ],
    relatedIds: ["r-001", "b-004", "r-004"],
  },
  "r-004": {
    id: "r-004",
    name: "Remera Corazones Dulces",
    imageSrc: productImages.remeraCorazones,
    price: 9490,
    colorHex: "#F5F0EB",
    category: "Remera",
    description:
      "Remera blanca cruda con estampado de corazones en rosas y rojos. Básica que no puede faltar. Perfecta como inner o sola.",
    features: [
      "Algodón 100% orgánico",
      "Blanco natural sin blanqueadores ópticos",
      "Talle clásico con espacio para crecer",
      "Apta para pieles atópicas",
    ],
    sizes: ["1-2", "2-4", "4-6", "6-8"],
    colorVariants: [
      { name: "Cruda Corazones", hex: "#F5F0EB" },
      { name: "Rosa Bebé", hex: "#FAE4EC" },
    ],
    relatedIds: ["r-002", "b-001", "b-003"],
  },
};

function getRelatedProducts(ids: string[]) {
  return ids
    .map((id) => FULL_PRODUCTS[id])
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      imageSrc: p.imageSrc,
      price: p.price,
      originalPrice: p.originalPrice,
      colorHex: p.colorHex,
      badge: p.badge,
    }));
}

export async function generateStaticParams() {
  return Object.keys(FULL_PRODUCTS).map((id) => ({ id }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = FULL_PRODUCTS[id];

  if (!product) {
    notFound();
  }

  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  const related = getRelatedProducts(product.relatedIds);

  return (
    <div className="min-h-dvh flex flex-col relative z-10">
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-tatan-primario4 transition-colors mb-6 group"
          >
            <ArrowLeft
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2.2}
            />
            Volver al inicio
          </Link>

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
            <div className="space-y-4">
              <div className="relative paper-card rounded-3xl p-4 sm:p-6 overflow-hidden">
                {discount > 0 && (
                  <div className="absolute top-5 left-5 bg-tatan-primario2 text-zinc-800 rounded-full w-14 h-14 flex flex-col items-center justify-center text-center text-xs font-bold leading-tight z-10 shadow-sm">
                    <span>{discount}%</span>
                    <span>OFF</span>
                  </div>
                )}
                {product.badge && (
                  <div className="absolute top-5 right-5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm z-10 border border-tatan-secundario1/50 bg-white text-zinc-700">
                    {product.badge}
                  </div>
                )}
                <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-tatan-primario1/40 to-tatan-primario2/40 p-6 sm:p-8 flex items-center justify-center relative">
                  <Image
                    src={product.imageSrc}
                    alt={product.name}
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 1024px) 90vw, 600px"
                    className="object-cover rounded-2xl drop-shadow-lg p-4 sm:p-6"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`flex-1 aspect-square paper-card rounded-2xl overflow-hidden p-2 transition-all ${
                      i === 0
                        ? "ring-2 ring-tatan-primario4/60"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Vista ${i + 1} del producto`}
                  >
                    <div className="relative w-full h-full rounded-xl bg-white/60">
                      <Image
                        src={product.imageSrc}
                        alt={`${product.name} vista ${i + 1}`}
                        fill
                        sizes="100px"
                        className="object-cover rounded-xl p-1"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="paper-card rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-tatan-primario2/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-700">
                      {product.category}
                    </span>
                    {discount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-tatan-acento-rosa/40 px-3 py-1 text-[11px] font-bold text-zinc-700">
                        Oferta limitada
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-zinc-800 leading-tight">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current"
                        strokeWidth={0}
                      />
                    ))}
                    <span className="ml-2 text-xs text-zinc-500 font-medium">
                      (124 reseñas)
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  {product.originalPrice && (
                    <span className="text-lg text-zinc-400 line-through font-medium">
                      ${product.originalPrice.toLocaleString("es-AR")}
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl font-extrabold text-tatan-acento-verde tracking-tight">
                    ${product.price.toLocaleString("es-AR")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-tatan-acento-verde/15 border border-tatan-acento-verde/30 px-3 py-2.5">
                    <Truck
                      className="w-4 h-4 text-tatan-acento-verde shrink-0"
                      strokeWidth={2.2}
                    />
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Envío gratis +$25k
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-tatan-acento-azul/20 border border-tatan-acento-azul/30 px-3 py-2.5">
                    <Leaf
                      className="w-4 h-4 text-green-700 shrink-0"
                      strokeWidth={2.2}
                    />
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Algodón orgánico
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm font-bold text-zinc-800">
                      Talle
                    </span>
                    <button className="text-xs font-semibold text-tatan-secundario2 hover:underline inline-flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" strokeWidth={2.2} />
                      Guía de talles
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {product.sizes.map((s, i) => (
                      <button
                        key={s}
                        className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          i === 2
                            ? "bg-tatan-primario4 text-white border-tatan-primario4 shadow-md"
                            : "bg-white/70 border-tatan-secundario1/40 text-zinc-700 hover:border-tatan-primario4/60"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-bold text-zinc-800 block mb-2.5">
                    Color
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    {product.colorVariants.map((c, i) => (
                      <button
                        key={c.name}
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 border transition-all ${
                          i === 0
                            ? "border-tatan-primario4/60 bg-white shadow-sm"
                            : "border-transparent bg-white/50 hover:bg-white"
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-zinc-200 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs font-semibold text-zinc-700">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-sm font-bold text-zinc-800 block mb-2.5">
                    Cantidad
                  </span>
                  <div className="inline-flex items-center rounded-2xl border border-tatan-secundario1/40 bg-white/80 overflow-hidden">
                    <button className="px-4 py-2.5 text-zinc-600 hover:text-tatan-primario4 hover:bg-tatan-primario1/40 transition-colors">
                      <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <span className="px-4 py-2.5 text-sm font-bold text-zinc-800 border-x border-tatan-secundario1/40">
                      1
                    </span>
                    <button className="px-4 py-2.5 text-zinc-600 hover:text-tatan-primario4 hover:bg-tatan-primario1/40 transition-colors">
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button className="btn-primary font-bold px-6 py-3.5 rounded-2xl text-base flex-1 inline-flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                    Agregar al carrito
                  </button>
                  <button className="px-6 py-3.5 rounded-2xl text-base font-bold border-2 border-tatan-primario4 bg-tatan-primario4/10 text-tatan-secundario2 hover:bg-tatan-primario4/20 transition-colors flex-1 inline-flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" strokeWidth={2.2} />
                    Comprar ahora
                  </button>
                </div>

                <button className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-zinc-600 hover:text-red-500 transition-colors py-1">
                  <Heart className="w-4 h-4" strokeWidth={2} />
                  Guardar en favoritos
                </button>
              </div>

              <div className="paper-card rounded-3xl p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-bold text-zinc-800">
                  Características
                </h2>
                <ul className="space-y-3">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-tatan-acento-verde/25 text-tatan-acento-verde flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-zinc-600 leading-relaxed">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="paper-card rounded-3xl p-6 sm:p-8">
                <h2 className="text-lg font-bold text-zinc-800 mb-5">
                  Descripción
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                  {product.description}
                </p>
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-tatan-secundario1/40">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-tatan-acento-azul/20 flex items-center justify-center text-tatan-acento-azul">
                      <Truck className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Envío 3-7 días
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-tatan-acento-rosa/30 flex items-center justify-center text-tatan-primario4">
                      <RotateCcw className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Cambios 30 días
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-tatan-acento-verde/20 flex items-center justify-center text-tatan-acento-verde">
                      <Shield className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-700 leading-tight">
                      Garantía 3 meses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-16 sm:mt-20">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="w-8 h-1 rounded-full bg-tatan-acento-rosa" />
                    <span className="text-xs font-bold uppercase tracking-wider text-tatan-secundario2">
                      También te puede gustar
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800">
                    Productos relacionados
                  </h2>
                </div>
              </div>
              <div className="grid gap-6 justify-items-center sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p, idx) => (
                  <ProductCard
                    key={`related-${p.id}`}
                    id={p.id}
                    title={p.name}
                    imageSrc={p.imageSrc}
                    originalPrice={p.originalPrice}
                    discountedPrice={p.price}
                    discountPercentage={
                      p.originalPrice
                        ? Math.round(
                            ((p.originalPrice - p.price) / p.originalPrice) *
                              100,
                          )
                        : undefined
                    }
                    installments={6}
                    installmentPrice={Math.round(p.price / 6)}
                    taxFreePrice={Math.round(p.price * 0.79)}
                    colorHex={p.colorHex}
                    productUrl={`/product/${p.id}`}
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
