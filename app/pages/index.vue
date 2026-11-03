
<script setup lang="ts">
import {
  Search,
  ShoppingBag,
  Menu,
  ArrowRight,
  ArrowUpRight,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Instagram,
  Facebook,
  Twitter,
  X,
  LoaderCircle,
  RefreshCw,
} from 'lucide-vue-next'

interface Category {
  id: string
  name: string
  slug?: string
  image_url?: string | null
}

interface Product {
  id: string
  name: string
  slug?: string
  description?: string | null
  price: number | string
  compare_at_price?: number | string | null
  image_url?: string | null
  stock_quantity?: number | null
  is_featured?: boolean
  category_id?: string | null
  categories?: { name: string } | { name: string }[] | null
}

interface CartItem {
  product: Product
  quantity: number
}

const { $supabase } = useNuxtApp()

const searchQuery = ref('')
const activeCategory = ref('All')
const mobileMenuOpen = ref(false)
const cartOpen = ref(false)
const cart = ref<CartItem[]>([])
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const errorMessage = ref('')
const wishlist = ref<string[]>([])
const notice = ref('')

const cartCount = computed(() =>
  cart.value.reduce((total, item) => total + item.quantity, 0),
)

const cartTotal = computed(() =>
  cart.value.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  ),
)

const categoryOptions = computed(() => [
  { name: 'All', count: products.value.length },
  ...categories.value.map((category) => ({
    name: category.name,
    count: products.value.filter(
      (product) => product.category_id === category.id,
    ).length,
  })),
])

function categoryName(product: Product) {
  const relation = product.categories
  if (Array.isArray(relation)) return relation[0]?.name ?? 'Collection'
  return relation?.name ?? 'Collection'
}

function productImage(product: Product) {
  return product.image_url || ''
}

function inStock(product: Product) {
  return product.stock_quantity == null || product.stock_quantity > 0
}

function formatPrice(value: number | string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value))
}

const visibleProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const matchesCategory =
      activeCategory.value === 'All' ||
      categoryName(product) === activeCategory.value

    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      categoryName(product).toLowerCase().includes(query) ||
      (product.description ?? '').toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })
})

async function loadProducts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [categoryResult, productResult] = await Promise.all([
      $supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name'),

      $supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

    if (categoryResult.error) throw categoryResult.error
    if (productResult.error) throw productResult.error

    categories.value = (categoryResult.data ?? []) as Category[]
    products.value = (productResult.data ?? []) as Product[]
  } catch (error: unknown) {
    console.error('Store catalogue could not be loaded:', error)
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'We could not load the collection. Please try again.'
  } finally {
    loading.value = false
  }
}

function addToCart(product: Product) {
  if (!inStock(product)) {
    notice.value = 'This item is currently out of stock.'
    return
  }

  const existing = cart.value.find(
    (item) => item.product.id === product.id,
  )

  const available = Number(product.stock_quantity)

  if (
    existing &&
    product.stock_quantity != null &&
    existing.quantity >= available
  ) {
    notice.value = 'You have reached the available stock for this item.'
    return
  }

  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ product, quantity: 1 })
  }

  notice.value = `${product.name} added to your bag.`
  cartOpen.value = false
}

function changeQuantity(productId: string, amount: number) {
  const item = cart.value.find(
    (entry) => entry.product.id === productId,
  )
  if (!item) return

  const stock = item.product.stock_quantity

  if (amount > 0 && stock != null && item.quantity >= stock) {
    notice.value = 'No more stock is available for this item.'
    return
  }

  item.quantity += amount

  if (item.quantity <= 0) {
    cart.value = cart.value.filter(
      (entry) => entry.product.id !== productId,
    )
  }
}

function toggleWishlist(productId: string) {
  wishlist.value = wishlist.value.includes(productId)
    ? wishlist.value.filter((id) => id !== productId)
    : [...wishlist.value, productId]
}

function selectCategory(name: string) {
  activeCategory.value = name
  mobileMenuOpen.value = false
}

onMounted(loadProducts)
</script>

