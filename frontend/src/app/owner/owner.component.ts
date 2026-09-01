import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService, Store, Product, OwnerSession, AboutInfo } from '../product.service';

interface CatalogOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-owner',
  templateUrl: './owner.component.html',
  styleUrls: ['./owner.component.css'],
})
export class OwnerComponent implements OnInit, OnDestroy {
  session: OwnerSession | null = null;

  loginUsername = '';
  loginPassword = '';
  loginError = '';

  store: Store | null = null;
  products: Product[] = [];

  color = '';
  whatsappDefault = '';
  saveError = '';

  newUsername = '';
  newPassword = '';
  credError = '';
  credOk = '';

  editAboutContent = '';
  aboutImageUrl = '';
  aboutImageFile?: File;
  aboutImagePreview = '';
  aboutUpdatedAt = '';

  model: Product = this.emptyModel();
  selectedImageFiles: File[] = [];
  imagePreviews: string[] = [];
  editProductId: string | null = null;

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

  lightboxProduct: Product | null = null;
  lightboxIndex = 0;
  photoIndexes: Record<string, number> = {};
  private photoTimer: any = null;

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.productService.getMe().subscribe({
      next: (res) => {
        const user = res?.user;
        if (user?.role === 'owner' && user.storeId) {
          this.session = user;
          this.startPhotoRotation();
          this.loadStoreData(user.storeId, user.storeName);
        } else if (user?.role === 'admin') {
          this.loginError = 'Esta sección es para dueños de negocio. El superadmin gestiona desde "Modo admin".';
        }
      },
      error: () => {
        // No logueado, mostrar login
      },
    });
  }

  ngOnDestroy(): void {
    this.stopPhotoRotation();
  }

  get accent(): string {
    return this.store?.color || '#467722';
  }

  emptyModel(): Product {
    return {
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
      isPublic: true,
    };
  }

  loginAsOwner(): void {
    this.loginError = '';
    this.productService.loginAdmin(this.loginUsername.trim(), this.loginPassword).subscribe({
      next: () => {
        this.productService.getMe().subscribe({
          next: (res) => {
            const user = res?.user;
            if (user?.role !== 'owner') {
              this.loginError = 'Estas credenciales no corresponden a un dueño de negocio.';
              this.productService.logout().subscribe();
              return;
            }
            this.loginPassword = '';
            this.session = user;
            this.startPhotoRotation();
            this.loadStoreData(user.storeId, user.storeName);
          },
          error: () => {
            this.loginError = 'No se pudo verificar la sesión.';
          },
        });
      },
      error: () => {
        this.loginError = 'Usuario o contraseña incorrectos.';
      },
    });
  }

  loadStoreData(storeId: string, storeName?: string): void {
    this.productService.getStoresAdmin().subscribe({
      next: (stores) => {
        const found = stores.find((s) => s.id === storeId);
        if (found) {
          this.store = found;
          this.color = found.color || '';
          this.whatsappDefault = found.whatsapp_default || '';
        }
      },
      error: () => {
        this.store = { id: storeId, name: storeName || 'Mi negocio', slug: '', color: '', whatsapp_default: '', is_closed: false, priority: null, created_at: '' };
      },
    });
    this.productService.getStoreProducts(storeId).subscribe({
      next: (products) => {
        this.products = products.map((p) => ({ type: p.type || 'otros', ...p }));
      },
      error: () => {
        this.products = [];
      },
    });
    const slug = this.store?.slug;
    if (slug) {
      this.productService.getAboutStore(slug).subscribe({
        next: (about) => {
          this.editAboutContent = about.content;
          this.aboutImageUrl = about.imageUrl || '';
          this.aboutUpdatedAt = about.updatedAt || '';
        },
        error: () => {
          this.editAboutContent = '';
        },
      });
    }
  }

  saveSettings(): void {
    if (!this.session?.storeId) {
      return;
    }
    this.saveError = '';
    this.productService
      .updateOwnerStore(this.session.storeId, { color: this.color, whatsappDefault: this.whatsappDefault })
      .subscribe({
        next: (store) => {
          if (this.store) {
            this.store = { ...this.store, ...store };
          }
          this.saveError = '';
        },
        error: () => {
          this.saveError = 'No se pudieron guardar los cambios. Intenta de nuevo.';
        },
      });
  }

  changeCredentials(): void {
    if (!this.session?.storeId) {
      return;
    }
    this.credError = '';
    this.credOk = '';
    this.productService
      .changeStoreCredentials(this.session.storeId, {
        username: this.newUsername || undefined,
        password: this.newPassword || undefined,
      })
      .subscribe({
        next: () => {
          this.credOk = 'Credenciales actualizadas correctamente.';
          this.newUsername = '';
          this.newPassword = '';
        },
        error: (err) => {
          this.credError = err?.error?.message || 'No se pudieron actualizar las credenciales.';
        },
      });
  }

  logoutOwner(): void {
    this.productService.logout().subscribe({
      next: () => {
        this.session = null;
        this.store = null;
        this.products = [];
        this.loginPassword = '';
        this.router.navigate(['/']);
      },
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goStore(): void {
    if (this.store?.slug) {
      this.router.navigate(['/negocio', this.store.slug]);
    }
  }

  formatPrice(product: Product): string {
    const currency = (product.currency || 'CUP').toUpperCase();
    const symbols: Record<string, string> = { CUP: '$', USD: '$', EUR: '€', ZELLE: '$' };
    return `${symbols[currency] ?? ''} ${Number(product.price).toFixed(2)} ${currency}`;
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

  startPhotoRotation(): void {
    if (this.photoTimer) {
      return;
    }
    this.photoTimer = setInterval(() => {
      for (const product of this.products) {
        if (!product.id) {
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

  submitProduct(form: NgForm): void {
    if (!this.session?.storeId || form.invalid) {
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
    formData.append('isPublic', this.model.isPublic ? 'true' : 'false');
    if (this.model.whatsapp) {
      formData.append('whatsapp', this.model.whatsapp);
    }
    this.selectedImageFiles.forEach((file) => {
      formData.append('images', file);
    });

    this.productService.createProduct(formData).subscribe({
      next: (product) => {
        this.products.unshift({ type: product.type || 'otros', ...product });
        this.resetForm(form);
      },
    });
  }

  startEdit(product: Product): void {
    this.editProductId = product.id ?? null;
    this.model = { ...product, province: product.province || 'Camagüey' };
    this.imagePreviews = this.productImages(product);
  }

  cancelEdit(): void {
    this.editProductId = null;
    this.model = this.emptyModel();
    this.selectedImageFiles = [];
    this.imagePreviews = [];
  }

  saveProduct(form: NgForm): void {
    if (!this.editProductId || form.invalid) {
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
    formData.append('isPublic', this.model.isPublic ? 'true' : 'false');
    if (this.model.whatsapp) {
      formData.append('whatsapp', this.model.whatsapp);
    }
    this.selectedImageFiles.forEach((file) => {
      formData.append('images', file);
    });

    this.productService.updateProduct(this.editProductId, formData).subscribe({
      next: (product) => {
        this.products = this.products.map((item) => (item.id === product.id ? { ...item, ...product } : item));
        this.cancelEdit();
      },
      error: () => {
        // ignore
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!product.id) {
      return;
    }
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter((item) => item.id !== product.id);
      },
    });
  }

  resetForm(form: NgForm): void {
    this.model = this.emptyModel();
    this.selectedImageFiles = [];
    this.imagePreviews = [];
    form.resetForm({ type: 'otros', currency: 'CUP', province: 'Camagüey', isPublic: true });
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
    if (!this.store?.slug) {
      return;
    }
    const formData = new FormData();
    formData.append('content', this.editAboutContent);
    if (this.aboutImageFile) {
      formData.append('image', this.aboutImageFile);
    }
    this.productService.updateAboutStore(this.store.slug, formData).subscribe({
      next: (res) => {
        this.editAboutContent = res.content;
        this.aboutImageUrl = res.imageUrl || this.aboutImageUrl;
        this.aboutUpdatedAt = res.updatedAt || '';
        if (this.aboutImagePreview) {
          URL.revokeObjectURL(this.aboutImagePreview);
        }
        this.aboutImageFile = undefined;
        this.aboutImagePreview = '';
      },
      error: () => {
        // ignore
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.lightboxProduct) {
      this.closeLightbox();
    }
  }
}
