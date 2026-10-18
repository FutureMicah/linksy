import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Backpack,
  Check,
  ChevronDown,
  Glasses,
  Heart,
  Search,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Waves,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import gogglesImage from "@/assets/swim-goggles.jpg";
import shirtImage from "@/assets/swim-shirt.jpg";
import trunksImage from "@/assets/swim-trunks.jpg";
import bagImage from "@/assets/swim-bag.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swim Shop — Gear up for the water" },
      {
        name: "description",
        content: "Shop swimwear, goggles, and poolside essentials selected for your next swim.",
      },
      { property: "og:title", content: "Swim Shop — Gear up for the water" },
      {
        property: "og:description",
        content: "Find swimwear, goggles, and poolside essentials for every swim.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SwimShopPage,
});

const products = [
  {
    id: "form-goggles",
    title: "FORM Smart Swim Goggles 2",
    category: "Goggles",
    price: 1350,
    rating: "4.8",
    reviews: 201,
    stock: 15,
    image: gogglesImage,
    alt: "Black performance swim goggles with blue mirrored lenses",
    tag: "BESTSELLER",
  },
  {
    id: "training-top",
    title: "Cobalt Training Swim Top",
    category: "Swimwear",
    price: 950,
    rating: "4.5",
    reviews: 82,
    stock: 8,
    image: shirtImage,
    alt: "Cobalt blue short-sleeve swim training top",
    tag: "QUICK DRY",
  },
  {
    id: "attack-goggles",
    title: "Zone3 Attack Swim Goggles",
    category: "Goggles",
    price: 1450,
    rating: "4.7",
    reviews: 185,
    stock: 10,
    image: gogglesImage,
    alt: "Black competition swim goggles with blue reflective lenses",
    tag: "RACE DAY",
  },
  {
    id: "track-trunks",
    title: "Trackside Swim Trunks",
    category: "Swimwear",
    price: 1190,
    rating: "4.6",
    reviews: 94,
    stock: 12,
    image: trunksImage,
    alt: "Navy swim trunks with blue side stripes",
    tag: "NEW",
  },
  {
    id: "mesh-bag",
    title: "Pool Day Mesh Gear Bag",
    category: "Accessories",
    price: 490,
    rating: "4.9",
    reviews: 67,
    stock: 21,
    image: bagImage,
    alt: "Black mesh swim gear bag with bright blue trim",
    tag: "POOL ESSENTIAL",
  },
];

const categories = ["All products", "Swimwear", "Goggles", "Accessories"];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(price);

