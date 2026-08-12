import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Product, ProductService } from './product.service';

interface CatalogOption {
  value: string;
  label: string;
}

type ViewName = 'inicio' | 'catalogo' | 'admin' | 'sobre-mi';

@Component({
  selector: 'app-root',
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
    { value: 'otros', label: 'Otros' },
  ];
  selectedCategory = 'all';
  selectedCategoryLabel = 'Todos';

  priceBounds = { min: 0, max: 0 };
  minPrice = 0;
  maxPrice = 0;
  selectedProvince = 'all';

  adminUsername = 'admin';
  adminPassword = 'admin123';
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

  constructor(private productService: ProductService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.restoreLock();
    this.loadProducts();
    this.loadAbout();
    this.initRevealObserver();
    this.startPhotoRotation();
    this.productService.getMe().subscribe({
      next: (res) => {
        if (res?.user?.role === 'admin') {
          this.isAdmin = true;
          this.activeView = 'admin';
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
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  applyFilter(): void {
    const inCategory = (product: Product) =>
      this.selectedCategory === 'all' || product.type?.toLowerCase() === this.selectedCategory;
    const inPrice = (product: Product) => {
      const price = Number(product.price) || 0;
      return price >= this.minPrice && price <= this.maxPrice;
    };
    const inProvince = (product: Product) =>
      this.selectedProvince === 'all' || (product.province || 'Camagüey') === this.selectedProvince;
    this.filteredProducts = this.products.filter((product) => inCategory(product) && inPrice(product) && inProvince(product));
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
    if (!this.products.length) {
      this.priceBounds = { min: 0, max: 0 };
      this.minPrice = 0;
      this.maxPrice = 0;
      return;
    }
    const prices = this.products.map((product) => Number(product.price) || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    this.priceBounds = { min, max };
    this.minPrice = min;
    this.maxPrice = max;
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
    const message = encodeURIComponent(
      `Hola, me interesa el producto ${product.name} (${this.formatPrice(product)}). ¿Está disponible?`,
    );
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
}
