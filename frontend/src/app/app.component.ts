import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Product, ProductService, Store, Feedback, FeedbackPublic } from './product.service';
import { firstValueFrom } from 'rxjs';

interface CatalogOption {
  value: string;
  label: string;
}

type ViewName = 'inicio' | 'catalogo' | 'admin' | 'sobre-mi';

@Component({
  selector: 'app-home',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'AdrianStore';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;
  isAdmin = false;
  activeView: ViewName = 'inicio';
  previousView: ViewName = 'inicio';

  catalogOptions: CatalogOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'ropa', label: 'Ropa' },
    { value: 'alimentos', label: 'Alimentos' },
    { value: 'hogar', label: 'Hogar' },
    { value: 'electrodomesticos', label: 'Electrodomésticos' },
    { value: 'deportes', label: 'Deportes' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'prendas', label: 'Prendas' },
    { value: 'accesorios', label: 'Accesorios' },
    { value: 'inmuebles', label: 'Inmuebles' },
    { value: 'otros', label: 'Otros' },
  ];
  selectedCategory = 'all';
  selectedCategoryLabel = 'Todos';
  searchTerm = '';
  categoryMenuOpen = false;
  priceMenuOpen = false;

  priceBounds = { min: 0, max: 0 };
  minPrice = 0;
  maxPrice = 0;
  selectedPriceCurrency = 'all';
  selectedProvince = 'all';

  adminUsername = '';
  adminPassword = '';
  adminLoginError = '';
  failedAttempts = 0;
  lockUntil: number | null = null;
  lockRemaining = 0;
  private lockTimer: any = null;

  productTypes: CatalogOption[] = [
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'ropa', label: 'Ropa' },
    { value: 'alimentos', label: 'Alimentos' },
    { value: 'hogar', label: 'Hogar' },
    { value: 'electrodomesticos', label: 'Electrodomésticos' },
    { value: 'deportes', label: 'Deportes' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'prendas', label: 'Prendas' },
    { value: 'accesorios', label: 'Accesorios' },
    { value: 'inmuebles', label: 'Inmuebles' },
    { value: 'otros', label: 'Otros' },
  ];

  currencyOptions: CatalogOption[] = [
    { value: 'CUP', label: 'CUP (Peso cubano)' },
    { value: 'USD', label: 'USD (Dólar)' },
    { value: 'EUR', label: 'EUR (Euro)' },
    { value: 'ZELLE', label: 'ZELLE' },
  ];

  provinceOptions: CatalogOption[] = [
    { value: 'Pinar del Río', label: 'Pinar del Río' },
    { value: 'Artemisa', label: 'Artemisa' },
    { value: 'La Habana', label: 'La Habana' },
    { value: 'Mayabeque', label: 'Mayabeque' },
    { value: 'Matanzas', label: 'Matanzas' },
    { value: 'Cienfuegos', label: 'Cienfuegos' },
    { value: 'Villa Clara', label: 'Villa Clara' },
    { value: 'Sancti Spíritus', label: 'Sancti Spíritus' },
    { value: 'Ciego de Ávila', label: 'Ciego de Ávila' },
    { value: 'Camagüey', label: 'Camagüey' },
    { value: 'Las Tunas', label: 'Las Tunas' },
    { value: 'Holguín', label: 'Holguín' },
    { value: 'Granma', label: 'Granma' },
    { value: 'Santiago de Cuba', label: 'Santiago de Cuba' },
    { value: 'Guantánamo', label: 'Guantánamo' },
    { value: 'Isla de la Juventud', label: 'Isla de la Juventud' },
  ];

  model: Product = {
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    imageUrls: [],
    whatsapp: '',
    type: 'otros',
    currency: 'CUP',
    acceptsTransfer: true,
    province: 'Camagüey',
  };

  selectedImageFiles: File[] = [];
  imagePreviews: string[] = [];
  editProductId: string | null = null;

  lightboxProduct: Product | null = null;
  lightboxIndex = 0;

  menuOpen = false;
  private observer?: IntersectionObserver;

  categoryCards: { value: string; label: string; icon: string }[] = [
    {
      value: 'tecnologia',
      label: 'Tecnología',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
    },
    {
      value: 'ropa',
      label: 'Ropa',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
    },
    {
      value: 'alimentos',
      label: 'Alimentos',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>',
    },
    {
      value: 'hogar',
      label: 'Hogar',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l4 10H4L8 2z"/><path d="M12 12v6"/><path d="M8 22v-2c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2H8z"/></svg>',
    },
    {
      value: 'electrodomesticos',
      label: 'Electrodomésticos',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z"/><path d="M5 10h14"/><path d="M15 7v6"/></svg>',
    },
    {
      value: 'deportes',
      label: 'Deportes',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>',
    },
    {
      value: 'servicios',
      label: 'Servicios',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>',
    },
    {
      value: 'prendas',
      label: 'Prendas',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/><path d="M9 21V10"/><path d="M15 21V10"/></svg>',
    },
    {
      value: 'accesorios',
      label: 'Accesorios',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/><path d="m4.93 4.93 2.12 2.12"/><path d="m16.95 16.95 2.12 2.12"/><path d="m19.07 4.93-2.12 2.12"/><path d="m7.05 16.95-2.12 2.12"/></svg>',
    },
    {
      value: 'inmuebles',
      label: 'Inmuebles',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="m5 21 1-7 6-12 6 12 1 7"/><path d="M9 21v-6h6v6"/><path d="M9 9h6"/></svg>',
    },
    {
      value: 'otros',
      label: 'Otros',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    },
  ];

  aboutContent = '';
  aboutUpdatedAt = '';
  editAboutContent = '';
  aboutImageUrl = '';
  aboutImageFile?: File;
  aboutImagePreview = '';

  constructor(
    private productService: ProductService,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.restoreLock();
    this.loadProducts();
    this.loadAbout();
    this.loadPublicStores();
    this.loadApprovedSuggestions();
    this.startSuggestionRotation();
    this.initRevealObserver();
    this.startPhotoRotation();
    this.productService.getMe().subscribe({
      next: (res) => {
        if (res?.user?.role === 'admin') {
          this.isAdmin = true;
          this.activeView = 'admin';
          this.loadStores();
          this.loadFeedbackAdmin();
        }
        this.scheduleReveals();
      },
      error: () => {
        this.scheduleReveals();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }
    if (this.photoTimer) {
      this.stopPhotoRotation();
    }
    if (this.suggestionTimer) {
      this.stopSuggestionRotation();
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  get selectableCategories(): CatalogOption[] {
    return this.catalogOptions.filter((option) => option.value !== 'all');
  }

  toggleCategoryMenu(event?: Event): void {
    event?.stopPropagation();
    this.priceMenuOpen = false;
    this.categoryMenuOpen = !this.categoryMenuOpen;
  }

  closeCategoryMenu(): void {
    this.categoryMenuOpen = false;
  }

  togglePriceMenu(event?: Event): void {
    event?.stopPropagation();
    this.categoryMenuOpen = false;
    this.priceMenuOpen = !this.priceMenuOpen;
  }

  closePriceMenu(): void {
    this.priceMenuOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeCategoryMenu();
    this.closePriceMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.lightboxProduct) {
      this.closeLightbox();
      return;
    }
    this.closeCategoryMenu();
    this.closePriceMenu();
  }

  get recentProducts(): Product[] {
    return this.products.slice(0, 6);
  }

  get heroProduct(): Product | null {
    return this.products.find((product) => product.imageUrl) ?? null;
  }

  get contactPhone(): string {
    return '59028922';
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  countFor(type: string): number {
    return this.products.filter((product) => (product.type || 'otros').toLowerCase() === type).length;
  }

  iconForCategory(value: string): string {
    return this.categoryCards.find((card) => card.value === value)?.icon ?? '';
  }

  // Los iconos son SVG estáticos de nuestro código: se marcan como HTML de confianza
  // para que Angular no los elimine (el sanitizador por defecto descarta <svg>).
  safeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  initRevealObserver(): void {
    if (!('IntersectionObserver' in window)) {
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
  }

  scheduleReveals(): void {
    setTimeout(() => {
      if (!this.observer) {
        return;
      }
      document.querySelectorAll('.reveal:not(.reveal-in)').forEach((element) => this.observer?.observe(element));
    }, 80);
  }

  selectView(view: ViewName): void {
    this.closeMenu();
    this.closeCategoryMenu();
    this.closePriceMenu();
    if (view === 'admin' && !this.isAdmin) {
      this.previousView = this.activeView;
      this.activeView = 'admin';
      this.scheduleReveals();
      return;
    }
    if (this.activeView === view) {
      return;
    }
    this.activeView = view;
    if (view === 'catalogo') {
      this.categoryImageFailed = false;
      this.applyFilter();
      this.updateSelectedCategoryLabel();
    }
    this.scheduleReveals();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goBackFromAdmin(): void {
    this.adminLoginError = '';
    this.adminPassword = '';
    this.activeView = this.previousView || 'inicio';
    this.scheduleReveals();
  }

  goNegocios(): void {
    this.closeMenu();
    this.router.navigate(['/negocios']);
  }

  goTuNegocio(): void {
    this.closeMenu();
    this.router.navigate(['/tu-negocio']);
  }

  goStoreBySlug(store: Store): void {
    if (store.slug) {
      this.router.navigate(['/negocio', store.slug]);
    }
  }

  storeAccent(store: Store): string {
    return store?.color || '#467722';
  }

  restoreLock(): void {
    const raw = localStorage.getItem('adminLockUntil');
    if (!raw) {
      return;
    }
    const until = Number(raw);
    if (until > Date.now()) {
      this.lockUntil = until;
      this.failedAttempts = 3;
      this.startLockTimer();
    } else {
      localStorage.removeItem('adminLockUntil');
    }
  }

  startLockTimer(): void {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }
    this.updateLockRemaining();
    this.lockTimer = setInterval(() => this.updateLockRemaining(), 1000);
  }

  updateLockRemaining(): void {
    if (!this.lockUntil) {
      return;
    }
    this.lockRemaining = Math.max(0, Math.ceil((this.lockUntil - Date.now()) / 1000));
    if (this.lockRemaining <= 0) {
      this.clearLock();
    }
  }

  clearLock(): void {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
      this.lockTimer = null;
    }
    this.lockUntil = null;
    this.lockRemaining = 0;
    this.failedAttempts = 0;
    localStorage.removeItem('adminLockUntil');
  }

  isLocked(): boolean {
    return !!this.lockUntil && this.lockUntil > Date.now();
  }

  formatLockTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  loginAsAdmin(): void {
    this.adminLoginError = '';
    if (this.isLocked()) {
      this.adminLoginError = `Demasiados intentos. Espera ${this.formatLockTime(this.lockRemaining)} para volver a intentar.`;
      return;
    }
    this.productService.loginAdmin(this.adminUsername.trim(), this.adminPassword).subscribe({
      next: () => {
        this.isAdmin = true;
        this.clearLock();
        this.adminPassword = '';
        this.adminLoginError = '';
        this.activeView = 'admin';
        this.loadStores();
        this.scheduleReveals();
      },
      error: () => {
        this.failedAttempts++;
        if (this.failedAttempts >= 3) {
          this.lockUntil = Date.now() + 5 * 60 * 1000;
          localStorage.setItem('adminLockUntil', String(this.lockUntil));
          this.startLockTimer();
          this.adminLoginError = 'Demasiados intentos fallidos. Debes esperar 5 minutos.';
        } else {
          this.adminLoginError = `Usuario o contraseña incorrectos. Intento ${this.failedAttempts} de 3.`;
        }
      },
    });
  }

  logoutAdmin(): void {
    this.productService.logout().subscribe({
      next: () => {
        this.isAdmin = false;
        this.adminLoginError = '';
        this.selectedCategory = 'all';
        this.selectedCategoryLabel = 'Todos';
        this.selectedPriceCurrency = 'all';
        this.updatePriceBounds();
        this.activeView = 'inicio';
        this.scheduleReveals();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products.map((product) => ({
          type: product.type || 'otros',
          ...product,
        }));
        this.updatePriceBounds();
        this.applyFilter();
        this.updateSelectedCategoryLabel();
        this.isLoading = false;
        this.scheduleReveals();
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  applyFilter(): void {
    const inCategory = (product: Product) =>
      this.selectedCategory === 'all' || product.type?.toLowerCase() === this.selectedCategory;
    const productCurrency = (product: Product) => (product.currency || 'CUP').toUpperCase();
    const inPrice = (product: Product) => {
      if (this.selectedPriceCurrency !== 'all' && productCurrency(product) !== this.selectedPriceCurrency) {
        return false;
      }
      const price = Number(product.price) || 0;
      return price >= this.minPrice && price <= this.maxPrice;
    };
    const inProvince = (product: Product) =>
      this.selectedProvince === 'all' || (product.province || 'Camagüey') === this.selectedProvince;
    const inSearch = (product: Product) => {
      const term = this.searchTerm.trim().toLowerCase();
      return !term || product.name.toLowerCase().includes(term);
    };
    this.filteredProducts = this.products.filter((product) => inCategory(product) && inPrice(product) && inProvince(product) && inSearch(product));
  }

  onSearch(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  get availableProvinces(): CatalogOption[] {
    const seen = new Set<string>();
    const result: CatalogOption[] = [];
    for (const product of this.products) {
      const province = product.province?.trim();
      if (province && !seen.has(province)) {
        seen.add(province);
        result.push({ value: province, label: province });
      }
    }
    return result.sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }

  selectProvince(province: string): void {
    this.selectedProvince = province;
    this.applyFilter();
  }

  updatePriceBounds(): void {
    if (this.selectedPriceCurrency !== 'all') {
      const exists = this.products.some((product) => (product.currency || 'CUP').toUpperCase() === this.selectedPriceCurrency);
      if (!exists) {
        this.selectedPriceCurrency = 'all';
      }
    }
    const pool =
      this.selectedPriceCurrency === 'all'
        ? this.products
        : this.products.filter((product) => (product.currency || 'CUP').toUpperCase() === this.selectedPriceCurrency);
    if (!pool.length) {
      this.priceBounds = { min: 0, max: 0 };
      this.minPrice = 0;
      this.maxPrice = 0;
      return;
    }
    const prices = pool.map((product) => Number(product.price) || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    this.priceBounds = { min, max };
    this.minPrice = min;
    this.maxPrice = max;
  }

  get availablePriceCurrencies(): string[] {
    const seen = new Set<string>();
    for (const product of this.products) {
      seen.add((product.currency || 'CUP').toUpperCase());
    }
    return Array.from(seen).sort();
  }

  countForCurrency(code: string): number {
    if (code === 'all') {
      return this.products.length;
    }
    return this.products.filter((product) => (product.currency || 'CUP').toUpperCase() === code).length;
  }

  selectPriceCurrency(currency: string): void {
    this.selectedPriceCurrency = currency;
    this.priceMenuOpen = false;
    this.updatePriceBounds();
    this.applyFilter();
  }

  get priceStep(): number {
    return this.priceBounds.max - this.priceBounds.min >= 100 ? 1 : 0.01;
  }

  get minPercent(): number {
    return this.percentFor(this.minPrice);
  }

  get maxPercent(): number {
    return this.percentFor(this.maxPrice);
  }

  percentFor(value: number): number {
    const { min, max } = this.priceBounds;
    if (max <= min) {
      return 0;
    }
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  }

  onMinPrice(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.minPrice = Math.min(value, this.maxPrice);
    this.applyFilter();
  }

  onMaxPrice(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.maxPrice = Math.max(value, this.minPrice);
    this.applyFilter();
  }

  resetPrice(): void {
    this.minPrice = this.priceBounds.min;
    this.maxPrice = this.priceBounds.max;
    this.applyFilter();
  }

  formatAmount(value: number): string {
    return Number(value).toFixed(2);
  }

  updateSelectedCategoryLabel(): void {
    const category = this.catalogOptions.find((item) => item.value === this.selectedCategory);
    this.selectedCategoryLabel = category?.label ?? 'Todos';
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.categoryImageFailed = false;
    this.categoryMenuOpen = false;
    this.activeView = 'catalogo';
    this.applyFilter();
    this.updateSelectedCategoryLabel();
    this.scheduleReveals();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get selectedCategoryImage(): string {
    const images: Record<string, string> = {
      tecnologia: 'assets/categorias/tecnologia.png',
      ropa: 'assets/categorias/ropa.png',
      alimentos: 'assets/categorias/alimentos.png',
      hogar: 'assets/categorias/hogar.png',
      electrodomesticos: 'assets/categorias/electrodomesticos.png',
      deportes: 'assets/categorias/deportes.png',
      servicios: 'assets/categorias/servicios.png',
      prendas: 'assets/categorias/prendas.png',
      accesorios: 'assets/categorias/accesorios.png',
      inmuebles: 'assets/categorias/inmuebles.png',
      otros: 'assets/categorias/otros.png',
    };
    return images[this.selectedCategory] ?? '';
  }

  categoryImageFailed = false;

  get showCategoryBackground(): boolean {
    return this.selectedCategory !== 'all';
  }

  onCategoryImageError(): void {
    this.categoryImageFailed = true;
  }

  updateImagePreviews(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.selectedImageFiles = files;
    this.imagePreviews = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  productImages(product: Product): string[] {
    if (product.imageUrls && product.imageUrls.length) {
      return product.imageUrls;
    }
    return product.imageUrl ? [product.imageUrl] : [];
  }

  photoIndexes: Record<string, number> = {};
  hoveredPhotoId: string | null = null;
  private photoTimer: any = null;

  photoIndex(product: Product): number {
    if (!product.id) {
      return 0;
    }
    return this.photoIndexes[product.id] ?? 0;
  }

  setPhotoIndex(product: Product, index: number): void {
    if (product.id) {
      this.photoIndexes[product.id] = index;
    }
  }

  setPhotoHover(productId: string | null): void {
    this.hoveredPhotoId = productId;
  }

  startPhotoRotation(): void {
    if (this.photoTimer) {
      return;
    }
    this.photoTimer = setInterval(() => {
      for (const product of this.products) {
        if (!product.id || product.id === this.hoveredPhotoId) {
          continue;
        }
        const imgs = this.productImages(product);
        if (imgs.length > 1) {
          this.photoIndexes[product.id] = ((this.photoIndexes[product.id] ?? 0) + 1) % imgs.length;
        }
      }
    }, 5000);
  }

  stopPhotoRotation(): void {
    if (this.photoTimer) {
      clearInterval(this.photoTimer);
      this.photoTimer = null;
    }
  }

  openLightbox(product: Product, index = 0): void {
    this.lightboxProduct = product;
    this.lightboxIndex = index;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxProduct = null;
    document.body.style.overflow = '';
  }

  nextLightboxImage(): void {
    const total = this.lightboxProduct ? this.productImages(this.lightboxProduct).length : 0;
    if (total > 0) {
      this.lightboxIndex = (this.lightboxIndex + 1) % total;
    }
  }

  prevLightboxImage(): void {
    const total = this.lightboxProduct ? this.productImages(this.lightboxProduct).length : 0;
    if (total > 0) {
      this.lightboxIndex = (this.lightboxIndex - 1 + total) % total;
    }
  }

  formatPrice(product: Product): string {
    const currency = (product.currency || 'CUP').toUpperCase();
    const symbols: Record<string, string> = { CUP: '$', USD: '$', EUR: '€', ZELLE: '$' };
    return `${symbols[currency] ?? ''} ${Number(product.price).toFixed(2)} ${currency}`;
  }

  submitProduct(form: NgForm): void {
    if (!this.isAdmin || form.invalid) {
      return;
    }

    const formData = new FormData();
    formData.append('name', this.model.name);
    formData.append('description', this.model.description);
    formData.append('price', String(this.model.price));
    formData.append('type', this.model.type || 'otros');
    formData.append('currency', this.model.currency || 'CUP');
    formData.append('acceptsTransfer', this.model.acceptsTransfer ? 'true' : 'false');
    formData.append('province', this.model.province || 'Camagüey');
    if (this.model.whatsapp) {
      formData.append('whatsapp', this.model.whatsapp);
    }
    this.selectedImageFiles.forEach((file) => {
      formData.append('images', file);
    });

    this.productService.createProduct(formData).subscribe({
      next: (product) => {
        this.products.unshift({ type: product.type || 'otros', ...product });
        this.updatePriceBounds();
        this.applyFilter();
        this.resetForm(form);
      },
    });
  }

  startEdit(product: Product): void {
    if (!this.isAdmin) {
      return;
    }

    this.editProductId = product.id ?? null;
    this.model = { ...product, province: product.province || 'Camagüey' };
    this.imagePreviews = this.productImages(product);
  }

  cancelEdit(): void {
    this.editProductId = null;
    this.model = {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      imageUrls: [],
      whatsapp: '',
      type: 'otros',
      currency: 'CUP',
      acceptsTransfer: true,
      province: 'Camagüey',
    };
    this.selectedImageFiles = [];
    this.imagePreviews = [];
  }

  saveProduct(form: NgForm): void {
    if (!this.isAdmin || !this.editProductId || form.invalid) {
      return;
    }

    const formData = new FormData();
    if (this.model.name) {
      formData.append('name', this.model.name);
    }
    if (this.model.description) {
      formData.append('description', this.model.description);
    }
    formData.append('price', String(this.model.price));
    formData.append('type', this.model.type || 'otros');
    formData.append('currency', this.model.currency || 'CUP');
    formData.append('acceptsTransfer', this.model.acceptsTransfer ? 'true' : 'false');
    formData.append('province', this.model.province || 'Camagüey');
    if (this.model.whatsapp) {
      formData.append('whatsapp', this.model.whatsapp);
    }
    this.selectedImageFiles.forEach((file) => {
      formData.append('images', file);
    });

    this.productService.updateProduct(this.editProductId, formData).subscribe({
      next: (product) => {
        this.products = this.products.map((item) => (item.id === product.id ? { ...item, ...product } : item));
        this.updatePriceBounds();
        this.applyFilter();
        this.cancelEdit();
      },
      error: () => {
        // Ignore
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!this.isAdmin || !product.id) {
      return;
    }

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter((item) => item.id !== product.id);
        this.updatePriceBounds();
        this.applyFilter();
      },
    });
  }

  resetForm(form: NgForm): void {
    this.model = {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      imageUrls: [],
      whatsapp: '',
      type: 'otros',
      currency: 'CUP',
      acceptsTransfer: true,
      province: 'Camagüey',
    };
    this.selectedImageFiles = [];
    this.imagePreviews = [];
    form.resetForm({ type: 'otros', currency: 'CUP', province: 'Camagüey' });
  }

  whatsappLink(product: Product): string {
    const phone = (product.whatsapp?.trim() || this.contactPhone).trim();
    const typeLabel = this.catalogOptions.find((o) => o.value === (product.type || 'otros').toLowerCase())?.label ?? 'Otros';
    const description = (product.description || '').trim();
    const lines = [
      'Hola, me interesa este producto:',
      '',
      `*Nombre:* ${product.name}`,
    ];
    if (description) {
      lines.push(`*Descripción:* ${description.slice(0, 300)}`);
    }
    lines.push(`*Precio:* ${this.formatPrice(product)}`);
    lines.push(`*Categoría:* ${typeLabel}`);
    lines.push(`*Provincia:* ${product.province || 'Camagüey'}`);
    lines.push(`*Acepta transferencia:* ${product.acceptsTransfer ? 'Sí' : 'No'}`);
    if (product.imageUrl) {
      lines.push(`*Foto:* ${product.imageUrl}`);
    }
    lines.push('', '¿Está disponible?');
    const message = encodeURIComponent(lines.join('\n'));
    return `https://wa.me/${phone}?text=${message}`;
  }

  loadAbout(): void {
    this.productService.getAbout().subscribe({
      next: (res) => {
        this.aboutContent = res.content || '';
        this.aboutUpdatedAt = res.updatedAt || '';
        this.aboutImageUrl = res.imageUrl || '';
        this.editAboutContent = this.aboutContent;
      },
      error: () => {
        // Ignore, section stays empty
      },
    });
  }

  onAboutImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.aboutImageFile = file;
      if (this.aboutImagePreview) {
        URL.revokeObjectURL(this.aboutImagePreview);
      }
      this.aboutImagePreview = URL.createObjectURL(file);
    }
  }

  saveAbout(): void {
    const formData = new FormData();
    formData.append('content', this.editAboutContent);
    if (this.aboutImageFile) {
      formData.append('image', this.aboutImageFile);
    }
    this.productService.updateAbout(formData).subscribe({
      next: (res) => {
        this.aboutContent = res.content;
        this.aboutUpdatedAt = res.updatedAt;
        this.aboutImageUrl = res.imageUrl || this.aboutImageUrl;
        this.editAboutContent = res.content;
        if (this.aboutImagePreview) {
          URL.revokeObjectURL(this.aboutImagePreview);
        }
        this.aboutImageFile = undefined;
        this.aboutImagePreview = '';
      },
      error: () => {
        // Ignore
      },
    });
  }

  // ===== Gestión de Negocios (superadmin) =====
  stores: Store[] = [];
  storesLoading = false;
  storesError = '';
  publicStores: Store[] = [];

  newStoreName = '';
  newStoreUsername = '';
  newStorePassword = '';
  createStoreError = '';
  createStoreOk = '';

  storeEditId: string | null = null;
  storeEditColor = '';
  storeEditWhatsapp = '';
  storeEditPriority: string | null = null;
  storeEditError = '';

  showStoreProductsId: string | null = null;
  storeProductsCache: Record<string, Product[]> = {};

  showStoreDetailsId: string | null = null;

  openStoreDetails(store: Store): void {
    this.showStoreDetailsId = store.id;
  }

  closeStoreDetails(): void {
    this.showStoreDetailsId = null;
  }

  get storeDetailsStore(): Store | null {
    return this.stores.find((s) => s.id === this.showStoreDetailsId) || null;
  }

  loadStores(): void {
    this.storesLoading = true;
    this.storesError = '';
    this.productService.getStoresAdmin().subscribe({
      next: (stores) => {
        this.stores = stores;
        this.storesLoading = false;
      },
      error: () => {
        this.storesLoading = false;
        this.storesError = 'No se pudieron cargar los negocios.';
      },
    });
  }

  loadPublicStores(): void {
    this.productService.getStores().subscribe({
      next: (stores) => {
        this.publicStores = stores;
      },
      error: () => {
        this.publicStores = [];
      },
    });
  }

  get latestStore(): Store | null {
    if (this.publicStores.length === 0) {
      return null;
    }
    return this.publicStores[this.publicStores.length - 1];
  }

  get otherPublicStores(): Store[] {
    if (this.publicStores.length <= 1) {
      return [];
    }
    return this.publicStores.slice(0, -1);
  }

  createStore(): void {
    this.createStoreError = '';
    this.createStoreOk = '';
    if (!this.newStoreName.trim() || !this.newStoreUsername.trim() || this.newStorePassword.length < 8) {
      this.createStoreError = 'Completa nombre, usuario y una contraseña de al menos 8 caracteres.';
      return;
    }
    this.productService
      .createStore(this.newStoreName.trim(), this.newStoreUsername.trim(), this.newStorePassword)
      .subscribe({
        next: () => {
          this.createStoreOk = 'Negocio creado correctamente.';
          this.newStoreName = '';
          this.newStoreUsername = '';
          this.newStorePassword = '';
          this.loadStores();
        },
        error: (err) => {
          this.createStoreError = err?.error?.message || 'No se pudo crear el negocio.';
        },
      });
  }

  startEditStore(store: Store): void {
    this.storeEditId = store.id;
    this.storeEditColor = store.color || '';
    this.storeEditWhatsapp = store.whatsapp_default || '';
    this.storeEditPriority = store.priority == null ? '' : String(store.priority);
    this.storeEditError = '';
  }

  cancelEditStore(): void {
    this.storeEditId = null;
  }

  saveStoreSettings(): void {
    if (!this.storeEditId) {
      return;
    }
    this.storeEditError = '';
    let priority: number | null = null;
    if (this.storeEditPriority !== '' && this.storeEditPriority != null) {
      const p = Number(this.storeEditPriority);
      if (!Number.isInteger(p) || p < 1) {
        this.storeEditError = 'La prioridad debe ser un número entero mayor o igual a 1.';
        return;
      }
      priority = p;
    }
    this.productService
      .updateStoreAdmin(this.storeEditId, {
        color: this.storeEditColor,
        whatsappDefault: this.storeEditWhatsapp,
        priority,
      })
      .subscribe({
        next: () => {
          this.storeEditId = null;
          this.loadStores();
        },
        error: (err) => {
          this.storeEditError = err?.error?.message || 'No se pudieron guardar los cambios.';
        },
      });
  }

  toggleStoreClosed(store: Store): void {
    this.productService.setStoreClosed(store.id, !store.is_closed).subscribe({
      next: () => {
        this.loadStores();
      },
    });
  }

  deleteStore(store: Store): void {
    if (!confirm(`¿Eliminar el negocio "${store.name}" y todos sus productos? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.productService.deleteStore(store.id).subscribe({
      next: () => {
        this.loadStores();
      },
    });
  }

  async toggleStoreProducts(store: Store): Promise<void> {
    if (this.showStoreProductsId === store.id) {
      this.showStoreProductsId = null;
      return;
    }
    if (!this.storeProductsCache[store.id]) {
      try {
        const products = await firstValueFrom(this.productService.getStoreProducts(store.id));
        this.storeProductsCache[store.id] = products || [];
      } catch {
        this.storeProductsCache[store.id] = [];
      }
    }
    this.showStoreProductsId = store.id;
  }

  storeProducts(store: Store): Product[] {
    return this.storeProductsCache[store.id] || [];
  }

  // ===== FEEDBACK: REPORTE DE ERROR (público) =====
  errorReportOpen = false;
  errorName = '';
  errorPhone = '';
  errorMessage = '';
  errorReportMsg = '';
  errorReportError = '';

  openErrorReport(): void {
    this.errorName = '';
    this.errorPhone = '';
    this.errorMessage = '';
    this.errorReportMsg = '';
    this.errorReportError = '';
    this.errorReportOpen = true;
  }

  closeErrorReport(): void {
    this.errorReportOpen = false;
  }

  submitErrorReport(): void {
    this.errorReportMsg = '';
    this.errorReportError = '';
    if (!this.errorName.trim()) {
      this.errorReportError = 'El nombre es obligatorio.';
      return;
    }
    if (!this.errorMessage.trim()) {
      this.errorReportError = 'Escribe el error que encontraste.';
      return;
    }
    this.productService
      .createFeedback({
        kind: 'error',
        name: this.errorName.trim(),
        phone: this.errorPhone.trim(),
        message: this.errorMessage.trim(),
      })
      .subscribe({
        next: () => {
          this.errorReportMsg = 'Gracias, tu reporte se envió al administrador.';
          this.errorName = '';
          this.errorPhone = '';
          this.errorMessage = '';
        },
        error: (err) => {
          this.errorReportError = err?.error?.message || 'No se pudo enviar el reporte.';
        },
      });
  }

  // ===== FEEDBACK: SUGERENCIAS / VALORACIONES (público) =====
  approvedSuggestions: FeedbackPublic[] = [];
  suggestionDetail: FeedbackPublic | null = null;
  private suggestionTimer: any = null;
  suggestionIndex = 0;
  suggestionName = '';
  suggestionPhone = '';
  suggestionMessage = '';
  suggestionMsg = '';
  suggestionError = '';

  loadApprovedSuggestions(): void {
    this.productService.getApprovedSuggestions().subscribe({
      next: (items) => {
        this.approvedSuggestions = items || [];
        if (this.suggestionIndex >= this.approvedSuggestions.length) {
          this.suggestionIndex = 0;
        }
      },
      error: () => {
        this.approvedSuggestions = [];
      },
    });
  }

  get currentSuggestion(): FeedbackPublic | null {
    if (!this.approvedSuggestions.length) {
      return null;
    }
    const idx = ((this.suggestionIndex % this.approvedSuggestions.length) + this.approvedSuggestions.length) % this.approvedSuggestions.length;
    return this.approvedSuggestions[idx];
  }

  setSuggestionIndex(i: number): void {
    this.suggestionIndex = i;
  }

  startSuggestionRotation(): void {
    if (this.suggestionTimer) {
      return;
    }
    this.suggestionTimer = setInterval(() => {
      if (this.approvedSuggestions.length > 1) {
        this.suggestionIndex = (this.suggestionIndex + 1) % this.approvedSuggestions.length;
      }
    }, 5000);
  }

  stopSuggestionRotation(): void {
    if (this.suggestionTimer) {
      clearInterval(this.suggestionTimer);
      this.suggestionTimer = null;
    }
  }

  openSuggestionDetail(suggestion: FeedbackPublic): void {
    this.suggestionDetail = suggestion;
    document.body.style.overflow = 'hidden';
  }

  closeSuggestionDetail(): void {
    this.suggestionDetail = null;
    document.body.style.overflow = '';
  }

  submitSuggestion(): void {
    this.suggestionMsg = '';
    this.suggestionError = '';
    if (!this.suggestionName.trim()) {
      this.suggestionError = 'El nombre es obligatorio.';
      return;
    }
    if (!this.suggestionMessage.trim()) {
      this.suggestionError = 'Escribe tu sugerencia o valoración.';
      return;
    }
    this.productService
      .createFeedback({
        kind: 'suggestion',
        name: this.suggestionName.trim(),
        phone: this.suggestionPhone.trim(),
        message: this.suggestionMessage.trim(),
      })
      .subscribe({
        next: () => {
          this.suggestionMsg = 'Gracias, tu sugerencia se envió para revisión.';
          this.suggestionName = '';
          this.suggestionPhone = '';
          this.suggestionMessage = '';
        },
        error: (err) => {
          this.suggestionError = err?.error?.message || 'No se pudo enviar tu sugerencia.';
        },
      });
  }

  // ===== FEEDBACK: BANDEJAS DE ADMIN (solo superadmin) =====
  errorReports: Feedback[] = [];
  suggestionReports: Feedback[] = [];

  loadFeedbackAdmin(): void {
    this.productService.getAdminErrors().subscribe({
      next: (items) => {
        this.errorReports = items || [];
      },
      error: () => {
        this.errorReports = [];
      },
    });
    this.productService.getAdminSuggestions().subscribe({
      next: (items) => {
        this.suggestionReports = items || [];
      },
      error: () => {
        this.suggestionReports = [];
      },
    });
  }

  approveFeedback(item: Feedback): void {
    this.productService.approveSuggestion(item.id, !item.approved).subscribe({
      next: () => {
        this.loadFeedbackAdmin();
        this.loadApprovedSuggestions();
      },
    });
  }

  deleteFeedbackItem(item: Feedback): void {
    if (!confirm('¿Eliminar este elemento de la bandeja?')) {
      return;
    }
    this.productService.deleteFeedback(item.id).subscribe({
      next: () => {
        this.loadFeedbackAdmin();
        this.loadApprovedSuggestions();
      },
    });
  }
}
