import type { Product } from "@workspace/api-zod";

export const products: Product[] = [
  {
    id: "rosewater-glow-serum",
    name: "Rosewater Glow Serum",
    brand: "Odhora Beauty",
    description:
      "A lightweight daily serum with a dewy finish, made to layer comfortably under moisturizer and makeup.",
    price: 890,
    category: "Skincare",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    badge: "Bestseller",
  },
  {
    id: "cloud-soft-moisturizer",
    name: "Cloud Soft Moisturizer",
    brand: "Odhora Beauty",
    description:
      "A silky, everyday face cream that leaves skin feeling soft and comfortable without a heavy finish.",
    price: 760,
    category: "Skincare",
    image:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85",
    rating: 4.7,
    badge: "Daily essential",
  },
  {
    id: "petal-tint-lip-oil",
    name: "Petal Tint Lip Oil",
    brand: "Lumière",
    description:
      "A glossy lip oil with a sheer rosy tint for a soft, comfortable pop of colour.",
    price: 540,
    category: "Makeup",
    image:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85",
    rating: 4.9,
    badge: "Just in",
  },
  {
    id: "soft-focus-blush",
    name: "Soft Focus Cream Blush",
    brand: "Lumière",
    description:
      "A blendable cream blush that adds a fresh wash of colour and a natural-looking finish.",
    price: 680,
    category: "Makeup",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
    rating: 4.6,
    badge: "Fan favourite",
  },
  {
    id: "silk-drop-hair-oil",
    name: "Silk Drop Hair Oil",
    brand: "Nourish & Co.",
    description:
      "A few drops smooth the look of dry ends and add a soft, polished shine to your styling routine.",
    price: 980,
    category: "Haircare",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    badge: "Bestseller",
  },
  {
    id: "botanical-hair-mask",
    name: "Botanical Hair Mask",
    brand: "Nourish & Co.",
    description:
      "A rich weekly hair treatment that leaves strands feeling softer and easier to comb through.",
    price: 1150,
    category: "Haircare",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85",
    rating: 4.7,
    badge: "Weekly ritual",
  },
  {
    id: "soft-musk-eau-de-parfum",
    name: "Soft Musk Eau de Parfum",
    brand: "Maison Odhora",
    description:
      "A gentle, close-to-skin fragrance with warm musk and a clean floral note.",
    price: 1890,
    category: "Fragrance",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    badge: "Gift pick",
  },
  {
    id: "everyday-sunscreen-spf",
    name: "Everyday Sunscreen SPF 50",
    brand: "Odhora Beauty",
    description:
      "A lightweight daily sunscreen with a smooth feel designed to sit comfortably under makeup.",
    price: 1250,
    category: "Skincare",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85",
    rating: 4.9,
    badge: "Everyday SPF",
  },
];
