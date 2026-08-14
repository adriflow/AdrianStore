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
  province?: string;
}

export interface AdminLoginResponse {
  token: string;
}

export interface AboutInfo {
  content: string;
  updatedAt: string;
  imageUrl?: string;
}

@Injectable()
export class ProductService {
  private baseApi = ((window as any).__ADRIAN_API_BASE__ as string) || environment.apiUrl;
  private apiUrl = `${this.baseApi}/products`;
  private authUrl = `${this.baseApi}/auth`;
  private aboutUrl = `${this.baseApi}/about`;

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
  getAbout(): Observable<AboutInfo> {
    return this.http.get<AboutInfo>(this.aboutUrl);
  }

  /** Update the "Sobre mí" content and photo (admin) */
  updateAbout(formData: FormData): Observable<AboutInfo> {
    return this.http.put<AboutInfo>(this.aboutUrl, formData, { withCredentials: true });
  }
}
