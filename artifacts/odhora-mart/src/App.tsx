import { createContext, type FormEvent, type ReactNode, useContext, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AdminPage from '@/pages/admin';
import { Route, Switch, useLocation, Router as WouterRouter, Link, useRoute } from 'wouter';
import { useCreateOrder, useGetProduct, useListProducts, getGetProductQueryKey, getListProductsQueryKey } from '@workspace/api-client-react';
import type { Product, OrderReceipt } from '@workspace/api-client-react';
import { bengaliProductName, orderStatusLabels } from '@/lib/bengali';
import { getProductCategoryGroup, productCategoryGroups } from '@/lib/product-categories';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronRight, CreditCard, Flower2, Heart, Leaf, Menu, Minus, PackageCheck, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Star, Trash2, Truck, X } from 'lucide-react';
import { useEffect } from 'react';

const queryClient = new QueryClient();

type CartEntry = { productId: string; quantity: number };
type CartApi = {
  items: CartEntry[];
  quantity: number;
  add: (id: string, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};
const CartContext = createContext<CartApi | null>(null);
function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('Cart context is unavailable');
  return value;
}
function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('odhora-cart') || '[]') as CartEntry[];
      return Array.isArray(parsed) ? parsed.filter((item) => item.productId && item.quantity > 0) : [];
    } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('odhora-cart', JSON.stringify(items)); }, [items]);
  const api = useMemo<CartApi>(() => ({
    items,
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    add: (id, quantity = 1) => setItems((current) => {
      const found = current.find((entry) => entry.productId === id);
      return found
        ? current.map((entry) => entry.productId === id ? { ...entry, quantity: Math.min(20, entry.quantity + quantity) } : entry)
        : [...current, { productId: id, quantity: Math.min(20, quantity) }];
    }),
    setQuantity: (id, quantity) => setItems((current) => quantity < 1
      ? current.filter((entry) => entry.productId !== id)
      : current.map((entry) => entry.productId === id ? { ...entry, quantity: Math.min(20, quantity) } : entry)),
    remove: (id) => setItems((current) => current.filter((entry) => entry.productId !== id)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
const money = (value: number) => `৳${new Intl.NumberFormat('en-BD').format(value)}`;

function Header() {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [isHome] = useRoute('/');
  const close = () => setOpen(false);
  return <>
    <div className="announcement" data-testid="text-announcement">একটু যত্ন, আপনার দরজায় — ক্যাশ অন ডেলিভারি সুবিধা</div>
    <header className="topbar">
      <div className="nav-inner">
        <button className="mobile-menu-toggle" type="button" aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'} onClick={() => setOpen(!open)} data-testid="button-mobile-menu">{open ? <X size={20}/> : <Menu size={20}/>}</button>
        <Link href="/" className="brand" onClick={close} data-testid="link-brand">
          <span className="brand-mark"><Flower2 size={20}/></span>
          <span className="brand-name">odh<span>ora</span> mart</span>
        </Link>
        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="প্রধান নেভিগেশন">
          <Link href="/" className={isHome ? 'active' : ''} onClick={close} data-testid="link-home">সব প্রোডাক্ট</Link>
          <Link href="/admin" className="admin-nav-link" onClick={close} data-testid="link-admin">অর্ডার দেখুন</Link>
          <a href="/#catalog" onClick={close} data-testid="link-catalog">বিউটি এডিট</a>
          <a href="/#our-promise" onClick={close} data-testid="link-our-promise">আমাদের প্রতিশ্রুতি</a>
        </nav>
        <div className="nav-actions">
          <Link href="/cart" className="cart-link" onClick={close} data-testid="link-cart">
            <ShoppingBag size={19}/><span>কার্ট</span><span className="cart-count" data-testid="text-cart-count">{cart.quantity}</span>
          </Link>
        </div>
      </div>
    </header>
  </>;
}
function Footer() {
  return <footer className="footer">
    <div className="footer-inner">
      <Link href="/" className="brand" data-testid="link-footer-brand"><span className="brand-mark"><Flower2 size={19}/></span><span className="brand-name">odh<span>ora</span> mart</span></Link>
      <span className="footer-note">প্রতিদিনের সৌন্দর্য, আরেকটু সহজ করে।</span>
      <div className="footer-links"><Link href="/" data-testid="link-footer-shop">কেনাকাটা</Link><Link href="/cart" data-testid="link-footer-cart">কার্ট</Link><a href="mailto:hello@odhoramart.com" data-testid="link-contact">যোগাযোগ করুন</a></div>
    </div>
  </footer>;
}
function Shell({ children }: { children: ReactNode }) {
  return <div className="site-shell"><Header/>{children}<Footer/></div>;
}
function LoadingGrid() {
  return <div className="product-grid" aria-label="পণ্য লোড হচ্ছে" data-testid="status-loading-products">
    {Array.from({ length: 8 }, (_, i) => <div key={i}><div className="skeleton skeleton-card"/><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line short"/></div>)}
  </div>;
}
function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <div className={`${className}${failed || !product.image ? ' product-fallback' : ''}`} data-testid={`img-product-${product.id}`}>
    {product.image && !failed ? <img src={product.image} alt={product.name} onError={() => setFailed(true)}/> : <Flower2 aria-hidden="true"/>}
  </div>;
}
function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  return <article className="product-card" data-testid={`card-product-${product.id}`}>
    <Link href={`/product/${product.id}`} className="product-image-wrap" data-testid={`link-product-${product.id}`} aria-label={`${product.name} দেখুন`}>
      <ProductImage product={product}/>
      {product.badge && <span className="product-badge" data-testid={`badge-product-${product.id}`}>{product.badge}</span>}
    </Link>
    <button className="quick-add" type="button" aria-label={`${product.name} কার্টে যোগ করুন`} title="কার্টে যোগ করুন" onClick={() => cart.add(product.id)} data-testid={`button-add-${product.id}`}><Plus size={19}/></button>
    <div className="product-info">
      <div className="product-brand" data-testid={`text-brand-${product.id}`}>{product.brand}</div>
      <Link href={`/product/${product.id}`} className="product-title" data-testid={`link-product-title-${product.id}`}>{product.name}</Link>
      <div className="product-meta"><span className="product-price" data-testid={`text-price-${product.id}`}>{money(product.price)}</span><span className="rating" data-testid={`text-rating-${product.id}`}><Star size={12} fill="currentColor"/>{Number(product.rating).toFixed(1)}</span></div>
    </div>
  </article>;
}
function Home() {
  const { data: products, isLoading, isError, refetch } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const [category, setCategory] = useState('সব');
  const [subcategory, setSubcategory] = useState('সব');
  const [search, setSearch] = useState('');
  const activeCategory = productCategoryGroups.find((group) => group.label === category);
  const filtered = useMemo(() => (products || []).filter((product) => {
    const productGroup = getProductCategoryGroup(product.category);
    const matchesCategory = category === 'সব' || productGroup === category;
    const matchesSubcategory = subcategory === 'সব' || product.category === subcategory;
    const searchText = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
    return matchesCategory && matchesSubcategory && searchText.includes(search.toLowerCase());
  }), [products, category, subcategory, search]);
  return <Shell>
    <main>
      <section className="hero" aria-label="ওধোরা মার্টে স্বাগতম">
        <div className="hero-copy">
          <span className="eyebrow">নিজের যত্নে কোমলতার ছোঁয়া</span>
          <h1>সুন্দর ত্বকের দিন<br/><em>শুরু হোক এখানেই</em></h1>
          <p>আপনার প্রতিদিনের প্রিয় বিউটি প্রোডাক্ট, যত্ন নিয়ে বাছাই করা এবং আপনার দরজায় পৌঁছে দেওয়া। ছোট ছোট জিনিসেই খুঁজে নিন নিজের আনন্দ।</p>
          <a href="#catalog" className="button-primary" data-testid="button-shop-the-edit">কেনাকাটা করুন <ArrowRight size={16}/></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="product-orbit"><div className="beauty-bottle"><div className="bottle-label"><strong>ODHORA</strong><span>প্রতিদিনের আভা</span></div></div><div className="mini-jar">কোমল ত্বক</div></div>
          <div className="hero-sticker">শুধু আপনার জন্য<br/>একটি মুহূর্ত</div>
        </div>
      </section>
      <section className="service-strip" aria-label="কেনাকাটার সুবিধা">
        <div className="service-item"><div className="service-icon"><Truck size={17}/></div><div><strong>যত্ন নিয়ে ডেলিভারি</strong><span>সারা বাংলাদেশে</span></div></div>
        <div className="service-item"><div className="service-icon"><ShieldCheck size={17}/></div><div><strong>শুধু ভালো প্রোডাক্ট</strong><span>আপনার রুটিনের জন্য বাছাই করা</span></div></div>
        <div className="service-item"><div className="service-icon"><CreditCard size={17}/></div><div><strong>পণ্য হাতে পেয়ে পেমেন্ট</strong><span>সহজ ক্যাশ অন ডেলিভারি</span></div></div>
      </section>
      <section className="page-wrap catalog-section" id="catalog">
        <div className="section-head"><div><span className="eyebrow">আপনার রুটিন, নতুন করে সাজানো</span><h2>ছোট ছোট বিউটি জিনিস</h2><p>প্রতিদিনের ভালো প্রোডাক্ট, আপনার কথা ভেবেই বাছাই করা</p></div></div>
        {products?.length ? <div className="catalog-filter-toolbar">
          <div className="catalog-category-filters">
            <div className="filter-row" role="group" aria-label="প্রধান পণ্য ক্যাটাগরি">
              <button className={`filter-chip ${category === 'সব' ? 'selected' : ''}`} onClick={() => { setCategory('সব'); setSubcategory('সব'); }} type="button" data-testid="filter-category-all">সব</button>
              {productCategoryGroups.map((group) => <button key={group.label} className={`filter-chip ${category === group.label ? 'selected' : ''}`} onClick={() => { setCategory(group.label); setSubcategory('সব'); }} type="button" data-testid={`filter-category-${group.label}`}>{group.label}</button>)}
            </div>
            {activeCategory && <div className="filter-row subcategory-filter-row" role="group" aria-label={`${activeCategory.label} উপক্যাটাগরি`}>
              <button className={`filter-chip ${subcategory === 'সব' ? 'selected' : ''}`} onClick={() => setSubcategory('সব')} type="button" data-testid="filter-subcategory-all">সব</button>
              {activeCategory.categories.map((item) => <button key={item} className={`filter-chip ${subcategory === item ? 'selected' : ''}`} onClick={() => setSubcategory(item)} type="button" data-testid={`filter-subcategory-${item}`}>{item}</button>)}
            </div>}
          </div>
          <label className="search-box"><Search size={15}/><input type="search" placeholder="পছন্দের পণ্য খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="পণ্য খুঁজুন" data-testid="input-product-search"/></label>
        </div> : null}
        {isLoading ? <LoadingGrid/> : isError ? <div className="status-error" data-testid="status-products-error"><strong>এই মুহূর্তে পণ্যগুলো লোড করা যাচ্ছে না।</strong><p>একটু পরে আবার চেষ্টা করুন।</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-products">আবার চেষ্টা করুন</button></div> : products?.length ? filtered.length ? <div className="product-grid" data-testid="grid-products">{filtered.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="state-box" data-testid="status-no-matching-products">এই খোঁজে কোনো পণ্য পাওয়া যায়নি। অন্য শব্দ বা ক্যাটাগরি দিয়ে চেষ্টা করুন।</div> : <div className="state-box" data-testid="status-empty-products"><Sparkles size={28}/><p>আমরা পণ্যগুলো প্রস্তুত করছি। শিগগিরই আবার দেখুন।</p></div>}
      </section>
      <section className="why-section" id="our-promise">
        <div className="why-inner">
          <div className="why-copy"><span className="eyebrow">ওধোরা মার্টের অনুভূতি</span><h2>সৌন্দর্য হোক<br/>আপনার মতো</h2><p>জটিল বা কঠিন কিছু নয়। নিজের ত্বকে ভালো লাগার ছোট ছোট অভ্যাসের জন্য বেছে নেওয়া যত্নের পণ্য।</p><a href="#catalog" className="button-outline" data-testid="button-explore-products">পছন্দের পণ্য খুঁজুন <ArrowRight size={15}/></a></div>
          <div className="promise-list">
            <div className="promise"><Leaf size={19}/><strong>যত্ন নিয়ে বাছাই করা</strong><p>প্রতিদিনের এমন প্রয়োজনীয় পণ্য, যা আমরা নিজেরাও ব্যবহার করতে পছন্দ করি।</p></div>
            <div className="promise"><Heart size={19}/><strong>প্রতিটি পার্সেলে যত্ন</strong><p>বন্ধুর জন্য উপহার সাজানোর মতো যত্নে প্রতিটি অর্ডার প্যাক করি।</p></div>
            <div className="promise"><PackageCheck size={19}/><strong>অর্ডার থেকে ডেলিভারি—সবই সহজ</strong><p>সহজ অর্ডার, পরিষ্কার চেকআউট, বাড়তি কোনো ঝামেলা নেই।</p></div>
            <div className="promise"><BadgeCheck size={19}/><strong>প্রয়োজনে আমরা পাশে</strong><p>প্রতিটি অর্ডারের পেছনে আছি আমরা—একটি ছোট, আন্তরিক দল।</p></div>
          </div>
        </div>
      </section>
      <section className="newsletter">
        <div><h2>একটু আভায় জায়গা করে নিন।</h2><p>ওধোরা মার্টের নতুন দৈনন্দিন পছন্দগুলো দেখুন।</p></div>
        <a href="#catalog" className="button-primary" data-testid="button-browse-collection">কালেকশন দেখুন <ArrowRight size={15}/></a>
      </section>
    </main>
  </Shell>;
}

function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const id = params?.id || '';
  const { data: product, isLoading, isError, refetch } = useGetProduct(id, { query: { queryKey: getGetProductQueryKey(id), enabled: !!id } });
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (isLoading) return <Shell><main className="page-wrap"><div className="detail-layout"><div className="skeleton skeleton-card"/><div><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line short"/></div></div></main></Shell>;
  if (isError || !product) return <Shell><main className="page-wrap"><div className="status-error" data-testid="status-product-error"><strong>এই পছন্দের পণ্যটি খুঁজে পাওয়া যায়নি।</strong><p>পণ্যটি হয়তো সরানো হয়েছে, অথবা এখন পাওয়া যাচ্ছে না।</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-product">আবার চেষ্টা করুন</button><p><Link href="/" data-testid="link-back-to-shop">দোকানে ফিরে যান</Link></p></div></main></Shell>;
  return <Shell><main className="page-wrap">
    <div className="breadcrumbs"><Link href="/" data-testid="link-breadcrumb-shop">কেনাকাটা</Link><ChevronRight size={13}/><span>{product.category}</span><ChevronRight size={13}/><span>{product.name}</span></div>
    <section className="detail-layout">
      <ProductImage product={product} className="detail-image"/>
      <div className="detail-copy">
        <span className="product-brand" data-testid="text-detail-brand">{product.brand}</span>
        {product.badge && <span className="product-badge" style={{position:'static',display:'inline-block',marginLeft:11}} data-testid="badge-detail">{product.badge}</span>}
        <h1 data-testid="text-detail-name">{product.name}</h1>
        <div className="rating" data-testid="text-detail-rating"><Star size={14} fill="currentColor"/>{Number(product.rating).toFixed(1)} <span>· ক্রেতাদের ভালোবাসা</span></div>
        <p className="description" data-testid="text-detail-description">{product.description}</p>
        <div className="detail-price" data-testid="text-detail-price">{money(product.price)}</div>
        <div className="buy-row">
          <div className="quantity-control" aria-label="পণ্যের পরিমাণ"><button type="button" aria-label="পরিমাণ কমান" onClick={() => setQuantity(Math.max(1, quantity - 1))} data-testid="button-quantity-decrease"><Minus size={15}/></button><span data-testid="text-detail-quantity">{quantity}</span><button type="button" aria-label="পরিমাণ বাড়ান" onClick={() => setQuantity(Math.min(20, quantity + 1))} data-testid="button-quantity-increase"><Plus size={15}/></button></div>
          <button className="button-primary" type="button" onClick={() => { cart.add(product.id, quantity); setAdded(true); }} data-testid="button-detail-add"><ShoppingBag size={16}/>{added ? 'কার্টে যোগ হয়েছে' : 'কার্টে যোগ করুন'}</button>
        </div>
        <div className="detail-points"><div><Truck size={16}/>সারা বাংলাদেশে ডেলিভারি</div><div><CreditCard size={16}/>পণ্য হাতে পেয়ে ক্যাশে পেমেন্ট করুন</div><div><ShieldCheck size={16}/>ওধোরা মার্টের যত্নে বাছাই করা</div></div>
      </div>
    </section>
  </main></Shell>;
}

function Cart() {
  const cart = useCart();
  const { data: products, isLoading, isError, refetch } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const lines = cart.items.map((entry) => ({ ...entry, product: products?.find((p) => p.id === entry.productId) })).filter((line): line is CartEntry & { product: Product } => !!line.product);
  const missingIds = cart.items.filter((entry) => !products?.some((product) => product.id === entry.productId)).map((entry) => entry.productId);
  const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);
  if (!cart.items.length) return <Shell><main className="page-wrap"><div className="empty-state"><div className="empty-illustration"><ShoppingBag size={34}/></div><span className="eyebrow">আপনার কার্টে এখনো কিছু নেই</span><h1>আপনার কার্ট খালি</h1><p>আপনার পছন্দের দৈনন্দিন বিউটি পণ্যটি খুঁজে নিতে একবার ঘুরে দেখুন।</p><Link href="/" className="button-primary" data-testid="button-empty-shop"><ArrowLeft size={15}/>কেনাকাটা শুরু করুন</Link></div></main></Shell>;
  return <Shell><main className="page-wrap">
    <div className="breadcrumbs"><Link href="/" data-testid="link-cart-continue">কেনাকাটা</Link><ChevronRight size={13}/><span>আপনার কার্ট</span></div>
    <h1 className="page-title" data-testid="text-cart-title">আপনার কার্ট <span style={{fontSize:'.52em',color:'#987e89',fontWeight:500}}>({cart.quantity} টি পণ্য)</span></h1>
    {isLoading ? <div className="state-box" data-testid="status-cart-loading">আপনার কার্ট প্রস্তুত হচ্ছে...</div> : isError ? <div className="status-error" data-testid="status-cart-error"><strong>কার্টের পণ্যের তথ্য আনা যায়নি।</strong><p>আপনার সংরক্ষিত পণ্যগুলো এখানে আছে। আবার চেষ্টা করুন।</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-cart">আবার চেষ্টা করুন</button></div> : <div className="cart-layout">
      <div className="cart-lines">{lines.map(({ product, quantity }) => <article className="cart-line" key={product.id} data-testid={`row-cart-item-${product.id}`}>
        <ProductImage product={product} className="cart-thumb"/>
        <div><div className="cart-product-brand">{product.brand}</div><h2 className="cart-product-name">{product.name}</h2><div className="cart-line-price">প্রতি পিস {money(product.price)}</div></div>
        <div className="cart-line-right">
          <div className="quantity-control"><button type="button" aria-label={`${product.name} পরিমাণ কমান`} onClick={() => cart.setQuantity(product.id, quantity - 1)} data-testid={`button-cart-decrease-${product.id}`}><Minus size={14}/></button><span data-testid={`text-cart-quantity-${product.id}`}>{quantity}</span><button type="button" aria-label={`${product.name} পরিমাণ বাড়ান`} onClick={() => cart.setQuantity(product.id, quantity + 1)} data-testid={`button-cart-increase-${product.id}`}><Plus size={14}/></button></div>
          <strong data-testid={`text-cart-line-total-${product.id}`}>{money(product.price * quantity)}</strong>
          <button className="remove-item" type="button" aria-label={`${product.name} সরান`} onClick={() => cart.remove(product.id)} data-testid={`button-remove-${product.id}`}><Trash2 size={16}/></button>
        </div>
      </article>)}
      {missingIds.length > 0 && <div className="error-message" data-testid="status-cart-missing-product">সংরক্ষিত একটি পণ্য আর পাওয়া যাচ্ছে না। <button type="button" onClick={() => missingIds.forEach((id) => cart.remove(id))} data-testid="button-remove-unavailable">পণ্যটি সরান</button></div>}
      </div>
      <aside className="summary-card"><h2>সংক্ষিপ্ত বিবরণ</h2><div className="summary-row"><span>সাবটোটাল</span><span data-testid="text-cart-subtotal">{money(subtotal)}</span></div><div className="summary-row"><span>ডেলিভারি চার্জ</span><span>চেকআউটে নিশ্চিত হবে</span></div><div className="summary-row total"><span>সম্ভাব্য মোট</span><span data-testid="text-cart-total">{money(subtotal)}</span></div><div className="summary-note">ক্যাশ অন ডেলিভারিতে কেনাকাটা সহজ। পরের ধাপে ডেলিভারির তথ্য নিশ্চিত করা হবে।</div><Link href="/checkout" className="button-primary" data-testid="button-proceed-checkout">চেকআউটে যান <ArrowRight size={15}/></Link><Link href="/" className="button-outline" style={{width:'100%',marginTop:10}} data-testid="button-continue-shopping">আরও দেখুন</Link></aside>
    </div>}
  </main></Shell>;
}

type CheckoutFields = { customerName: string; phone: string; email: string; address: string; city: string; area: string; note: string };
const blankFields: CheckoutFields = { customerName: '', phone: '', email: '', address: '', city: '', area: '', note: '' };
function Checkout() {
  const cart = useCart();
  const { data: products, isLoading, isError, refetch } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const order = useCreateOrder();
  const [fields, setFields] = useState(blankFields);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [errorText, setErrorText] = useState('');
  const lines = cart.items.map((entry) => ({ ...entry, product: products?.find((p) => p.id === entry.productId) })).filter((line): line is CartEntry & { product: Product } => !!line.product);
  const missingIds = cart.items.filter((entry) => !products?.some((product) => product.id === entry.productId)).map((entry) => entry.productId);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const setField = (key: keyof CheckoutFields, value: string) => setFields((prev) => ({ ...prev, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorText('');
    if (!lines.length) { setErrorText('আপনার কার্ট খালি। অর্ডার করার আগে একটি পণ্য যোগ করুন।'); return; }
    if (lines.some((line) => line.quantity > 20)) { setErrorText('প্রতিটি পণ্যের পরিমাণ ২০ বা তার কম রাখুন।'); return; }
    order.mutate({ data: {
      customerName: fields.customerName.trim(), phone: fields.phone.trim(),
      email: fields.email.trim() || null, address: fields.address.trim(),
      city: fields.city.trim(), area: fields.area.trim() || null,
      note: fields.note.trim() || null,
      items: lines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
    } }, {
      onSuccess: (result) => { setReceipt(result); cart.clear(); },
      onError: () => setErrorText('এই মুহূর্তে অর্ডারটি করা যায়নি। আপনার কার্টের পণ্যগুলো আছে—তথ্য যাচাই করে আবার চেষ্টা করুন।'),
    });
  };
  if (receipt) return <Shell><main className="page-wrap"><section className="receipt" data-testid="status-order-success"><div className="receipt-check"><Check size={30}/></div><span className="eyebrow">অর্ডার পেয়েছি</span><h1>এবারের দায়িত্ব আমাদের।</h1><p>ধন্যবাদ, {fields.customerName}। আপনার ক্যাশ অন ডেলিভারি অর্ডারটি পেয়েছি। শিগগিরই নিশ্চিত করে পার্সেল পাঠানোর জন্য আপনার সঙ্গে যোগাযোগ করব।</p><div className="receipt-code" data-testid="text-order-number">অর্ডার {receipt.orderNumber}</div><div className="receipt-total" data-testid="text-order-total">{money(receipt.total)} <span style={{fontSize:12,fontWeight:500}}>{receipt.currency}</span></div><p data-testid="text-order-status">অবস্থা: {orderStatusLabels[receipt.status]}</p><Link href="/" className="button-primary" data-testid="button-order-continue">দোকানে ফিরে যান <ArrowRight size={15}/></Link></section></main></Shell>;
  if (!cart.items.length) return <Shell><main className="page-wrap"><div className="empty-state"><div className="empty-illustration"><ShoppingBag size={34}/></div><h1>আপনার কার্ট খালি</h1><p>আগে পছন্দের কিছু বিউটি পণ্য যোগ করুন, তারপর সেগুলো আপনার কাছে পৌঁছে দেব।</p><Link href="/" className="button-primary" data-testid="button-checkout-empty-shop">বিউটি পণ্য দেখুন <ArrowRight size={15}/></Link></div></main></Shell>;
  if (isLoading) return <Shell><main className="page-wrap"><div className="state-box" data-testid="status-checkout-loading">আপনার অর্ডারের বিবরণ প্রস্তুত হচ্ছে...</div></main></Shell>;
  if (isError || !products) return <Shell><main className="page-wrap"><div className="status-error" data-testid="status-checkout-products-error"><strong>এখনই অর্ডারের বিবরণ নিশ্চিত করা যাচ্ছে না।</strong><p>আপনার সংরক্ষিত কার্ট ঠিক আছে। চেকআউটের আগে আবার চেষ্টা করুন।</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-checkout-products">আবার চেষ্টা করুন</button></div></main></Shell>;
  return <Shell><main className="page-wrap">
    <div className="breadcrumbs"><Link href="/cart" data-testid="link-back-to-cart">আপনার কার্ট</Link><ChevronRight size={13}/><span>ডেলিভারির তথ্য</span></div>
    <h1 className="page-title" data-testid="text-checkout-title">আপনার কাছে পৌঁছে দিই।</h1>
    <p style={{fontSize:13,color:'#806d75',margin:'0 0 23px'}}>ক্যাশ অন ডেলিভারি অর্ডারের জন্য কয়েকটি তথ্য দিন।</p>
    <div className="checkout-layout">
      <div><div className="cod-mark"><CreditCard size={21}/><span><strong>ক্যাশ অন ডেলিভারি</strong><br/>ওধোরা মার্টের পার্সেল হাতে পেয়ে পেমেন্ট করুন।</span></div>
        {errorText && <div className="error-message" role="alert" data-testid="status-checkout-error">{errorText}</div>}
        {missingIds.length > 0 && <div className="error-message" data-testid="status-checkout-unavailable">আপনার সংরক্ষিত কার্টের কিছু পণ্য আর পাওয়া যাচ্ছে না। <button type="button" onClick={() => missingIds.forEach((id) => cart.remove(id))} data-testid="button-remove-checkout-unavailable">পণ্য সরান</button></div>}
        <form className="checkout-form" onSubmit={submit} data-testid="form-checkout">
          <div className="form-field"><label htmlFor="customerName">পুরো নাম *</label><input id="customerName" name="customerName" autoComplete="name" minLength={2} maxLength={100} required value={fields.customerName} onChange={(e) => setField('customerName',e.target.value)} placeholder="ডেলিভারির জন্য নাম লিখুন" data-testid="input-customer-name"/></div>
          <div className="form-field"><label htmlFor="phone">মোবাইল নম্বর *</label><input id="phone" name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={20} required value={fields.phone} onChange={(e) => setField('phone',e.target.value)} placeholder="01XXXXXXXXX" data-testid="input-phone"/></div>
          <div className="form-field full"><label htmlFor="email">ইমেইল ঠিকানা <span style={{fontWeight:400,color:'#987e89'}}>· ঐচ্ছিক</span></label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} value={fields.email} onChange={(e) => setField('email',e.target.value)} placeholder="ইমেইল ঠিকানা লিখুন" data-testid="input-email"/></div>
          <div className="form-field full"><label htmlFor="address">ডেলিভারির ঠিকানা *</label><textarea id="address" name="address" autoComplete="street-address" minLength={5} maxLength={500} required value={fields.address} onChange={(e) => setField('address',e.target.value)} placeholder="বাড়ি, সড়ক এবং দরকারি দিকনির্দেশনা লিখুন" data-testid="input-address"/></div>
          <div className="form-field"><label htmlFor="city">শহর বা জেলা *</label><input id="city" name="city" autoComplete="address-level2" minLength={2} maxLength={100} required value={fields.city} onChange={(e) => setField('city',e.target.value)} placeholder="ঢাকা" data-testid="input-city"/></div>
          <div className="form-field"><label htmlFor="area">এলাকা <span style={{fontWeight:400,color:'#987e89'}}>· ঐচ্ছিক</span></label><input id="area" name="area" maxLength={100} value={fields.area} onChange={(e) => setField('area',e.target.value)} placeholder="আপনার এলাকা" data-testid="input-area"/></div>
          <div className="form-field full"><label htmlFor="note">ডেলিভারি নোট <span style={{fontWeight:400,color:'#987e89'}}>· ঐচ্ছিক</span></label><textarea id="note" name="note" maxLength={1000} value={fields.note} onChange={(e) => setField('note',e.target.value)} placeholder="আপনাকে খুঁজে পেতে সাহায্য করবে এমন তথ্য লিখুন" data-testid="input-note"/></div>
          <button className="button-primary" type="submit" disabled={order.isPending || !lines.length} data-testid="button-place-order">{order.isPending ? 'অর্ডার করা হচ্ছে...' : <>অর্ডার করুন <ArrowRight size={15}/></>}</button>
        </form>
      </div>
      <aside className="summary-card"><h2>আপনার অর্ডার</h2>{lines.map(({ product, quantity }) => <div className="summary-row" key={product.id} data-testid={`row-checkout-item-${product.id}`}><span>{bengaliProductName(product.name)} × {quantity}</span><strong>{money(product.price * quantity)}</strong></div>)}<div className="summary-row"><span>ডেলিভারি চার্জ</span><span>শিগগিরই নিশ্চিত করা হবে</span></div><div className="summary-row total"><span>পরিশোধযোগ্য মোট</span><span data-testid="text-checkout-total">{money(total)}</span></div><div className="summary-note">অনলাইনে কোনো টাকা কাটা হবে না। পণ্য হাতে পেয়ে নগদে পরিশোধ করুন।</div></aside>
    </div>
  </main></Shell>;
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <CartProvider>
            <Router />
          </CartProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
