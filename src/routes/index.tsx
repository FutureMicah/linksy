import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  CreditCard,
  Gift,
  Heart,
  LayoutGrid,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import collaborationImage from "@/assets/creative-collaboration.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lovable — Good things happen together" },
      {
        name: "description",
        content: "Find your people, hire brilliant independent talent, and discover digital goods in one trusted marketplace.",
      },
      { property: "og:title", content: "Lovable — Good things happen together" },
      {
        property: "og:description",
        content: "Meet your next creative partner and discover digital goods made by people who care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const experts = [
  {
    name: "Maya Okafor",
    title: "Brand & visual designer",
    category: "Design",
    rate: "$65",
    rating: "4.98",
    reviews: "128",
    initials: "MO",
    color: "avatar-coral",
    availability: "Available this week",
    skills: ["Brand identity", "Figma", "+3"],
  },
  {
    name: "Ethan Brooks",
    title: "Full-stack developer",
    category: "Development",
    rate: "$85",
    rating: "5.0",
    reviews: "96",
    initials: "EB",
    color: "avatar-lilac",
    availability: "Taking new projects",
    skills: ["React", "Next.js", "+4"],
  },
  {
    name: "Nia Campbell",
    title: "Growth & content strategist",
    category: "Marketing",
    rate: "$55",
    rating: "4.96",
    reviews: "74",
    initials: "NC",
    color: "avatar-mint",
    availability: "Available today",
    skills: ["Social media", "SEO", "+2"],
  },
];

const goods = [
  { title: "The Soft Studio Brand Kit", type: "Branding template", price: "$28", color: "goods-coral", icon: Sparkles, initials: "S" },
  { title: "Social Story Starter Pack", type: "Instagram templates", price: "$18", color: "goods-lilac", icon: Heart, initials: "✳" },
  { title: "The Focus Hour Planner", type: "Notion template", price: "$12", color: "goods-sage", icon: LayoutGrid, initials: "◒" },
];

const initialTransactions = [
  { title: "Website refresh", person: "From Ethan Brooks", date: "Today, 10:42 am", amount: "+$320.00", kind: "in" },
  { title: "Brand strategy session", person: "With Maya Okafor", date: "Yesterday", amount: "−$85.00", kind: "out" },
  { title: "Story Starter Pack", person: "Digital download", date: "Oct 12", amount: "−$18.00", kind: "out" },
];