<template>
  <div id="top" class="store">
    <div class="announcement">
      <span>Thoughtful pieces for everyday living</span>
      <a href="#shop">Discover the collection <ArrowRight :size="13" /></a>
    </div>

    <header class="header">
      <NuxtLink to="/" class="brand" aria-label="Maison home">
        MAISON<span>.</span>
        <small>OBJECTS FOR EVERYDAY LIVING</small>
      </NuxtLink>

      <nav class="desktop-nav">
        <a href="#shop">Shop all</a>
        <a href="#categories">Collections</a>
        <a href="#story">Our story</a>
        <a href="#newsletter">Journal</a>
      </nav>

      <div class="header-actions">
        <button
          class="icon-button"
          aria-label="Search products"
          @click="($refs.searchInput as HTMLInputElement | undefined)?.focus()"
        >
          <Search :size="20" />
        </button>

        <button class="bag-button" @click="cartOpen = true">
          <ShoppingBag :size="20" />
          <span>Bag ({{ cartCount }})</span>
        </button>

        <button
          class="icon-button mobile-toggle"
          aria-label="Toggle navigation"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <Menu v-if="!mobileMenuOpen" :size="22" />
          <X v-else :size="22" />
        </button>
      </div>

      <nav v-if="mobileMenuOpen" class="mobile-nav">
        <a href="#shop" @click="mobileMenuOpen = false">Shop all</a>
        <a href="#categories" @click="mobileMenuOpen = false">Collections</a>
        <a href="#story" @click="mobileMenuOpen = false">Our story</a>
        <a href="#newsletter" @click="mobileMenuOpen = false">Journal</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <img
          class="hero-image"
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=90"
          alt="Contemporary retail collection"
        />
        <div class="hero-overlay"></div>

        <div class="hero-content">
          <p class="eyebrow light">THE ART OF EVERYDAY</p>
          <h1>Less, but<br /><em>better.</em></h1>
          <p class="hero-description">
            Thoughtfully chosen pieces. Considered design.<br class="desktop-break" />
            A little more meaning in the everyday.
          </p>
          <a class="primary-button" href="#shop">
            Discover the collection <ArrowRight :size="17" />
          </a>
          <div class="hero-note">
            <span class="hero-line"></span>
            <span>DESIGNED TO LIVE WITH YOU</span>
          </div>
        </div>

        <div class="hero-index">01 <span></span> 03</div>
      </section>

      <section class="trust-strip">
        <div><Truck :size="21" /><span>Thoughtful delivery</span></div>
        <div><ShieldCheck :size="21" /><span>Secure shopping</span></div>
        <div><RotateCcw :size="21" /><span>Clear returns policy</span></div>
      </section>

      <section id="categories" class="categories section-shell">
        <div class="section-heading">
          <div>
            <p class="eyebrow">A CONSIDERED COLLECTION</p>
            <h2>Find your <em>everyday.</em></h2>
          </div>
          <a href="#shop" class="text-link">
            Explore everything <ArrowUpRight :size="17" />
          </a>
        </div>

        <div class="category-grid">
          <a
            href="#shop"
            class="category-card category-large"
            @click="selectCategory('Clothing')"
          >
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85"
              alt="Contemporary clothing"
              loading="lazy"
            />
            <span class="category-number">01 / COLLECTION</span>
            <span class="category-title">Wear it well <ArrowUpRight :size="20" /></span>
          </a>

          <a
            href="#shop"
            class="category-card"
            @click="selectCategory('Accessories')"
          >
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=850&q=85"
              alt="Curated accessories"
              loading="lazy"
            />
            <span class="category-number">02 / DETAILS</span>
            <span class="category-title">The finishing touch <ArrowUpRight :size="20" /></span>
          </a>

          <a
            href="#shop"
            class="category-card"
            @click="selectCategory('Footwear')"
          >
            <img
              src="https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=850&q=85"
              alt="Everyday footwear"
              loading="lazy"
            />
            <span class="category-number">03 / MOVEMENT</span>
            <span class="category-title">Made to move <ArrowUpRight :size="20" /></span>
          </a>
        </div>
      </section>

      <section id="shop" class="shop-section">
        <div class="section-shell">
          <div class="section-heading shop-heading">
            <div>
              <p class="eyebrow">THE PIECES WE LOVE</p>
              <h2>Good things, <em>well made.</em></h2>
            </div>

            <label class="search-field">
              <Search :size="18" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="search"
                placeholder="Find something..."
                aria-label="Search products"
              />
            </label>
          </div>

          <div class="category-filters">
            <button
              v-for="category in categoryOptions"
              :key="category.name"
              :class="{ selected: activeCategory === category.name }"
              @click="selectCategory(category.name)"
            >
              {{ category.name }}
              <span class="filter-count">{{ category.count }}</span>
            </button>
          </div>

          <div v-if="loading" class="status-panel">
            <LoaderCircle class="spin" :size="27" />
            <h3>Curating your collection</h3>
            <p>Please wait while we load the latest products.</p>
          </div>

          <div v-else-if="errorMessage" class="status-panel">
            <ShieldCheck :size="30" />
            <h3>Our collection is temporarily unavailable</h3>
            <p>{{ errorMessage }}</p>
            <button class="outline-button" @click="loadProducts">
              Try again <RefreshCw :size="16" />
            </button>
          </div>

          <div v-else-if="visibleProducts.length" class="product-grid">
            <article
              v-for="product in visibleProducts"
              :key="product.id"
              class="product-card"
            >
              <div class="product-image-wrap">
                <img
                  v-if="productImage(product)"
                  :src="productImage(product)"
                  :alt="product.name"
                  loading="lazy"
                />
                <div v-else class="image-placeholder">
                  <ShoppingBag :size="34" />
                  <span>MAISON</span>
                </div>

                <span v-if="product.is_featured" class="product-badge">
                  FEATURED
                </span>

                <button
                  class="wishlist-button"
                  :class="{ wished: wishlist.includes(product.id) }"
                  :aria-label="wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'"
                  @click="toggleWishlist(product.id)"
                >
                  <Heart
                    :size="18"
                    :fill="wishlist.includes(product.id) ? 'currentColor' : 'none'"
                  />
                </button>

                <button
                  class="quick-add"
                  :disabled="!inStock(product)"
                  @click="addToCart(product)"
                >
                  {{ inStock(product) ? 'Add to bag' : 'Sold out' }}
                  <ArrowRight :size="16" />
                </button>
              </div>

              <div class="product-meta">
                <div>
                  <p class="product-category">{{ categoryName(product) }}</p>
                  <h3>{{ product.name }}</h3>
                </div>
                <div class="price-group">
                  <p class="product-price">{{ formatPrice(product.price) }}</p>
                  <p
                    v-if="product.compare_at_price && Number(product.compare_at_price) > Number(product.price)"
                    class="compare-price"
                  >
                    {{ formatPrice(product.compare_at_price) }}
                  </p>
                </div>
              </div>

              <p v-if="!inStock(product)" class="stock-note">Currently unavailable</p>
            </article>
          </div>

          <div v-else class="status-panel">
            <ShoppingBag :size="30" />
            <h3>No products found</h3>
            <p>
              Try another search or choose a different collection.
            </p>
            <button
              class="outline-button"
              @click="searchQuery = ''; activeCategory = 'All'"
            >
              Clear filters <ArrowRight :size="16" />
            </button>
          </div>

          <div v-if="!loading && !errorMessage && products.length" class="center-action">
            <button
              class="outline-button"
              @click="activeCategory = 'All'; searchQuery = ''"
            >
              Explore all products <ArrowRight :size="17" />
            </button>
          </div>
        </div>
      </section>

      <section id="story" class="story-section">
        <div class="story-image">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=85"
            alt="Thoughtful retail design"
            loading="lazy"
          />
        </div>
        <div class="story-content">
          <p class="eyebrow">A DIFFERENT WAY TO SHOP</p>
          <h2>Buy less.<br /><em>Choose well.</em><br />Make it last.</h2>
          <p>
            We believe the things we bring into our lives should earn their place.
            That's why we look for thoughtful details, lasting materials and
            designs that feel right today and tomorrow.
          </p>
          <a href="#newsletter" class="text-link">
            A little about us <ArrowRight :size="17" />
          </a>
          <span class="story-stamp">MADE FOR<br />THE EVERYDAY</span>
        </div>
      </section>

      <section class="benefits section-shell">
        <div class="benefit">
          <Truck :size="25" />
          <h3>Delivery, thoughtfully.</h3>
          <p>Clear delivery options at checkout, wherever you are.</p>
        </div>
        <div class="benefit">
          <ShieldCheck :size="25" />
          <h3>Your trust matters.</h3>
          <p>Secure payments and careful handling of your information.</p>
        </div>
        <div class="benefit">
          <RotateCcw :size="25" />
          <h3>Shop with confidence.</h3>
          <p>Transparent return policies and friendly support.</p>
        </div>
      </section>

      <section id="newsletter" class="newsletter">
        <p class="eyebrow light">NOTES FROM MAISON</p>
        <h2>Good things, delivered.</h2>
        <p>New collections, considered finds and a little inspiration.</p>
        <form class="newsletter-form" @submit.prevent="notice = 'Newsletter subscriptions will be enabled in a later step.'">
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Email address"
            required
          />
          <button type="submit" aria-label="Subscribe">
            <ArrowRight :size="19" />
          </button>
        </form>
        <span class="newsletter-note">
          Thoughtful emails only. Unsubscribe anytime.
        </span>
      </section>
    </main>

    <footer class="footer">
      <div class="footer-top">
        <div class="footer-brand">
          <NuxtLink to="/" class="brand footer-logo">MAISON<span>.</span></NuxtLink>
          <p>Thoughtfully chosen.<br />Made for everyday living.</p>
          <div class="social-links">
            <a href="#newsletter" aria-label="Instagram"><Instagram :size="18" /></a>
            <a href="#newsletter" aria-label="Facebook"><Facebook :size="18" /></a>
            <a href="#newsletter" aria-label="Twitter"><Twitter :size="18" /></a>
          </div>
        </div>

        <div class="footer-column">
          <h4>EXPLORE</h4>
          <a href="#shop">Shop all</a>
          <a href="#categories">Collections</a>
          <a href="#story">Our story</a>
        </div>

        <div class="footer-column">
          <h4>HELP</h4>
          <a href="#newsletter">Contact us</a>
          <a href="#newsletter">Shipping & returns</a>
          <a href="#newsletter">FAQs</a>
        </div>

        <div class="footer-column">
          <h4>THE DETAILS</h4>
          <a href="#newsletter">Privacy policy</a>
          <a href="#newsletter">Terms of service</a>
          <a href="#newsletter">Payment information</a>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} Maison. All rights reserved.</span>
        <span>Prices shown in USD ($)</span>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>

    <Transition name="toast">
      <div v-if="notice" class="toast-message" role="status">
        <span>{{ notice }}</span>
        <button aria-label="Dismiss notification" @click="notice = ''">
          <X :size="16" />
        </button>
      </div>
    </Transition>

    <div v-if="cartOpen" class="drawer-backdrop" @click.self="cartOpen = false">
      <aside class="cart-drawer" aria-label="Shopping bag">
        <div class="drawer-heading">
          <div>
            <p class="eyebrow">YOUR SELECTION</p>
            <h2>Your bag <span>({{ cartCount }})</span></h2>
          </div>
          <button class="icon-button" aria-label="Close bag" @click="cartOpen = false">
            <X :size="22" />
          </button>
        </div>

        <div v-if="!cart.length" class="empty-cart">
          <ShoppingBag :size="38" />
          <h3>Your bag is waiting.</h3>
          <p>Discover pieces you'll love living with.</p>
          <button class="primary-button" @click="cartOpen = false">
            Continue shopping <ArrowRight :size="16" />
          </button>
        </div>

        <div v-else class="cart-items">
          <article v-for="item in cart" :key="item.product.id" class="cart-item">
            <img
              v-if="productImage(item.product)"
              :src="productImage(item.product)"
              :alt="item.product.name"
            />
            <div v-else class="cart-placeholder"><ShoppingBag :size="22" /></div>

            <div class="cart-item-info">
              <p class="product-category">{{ categoryName(item.product) }}</p>
              <h3>{{ item.product.name }}</h3>
              <p>{{ formatPrice(item.product.price) }}</p>
              <div class="quantity-controls">
                <button aria-label="Decrease quantity" @click="changeQuantity(item.product.id, -1)">−</button>
                <span>{{ item.quantity }}</span>
                <button aria-label="Increase quantity" @click="changeQuantity(item.product.id, 1)">+</button>
              </div>
            </div>

            <button
              class="remove-item"
              aria-label="Remove item"
              @click="changeQuantity(item.product.id, -item.quantity)"
            >
              <X :size="16" />
            </button>
          </article>

          <div class="cart-summary">
            <div><span>Subtotal</span><strong>{{ formatPrice(cartTotal) }}</strong></div>
            <p>Shipping and taxes are calculated at checkout.</p>
            <button
              class="primary-button checkout-button"
              @click="notice = 'Checkout will be enabled after secure order and payment integration.'"
            >
              Continue to checkout <ArrowRight :size="17" />
            </button>
            <button class="continue-link" @click="cartOpen = false">
              Continue shopping
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');