function SwimShopPage() {
  const [activeCategory, setActiveCategory] = useState("All products");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [lowToHigh, setLowToHigh] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory =
        activeCategory === "All products" || product.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        `${product.title} ${product.category}`.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
    return lowToHigh ? filtered.sort((a, b) => a.price - b.price) : filtered;
  }, [activeCategory, search, lowToHigh]);

  const cartItems = products.filter((product) => (cart[product.id] ?? 0) > 0);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, product) => sum + product.price * (cart[product.id] ?? 0),
    0,
  );

  function addToCart(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div className="shop-page min-h-screen bg-background text-foreground">
      <header className="shop-header">
        <div className="shop-shell shop-header-inner">
          <a href="#home" className="shop-brand" aria-label="Swim Shop home">
            <span className="shop-brand-icon"><Waves size={19} /></span>
            <span>SWIM<span className="shop-brand-dot">.</span></span>
          </a>
          <nav aria-label="Shop navigation" className="shop-nav">
            <a href="#products" className="shop-nav-active">Shop</a>
            <a href="#products" onClick={() => setActiveCategory("Swimwear")}>Swimwear</a>
            <a href="#products" onClick={() => setActiveCategory("Goggles")}>Goggles</a>
          </nav>
          <div className="shop-header-actions">
            <Button
              variant="ghost"
              size="icon"
              className="shop-icon-button"
              aria-label="Favorites"
              onClick={() => setActiveCategory("All products")}
            >
              <Heart size={19} />
              {favorites.length > 0 && <span className="header-count">{favorites.length}</span>}
            </Button>
            <Button
              variant="outline"
              className="header-cart-button"
              aria-label={`Shopping bag, ${cartCount} items`}
              onClick={() => setCartOpen((open) => !open)}
            >
              <ShoppingBag size={17} /> <span>Bag</span>
              {cartCount > 0 && <span className="header-count">{cartCount}</span>}
            </Button>
          </div>
        </div>
      </header>

      <main id="home" className="shop-shell shop-main">
        <section className="shop-welcome" aria-label="Welcome">
          <div className="welcome-copy">
            <span className="welcome-kicker"><Waves size={14} /> MADE FOR WATER DAYS</span>
            <h1>Find your <span>flow.</span></h1>
            <p>Good gear. Better swims. Your next favorite starts here.</p>
          </div>
          <div className="welcome-note"><span>SWIM MORE</span><strong>Worry less.</strong></div>
        </section>

        <section className="shop-promo" aria-label="Swimwear promotion">
          <div className="promo-copy">
            <span className="promo-label">THE WATER'S CALLING</span>
            <h2>Make a splash<br />in something new.</h2>
            <p>Fresh swim essentials for every kind of water day.</p>
            <Button className="promo-button" onClick={() => {
              setActiveCategory("Swimwear");
              document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
            }}>
              Shop swimwear <ArrowRight size={16} />
            </Button>
          </div>
          <img src={shirtImage} alt="Swimmer wearing a cobalt training top by the pool" width={1024} height={1024} fetchPriority="high" />
          <div className="promo-sticker"><span>NEW</span><strong>Season<br />ready</strong></div>
        </section>

        <section className="category-section" aria-label="Shop categories">
          <div className="category-scroll">
            <button className="category-tile category-tile-active" onClick={() => setActiveCategory("All products")}>
              <span><Waves size={20} /></span><strong>All gear</strong>
            </button>
            <button className="category-tile" onClick={() => setActiveCategory("Swimwear")}>
              <span><Shirt size={20} /></span><strong>Swimwear</strong>
            </button>
            <button className="category-tile" onClick={() => setActiveCategory("Goggles")}>
              <span><Glasses size={20} /></span><strong>Goggles</strong>
            </button>
            <button className="category-tile" onClick={() => setActiveCategory("Accessories")}>
              <span><Backpack size={20} /></span><strong>Swim bags</strong>
            </button>
          </div>
        </section>

        <section className="product-section" id="products">
          <div className="product-heading">
            <div>
              <span className="section-kicker">READY WHEN YOU ARE</span>
              <h2>Featured products</h2>
            </div>
            <span className="result-count">{filteredProducts.length} items</span>
          </div>

          <div className="product-controls">
            <div className="product-search">
              <Search size={17} />
              <Input
                aria-label="Search products"
                placeholder="Search your swim kit"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && <Button variant="ghost" size="icon" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></Button>}
            </div>
            <div className="category-filters" role="group" aria-label="Filter by category">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="ghost"
                  className={cn("category-filter", activeCategory === category && "category-filter-active")}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              className={cn("sort-button", lowToHigh && "sort-button-active")}
              onClick={() => setLowToHigh((value) => !value)}
              aria-label="Sort products by price"
            >
              <SlidersHorizontal size={15} /> <span>{lowToHigh ? "Price: low to high" : "Sort"}</span><ChevronDown size={14} />
            </Button>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    <img src={product.image} alt={product.alt} width={1024} height={1024} loading="lazy" />
                    <span className="product-tag">{product.tag}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("favorite-button", favorites.includes(product.id) && "favorite-button-active")}
                      aria-label={`${favorites.includes(product.id) ? "Remove" : "Add"} ${product.title} ${favorites.includes(product.id) ? "from" : "to"} favorites`}
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart size={17} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
                    </Button>
                    <span className="product-price-pill">{formatPrice(product.price)}</span>
                  </div>
                  <div className="product-details">
                    <div className="stock-line"><span className="stock-dot" />{product.stock} in stock</div>
                    <div className="product-rating"><Star size={13} fill="currentColor" /><strong>{product.rating}</strong><span>({product.reviews})</span></div>
                    <h3>{product.title}</h3>
                    <div className="product-card-bottom">
                      <span>{product.category}</span>
                      <Button className="add-to-bag" onClick={() => addToCart(product.id)} aria-label={`Add ${product.title} to bag`}>
                        Add <ShoppingBag size={15} />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-products"><Search size={22} /><strong>No products found</strong><span>Try another search or category.</span></div>
          )}
        </section>

        <section className="shop-perks" aria-label="Shopping benefits">
          <span><Check size={15} /> Secure checkout</span><i /><span><Check size={15} /> Easy returns</span><i /><span><Check size={15} /> Gear for every swimmer</span>
        </section>
      </main>

      {cartOpen && (
        <aside className="cart-panel" aria-label="Shopping bag">
          <div className="cart-panel-header"><div><span className="section-kicker">YOUR SWIM KIT</span><h2>Shopping bag</h2></div><Button variant="ghost" size="icon" aria-label="Close bag" onClick={() => setCartOpen(false)}><X size={18} /></Button></div>
          {cartItems.length > 0 ? <div className="cart-line-list">{cartItems.map((product) => <div className="cart-line" key={product.id}><img src={product.image} alt="" width={1024} height={1024} /><div><strong>{product.title}</strong><span>{cart[product.id]} × {formatPrice(product.price)}</span></div><div className="cart-quantity"><Button variant="outline" size="icon" aria-label={`Remove one ${product.title}`} onClick={() => setCart((current) => ({ ...current, [product.id]: Math.max(0, (current[product.id] ?? 0) - 1) }))}>−</Button><span>{cart[product.id]}</span><Button variant="outline" size="icon" aria-label={`Add one ${product.title}`} onClick={() => addToCart(product.id)}>+</Button></div></div>)}</div> : <div className="cart-empty"><ShoppingBag size={25} /><strong>Your bag is ready for a swim.</strong><span>Add a few favorites to get started.</span></div>}
          <div className="cart-total"><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div>
          <Button className="checkout-button" disabled={cartCount === 0} onClick={() => setCartOpen(false)}>Continue to checkout <ArrowRight size={16} /></Button>
        </aside>
      )}

      {cartCount > 0 && (
        <div className="cart-dock">
          <Button className="cart-dock-button" onClick={() => setCartOpen((open) => !open)}>
            <span>View your bag <span className="cart-dock-count">{cartCount}x</span></span>
            <strong>{formatPrice(cartTotal)}</strong>
          </Button>
        </div>
      )}
    </div>
  );
}