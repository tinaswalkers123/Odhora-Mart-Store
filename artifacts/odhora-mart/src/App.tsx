import { createContext, type FormEvent, type ReactNode, useContext, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter, Link, useRoute } from 'wouter';
import { useCreateOrder, useGetProduct, useListProducts, getGetProductQueryKey, getListProductsQueryKey } from '@workspace/api-client-react';
import type { Product, OrderReceipt } from '@workspace/api-client-react';
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
    <div className="announcement" data-testid="text-announcement">A LITTLE CARE, DELIVERED TO YOUR DOOR — CASH ON DELIVERY AVAILABLE</div>
    <header className="topbar">
      <div className="nav-inner">
        <button className="mobile-menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)} data-testid="button-mobile-menu">{open ? <X size={20}/> : <Menu size={20}/>}</button>
        <Link href="/" className="brand" onClick={close} data-testid="link-brand">
          <span className="brand-mark"><Flower2 size={20}/></span>
          <span className="brand-name">odh<span>ora</span> mart</span>
        </Link>
        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          <Link href="/" className={isHome ? 'active' : ''} onClick={close} data-testid="link-home">Shop all</Link>
          <a href="/#catalog" onClick={close} data-testid="link-catalog">Beauty edit</a>
          <a href="/#our-promise" onClick={close} data-testid="link-our-promise">Our promise</a>
        </nav>
        <div className="nav-actions">
          <Link href="/cart" className="cart-link" onClick={close} data-testid="link-cart">
            <ShoppingBag size={19}/><span>Bag</span><span className="cart-count" data-testid="text-cart-count">{cart.quantity}</span>
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
      <span className="footer-note">Everyday beauty, made a little easier.</span>
      <div className="footer-links"><Link href="/" data-testid="link-footer-shop">Shop</Link><Link href="/cart" data-testid="link-footer-cart">Your bag</Link><a href="mailto:hello@odhoramart.com" data-testid="link-contact">Get in touch</a></div>
    </div>
  </footer>;
}
function Shell({ children }: { children: ReactNode }) {
  return <div className="site-shell"><Header/>{children}<Footer/></div>;
}
function LoadingGrid() {
  return <div className="product-grid" aria-label="Loading products" data-testid="status-loading-products">
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
    <Link href={`/product/${product.id}`} className="product-image-wrap" data-testid={`link-product-${product.id}`} aria-label={`View ${product.name}`}>
      <ProductImage product={product}/>
      {product.badge && <span className="product-badge" data-testid={`badge-product-${product.id}`}>{product.badge}</span>}
    </Link>
    <button className="quick-add" type="button" aria-label={`Add ${product.name} to bag`} title="Add to bag" onClick={() => cart.add(product.id)} data-testid={`button-add-${product.id}`}><Plus size={19}/></button>
    <div className="product-info">
      <div className="product-brand" data-testid={`text-brand-${product.id}`}>{product.brand}</div>
      <Link href={`/product/${product.id}`} className="product-title" data-testid={`link-product-title-${product.id}`}>{product.name}</Link>
      <div className="product-meta"><span className="product-price" data-testid={`text-price-${product.id}`}>{money(product.price)}</span><span className="rating" data-testid={`text-rating-${product.id}`}><Star size={12} fill="currentColor"/>{Number(product.rating).toFixed(1)}</span></div>
    </div>
  </article>;
}
function Home() {
  const { data: products, isLoading, isError, refetch } = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const categories = useMemo(() => ['All', ...Array.from(new Set((products || []).map((p) => p.category).filter(Boolean)))], [products]);
  const filtered = (products || []).filter((p) => (category === 'All' || p.category === category) && `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(search.toLowerCase()));
  return <Shell>
    <main>
      <section className="hero" aria-label="Welcome to Odhora Mart">
        <div className="hero-copy">
          <span className="eyebrow">A softer kind of self-care</span>
          <h1>Good skin days<br/>start <em>right here.</em></h1>
          <p>Your everyday beauty favorites, thoughtfully picked and delivered with care. Find the little things that make you feel like you.</p>
          <a href="#catalog" className="button-primary" data-testid="button-shop-the-edit">Shop the edit <ArrowRight size={16}/></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="product-orbit"><div className="beauty-bottle"><div className="bottle-label"><strong>ODHORA</strong><span>DAILY GLOW</span></div></div><div className="mini-jar">SOFT SKIN</div></div>
          <div className="hero-sticker">A moment<br/>just for you</div>
        </div>
      </section>
      <section className="service-strip" aria-label="Shopping benefits">
        <div className="service-item"><div className="service-icon"><Truck size={17}/></div><div><strong>Delivered with care</strong><span>Across Bangladesh</span></div></div>
        <div className="service-item"><div className="service-icon"><ShieldCheck size={17}/></div><div><strong>Only the good stuff</strong><span>Picked for your routine</span></div></div>
        <div className="service-item"><div className="service-icon"><CreditCard size={17}/></div><div><strong>Pay when it arrives</strong><span>Easy cash on delivery</span></div></div>
      </section>
      <section className="page-wrap catalog-section" id="catalog">
        <div className="section-head"><div><span className="eyebrow">Your routine, refreshed</span><h2>Little beauty things</h2><p>Good everyday finds, chosen with you in mind.</p></div></div>
        {products?.length ? <div className="filter-row" aria-label="Product filters">
          {categories.map((item) => <button key={item} className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)} type="button" data-testid={`filter-category-${item}`}>{item}</button>)}
          <label className="search-box"><Search size={15}/><input type="search" placeholder="Find your favorite..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" data-testid="input-product-search"/></label>
        </div> : null}
        {isLoading ? <LoadingGrid/> : isError ? <div className="status-error" data-testid="status-products-error"><strong>We couldn’t load the shelves just now.</strong><p>Please try again in a moment.</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-products">Try again</button></div> : products?.length ? filtered.length ? <div className="product-grid" data-testid="grid-products">{filtered.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="state-box" data-testid="status-no-matching-products">No beauty finds match that search. Try another word or category.</div> : <div className="state-box" data-testid="status-empty-products"><Sparkles size={28}/><p>We’re getting the good stuff ready. Please check back soon.</p></div>}
      </section>
      <section className="why-section" id="our-promise">
        <div className="why-inner">
          <div className="why-copy"><span className="eyebrow">The Odhora feeling</span><h2>Beauty should feel<br/>like you.</h2><p>Not complicated. Not intimidating. Just thoughtful products for the little rituals that help you feel good in your own skin.</p><a href="#catalog" className="button-outline" data-testid="button-explore-products">Find your favorites <ArrowRight size={15}/></a></div>
          <div className="promise-list">
            <div className="promise"><Leaf size={19}/><strong>Thoughtfully chosen</strong><p>Everyday essentials we’d happily keep on our own shelf.</p></div>
            <div className="promise"><Heart size={19}/><strong>Care in every parcel</strong><p>We pack each order with the same care as a gift for a friend.</p></div>
            <div className="promise"><PackageCheck size={19}/><strong>Easy from start to door</strong><p>A simple order, a clear checkout, and no surprises.</p></div>
            <div className="promise"><BadgeCheck size={19}/><strong>Here when you need us</strong><p>A small shop with real people behind every order.</p></div>
          </div>
        </div>
      </section>
      <section className="newsletter">
        <div><h2>Make room for a little glow.</h2><p>Browse the latest everyday finds from Odhora Mart.</p></div>
        <a href="#catalog" className="button-primary" data-testid="button-browse-collection">Browse the collection <ArrowRight size={15}/></a>
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
  if (isError || !product) return <Shell><main className="page-wrap"><div className="status-error" data-testid="status-product-error"><strong>We couldn’t find that beauty favorite.</strong><p>It may have moved, or it might be having a little rest.</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-product">Try again</button><p><Link href="/" data-testid="link-back-to-shop">Back to the shop</Link></p></div></main></Shell>;
  return <Shell><main className="page-wrap">
    <div className="breadcrumbs"><Link href="/" data-testid="link-breadcrumb-shop">Shop</Link><ChevronRight size={13}/><span>{product.category}</span><ChevronRight size={13}/><span>{product.name}</span></div>
    <section className="detail-layout">
      <ProductImage product={product} className="detail-image"/>
      <div className="detail-copy">
        <span className="product-brand" data-testid="text-detail-brand">{product.brand}</span>
        {product.badge && <span className="product-badge" style={{position:'static',display:'inline-block',marginLeft:11}} data-testid="badge-detail">{product.badge}</span>}
        <h1 data-testid="text-detail-name">{product.name}</h1>
        <div className="rating" data-testid="text-detail-rating"><Star size={14} fill="currentColor"/>{Number(product.rating).toFixed(1)} <span>· A little customer love</span></div>
        <p className="description" data-testid="text-detail-description">{product.description}</p>
        <div className="detail-price" data-testid="text-detail-price">{money(product.price)}</div>
        <div className="buy-row">
          <div className="quantity-control" aria-label="Quantity selector"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))} data-testid="button-quantity-decrease"><Minus size={15}/></button><span data-testid="text-detail-quantity">{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(Math.min(20, quantity + 1))} data-testid="button-quantity-increase"><Plus size={15}/></button></div>
          <button className="button-primary" type="button" onClick={() => { cart.add(product.id, quantity); setAdded(true); }} data-testid="button-detail-add"><ShoppingBag size={16}/>{added ? 'Added to your bag' : 'Add to bag'}</button>
        </div>
        <div className="detail-points"><div><Truck size={16}/>Delivery available across Bangladesh</div><div><CreditCard size={16}/>Pay with cash when your order arrives</div><div><ShieldCheck size={16}/>Thoughtfully selected by Odhora Mart</div></div>
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
  if (!cart.items.length) return <Shell><main className="page-wrap"><div className="empty-state"><div className="empty-illustration"><ShoppingBag size={34}/></div><span className="eyebrow">Your bag is taking a breather</span><h1>A little space for something lovely.</h1><p>Your bag is empty for now. Take a look around and find an everyday favorite to bring home.</p><Link href="/" className="button-primary" data-testid="button-empty-shop"><ArrowLeft size={15}/>Explore the shop</Link></div></main></Shell>;
  return <Shell><main className="page-wrap">
    <div className="breadcrumbs"><Link href="/" data-testid="link-cart-continue">Shop</Link><ChevronRight size={13}/><span>Your bag</span></div>
    <h1 className="page-title" data-testid="text-cart-title">Your bag <span style={{fontSize:'.52em',color:'#987e89',fontWeight:500}}>({cart.quantity} items)</span></h1>
    {isLoading ? <div className="state-box" data-testid="status-cart-loading">Gathering your bag...</div> : isError ? <div className="status-error" data-testid="status-cart-error"><strong>We couldn’t fetch your bag details.</strong><p>Your saved items are still here. Please try again.</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-cart">Try again</button></div> : <div className="cart-layout">
      <div className="cart-lines">{lines.map(({ product, quantity }) => <article className="cart-line" key={product.id} data-testid={`row-cart-item-${product.id}`}>
        <ProductImage product={product} className="cart-thumb"/>
        <div><div className="cart-product-brand">{product.brand}</div><h2 className="cart-product-name">{product.name}</h2><div className="cart-line-price">{money(product.price)} each</div></div>
        <div className="cart-line-right">
          <div className="quantity-control"><button type="button" aria-label={`Decrease ${product.name}`} onClick={() => cart.setQuantity(product.id, quantity - 1)} data-testid={`button-cart-decrease-${product.id}`}><Minus size={14}/></button><span data-testid={`text-cart-quantity-${product.id}`}>{quantity}</span><button type="button" aria-label={`Increase ${product.name}`} onClick={() => cart.setQuantity(product.id, quantity + 1)} data-testid={`button-cart-increase-${product.id}`}><Plus size={14}/></button></div>
          <strong data-testid={`text-cart-line-total-${product.id}`}>{money(product.price * quantity)}</strong>
          <button className="remove-item" type="button" aria-label={`Remove ${product.name}`} onClick={() => cart.remove(product.id)} data-testid={`button-remove-${product.id}`}><Trash2 size={16}/></button>
        </div>
      </article>)}
      {missingIds.length > 0 && <div className="error-message" data-testid="status-cart-missing-product">A saved product is no longer available. <button type="button" onClick={() => missingIds.forEach((id) => cart.remove(id))} data-testid="button-remove-unavailable">Remove unavailable item{missingIds.length > 1 ? 's' : ''}</button></div>}
      </div>
      <aside className="summary-card"><h2>A quick summary</h2><div className="summary-row"><span>Subtotal</span><span data-testid="text-cart-subtotal">{money(subtotal)}</span></div><div className="summary-row"><span>Delivery</span><span>Confirmed at checkout</span></div><div className="summary-row total"><span>Estimated total</span><span data-testid="text-cart-total">{money(subtotal)}</span></div><div className="summary-note">Cash on delivery keeps checkout simple. We’ll confirm delivery details in the next step.</div><Link href="/checkout" className="button-primary" data-testid="button-proceed-checkout">Continue to checkout <ArrowRight size={15}/></Link><Link href="/" className="button-outline" style={{width:'100%',marginTop:10}} data-testid="button-continue-shopping">Keep browsing</Link></aside>
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
    if (!lines.length) { setErrorText('Your bag is empty. Add a product before placing an order.'); return; }
    if (lines.some((line) => line.quantity > 20)) { setErrorText('Please keep each product quantity at 20 or below.'); return; }
    order.mutate({ data: {
      customerName: fields.customerName.trim(), phone: fields.phone.trim(),
      email: fields.email.trim() || null, address: fields.address.trim(),
      city: fields.city.trim(), area: fields.area.trim() || null,
      note: fields.note.trim() || null,
      items: lines.map(({ product, quantity }) => ({ productId: product.id, quantity })),
    } }, {
      onSuccess: (result) => { setReceipt(result); cart.clear(); },
      onError: () => setErrorText('Your order could not be placed just yet. Your bag is safe — please check your details and try again.'),
    });
  };
  if (receipt) return <Shell><main className="page-wrap"><section className="receipt" data-testid="status-order-success"><div className="receipt-check"><Check size={30}/></div><span className="eyebrow">Order received</span><h1>We’ll take it from here.</h1><p>Thank you, {fields.customerName}. Your cash-on-delivery order is confirmed. We’ll be in touch to get your parcel on its way.</p><div className="receipt-code" data-testid="text-order-number">Order {receipt.orderNumber}</div><div className="receipt-total" data-testid="text-order-total">{money(receipt.total)} <span style={{fontSize:12,fontWeight:500}}>{receipt.currency}</span></div><p data-testid="text-order-status">Status: {receipt.status}</p><Link href="/" className="button-primary" data-testid="button-order-continue">Back to the shop <ArrowRight size={15}/></Link></section></main></Shell>;
  if (!cart.items.length) return <Shell><main className="page-wrap"><div className="empty-state"><div className="empty-illustration"><ShoppingBag size={34}/></div><h1>Your bag is empty.</h1><p>Add a few everyday favorites first, then we’ll help you get them home.</p><Link href="/" className="button-primary" data-testid="button-checkout-empty-shop">Browse beauty finds <ArrowRight size={15}/></Link></div></main></Shell>;
  if (isLoading) return <Shell><main className="page-wrap"><div className="state-box" data-testid="status-checkout-loading">Preparing your order summary...</div></main></Shell>;
  if (isError || !products) return <Shell><main className="page-wrap"><div className="status-error" data-testid="status-checkout-products-error"><strong>We can’t confirm your order details yet.</strong><p>Your saved bag is safe. Please retry before checking out.</p><button className="button-outline" onClick={() => void refetch()} data-testid="button-retry-checkout-products">Try again</button></div></main></Shell>;
  return <Shell><main className="page-wrap">
    <div className="breadcrumbs"><Link href="/cart" data-testid="link-back-to-cart">Your bag</Link><ChevronRight size={13}/><span>Delivery details</span></div>
    <h1 className="page-title" data-testid="text-checkout-title">Let’s get it to you.</h1>
    <p style={{fontSize:13,color:'#806d75',margin:'0 0 23px'}}>Share a few details for your cash-on-delivery order.</p>
    <div className="checkout-layout">
      <div><div className="cod-mark"><CreditCard size={21}/><span><strong>Cash on delivery</strong><br/>Pay when your Odhora parcel arrives at your door.</span></div>
        {errorText && <div className="error-message" role="alert" data-testid="status-checkout-error">{errorText}</div>}
        {missingIds.length > 0 && <div className="error-message" data-testid="status-checkout-unavailable">Some products in your saved bag are no longer available. <button type="button" onClick={() => missingIds.forEach((id) => cart.remove(id))} data-testid="button-remove-checkout-unavailable">Remove unavailable item{missingIds.length > 1 ? 's' : ''}</button></div>}
        <form className="checkout-form" onSubmit={submit} data-testid="form-checkout">
          <div className="form-field"><label htmlFor="customerName">Your name *</label><input id="customerName" name="customerName" autoComplete="name" minLength={2} maxLength={100} required value={fields.customerName} onChange={(e) => setField('customerName',e.target.value)} placeholder="Name for the delivery" data-testid="input-customer-name"/></div>
          <div className="form-field"><label htmlFor="phone">Phone number *</label><input id="phone" name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={20} required value={fields.phone} onChange={(e) => setField('phone',e.target.value)} placeholder="01XXXXXXXXX" data-testid="input-phone"/></div>
          <div className="form-field full"><label htmlFor="email">Email address <span style={{fontWeight:400,color:'#987e89'}}>· optional</span></label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} value={fields.email} onChange={(e) => setField('email',e.target.value)} placeholder="you@example.com" data-testid="input-email"/></div>
          <div className="form-field full"><label htmlFor="address">Street address *</label><textarea id="address" name="address" autoComplete="street-address" minLength={5} maxLength={500} required value={fields.address} onChange={(e) => setField('address',e.target.value)} placeholder="House, road, and any helpful directions" data-testid="input-address"/></div>
          <div className="form-field"><label htmlFor="city">City or district *</label><input id="city" name="city" autoComplete="address-level2" minLength={2} maxLength={100} required value={fields.city} onChange={(e) => setField('city',e.target.value)} placeholder="Dhaka" data-testid="input-city"/></div>
          <div className="form-field"><label htmlFor="area">Area <span style={{fontWeight:400,color:'#987e89'}}>· optional</span></label><input id="area" name="area" maxLength={100} value={fields.area} onChange={(e) => setField('area',e.target.value)} placeholder="Neighborhood or area" data-testid="input-area"/></div>
          <div className="form-field full"><label htmlFor="note">Delivery note <span style={{fontWeight:400,color:'#987e89'}}>· optional</span></label><textarea id="note" name="note" maxLength={1000} value={fields.note} onChange={(e) => setField('note',e.target.value)} placeholder="Anything that will help us find you" data-testid="input-note"/></div>
          <button className="button-primary" type="submit" disabled={order.isPending || !lines.length} data-testid="button-place-order">{order.isPending ? 'Placing your order...' : <>Place cash-on-delivery order <ArrowRight size={15}/></>}</button>
        </form>
      </div>
      <aside className="summary-card"><h2>Your order</h2>{lines.map(({ product, quantity }) => <div className="summary-row" key={product.id} data-testid={`row-checkout-item-${product.id}`}><span>{product.name} × {quantity}</span><strong>{money(product.price * quantity)}</strong></div>)}<div className="summary-row"><span>Delivery</span><span>Confirmed soon</span></div><div className="summary-row total"><span>Total to pay</span><span data-testid="text-checkout-total">{money(total)}</span></div><div className="summary-note">Nothing is charged online. Pay in cash when your order arrives.</div></aside>
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
