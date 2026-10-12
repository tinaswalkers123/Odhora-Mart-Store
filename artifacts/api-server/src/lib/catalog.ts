import type { Product } from "@workspace/api-zod";

export const products: Product[] = [
  {
    id: "rosewater-glow-serum",
    name: "রোজওয়াটার গ্লো সিরাম",
    brand: "Odhora Beauty",
    description:
      "হালকা দৈনন্দিন সিরাম, যা ত্বকে শিশিরভেজা আভা আনে। ময়েশ্চারাইজার ও মেকআপের নিচে আরামদায়কভাবে ব্যবহার করা যায়।",
    price: 890,
    category: "ত্বকের যত্ন",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    badge: "বেস্টসেলার",
  },
  {
    id: "cloud-soft-moisturizer",
    name: "ক্লাউড সফট ময়েশ্চারাইজার",
    brand: "Odhora Beauty",
    description:
      "রেশমের মতো নরম, প্রতিদিনের এই ফেস ক্রিম ত্বককে কোমল ও আরামদায়ক রাখে, ভারী ভাব ছাড়াই।",
    price: 760,
    category: "ত্বকের যত্ন",
    image:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=900&q=85",
    rating: 4.7,
    badge: "প্রতিদিনের প্রয়োজন",
  },
  {
    id: "petal-tint-lip-oil",
    name: "পেটাল টিন্ট লিপ অয়েল",
    brand: "Lumière",
    description:
      "হালকা গোলাপি আভাযুক্ত চকচকে লিপ অয়েল, যা ঠোঁটে নরম ও আরামদায়ক রং এনে দেয়।",
    price: 540,
    category: "মেকআপ",
    image:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85",
    rating: 4.9,
    badge: "নতুন এসেছে",
  },
  {
    id: "soft-focus-blush",
    name: "সফট ফোকাস ক্রিম ব্লাশ",
    brand: "Lumière",
    description:
      "সহজে মিশে যাওয়া ক্রিম ব্লাশ, যা গালে সতেজ রং ও স্বাভাবিক আভা যোগ করে।",
    price: 680,
    category: "মেকআপ",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
    rating: 4.6,
    badge: "সবার পছন্দ",
  },
  {
    id: "silk-drop-hair-oil",
    name: "সিল্ক ড্রপ হেয়ার অয়েল",
    brand: "Nourish & Co.",
    description:
      "কয়েক ফোঁটায় শুষ্ক চুলের ডগা মসৃণ দেখায় এবং চুলের সাজে দেয় কোমল, ঝলমলে আভা।",
    price: 980,
    category: "চুলের যত্ন",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    badge: "বেস্টসেলার",
  },
  {
    id: "botanical-hair-mask",
    name: "বোটানিক্যাল হেয়ার মাস্ক",
    brand: "Nourish & Co.",
    description:
      "সপ্তাহে একবারের সমৃদ্ধ হেয়ার ট্রিটমেন্ট, যা চুলকে করে আরও কোমল ও আঁচড়ানো সহজ।",
    price: 1150,
    category: "চুলের যত্ন",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85",
    rating: 4.7,
    badge: "সাপ্তাহিক যত্ন",
  },
  {
    id: "soft-musk-eau-de-parfum",
    name: "সফট মাস্ক ইও দ্য পারফাম",
    brand: "Maison Odhora",
    description:
      "উষ্ণ মাস্ক ও পরিচ্ছন্ন ফুলেল ঘ্রাণের কোমল পারফিউম—ত্বকের কাছাকাছি মৃদু সুবাস।",
    price: 1890,
    category: "সুগন্ধি",
    image:
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=85",
    rating: 4.8,
    badge: "উপহারের পছন্দ",
  },
  {
    id: "everyday-sunscreen-spf",
    name: "প্রতিদিনের সানস্ক্রিন SPF ৫০",
    brand: "Odhora Beauty",
    description:
      "হালকা দৈনন্দিন সানস্ক্রিন, যার মসৃণ অনুভূতি মেকআপের নিচে ব্যবহারেও আরাম দেয়।",
    price: 1250,
    category: "ত্বকের যত্ন",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85",
    rating: 4.9,
    badge: "প্রতিদিনের SPF",
  },
];
