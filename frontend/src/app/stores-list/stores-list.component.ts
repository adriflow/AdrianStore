import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, Store } from '../product.service';

@Component({
  selector: 'app-stores-list',
  templateUrl: './stores-list.component.html',
  styleUrls: ['./stores-list.component.css'],
})
export class StoresListComponent implements OnInit {
  stores: Store[] = [];
  isLoading = false;
  loadError = '';

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.isLoading = true;
    this.loadError = '';
    this.productService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadError = 'No se pudo cargar la lista de negocios. Intenta más tarde.';
      },
    });
  }

  accent(store: Store): string {
    return store.color || '#467722';
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goToStore(store: Store): void {
    this.router.navigate(['/negocio', store.slug]);
  }
}
