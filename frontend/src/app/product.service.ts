import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  whatsapp?: string;
  type?: string;
  currency?: string;
  acceptsTransfer?: boolean;
}

export interface AdminLoginResponse {
  token: string;
}

@Injectable()
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private authUrl = `${environment.apiUrl}/auth`;
  private aboutUrl = `${environment.apiUrl}/about`;

  constructor(private http: HttpClient) {}

  /** Retrieve products, optionally filtered by type */
  getProducts(type?: string): Observable<Product[]> {
    const params = type && type !== 'all' ? new HttpParams().set('type', type) : undefined;
    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  /** Create a new product (admin) */
  createProduct(formData: FormData): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, formData, { withCredentials: true });
  }

  /** Update an existing product (admin) */
  updateProduct(id: string, formData: FormData): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, formData, { withCredentials: true });
  }

  /** Delete a product (admin) */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  /** Authenticate admin (login) */
  loginAdmin(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, { username, password }, { withCredentials: true });
  }

  /** Get current authenticated user info */
  getMe(): Observable<any> {
    return this.http.get<any>(`${this.authUrl}/me`, { withCredentials: true });
  }

  /** Logout admin and clear HttpOnly cookie */
  logout(): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/logout`, {}, { withCredentials: true });
  }

  /** Get the "Sobre mí" content (public) */
  getAbout(): Observable<{ content: string; updatedAt: string }> {
    return this.http.get<{ content: string; updatedAt: string }>(this.aboutUrl);
  }

  /** Update the "Sobre mí" content (admin) */
  updateAbout(content: string): Observable<{ content: string; updatedAt: string }> {
    return this.http.put<{ content: string; updatedAt: string }>(this.aboutUrl, { content }, { withCredentials: true });
  }
}
