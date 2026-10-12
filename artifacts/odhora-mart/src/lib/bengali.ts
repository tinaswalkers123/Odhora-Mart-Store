const legacyProductNames: Record<string, string> = {
  'Rosewater Glow Serum': 'রোজওয়াটার গ্লো সিরাম',
  'Cloud Soft Moisturizer': 'ক্লাউড সফট ময়েশ্চারাইজার',
  'Petal Tint Lip Oil': 'পেটাল টিন্ট লিপ অয়েল',
  'Soft Focus Cream Blush': 'সফট ফোকাস ক্রিম ব্লাশ',
  'Silk Drop Hair Oil': 'সিল্ক ড্রপ হেয়ার অয়েল',
  'Botanical Hair Mask': 'বোটানিক্যাল হেয়ার মাস্ক',
  'Soft Musk Eau de Parfum': 'সফট মাস্ক ইও দ্য পারফাম',
  'Everyday Sunscreen SPF 50': 'প্রতিদিনের সানস্ক্রিন SPF ৫০',
};

export function bengaliProductName(name: string) {
  return legacyProductNames[name] ?? name;
}

export const orderStatusLabels = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  shipped: 'পাঠানো হয়েছে',
  delivered: 'পৌঁছে দেওয়া হয়েছে',
  cancelled: 'বাতিল',
} as const;