.store {
  --ink: #25241f;
  --muted: #77756d;
  --cream: #f7f5f0;
  --line: #e8e5de;
  --olive: #666b4e;
  color: var(--ink);
  background: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
}
.store * { box-sizing: border-box; }
.store button, .store input { font: inherit; }
.store button, .store a { -webkit-tap-highlight-color: transparent; }
.store a { color: inherit; text-decoration: none; }
.store button { cursor: pointer; }
.store button:disabled { cursor: not-allowed; opacity: .65; }
.announcement {
  min-height: 36px; padding: 9px 5%; display:flex; align-items:center;
  justify-content:center; gap: 12px; background:#34392d; color:#fff;
  font-size:10px; letter-spacing:.055em;
}
.announcement a { display:flex; align-items:center; gap:5px; color:#e2dfd1; }
.header {
  height: 88px; padding:0 6%; display:flex; align-items:center;
  justify-content:space-between; position:relative; z-index:10;
  border-bottom:1px solid #f0eee9; background:white;
}
.brand {
  display:flex; flex-direction:column; font-family:'Playfair Display',serif;
  font-size:29px; letter-spacing:.07em; line-height:1;
}
.brand small {
  margin-top:8px; font-family:'DM Sans',sans-serif; font-size:8px;
  letter-spacing:.18em; color:var(--muted);
}
.desktop-nav { display:flex; align-items:center; gap:37px; }
.desktop-nav a { font-size:12px; color:#55544d; transition:color .2s; }
.desktop-nav a:hover,.footer-column a:hover { color:var(--olive); }
.header-actions { display:flex; align-items:center; gap:21px; }
.icon-button,.bag-button {
  display:flex; align-items:center; justify-content:center; gap:9px;
  border:0; background:none; color:var(--ink);
}
.bag-button { font-size:12px; }
.mobile-toggle,.mobile-nav { display:none; }
.hero { position:relative; min-height:590px; height:min(680px,72vw); background:#46463d; overflow:hidden; }
.hero-image,.hero-overlay { position:absolute; inset:0; width:100%; height:100%; }
.hero-image { object-fit:cover; object-position:center 55%; }
.hero-overlay { background:linear-gradient(90deg,rgba(25,27,23,.75),rgba(25,27,23,.42) 45%,rgba(25,27,23,.04)); }
.hero-content { position:absolute; top:50%; left:10%; transform:translateY(-48%); color:#fff; }
.eyebrow { margin:0 0 17px; font-size:9px; letter-spacing:.19em; font-weight:600; color:var(--olive); }
.light { color:#d9d8c8; }
.hero h1,.section-heading h2,.story-content h2,.newsletter h2 {
  margin:0; font-family:'Playfair Display',serif; font-weight:400; letter-spacing:-.035em;
}
.hero h1 { font-size:clamp(64px,8vw,112px); line-height:.96; }
.hero h1 em,.section-heading h2 em,.story-content h2 em { font-weight:400; }
.hero-description { margin:24px 0 30px; color:#e8e6df; font-size:12px; line-height:1.9; }
.primary-button,.outline-button {
  display:inline-flex; align-items:center; justify-content:center; gap:22px;
  padding:16px 20px; font-size:11px; transition:background .2s,color .2s;
}
.primary-button { background:#fff; color:#282922; border:1px solid #fff; }
.primary-button:hover { background:#e5e3d9; }
.hero-note {
  position:absolute; top:calc(100% + 85px); display:flex; align-items:center;
  gap:12px; color:#dddace; font-size:8px; letter-spacing:.15em; white-space:nowrap;
}
.hero-line,.hero-index span { display:inline-block; height:1px; width:35px; background:#d9d7cb; }
.hero-index { position:absolute; right:6%; bottom:38px; display:flex; gap:12px; align-items:center; color:#fff; font-size:10px; }
.hero-index span { width:50px; }
.trust-strip {
  display:flex; align-items:center; justify-content:center; gap:8%;
  padding:25px 5%; border-bottom:1px solid var(--line); background:#fbfaf7;
}
.trust-strip div { display:flex; align-items:center; gap:10px; color:#5e5d55; font-size:10px; }
.trust-strip svg,.benefit svg { color:var(--olive); }
.section-shell { max-width:1440px; margin:0 auto; padding-left:6%; padding-right:6%; }
.categories { padding-top:105px; padding-bottom:105px; }
.section-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:35px; }
.section-heading h2 { font-size:clamp(34px,4.1vw,52px); line-height:1.12; }
.text-link { display:inline-flex; align-items:center; gap:10px; padding-bottom:5px; border-bottom:1px solid #c8c6bb; font-size:11px; white-space:nowrap; }
.category-grid { display:grid; grid-template-columns:1.35fr 1fr 1fr; gap:17px; }
.category-card { position:relative; height:350px; overflow:hidden; background:#e8e5dd; color:white!important; }
.category-card::after { content:''; position:absolute; inset:40% 0 0; background:linear-gradient(transparent,rgba(0,0,0,.58)); }
.category-card img { width:100%; height:100%; object-fit:cover; transition:transform .5s; }
.category-card:hover img { transform:scale(1.045); }
.category-number,.category-title { position:absolute; z-index:1; left:23px; }
.category-number { top:22px; font-size:8px; letter-spacing:.16em; }
.category-title { bottom:22px; right:20px; display:flex; align-items:center; justify-content:space-between; gap:10px; font-family:'Playfair Display',serif; font-size:23px; }
.shop-section { background:var(--cream); padding:100px 0 95px; }
.shop-heading { margin-bottom:30px; }
.search-field { display:flex; align-items:center; gap:10px; border-bottom:1px solid #c8c6bb; padding:11px 0; min-width:230px; color:#747269; }
.search-field input { width:100%; border:0; outline:0; background:transparent; font-size:11px; }
.category-filters { display:flex; gap:26px; margin-bottom:30px; border-bottom:1px solid #e4e1d9; overflow-x:auto; }
.category-filters button { flex-shrink:0; padding:0 0 13px; border:0; border-bottom:2px solid transparent; background:none; color:#77756d; font-size:11px; }
.category-filters button.selected { color:var(--ink); border-bottom-color:var(--ink); }
.filter-count { margin-left:3px; color:#99968c; font-size:10px; }
.product-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:22px 18px; }
.product-image-wrap { position:relative; aspect-ratio:.79; overflow:hidden; background:#e7e4dc; }
.product-image-wrap > img { width:100%; height:100%; object-fit:cover; transition:transform .45s; }
.product-card:hover .product-image-wrap > img { transform:scale(1.04); }
.image-placeholder { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:#99968b; background:#ebe8e0; }
.image-placeholder span { font-family:'Playfair Display',serif; letter-spacing:.15em; }
.product-badge { position:absolute; top:13px; left:12px; padding:7px 9px; background:#fff; color:#4b4b42; font-size:8px; letter-spacing:.1em; }
.wishlist-button {
  position:absolute; top:11px; right:11px; display:grid; place-items:center;
  width:34px; height:34px; border:0; border-radius:50%; background:rgba(255,255,255,.92);
}
.wishlist-button:hover,.wishlist-button.wished { color:#a44848; }
.quick-add {
  position:absolute; bottom:0; left:0; right:0; width:100%;
  display:flex; align-items:center; justify-content:space-between; padding:15px;
  border:0; background:rgba(255,255,255,.96); color:var(--ink); font-size:11px;
  transform:translateY(100%); transition:transform .25s;
}
.product-card:hover .quick-add,.quick-add:focus { transform:translateY(0); }
.product-meta { display:flex; justify-content:space-between; gap:8px; padding-top:15px; }
.product-category { margin:0 0 7px; color:#838177; font-size:9px; }
.product-meta h3 { margin:0; font-size:12px; font-weight:500; line-height:1.5; }
.price-group { text-align:right; flex-shrink:0; }
.product-price { margin:0; font-size:12px; white-space:nowrap; }
.compare-price { margin:5px 0 0; color:#96938a; font-size:10px; text-decoration:line-through; }
.stock-note { margin:9px 0 0; color:#8a6258; font-size:10px; }
.center-action { display:flex; justify-content:center; margin-top:48px; }
.outline-button { border:1px solid #bdbab0; background:transparent; color:var(--ink); }
.outline-button:hover { background:var(--ink); color:#fff; }
.status-panel { min-height:230px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:13px; text-align:center; color:#77756d; padding:35px 15px; }
.status-panel h3 { margin:0; color:var(--ink); font-family:'Playfair Display',serif; font-weight:400; font-size:23px; }
.status-panel p { max-width:460px; margin:0; font-size:12px; line-height:1.8; overflow-wrap:anywhere; }
.status-panel .outline-button { margin-top:5px; }
.spin { animation:spin 1.2s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.story-section { display:grid; grid-template-columns:1fr 1fr; min-height:590px; background:#eceae3; }
.story-image { min-height:590px; overflow:hidden; }
.story-image img { width:100%; height:100%; object-fit:cover; }
.story-content { position:relative; align-self:center; max-width:620px; padding:75px 12%; }
.story-content h2 { font-size:clamp(44px,5vw,67px); line-height:1.1; }
.story-content > p:not(.eyebrow) { max-width:365px; margin:25px 0; color:#747269; font-size:12px; line-height:2; }
.story-stamp { position:absolute; right:8%; bottom:30px; display:grid; place-items:center; width:75px; height:75px; border:1px solid #c7c4b8; border-radius:50%; color:#77756d; text-align:center; font-size:7px; letter-spacing:.12em; line-height:1.8; transform:rotate(-12deg); }
.benefits { display:grid; grid-template-columns:repeat(3,1fr); gap:35px; padding-top:70px; padding-bottom:75px; text-align:center; }
.benefit { padding:0 18px; }
.benefit h3 { margin:17px 0 9px; font-family:'Playfair Display',serif; font-size:19px; font-weight:400; }
.benefit p { max-width:250px; margin:0 auto; color:#807e74; font-size:11px; line-height:1.8; }
.newsletter { padding:72px 20px 76px; text-align:center; background:#414638; color:#fff; }
.newsletter h2 { font-size:clamp(35px,4vw,48px); }
.newsletter > p:not(.eyebrow) { margin:14px 0 25px; color:#d2d1c7; font-size:11px; }
.newsletter-form { display:flex; width:min(390px,90%); margin:0 auto 14px; border-bottom:1px solid #9d9f91; }
.newsletter-form input { flex:1; min-width:0; padding:14px 0; border:0; outline:0; background:transparent; color:white; font-size:11px; }
.newsletter-form input::placeholder { color:#d0d0c6; }
.newsletter-form button { display:grid; place-items:center; padding:0 8px; border:0; background:transparent; color:#fff; }
.newsletter-note { color:#c2c2b6; font-size:9px; }
.footer { padding:60px 6% 0; }
.footer-top { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px; padding-bottom:48px; }
.footer-logo { display:inline-flex; font-size:27px; }
.footer-brand > p { margin:18px 0; color:#77756d; font-size:11px; line-height:1.9; }
.social-links { display:flex; gap:15px; }
.social-links a { color:#66665c; }
.footer-column { display:flex; flex-direction:column; align-items:flex-start; gap:14px; }
.footer-column h4 { margin:5px 0 7px; font-size:9px; letter-spacing:.13em; }
.footer-column a { color:#77756d; font-size:10px; }
.footer-bottom { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:20px 0; border-top:1px solid var(--line); color:#88867c; font-size:9px; }
.toast-message {
  position:fixed; z-index:60; right:22px; bottom:22px; max-width:min(420px,calc(100vw - 32px));
  display:flex; align-items:center; gap:16px; justify-content:space-between;
  padding:15px 17px; background:#34392d; color:#fff; box-shadow:0 10px 35px #0002;
  font-size:12px; line-height:1.6;
}
.toast-message button { display:grid; place-items:center; border:0; background:none; color:white; }
.toast-enter-active,.toast-leave-active { transition:opacity .2s,transform .2s; }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(8px); }
.drawer-backdrop { position:fixed; inset:0; z-index:50; display:flex; justify-content:flex-end; background:#17171080; }
.cart-drawer { width:min(480px,100%); height:100%; display:flex; flex-direction:column; background:#fff; padding:28px; overflow-y:auto; box-shadow:-10px 0 40px #0001; }
.drawer-heading { display:flex; align-items:center; justify-content:space-between; padding-bottom:24px; border-bottom:1px solid var(--line); }
.drawer-heading .eyebrow { margin-bottom:8px; }
.drawer-heading h2 { margin:0; font-family:'Playfair Display',serif; font-size:32px; font-weight:400; }
.drawer-heading h2 span { color:var(--muted); font-size:18px; }
.empty-cart { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:16px; color:var(--muted); }
.empty-cart h3 { margin:0; color:var(--ink); font-family:'Playfair Display',serif; font-size:25px; font-weight:400; }
.empty-cart p { margin:0 0 10px; font-size:12px; }
.cart-items { flex:1; display:flex; flex-direction:column; }
.cart-item { display:grid; grid-template-columns:88px 1fr auto; gap:15px; padding:22px 0; border-bottom:1px solid var(--line); }
.cart-item > img,.cart-placeholder { width:88px; height:112px; object-fit:cover; background:var(--cream); }
.cart-placeholder { display:grid; place-items:center; color:var(--muted); }
.cart-item-info h3 { margin:0 0 8px; font-size:12px; font-weight:500; }
.cart-item-info > p:not(.product-category) { margin:0; font-size:12px; }
.quantity-controls { display:inline-flex; align-items:center; gap:15px; margin-top:13px; border:1px solid var(--line); }
.quantity-controls button { width:29px; height:27px; border:0; background:white; }
.quantity-controls span { font-size:11px; }
.remove-item { align-self:start; border:0; background:none; color:var(--muted); }
.cart-summary { margin-top:auto; padding-top:24px; }
.cart-summary > div { display:flex; justify-content:space-between; font-size:13px; }
.cart-summary strong { font-weight:600; }
.cart-summary > p { margin:13px 0 22px; color:var(--muted); font-size:11px; }
.checkout-button { width:100%; justify-content:space-between; background:#34392d; border-color:#34392d; color:#fff; }
.checkout-button:hover { background:#4d5341; }
.continue-link { display:block; margin:17px auto 0; border:0; background:none; color:var(--muted); font-size:11px; text-decoration:underline; }
@media (max-width:900px) {
  .desktop-nav { gap:18px; }
  .header { padding:0 4%; }
  .section-shell { padding-left:4%; padding-right:4%; }
  .category-card { height:280px; }
  .product-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:28px 16px; }
  .story-content { padding:55px 8%; }
  .footer-top { grid-template-columns:1.5fr 1fr 1fr; }
  .footer-column:last-child { grid-column:2; }
}
@media (max-width:600px) {
  .announcement { gap:5px; font-size:8px; }
  .header { height:73px; }
  .brand { font-size:24px; }
  .brand small { font-size:7px; }
  .desktop-nav { display:none; }
  .header-actions { gap:14px; }
  .bag-button span { display:none; }
  .mobile-toggle { display:flex; }
  .mobile-nav { position:absolute; top:100%; left:0; right:0; display:flex; flex-direction:column; padding:10px 6% 18px; border-bottom:1px solid var(--line); background:#fff; }
  .mobile-nav a { padding:14px 0; border-bottom:1px solid #f0eee9; font-size:13px; }
  .hero { min-height:570px; height:80vh; max-height:720px; }
  .hero-image { object-position:60% center; }
  .hero-overlay { background:linear-gradient(90deg,rgba(25,27,23,.76),rgba(25,27,23,.25)); }
  .hero-content { left:7%; right:5%; }
  .hero h1 { font-size:76px; }
  .hero-description { font-size:11px; }
  .hero-note { top:calc(100% + 70px); font-size:7px; }
  .trust-strip { display:grid; grid-template-columns:1fr; gap:15px; padding:22px 8%; }
  .trust-strip div { font-size:10px; }
  .categories { padding-top:68px; padding-bottom:65px; }
  .section-heading { align-items:flex-start; flex-direction:column; gap:18px; }
  .section-heading h2 { font-size:38px; }
  .category-grid { grid-template-columns:1fr 1fr; gap:10px; }
  .category-card,.category-large { height:245px; }
  .category-large { grid-column:span 2; height:320px; }
  .category-number { left:13px; top:14px; font-size:7px; }
  .category-title { left:13px; right:10px; bottom:15px; font-size:18px; }
  .shop-section { padding:68px 0; }
  .shop-heading { gap:20px; }
  .search-field { width:100%; }
  .category-filters { gap:20px; scrollbar-width:none; }
  .category-filters::-webkit-scrollbar { display:none; }
  .product-grid { gap:25px 12px; }
  .product-meta { flex-direction:column; gap:8px; }
  .product-meta h3 { font-size:11px; }
  .price-group { text-align:left; }
  .quick-add { position:relative; transform:none; padding:11px; font-size:10px; }
  .wishlist-button { width:30px; height:30px; }
  .product-badge { top:8px; left:8px; font-size:7px; padding:6px; }
  .story-section { grid-template-columns:1fr; }
  .story-image { min-height:370px; height:370px; }
  .story-content { padding:55px 7% 85px; }
  .story-content h2 { font-size:56px; }
  .story-stamp { right:8%; bottom:15px; width:65px; height:65px; }
  .benefits { grid-template-columns:1fr; gap:35px; padding-top:55px; padding-bottom:55px; }
  .newsletter { padding:60px 15px; }
  .footer { padding:45px 6% 0; }
  .footer-top { grid-template-columns:1fr 1fr; gap:35px 20px; }
  .footer-brand { grid-column:span 2; }
  .footer-column:last-child { grid-column:auto; }
  .footer-bottom { flex-wrap:wrap; justify-content:flex-start; gap:12px 20px; }
  .cart-drawer { padding:22px 18px; }
}
</style>
