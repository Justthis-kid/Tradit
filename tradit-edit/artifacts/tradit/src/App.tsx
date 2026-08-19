import { type ReactNode, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  FileImage,
  Footprints,
  Heart,
  ImagePlus,
  Leaf,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  ReceiptText,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  getGetCreditBalanceQueryKey,
  getGetDashboardQueryKey,
  getListProductsQueryKey,
  useCreateCheckout,
  useDecideTradeIn,
  useGetCreditBalance,
  useGetDashboard,
  useListProducts,
  useUploadTradeIn,
  type Product,
  type TradeInAnalysis,
  type TradeInSummary,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import '@/index.css';

const queryClient = new QueryClient();

type BagLine = { product: Product; quantity: number; size: string };

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
      <span className="brand-mark" aria-hidden="true"><span className="font-mono-brand text-[9px]">T</span></span>
      <span className="brand-word text-[1.35rem]">tradit</span>
    </Link>
  );
}

function Header({ bagCount, onBag }: { bagCount: number; onBag: () => void }) {
  const [location] = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          <Link href="/" data-testid="link-shop" className={`text-sm font-semibold transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Shop</Link>
          <Link href="/trade-in" data-testid="link-trade-in" className={`text-sm font-semibold transition-colors ${location === '/trade-in' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Trade in</Link>
          <Link href="/dashboard" data-testid="link-dashboard" className={`text-sm font-semibold transition-colors ${location === '/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Your circle</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/trade-in" data-testid="link-mobile-trade-in" className="hidden rounded-full px-3 py-2 text-xs font-bold text-primary hover:bg-muted sm:inline-flex md:hidden">Trade in</Link>
          <Link href="/dashboard" data-testid="link-mobile-dashboard" className="hidden rounded-full p-2 text-primary hover:bg-muted sm:inline-flex md:hidden"><BarChart3 size={18} /></Link>
          <button type="button" onClick={onBag} data-testid="button-open-bag" className="relative rounded-full p-3 text-primary transition-colors hover:bg-muted">
            <ShoppingBag size={20} strokeWidth={1.8} />
            {bagCount > 0 && <span data-testid="text-bag-count" className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-secondary px-1 font-mono-brand text-[10px] font-bold text-foreground">{bagCount}</span>}
          </button>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto border-t border-border/50 px-5 py-2.5 md:hidden">
        <Link href="/" data-testid="link-mobile-shop" className={`whitespace-nowrap text-xs font-bold ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>Shop</Link>
        <Link href="/trade-in" data-testid="link-mobile-trade" className={`whitespace-nowrap text-xs font-bold ${location === '/trade-in' ? 'text-primary' : 'text-muted-foreground'}`}>Trade in a pair</Link>
        <Link href="/dashboard" data-testid="link-mobile-circle" className={`whitespace-nowrap text-xs font-bold ${location === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}>Your circle</Link>
      </div>
    </header>
  );
}

function Shell({ children, bagCount, onBag }: { children: ReactNode; bagCount: number; onBag: () => void }) {
  return (
    <div className="noise min-h-[100dvh] bg-background">
      <Header bagCount={bagCount} onBag={onBag} />
      {children}
      <footer className="mt-20 border-t border-border bg-primary px-5 py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/70">Good shoes keep moving. A neighborhood exchange for pairs with more life in them.</p>
          </div>
          <p className="font-mono-brand text-[10px] uppercase tracking-[.18em] text-primary-foreground/50">Style is a shared resource</p>
        </div>
      </footer>
    </div>
  );
}

function Notice({ kind, children, onDismiss }: { kind: 'success' | 'error'; children: ReactNode; onDismiss?: () => void }) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} data-testid={`status-${kind}`} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${kind === 'success' ? 'border-primary/20 bg-primary/8 text-primary' : 'border-destructive/25 bg-destructive/8 text-destructive'}`}>
      {kind === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <CircleAlert size={18} className="mt-0.5 shrink-0" />}
      <span className="flex-1">{children}</span>
      {onDismiss && <button type="button" onClick={onDismiss} data-testid="button-dismiss-notice" className="shrink-0 opacity-70 hover:opacity-100"><X size={16} /></button>}
    </div>
  );
}

function LoadingProducts() {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="animate-pulse"><div className="aspect-[1.1] rounded-[1.5rem] bg-muted" /><div className="mt-4 h-3 w-1/3 rounded bg-muted" /><div className="mt-2 h-5 w-3/4 rounded bg-muted" /></div>)}
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  return (
    <article className="product-card group animate-rise" data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-[.92] overflow-hidden rounded-[4px] bg-muted">
        {product.imageUrl ? <img src={product.imageUrl} alt={`${product.brand} ${product.name}`} className="product-media h-full w-full object-cover" /> : <div className="surface-grid flex h-full items-center justify-center text-primary/35"><Footprints size={76} strokeWidth={1} /></div>}
        <div className="absolute left-4 top-4 flex gap-2">
          {product.badge && <span data-testid={`text-badge-${product.id}`} className="rounded-sm bg-primary px-3 py-1.5 font-mono-brand text-[10px] uppercase tracking-wider text-primary-foreground">{product.badge}</span>}
          {discount > 0 && <span className="rounded-sm bg-secondary px-3 py-1.5 font-mono-brand text-[10px] uppercase tracking-wider text-secondary-foreground">-{discount}%</span>}
        </div>
        <button type="button" data-testid={`button-add-product-${product.id}`} onClick={() => onAdd(product)} className="absolute bottom-4 right-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-secondary text-secondary-foreground opacity-0 shadow-md transition-all group-hover:translate-y-0 group-hover:opacity-100 hover:bg-accent sm:opacity-100 sm:translate-y-0">
          <Plus size={19} />
          <span className="sr-only">Add {product.name} to bag</span>
        </button>
      </div>
      <div className="flex items-start justify-between gap-4 pt-4">
        <div>
          <p className="font-mono-brand text-[10px] uppercase tracking-[.16em] text-muted-foreground">{product.brand} · {product.category}</p>
          <h3 className="mt-1 text-base font-bold tracking-[-.02em]">{product.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{product.color} · {product.sizeRange}</p>
        </div>
        <div className="text-right">
          <p data-testid={`text-price-${product.id}`} className="font-mono-brand text-sm font-medium">${product.price.toFixed(2)}</p>
          {product.originalPrice > product.price && <p className="text-xs text-muted-foreground line-through">${product.originalPrice.toFixed(2)}</p>}
        </div>
      </div>
    </article>
  );
}

function HomePage({ onAdd }: { onAdd: (product: Product) => void }) {
  const { data: products, isLoading, isError, refetch } = useListProducts();
  const [filter, setFilter] = useState('All pairs');
  const categories = useMemo(() => ['All pairs', ...Array.from(new Set((products ?? []).map((product) => product.category)))], [products]);
  const visibleProducts = (products ?? []).filter((product) => filter === 'All pairs' || product.category === filter);
  return (
    <main>
      <section className="hero-surface overflow-hidden text-primary-foreground">
        <div className="mx-auto grid max-w-[1240px] items-end gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-24 lg:pt-24">
          <div className="animate-rise">
            <p className="font-mono-brand text-[10px] uppercase tracking-[.23em] text-secondary">A neighborhood footwear exchange</p>
            <h1 className="font-display mt-5 max-w-[650px] text-[clamp(3.6rem,8vw,7.6rem)] leading-[.88] tracking-[-.065em]">Wear it well.<br /><em className="text-secondary">Pass it on.</em></h1>
            <p className="mt-7 max-w-md text-base leading-7 text-primary-foreground/72">Find pairs with a past. Give yours a next chapter. Tradit keeps good footwear in the circle, where style and stewardship belong together.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#the-edit" data-testid="link-browse-edit" className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5">Browse the edit <ArrowRight size={16} /></a>
              <Link href="/trade-in" data-testid="link-hero-trade-in" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10">Trade a pair <ArrowUpRight size={16} /></Link>
            </div>
          </div>
          <div className="relative hidden min-h-[390px] animate-rise delay-2 lg:block">
            <div className="h-[360px] overflow-hidden rounded-[4px]"><img src="https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=85" alt="Sneakers ready for a new home" className="h-full w-full object-cover opacity-90" /></div>
          </div>
        </div>
      </section>

      <section id="the-edit" className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">Current rotation</p>
            <h2 className="font-display mt-2 text-4xl tracking-[-.04em] sm:text-5xl">The edit</h2>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {categories.map((category) => <button key={category} type="button" onClick={() => setFilter(category)} data-testid={`button-filter-${category.toLowerCase().replaceAll(' ', '-')}`} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-colors ${filter === category ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-primary/40'}`}>{category}</button>)}
          </div>
        </div>
        {isLoading && <LoadingProducts />}
        {isError && <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-10 text-center"><CircleAlert className="mx-auto text-destructive" /><p className="mt-3 font-bold">The edit is taking a breather.</p><p className="mt-1 text-sm text-muted-foreground">We couldn’t load the pairs right now.</p><button type="button" onClick={() => refetch()} data-testid="button-retry-products" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><RefreshCw size={15} /> Try again</button></div>}
        {!isLoading && !isError && visibleProducts.length === 0 && <div data-testid="empty-products" className="rounded-[1.5rem] border border-dashed border-border p-14 text-center"><Footprints className="mx-auto text-muted-foreground" /><p className="mt-4 font-bold">No pairs in this lane yet.</p><p className="mt-1 text-sm text-muted-foreground">Try another part of the edit.</p></div>}
        {!isLoading && !isError && visibleProducts.length > 0 && <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}</div>}
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-20 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] bg-secondary/30 sm:grid-cols-[.85fr_1.15fr]">
          <div className="surface-grid flex min-h-[290px] items-end p-8 sm:p-10"><p className="font-display max-w-xs text-4xl leading-[.95] tracking-[-.04em]">Your old favorites might be someone’s new everyday.</p></div>
          <div className="flex flex-col justify-between gap-7 p-8 sm:p-10"><div><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-primary">Why Tradit</p><p className="mt-5 max-w-lg text-lg leading-8">We believe the most personal things in our closets deserve a longer life. Every trade keeps materials in motion, gives a neighbor access to quality, and makes room for what’s next.</p></div><Link href="/trade-in" data-testid="link-why-trade-in" className="inline-flex items-center gap-2 text-sm font-bold text-primary">Put a pair back in the circle <ArrowRight size={16} /></Link></div>
        </div>
      </section>
    </main>
  );
}

function TradeInPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [analysis, setAnalysis] = useState<TradeInAnalysis | null>(null);
  const [summary, setSummary] = useState<TradeInSummary | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const upload = useUploadTradeIn();
  const decide = useDecideTradeIn();

  const handleFile = (nextFile?: File) => {
    if (!nextFile) return;
    setError('');
    setSummary(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(nextFile.type)) {
      setError('Choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (nextFile.size > 4_000_000) {
      setError('That image is larger than 4MB. Try a smaller photo.');
      return;
    }
    setFile(nextFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result ?? ''));
    reader.readAsDataURL(nextFile);
  };

  const scan = () => {
    if (!file || !preview) return;
    setError('');
    upload.mutate({ data: { imageName: file.name, imageData: preview.split(',')[1] ?? preview, mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' } }, {
      onSuccess: (result) => setAnalysis(result),
      onError: () => setError('The scan could not read that photo. Try another angle with the whole pair in frame.'),
    });
  };
  const makeDecision = (decision: 'accept' | 'decline') => {
    if (!analysis) return;
    setError('');
    decide.mutate({ id: analysis.id, data: { decision } }, {
      onSuccess: (result) => {
        setSummary(result);
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCreditBalanceQueryKey() });
      },
      onError: () => setError('We couldn’t save that decision. Please try again.'),
    });
  };
  const reset = () => { setFile(null); setPreview(''); setAnalysis(null); setSummary(null); setError(''); if (fileInputRef.current) fileInputRef.current.value = ''; };

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div className="animate-rise">
          <p className="font-mono-brand text-[10px] uppercase tracking-[.23em] text-muted-foreground">Trade-in studio · 02</p>
          <h1 className="font-display mt-4 text-[clamp(3.5rem,7vw,6.4rem)] leading-[.88] tracking-[-.06em]">Give it<br /><em className="text-primary">another life.</em></h1>
          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">Send us a clear photo. We’ll take a thoughtful first look, then offer credit based on the pair’s condition and staying power.</p>
          <div className="mt-10 space-y-4 border-t border-border pt-6">
            {[['01', 'Photograph your pair', 'Natural light, both shoes visible.'], ['02', 'Review the offer', 'A quick scan suggests a starting value.'], ['03', 'Keep the circle moving', 'Accept the credit or pass for now.']].map(([number, title, detail]) => <div key={number} className="flex gap-4"><span className="font-mono-brand text-xs text-secondary-foreground">{number}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div></div>)}
          </div>
        </div>
        <div className="animate-rise delay-1">
          {!analysis && !summary && <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-8">
            <div className="flex items-center justify-between"><div><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">Photo check</p><h2 className="mt-2 text-xl font-bold">Show us the pair</h2></div><ScanLine className="text-secondary-foreground" size={24} /></div>
            <button type="button" onClick={() => fileInputRef.current?.click()} data-testid="button-choose-photo" className={`mt-7 flex aspect-[1.35] w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed transition-colors ${preview ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/40 hover:border-primary/50 hover:bg-primary/5'}`}>
              {preview ? <img src={preview} alt="Selected shoe preview" className="h-full w-full rounded-[1.5rem] object-cover" data-testid="img-trade-preview" /> : <><span className="grid h-14 w-14 place-items-center rounded-full bg-secondary/60 text-primary"><ImagePlus size={23} /></span><span className="mt-4 text-sm font-bold">Choose a photo</span><span className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WEBP · up to 4MB</span></>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleFile(event.target.files?.[0])} data-testid="input-trade-photo" className="sr-only" />
            {file && <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted px-3 py-2 text-xs"><FileImage size={16} className="text-primary" /><span className="flex-1 truncate">{file.name}</span><button type="button" onClick={reset} data-testid="button-remove-photo" className="text-muted-foreground hover:text-destructive"><X size={15} /></button></div>}
            {error && <div className="mt-5"><Notice kind="error" onDismiss={() => setError('')}>{error}</Notice></div>}
            <button type="button" onClick={scan} disabled={!file || upload.isPending} data-testid="button-scan-photo" className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40">{upload.isPending ? <><Loader2 size={17} className="animate-spin" /> Reading the pair…</> : <><ScanLine size={17} /> Review my offer</>}</button>
          </div>}
          {analysis && !summary && <AnalysisCard analysis={analysis} isPending={decide.isPending} error={error} onDecision={makeDecision} onReset={reset} />}
          {summary && <SummaryCard summary={summary} onReset={reset} />}
        </div>
      </div>
    </main>
  );
}

function AnalysisCard({ analysis, isPending, error, onDecision, onReset }: { analysis: TradeInAnalysis; isPending: boolean; error: string; onDecision: (decision: 'accept' | 'decline') => void; onReset: () => void }) {
  return <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-8">
    <div className="flex items-start justify-between gap-4"><div><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">Scan complete</p><h2 className="mt-2 font-display text-4xl tracking-[-.04em]">A good-looking<br /><em>starting point.</em></h2></div><span className="grid h-11 w-11 place-items-center rounded-full bg-secondary/60 text-primary"><Check size={20} /></span></div>
    <p className="mt-5 text-sm leading-6 text-muted-foreground">{analysis.message}</p>
    <div className="mt-7 divide-y divide-border rounded-2xl border border-border">
      <div className="flex items-center justify-between px-4 py-3"><span className="text-xs text-muted-foreground">Brand / model</span><span data-testid="text-analysis-model" className="text-sm font-bold">{analysis.brand} {analysis.model}</span></div>
      <div className="flex items-center justify-between px-4 py-3"><span className="text-xs text-muted-foreground">Condition</span><span data-testid="text-analysis-condition" className="text-sm font-bold">{analysis.condition}</span></div>
      <div className="flex items-center justify-between px-4 py-3"><span className="text-xs text-muted-foreground">Estimated value</span><span className="font-mono-brand text-sm">${analysis.estimatedValue.toFixed(2)}</span></div>
      <div className="flex items-center justify-between bg-secondary/20 px-4 py-4"><span className="text-sm font-bold">Your Tradit credit</span><span data-testid="text-credit-offer" className="font-mono-brand text-xl font-medium text-primary">${analysis.creditOffer.toFixed(2)}</span></div>
    </div>
    {error && <div className="mt-5"><Notice kind="error">{error}</Notice></div>}
    <div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => onDecision('decline')} disabled={isPending} data-testid="button-decline-offer" className="rounded-full border border-border px-5 py-3.5 text-sm font-bold transition-colors hover:bg-muted disabled:opacity-50">Not this time</button><button type="button" onClick={() => onDecision('accept')} disabled={isPending} data-testid="button-accept-offer" className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-50">{isPending ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Accept ${analysis.creditOffer.toFixed(2)} credit</button></div>
    <button type="button" onClick={onReset} disabled={isPending} data-testid="button-scan-another" className="mx-auto mt-5 block text-xs font-bold text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Scan a different pair</button>
  </div>;
}