function HomePage() {
  const [activeFilter, setActiveFilter] = useState("All experts");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [balance, setBalance] = useState(1284.5);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [toast, setToast] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredExperts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return experts.filter((expert) => {
      const matchesFilter = activeFilter === "All experts" || expert.category === activeFilter;
      const matchesQuery = !normalizedQuery || `${expert.name} ${expert.title} ${expert.skills.join(" ")}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  function toggleSave(name: string) {
    setSaved((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  function addToCart(name: string) {
    setCartCount((current) => current + 1);
    showToast(`${name} added to your bag`);
  }

  function addFunds() {
    setBalance((current) => current + 100);
    setTransactions((current) => [
      { title: "Wallet top up", person: "Added just now", date: "Just now", amount: "+$100.00", kind: "in" },
      ...current,
    ]);
    showToast("$100 added to your wallet");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="site-header sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="shell flex h-[68px] items-center justify-between gap-5">
          <a href="#home" aria-label="Lovable home" className="flex shrink-0 items-center gap-2.5">
            <span className="brand-mark"><Heart size={17} strokeWidth={2.6} fill="currentColor" /></span>
            <span className="text-[21px] font-extrabold leading-none tracking-[-0.6px]">lovable<span className="brand-period">.</span></span>
          </a>

          <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
            <a href="#experts" className="nav-link nav-link-active">Find talent</a>
            <a href="#marketplace" className="nav-link">Marketplace</a>
            <a href="#wallet" className="nav-link">Wallet</a>
            <a href="#community" className="nav-link">Community</a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Button variant="ghost" size="icon" aria-label="Notifications" className="icon-button relative">
              <Bell size={18} />
              <span className="notification-dot" />
            </Button>
            <Button variant="outline" className="header-outline" onClick={() => showToast("Welcome back to Lovable")}>Log in</Button>
            <Button className="header-cta" onClick={() => showToast("Your free account is ready to set up")}>Join for free <ArrowRight size={15} /></Button>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <Button variant="ghost" size="icon" className="icon-button relative" aria-label="Shopping bag">
              <ShoppingBag size={19} />
              {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
            </Button>
            <Button variant="ghost" size="icon" className="icon-button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} onClick={() => setMobileMenuOpen((open) => !open)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && <div className="mobile-menu shell"><a href="#experts" onClick={() => setMobileMenuOpen(false)}>Find talent</a><a href="#marketplace" onClick={() => setMobileMenuOpen(false)}>Marketplace</a><a href="#wallet" onClick={() => setMobileMenuOpen(false)}>Wallet & rewards</a><a href="#community" onClick={() => setMobileMenuOpen(false)}>Community</a><Button className="header-cta" onClick={() => showToast("Your free account is ready to set up")}>Join for free <ArrowRight size={15} /></Button></div>}
      </header>

      <main id="home">
        <section className="hero-band">
          <div className="shell hero-layout">
            <div className="hero-copy float-in">
              <div className="eyebrow"><Sparkles size={14} /> YOUR PEOPLE ARE HERE</div>
              <h1>Good things<br />happen <span className="headline-highlight">together.</span></h1>
              <p className="hero-description">Find the talent, tools, and tiny sparks that bring your next big idea to life.</p>
              <div className="hero-actions">
                <Button className="hero-primary" onClick={() => document.getElementById("experts")?.scrollIntoView({ behavior: "smooth" })}>Find your people <ArrowRight size={17} /></Button>
                <a className="hero-secondary" href="#marketplace"><span className="play-icon"><ArrowRight size={13} /></span> Explore the marketplace</a>
              </div>
              <div className="hero-proof"><div className="mini-avatars"><span className="mini-avatar avatar-coral">M</span><span className="mini-avatar avatar-lilac">E</span><span className="mini-avatar avatar-mint">N</span><span className="mini-avatar avatar-gold">J</span></div><div><div className="proof-stars"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><span>4.9/5</span></div><span className="proof-caption">from 2,400+ happy collaborations</span></div></div>
            </div>
            <div className="hero-visual float-in" style={{ animationDelay: "100ms" }}>
              <div className="image-frame"><img src={collaborationImage} alt="Two creative professionals sharing ideas over a laptop" width={1536} height={1024} fetchPriority="high" /><div className="image-tint" /></div>
              <div className="float-card project-float"><div className="float-icon float-icon-peach"><Sparkles size={17} /></div><div><strong>Made with people</strong><span>Not just another platform</span></div><span className="float-heart"><Heart size={17} fill="currentColor" /></span></div>
              <div className="float-card trust-float"><span className="trust-check"><ShieldCheck size={17} /></span><div><strong>Good people. Safe payments.</strong><span>Every step of the way</span></div></div>
              <span className="hero-star hero-star-one">✳</span><span className="hero-star hero-star-two">✦</span>
            </div>
          </div>
          <div className="shell hero-bottom"><span>MADE FOR PEOPLE MAKING THINGS</span><div className="hero-bottom-items"><span><ShieldCheck size={14} /> Payments you can trust</span><span><Heart size={13} /> People-first, always</span><span><Sparkles size={14} /> Ideas become real</span></div></div>
        </section>

        <section className="experts-section section-space" id="experts">
          <div className="shell">
            <div className="section-heading-row"><div><div className="eyebrow section-eyebrow"><span className="tiny-spark">✳</span> FIND YOUR COLLABORATOR</div><h2>Hire experts <span className="soft-highlight">you’ll love.</span></h2><p className="section-description">Good at what they do. Even better to work with.</p></div><a className="text-link desktop-link" href="#experts" onClick={() => { setActiveFilter("All experts"); setQuery(""); }}>Meet all experts <ArrowRight size={16} /></a></div>

            <div className="expert-toolbar">
              <div className="filter-tabs" role="group" aria-label="Filter experts">
                {["All experts", "Design", "Development", "Marketing"].map((filter) => <Button key={filter} variant="ghost" onClick={() => setActiveFilter(filter)} className={cn("filter-pill", activeFilter === filter && "filter-pill-active")}>{filter}</Button>)}
              </div>
              <div className="search-control"><Search size={17} /><Input aria-label="Search experts" placeholder="Try “brand designer”" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            </div>

            {filteredExperts.length > 0 ? <div className="expert-grid">{filteredExperts.map((expert, index) => <article className="expert-card" key={expert.name} style={{ animationDelay: `${index * 70}ms` }}>
              <div className="expert-card-top"><div className={cn("expert-avatar", expert.color)}><span>{expert.initials}</span><i /></div><div className="expert-person"><div className="expert-name-line"><h3>{expert.name}</h3><BadgeCheck size={16} className="verified-icon" aria-label="Verified expert" /></div><p>{expert.title}</p></div><Button variant="ghost" size="icon" aria-label={`${saved.includes(expert.name) ? "Remove" : "Save"} ${expert.name}`} onClick={() => toggleSave(expert.name)} className={cn("save-button", saved.includes(expert.name) && "save-button-active")}><Bookmark size={18} fill={saved.includes(expert.name) ? "currentColor" : "none"} /></Button></div>
              <div className="expert-availability"><span className="availability-dot" />{expert.availability}</div>
              <div className="skill-row">{expert.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <div className="expert-card-bottom"><div className="rating-line"><Star size={14} fill="currentColor" /><strong>{expert.rating}</strong><span>({expert.reviews})</span><span className="rating-divider" /><span className="expert-rate">{expert.rate}<small>/hr</small></span></div><Button variant="outline" className="view-profile" onClick={() => showToast(`${expert.name}’s profile is ready to explore`)}>View profile <ArrowRight size={14} /></Button></div>
            </article>)}</div> : <div className="empty-experts"><Search size={22} /><strong>No experts found just yet</strong><span>Try another search or choose a different speciality.</span></div>}

            <div className="become-expert"><div className="become-icon"><BriefcaseBusiness size={20} /></div><div><strong>Something special to share?</strong><span>Meet the clients who are looking for you.</span></div><Button variant="ghost" className="become-link" onClick={() => showToast("Your expert profile is ready to start")}>Become an expert <ArrowRight size={15} /></Button></div>
          </div>
        </section>

        <section className="marketplace-section section-space" id="marketplace">
          <div className="shell">
            <div className="section-heading-row marketplace-heading"><div><div className="eyebrow section-eyebrow"><ShoppingBag size={14} /> THE LITTLE BIG IDEA SHOP</div><h2>Find a little <span className="soft-highlight">something.</span></h2><p className="section-description">Thoughtful digital goods, made by people like you.</p></div><a className="text-link desktop-link" href="#marketplace" onClick={() => showToast("You’re browsing all digital goods")}>Browse everything <ArrowRight size={16} /></a></div>
            <div className="goods-grid">{goods.map((item) => <article className="goods-card" key={item.title}><button className="goods-art" aria-label={`Preview ${item.title}`} onClick={() => showToast(`${item.title} preview opened`)}><span className={cn("goods-sticker", item.color)}><item.icon size={18} /></span><span className={cn("goods-art-main", item.color)}><span className="goods-art-orbit" /><span className="goods-art-mark">{item.initials}</span><span className="goods-art-lines"><i /><i /><i /></span></span><span className="goods-art-caption">MADE WITH A LITTLE LOVE</span></button><div className="goods-info"><div><p>{item.type}</p><h3>{item.title}</h3></div><strong className="goods-price">{item.price}</strong></div><div className="goods-card-bottom"><span><BadgeCheck size={14} /> Instant download</span><Button variant="ghost" size="icon" aria-label={`Add ${item.title} to bag`} className="add-bag-button" onClick={() => addToCart(item.title)}><ShoppingBag size={17} /></Button></div></article>)}</div>
            <a className="text-link mobile-browse" href="#marketplace" onClick={() => showToast("You’re browsing all digital goods")}>Browse everything <ArrowRight size={16} /></a>
            <div className="category-rail"><span className="category-label">A good place to start</span><button onClick={() => showToast("Browsing brand & design picks")}><Sparkles size={14} /> Brand & design</button><button onClick={() => showToast("Browsing gift cards")}><Gift size={14} /> Gift cards</button><button onClick={() => showToast("Browsing social templates")}><Heart size={14} /> Social templates</button><button onClick={() => showToast("Browsing services")}><BriefcaseBusiness size={14} /> Little services</button></div>
          </div>
        </section>

        <section className="wallet-band" id="wallet">
          <div className="shell wallet-layout">
            <div className="wallet-copy"><div className="eyebrow wallet-eyebrow"><Wallet size={14} /> YOUR LOVABLE WALLET</div><h2>Keep the good<br />stuff <span>moving.</span></h2><p>One simple place for the people, ideas, and little treats you love.</p><div className="wallet-promises"><span><ShieldCheck size={16} /> Secure payments</span><span><Gift size={16} /> Little rewards, too</span></div><Button variant="outline" className="wallet-help" onClick={() => showToast("Our wallet team is happy to help")}><CircleHelp size={15} /> Wallet help <ArrowRight size={14} /></Button></div>
            <div className="wallet-panel">
              <div className="wallet-panel-head"><div className="wallet-panel-title"><span className="wallet-icon-badge"><Wallet size={18} /></span><div><strong>Your Lovable wallet</strong><span>Looking good today <span className="status-spark">✦</span></span></div></div><Button variant="ghost" size="icon" aria-label="Wallet options" className="wallet-menu" onClick={() => showToast("Wallet settings opened")}><Menu size={19} /></Button></div>
              <div className="balance-label">AVAILABLE BALANCE</div><div className="balance-amount">${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span>USD</span></div>
              <div className="wallet-actions"><Button className="wallet-action-primary" onClick={addFunds}><ArrowDownLeft size={16} /> Add funds</Button><Button variant="outline" className="wallet-action-secondary" onClick={() => showToast("Choose someone to send a little love") }><ArrowUpRight size={16} /> Send</Button><Button variant="outline" size="icon" aria-label="Wallet cards" className="wallet-card-button" onClick={() => showToast("Your cards are all in one safe place")}><CreditCard size={17} /></Button></div>
              <div className="transaction-heading"><div><strong>Recent activity</strong><span>A little here, a little there</span></div><Button variant="ghost" className="see-all" onClick={() => showToast("You’re all caught up on activity")}>See all <ArrowRight size={14} /></Button></div>
              <div className="transaction-list">{transactions.slice(0, 3).map((transaction, index) => <div className="transaction-row" key={`${transaction.title}-${transaction.date}-${index}`}><span className={cn("transaction-icon", transaction.kind === "in" ? "transaction-in" : "transaction-out")}>{transaction.kind === "in" ? <ArrowDownLeft size={16} /> : <ShoppingBag size={15} />}</span><div className="transaction-copy"><strong>{transaction.title}</strong><span>{transaction.person} · {transaction.date}</span></div><strong className={cn("transaction-amount", transaction.kind === "in" && "amount-positive")}>{transaction.amount}</strong></div>)}</div>
              <div className="wallet-safe"><ShieldCheck size={14} /> Your money is safe with us <span>Learn more <ChevronDown size={12} /></span></div>
            </div>
          </div>
        </section>

        <section className="community-section section-space" id="community">
          <div className="shell">
            <div className="community-top"><div><div className="eyebrow section-eyebrow"><Heart size={14} /> GOOD PEOPLE, GOOD WORK</div><h2>Little wins.<br /><span className="soft-highlight">Real connections.</span></h2></div><div className="community-note"><span className="community-spark">✳</span><p>A kind word can be the start<br className="desktop-only" /> of something wonderful.</p></div></div>
            <div className="testimonial-grid"><article className="testimonial-card testimonial-one"><div className="quote-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><p className="quote-copy">“I came for a logo and found the creative partner I’d been missing.”</p><div className="quote-person"><span className="quote-avatar avatar-gold">SK</span><div><strong>Sarah K.</strong><span>Founder, Sunroom Studio</span></div><span className="quote-verified"><ShieldCheck size={13} /> Verified</span></div></article><article className="testimonial-card testimonial-two"><div className="quote-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><p className="quote-copy">“My first client here became a regular. It feels like people actually care.”</p><div className="quote-person"><span className="quote-avatar avatar-lilac">JM</span><div><strong>Jordan M.</strong><span>Independent designer</span></div><span className="quote-verified"><ShieldCheck size={13} /> Verified</span></div></article><article className="testimonial-card testimonial-three"><div className="quote-stars"><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /></div><p className="quote-copy">“A safe, lovely place to buy from small creators. I’m a fan for life.”</p><div className="quote-person"><span className="quote-avatar avatar-coral">AL</span><div><strong>Alex L.</strong><span>A very happy shopper</span></div><span className="quote-verified"><ShieldCheck size={13} /> Verified</span></div></article></div>
            <div className="trust-strip"><span><ShieldCheck size={18} /> Protected payments</span><i /><span><BadgeCheck size={18} /> Real, verified reviews</span><i /><span><MessageCircle size={18} /> Kind humans here to help</span></div>
          </div>
        </section>

        <section className="final-note"><div className="shell final-note-inner"><span className="final-heart"><Heart size={20} fill="currentColor" /></span><div><strong>There’s room for your kind of good.</strong><span>Make a little space for what you love.</span></div><Button className="final-cta" onClick={() => showToast("Welcome to the good stuff")}>Find your people <ArrowRight size={15} /></Button></div></section>
      </main>

      <footer className="footer"><div className="shell footer-main"><a href="#home" className="footer-brand"><span className="brand-mark"><Heart size={16} strokeWidth={2.6} fill="currentColor" /></span><strong>lovable<span className="brand-period">.</span></strong></a><p>Good things happen together.</p><div className="footer-links"><a href="#experts">Find talent</a><a href="#marketplace">Marketplace</a><a href="#wallet">Wallet</a><a href="#community">Our community</a><a href="#community">Help & safety</a></div><div className="footer-bottom"><span>© 2026 Lovable. Made for the people who make things.</span><span>Made with <Heart size={12} fill="currentColor" /> and a little extra care</span></div></div></footer>

      <div className="floating-tools"><Button variant="outline" size="icon" aria-label={`Shopping bag${cartCount > 0 ? `, ${cartCount} items` : ""}`} className="floating-bag" onClick={() => showToast(cartCount ? `${cartCount} lovely thing${cartCount > 1 ? "s" : ""} in your bag` : "Your bag is waiting for something lovely")}><ShoppingBag size={18} />{cartCount > 0 && <span className="floating-count">{cartCount}</span>}</Button><Button variant="outline" size="icon" aria-label="Send a message" className="floating-chat" onClick={() => showToast("A friendly human will be right with you")}><MessageCircle size={18} /></Button></div>
      {toast && <div role="status" className="toast-message"><Check size={16} />{toast}</div>}
    </div>
  );
}