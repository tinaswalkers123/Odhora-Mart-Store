export const productCategoryGroups = [
  {
    label: "স্কিন কেয়ার",
    categories: [
      "ফেসওয়াশ",
      "ময়েশ্চারাইজার",
      "সিরাম",
      "সানস্ক্রিন",
      "টোনার",
      "ফেস মাস্ক",
      "স্ক্রাব",
      "আই ক্রিম",
      "নাইট ক্রিম",
      "ডে ক্রিম",
    ],
  },
  {
    label: "মেকআপ",
    categories: [
      "লিপস্টিক",
      "লিকুইড লিপস্টিক",
      "লিপ গ্লস",
      "কাজল",
      "আইলাইনার",
      "মাসকারা",
      "আইশ্যাডো",
      "ফাউন্ডেশন",
      "কনসিলার",
      "কমপ্যাক্ট পাউডার",
      "ব্লাশ অন",
      "হাইলাইটার",
      "নেইলপলিশ",
    ],
  },
  {
    label: "হেয়ার কেয়ার",
    categories: [
      "শ্যাম্পু",
      "কন্ডিশনার",
      "হেয়ার অয়েল",
      "হেয়ার সিরাম",
      "হেয়ার মাস্ক",
    ],
  },
  {
    label: "বডি কেয়ার",
    categories: [
      "বডি লোশন",
      "বডি ওয়াশ",
      "হ্যান্ড ক্রিম",
      "ফুট ক্রিম",
      "বডি স্ক্রাব",
      "ডিওডোরেন্ট",
    ],
  },
  {
    label: "পারফিউম",
    categories: ["পারফিউম", "বডি স্প্রে"],
  },
  {
    label: "অন্যান্য",
    categories: ["ফেস টিস্যু", "কটন প্যাড", "মেকআপ ব্রাশ", "বিউটি ব্লেন্ডার"],
  },
] as const;

const parentCategoryByName = new Map<string, string>(
  productCategoryGroups.flatMap((group) =>
    group.categories.map((category) => [category, group.label] as const),
  ),
);

export function getProductCategoryGroup(category: string) {
  return parentCategoryByName.get(category);
}
