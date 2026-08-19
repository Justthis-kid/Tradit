import { ArrowRight, ChevronDown, Heart, Search, ShoppingBag, Wallet } from 'lucide-react';
import './_group.css';

type Product = {
  id: string;
  brand: string;
  name: string;
  category: string;
  sizeRange: string;
  color: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  badge: string | null;
};

// Developers: update this list to change the pairs shown in the shop.
export const products: Product[] = [
  { id: 'p1', brand: 'Nike', name: "Air Force 1 '07", category: 'Sneakers', sizeRange: '6–13', color: 'Summit White / Gum', price: 78, originalPrice: 115, imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85', badge: 'Most loved' },
  { id: 'p2', brand: 'New Balance', name: '550 Heritage', category: 'Sneakers', sizeRange: '5–12', color: 'Sea Salt / Red', price: 92, originalPrice: 130, imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85', badge: 'Fresh drop' },
  { id: 'p3', brand: 'Salomon', name: 'XT-6 Expanse', category: 'Outdoor', sizeRange: '7–13', color: 'Black / Desert Sage', price: 110, originalPrice: 160, imageUrl: 'https://images.unsplash.com/photo-1554130849-1f6a06f2d8f3?auto=format&fit=crop&w=1000&q=85', badge: 'Trail ready' },
  { id: 'p4', brand: 'adidas', name: 'Samba OG', category: 'Sneakers', sizeRange: '6–11', color: 'Core Black / Gum', price: 84, originalPrice: 100, imageUrl: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=1000&q=85', badge: null },
  { id: 'p5', brand: 'ASICS', name: 'Gel-Kayano 14', category: 'Running', sizeRange: '7–12', color: 'Cream / Silver', price: 118, originalPrice: 150, imageUrl: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1000&q=85', badge: 'Good condition' },
  { id: 'p6', brand: 'Dr. Martens', name: '1460 Smooth', category: 'Boots', sizeRange: '5–10', color: 'Cherry Red', price: 96, originalPrice: 170, imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1000&q=85', badge: 'Vintage find' },
];

function Brand() {
  return <div className="flex items-center gap-2.5"><span className="brand-mark">T</span><span className="brand-word">tradit</span></div>;
}

function ProductCard({ product }: { product: Product }) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  return <article className="product-card group">
    <div className="relative aspect-[.92] overflow-hidden rounded-[4px] bg-[#eee8dc]">
      <img src={product.imageUrl} alt={`${product.brand} ${product.name}`} className="product-media h-full w-full object-cover" />
      <button aria-label={`Save ${product.name}`} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#17130d] transition hover:bg-[#f4b000]"><Heart size={16} /></button>
      <div className="absolute bottom-3 left-3 flex gap-2">
        {product.badge && <span className="rounded-sm bg-[#17130d] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white">{product.badge}</span>}
        <span className="rounded-sm bg-[#f4b000] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#17130d]">-{discount}%</span>
      </div>
    </div>
    <div className="flex justify-between gap-4 py-3">
      <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#756c5f]">{product.brand}</p><h3 className="mt-1 text-[15px] font-bold">{product.name}</h3><p className="mt-1 text-xs text-[#756c5f]">Size {product.sizeRange} · {product.color}</p></div>
      <div className="text-right"><p className="text-sm font-extrabold">${product.price}</p><p className="text-xs text-[#958c80] line-through">${product.originalPrice}</p></div>
    </div>
  </article>;
}

function WalletPanel() {
  return <section className="wallet-panel mx-auto max-w-[1240px] px-5 pb-16 lg:px-8">
    <div className="overflow-hidden rounded-[4px] bg-[#17130d] text-white">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:p-10">
        <div><div className="flex items-center gap-2 text-[#f4b000]"><Wallet size={18} /><span className="text-xs font-bold uppercase tracking-[.16em]">Tradit credits</span></div><p className="mt-5 text-5xl font-extrabold tracking-[-.06em]">$0.00</p><p className="mt-2 text-sm text-white/60">Available to spend on your next pair</p><div className="mt-8 flex flex-wrap gap-3"><button className="rounded-sm bg-[#f4b000] px-4 py-2.5 text-sm font-bold text-[#17130d]">Trade in a pair <ArrowRight size={15} className="ml-2 inline" /></button><button className="rounded-sm border border-white/20 px-4 py-2.5 text-sm font-bold text-white">View wallet</button></div></div>
        <div className="border-t border-white/15 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><div className="flex items-center justify-between"><h3 className="font-bold">Credit history</h3><span className="text-xs text-white/45">All activity</span></div><div className="mt-5 flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-sm font-semibold">No credits yet</p><p className="mt-1 text-xs text-white/50">Trade in footwear to get started</p></div><span className="font-mono text-sm text-white/60">$0.00</span></div><div className="mt-5 rounded-sm bg-[#2a241b] p-4"><p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#f4b000]">Your credit allowance</p><p className="mt-2 text-sm text-white/70">Trade-in value appears here as <strong className="text-white">pending</strong> while we review your pair.</p><p className="mt-2 font-mono text-lg text-white">$0.00 pending</p></div></div>
      </div>
    </div>
  </section>;
}

export function Current() {
  return <div className="tradit-current min-h-screen">
    <header className="sticky top-0 z-40 border-b border-[#ded6c8] bg-[#fffdf8]/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 lg:px-8"><Brand /><nav className="hidden items-center gap-7 md:flex"><span className="text-sm font-bold">Shop</span><span className="text-sm text-[#756c5f]">Sell</span><span className="text-sm text-[#756c5f]">Trade in</span><span className="text-sm text-[#756c5f]">Community</span></nav><div className="flex items-center gap-2"><button aria-label="Search" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f4b000]/20"><Search size={18} /></button><button aria-label="Wallet" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f4b000]/20"><Wallet size={18} /></button><button aria-label="Bag" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#f4b000]/20"><ShoppingBag size={18} /></button></div></div>
    </header>
    <main>
      <section className="hero-surface"><div className="mx-auto grid max-w-[1240px] items-end gap-10 px-5 py-14 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-20"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#f4b000]">The footwear marketplace</p><h1 className="mt-5 max-w-[620px] text-[clamp(3.5rem,8vw,7.2rem)] font-extrabold leading-[.86] tracking-[-.08em] text-white">Good pairs.<br /><span className="text-[#f4b000]">Better stories.</span></h1><p className="mt-7 max-w-md text-base leading-7 text-white/65">Shop pre-loved footwear from people with good taste. Wear it well, then pass it on.</p><div className="mt-8 flex flex-wrap gap-3"><button className="rounded-sm bg-[#f4b000] px-5 py-3 text-sm font-bold text-[#17130d]">Shop the edit <ArrowRight size={16} className="ml-2 inline" /></button><button className="rounded-sm border border-white/25 px-5 py-3 text-sm font-bold text-white">Trade a pair</button></div></div><div className="hero-photo hidden lg:block"><img src="https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=85" alt="Sneakers ready for a new home" /></div></div></section>
      <section className="mx-auto max-w-[1240px] px-5 py-14 lg:px-8 lg:py-20"><div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#756c5f]">Fresh from the community</p><h2 className="mt-2 text-4xl font-extrabold tracking-[-.06em] sm:text-5xl">Shop the edit</h2></div><button className="flex items-center gap-1 text-sm font-bold">Filter & sort <ChevronDown size={16} /></button></div><div className="mb-8 flex gap-2 overflow-x-auto pb-1"><span className="whitespace-nowrap rounded-sm bg-[#17130d] px-4 py-2 text-xs font-bold text-white">All pairs</span>{['Sneakers', 'Outdoor', 'Running', 'Boots'].map((tag) => <span key={tag} className="whitespace-nowrap rounded-sm border border-[#ded6c8] px-4 py-2 text-xs font-bold">{tag}</span>)}</div><div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></section>
      <WalletPanel />
    </main>
    <footer className="border-t border-[#ded6c8] px-5 py-8 text-center text-xs text-[#756c5f]">tradit · footwear with a second life</footer>
  </div>;
}