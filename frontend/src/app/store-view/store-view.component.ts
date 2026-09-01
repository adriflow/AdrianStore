import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductService, Store, Product, AboutInfo } from '../product.service';

interface CatalogOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-store-view',
  templateUrl: './store-view.component.html',
  styleUrls: ['./store-view.component.css'],
})
export class StoreViewComponent implements OnInit {
  store: Store | null = null;
  products: Product[] = [];
  about: AboutInfo = { content: '', updatedAt: '' };
  isLoading = false;
  notFound = false;

  searchTerm = '';
  selectedCategory = 'all';
  activeTab: 'productos' | 'sobre-mi' = 'productos';

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

  photoIndexes: Record<string, number> = {};
  lightboxProduct: Product | null = null;
  lightboxIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const slug = params['slug'];
      if (slug) {
        this.loadStore(slug);
      }
    });
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  get accent(): string {
    return this.store?.color || '#467722';
  }

  get storePhone(): string {
    return this.store?.whatsapp_default || '59028922';
  }

  get hasCategories(): boolean {
    return this.products.some((p) => p.type && p.type !== 'otros');
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.products.filter((product) => {
      const inCategory =
        this.selectedCategory === 'all' || (product.type || 'otros').toLowerCase() === this.selectedCategory;
      const inSearch = !term || product.name.toLowerCase().includes(term);
      return inCategory && inSearch;
    });
  }

  get selectableCategories(): CatalogOption[] {
    return this.catalogOptions.filter((o) => o.value !== 'all' && this.products.some((p) => (p.type || 'otros').toLowerCase() === o.value));
  }

  countFor(type: string): number {
    return this.products.filter((p) => (p.type || 'otros').toLowerCase() === type).length;
  }

  iconForCategory(value: string): string {
    const icons: Record<string, string> = {
      tecnologia: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
      ropa: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
      alimentos: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/></svg>',
      hogar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8l4 10H4L8 2z"/><path d="M12 12v6"/></svg>',
      electrodomesticos: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z"/><path d="M5 10h14"/><path d="M15 7v6"/></svg>',
      deportes: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="M3 3l1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/></svg>',
      servicios: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>',
      prendas: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
      accesorios: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/></svg>',
      inmuebles: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="m5 21 1-7 6-12 6 12 1 7"/><path d="M9 21v-6h6v6"/></svg>',
      otros: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>',
    };
    return icons[value] ?? '';
  }

  safeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  loadStore(slug: string): void {
    this.isLoading = true;
    this.notFound = false;
    this.products = [];
    this.productService.getStoreBySlug(slug).subscribe({
      next: (store) => {
        this.isLoading = false;
        if (!store) {
          this.notFound = true;
          return;
        }
        this.store = store;
        this.loadProducts(store.id);
        this.loadAbout(slug);
      },
      error: () => {
        this.isLoading = false;
        this.notFound = true;
      },
    });
  }

  loadProducts(storeId: string): void {
    this.productService.getStoreProducts(storeId).subscribe({
      next: (products) => {
        this.products = products.map((p) => ({ type: p.type || 'otros', ...p }));
      },
      error: () => {
        this.products = [];
      },
    });
  }

  loadAbout(slug: string): void {
    this.productService.getAboutStore(slug).subscribe({
      next: (about) => {
        this.about = about;
      },
      error: () => {
        this.about = { content: '', updatedAt: '' };
      },
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  productImages(product: Product): string[] {
    if (product.imageUrls && product.imageUrls.length) {
      return product.imageUrls;
    }
    return product.imageUrl ? [product.imageUrl] : [];
  }

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

  formatPrice(product: Product): string {
    const currency = (product.currency || 'CUP').toUpperCase();
    const symbols: Record<string, string> = { CUP: '$', USD: '$', EUR: '€', ZELLE: '$' };
    return `${symbols[currency] ?? ''} ${Number(product.price).toFixed(2)} ${currency}`;
  }

  whatsappLink(product: Product): string {
    const phone = (product.whatsapp?.trim() || this.storePhone).trim();
    const typeLabel = this.catalogOptions.find((o) => o.value === (product.type || 'otros').toLowerCase())?.label ?? 'Otros';
    const lines = [
      'Hola, me interesa este producto:',
      '',
      `*Nombre:* ${product.name}`,
    ];
    if (product.description) {
      lines.push(`*Descripción:* ${product.description.slice(0, 300)}`);
    }
    lines.push(`*Precio:* ${this.formatPrice(product)}`);
    lines.push(`*Categoría:* ${typeLabel}`);
    lines.push(`*Provincia:* ${product.province || 'Camagüey'}`);
    lines.push('', '¿Está disponible?');
    const message = encodeURIComponent(lines.join('\n'));
    return `https://wa.me/${phone}?text=${message}`;
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

  goHome(): void {
    this.router.navigate(['/']);
  }

  goStores(): void {
    this.router.navigate(['/negocios']);
  }
}