function SummaryCard({ summary, onReset }: { summary: TradeInSummary; onReset: () => void }) {
  const accepted = summary.decision === 'accepted';
  return <div className="rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm sm:p-12">
    <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${accepted ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground'}`}>{accepted ? <CheckCircle2 size={30} /> : <Clock3 size={28} />}</span>
    <p className="mt-6 font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">{accepted ? 'Credit added' : 'Offer declined'}</p>
    <h2 data-testid="text-trade-summary" className="font-display mt-2 text-5xl tracking-[-.05em]">{accepted ? `+$${summary.creditAdded.toFixed(2)}` : 'No pressure.'}</h2>
    <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">{summary.message}</p>
    {accepted && <div className="mt-7 rounded-2xl bg-secondary/25 p-4"><p className="text-xs text-muted-foreground">New Tradit balance</p><p data-testid="text-new-balance" className="mt-1 font-mono-brand text-2xl text-primary">${summary.newBalance.toFixed(2)}</p></div>}
    <button type="button" onClick={onReset} data-testid="button-trade-another" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Trade another pair <ArrowRight size={16} /></button>
  </div>;
}

function DashboardPage() {
  const dashboardQuery = useGetDashboard();
  const creditQuery = useGetCreditBalance();
  const dashboard = dashboardQuery.data;
  const credit = creditQuery.data;
  const isLoading = dashboardQuery.isLoading || creditQuery.isLoading;
  const isError = dashboardQuery.isError || creditQuery.isError;
  const progress = dashboard ? Math.min(100, (dashboard.scansThisHour / Math.max(1, dashboard.scansLimit)) * 100) : 0;
  return <main className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8 lg:py-20">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="font-mono-brand text-[10px] uppercase tracking-[.23em] text-muted-foreground">Member dashboard · 03</p><h1 className="font-display mt-3 text-5xl tracking-[-.055em] sm:text-6xl">Your circle.</h1></div><p className="max-w-xs text-sm leading-6 text-muted-foreground">A small record of the good things you’ve kept moving.</p></div>
    {isLoading && <DashboardSkeleton />}
    {isError && <div className="mt-12"><Notice kind="error">We couldn’t load your circle right now. Refresh the page to try again.</Notice></div>}
    {!isLoading && !isError && dashboard && credit && <div className="mt-10 animate-rise">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="hero-surface relative overflow-hidden rounded-[4px] p-7 text-primary-foreground sm:p-10"><div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-secondary/25" /><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-secondary">Tradit credits</p><p data-testid="text-dashboard-balance" className="font-display mt-4 text-6xl tracking-[-.06em] sm:text-8xl">${credit.balance.toFixed(2)}</p><p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/65">Available to spend on your next pair.</p><div className="mt-10 grid grid-cols-2 gap-5 border-t border-primary-foreground/15 pt-5"><div><p className="font-mono-brand text-[10px] uppercase tracking-wider text-primary-foreground/55">Pending trade-in value</p><p data-testid="text-pending-credit" className="mt-1 font-mono-brand text-lg">${credit.pending.toFixed(2)}</p></div><div><p className="font-mono-brand text-[10px] uppercase tracking-wider text-primary-foreground/55">Credit history</p><p data-testid="text-lifetime-earned" className="mt-1 font-mono-brand text-lg">${credit.lifetimeEarned.toFixed(2)}</p></div></div></div>
        <div className="rounded-[2rem] border border-border bg-card p-7 sm:p-8"><div className="flex items-center justify-between"><div><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">This hour</p><h2 className="mt-2 text-xl font-bold">Scan allowance</h2></div><ScanLine className="text-secondary-foreground" size={23} /></div><p data-testid="text-scan-count" className="mt-10 font-display text-6xl tracking-[-.06em]">{dashboard.scansThisHour}<span className="font-sans text-2xl font-normal text-muted-foreground"> / {dashboard.scansLimit}</span></p><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-4 text-xs leading-5 text-muted-foreground">{dashboard.scansLimit - dashboard.scansThisHour > 0 ? `You have ${dashboard.scansLimit - dashboard.scansThisHour} scan${dashboard.scansLimit - dashboard.scansThisHour === 1 ? '' : 's'} left this hour.` : 'Your hourly scans are all used. Check back soon.'}</p><Link href="/trade-in" data-testid="link-dashboard-trade-in" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary">Scan a pair <ArrowRight size={16} /></Link></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-[4px] border border-border bg-card p-7 sm:p-8"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/40 text-primary"><Leaf size={20} /></span><div><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">Impact, in motion</p><p className="mt-1 text-sm font-bold">Pairs circulated</p></div></div><p data-testid="text-pairs-circulated" className="font-display mt-8 text-6xl tracking-[-.06em]">{dashboard.pairsCirculated}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Every pair is one less thing sitting still.</p><p className="mt-8 border-t border-border pt-4 font-mono-brand text-[10px] uppercase tracking-wider text-muted-foreground">Member since {new Date(dashboard.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p></div>
        <ActivityFeed activities={dashboard.recentActivity} />
      </div>
    </div>}
  </main>;
}

function ActivityFeed({ activities }: { activities: { id: string; type: string; title: string; detail: string; createdAt: string }[] }) {
  return <div className="rounded-[4px] border border-border bg-card p-7 sm:p-8"><div className="flex items-center justify-between"><div><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">Wallet</p><h2 className="mt-2 text-xl font-bold">Credit history</h2></div><ReceiptText className="text-secondary-foreground" size={22} /></div>{activities.length === 0 ? <div data-testid="empty-activity" className="py-12 text-center text-sm text-muted-foreground"><p>$0.00 in credit history</p><p className="mt-2 text-xs">Trade in a pair to create your first entry.</p></div> : <div className="mt-7 divide-y divide-border">{activities.map((activity) => <div key={activity.id} data-testid={`row-activity-${activity.id}`} className="flex gap-4 py-4 first:pt-0 last:pb-0"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-primary">{activity.type === 'trade_in' ? <ArrowDownRight size={17} /> : activity.type === 'purchase' ? <ShoppingBag size={16} /> : <Leaf size={17} />}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-4"><p className="text-sm font-bold">{activity.title}</p><time className="shrink-0 font-mono-brand text-[10px] text-muted-foreground">{new Date(activity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{activity.detail}</p></div></div>)}</div>}</div>;
}

function DashboardSkeleton() {
  return <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="h-[360px] animate-pulse rounded-[2rem] bg-muted" /><div className="h-[360px] animate-pulse rounded-[2rem] bg-muted" /></div>;
}

function BagDrawer({ lines, onClose, onChangeQuantity, onRemove, onOrderPlaced }: { lines: BagLine[]; onClose: () => void; onChangeQuantity: (id: string, delta: number) => void; onRemove: (id: string) => void; onOrderPlaced: () => void }) {
  const checkout = useCreateCheckout();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<{ id: string; total: number; creditUsed: number; cashDue: number } | null>(null);
  const [error, setError] = useState('');
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const submit = () => {
    setError('');
    checkout.mutate({ data: { items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })) } }, {
      onSuccess: (result) => {
        setOrder(result);
        onOrderPlaced();
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCreditBalanceQueryKey() });
      },
      onError: () => setError('Checkout could not be completed. Your bag is safe; try again.'),
    });
  };
  return <div className="fixed inset-0 z-50 flex justify-end bg-foreground/25 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Your bag" data-testid="bag-drawer">
    <button type="button" onClick={onClose} data-testid="button-close-bag-backdrop" className="absolute inset-0 cursor-default" aria-label="Close bag" />
    <aside className="relative flex h-full w-full max-w-[470px] flex-col bg-background shadow-2xl animate-rise">
      <div className="flex items-center justify-between border-b border-border px-6 py-5"><div><p className="font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">Your bag</p><h2 className="mt-1 font-display text-3xl tracking-[-.04em]">{order ? 'Order placed' : `${lines.length} ${lines.length === 1 ? 'pair' : 'pairs'}`}</h2></div><button type="button" onClick={onClose} data-testid="button-close-bag" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={20} /></button></div>
      {order ? <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-secondary text-primary"><PackageCheck size={30} /></span><p className="mt-6 font-mono-brand text-[10px] uppercase tracking-[.2em] text-muted-foreground">Confirmed · {order.id}</p><h3 className="font-display mt-2 text-4xl">It’s in motion.</h3><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Your pair is headed your way. We used ${order.creditUsed.toFixed(2)} in Tradit credit, with ${order.cashDue.toFixed(2)} due in cash.</p><button type="button" onClick={onClose} data-testid="button-finish-checkout" className="mt-8 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Back to the edit</button></div> : <>{lines.length === 0 ? <div data-testid="empty-bag" className="flex flex-1 flex-col items-center justify-center px-8 text-center"><span className="grid h-16 w-16 place-items-center rounded-full bg-muted text-primary"><ShoppingBag size={25} /></span><h3 className="font-display mt-6 text-3xl">Nothing here yet.</h3><p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">When a pair feels like yours, add it to the bag and we’ll keep the checkout simple.</p><button type="button" onClick={onClose} data-testid="button-continue-shopping" className="mt-7 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Continue browsing</button></div> : <><div className="flex-1 overflow-y-auto px-6 py-5">{lines.map((line) => <div key={`${line.product.id}-${line.size}`} className="flex gap-4 border-b border-border py-4 first:pt-0" data-testid={`row-bag-${line.product.id}`}><div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">{line.product.imageUrl ? <img src={line.product.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-primary/35"><Footprints size={32} /></div>}</div><div className="min-w-0 flex-1"><p className="font-mono-brand text-[10px] uppercase tracking-wider text-muted-foreground">{line.product.brand}</p><p className="mt-1 truncate text-sm font-bold">{line.product.name}</p><p className="mt-1 font-mono-brand text-xs">${line.product.price.toFixed(2)}</p><div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => onChangeQuantity(line.product.id, -1)} data-testid={`button-decrease-${line.product.id}`} className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-muted"><Minus size={13} /></button><span data-testid={`text-quantity-${line.product.id}`} className="w-5 text-center font-mono-brand text-xs">{line.quantity}</span><button type="button" onClick={() => onChangeQuantity(line.product.id, 1)} data-testid={`button-increase-${line.product.id}`} className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-muted"><Plus size={13} /></button><button type="button" onClick={() => onRemove(line.product.id)} data-testid={`button-remove-${line.product.id}`} className="ml-2 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button></div></div></div>)}</div><div className="border-t border-border bg-card px-6 py-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Subtotal</span><span data-testid="text-bag-total" className="font-mono-brand text-lg">${total.toFixed(2)}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Tradit credit is applied automatically at checkout.</p>{error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}<button type="button" onClick={submit} disabled={checkout.isPending} data-testid="button-checkout" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-50">{checkout.isPending ? <><Loader2 size={17} className="animate-spin" /> Completing checkout…</> : <><CreditCard size={17} /> Checkout · ${total.toFixed(2)}</>}</button></div></>}</>}
    </aside>
  </div>;
}

function AppContent() {
  const [bagOpen, setBagOpen] = useState(false);
  const [bag, setBag] = useState<Record<string, BagLine>>({});
  const lines = Object.values(bag);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const addToBag = (product: Product) => setBag((current) => ({ ...current, [product.id]: current[product.id] ? { ...current[product.id], quantity: current[product.id].quantity + 1 } : { product, quantity: 1, size: product.availableSizes[0] ?? product.sizeRange } }));
  const changeQuantity = (id: string, delta: number) => setBag((current) => { const line = current[id]; if (!line) return current; const quantity = line.quantity + delta; if (quantity <= 0) { const next = { ...current }; delete next[id]; return next; } return { ...current, [id]: { ...line, quantity } }; });
  const removeLine = (id: string) => setBag((current) => { const next = { ...current }; delete next[id]; return next; });
  return <Shell bagCount={count} onBag={() => setBagOpen(true)}>
    <Switch>
      <Route path="/trade-in" component={TradeInPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/" component={() => <HomePage onAdd={(product) => { addToBag(product); setBagOpen(true); }} />} />
      <Route component={NotFound} />
    </Switch>
    {bagOpen && <BagDrawer lines={lines} onClose={() => setBagOpen(false)} onChangeQuantity={changeQuantity} onRemove={removeLine} onOrderPlaced={() => setBag({})} />}
  </Shell>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><AppContent /></RoutedErrorBoundary></WouterRouter></QueryClientProvider>;
}

export default App;