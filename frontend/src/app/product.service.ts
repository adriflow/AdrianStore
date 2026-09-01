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
  isPublic?: boolean;
  storeId?: string;
  storeName?: string;
}

export interface AdminLoginResponse {
  token: string;
}

export interface AboutInfo {
  content: string;
  updatedAt: string;
  imageUrl?: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  color: string;
  whatsapp_default: string;
  is_closed: boolean;
  priority: number | null;
  created_at: string;
  username?: string;
}

export interface OwnerSession {
  sub: string;
  username: string;
  role: string;
  storeId?: string;
  storeName?: string;
}

export interface Feedback {
  id: string;
  kind: 'error' | 'suggestion';
  name: string;
  phone: string;
  message: string;
  approved: boolean;
  created_at: string;
}

export interface FeedbackPublic {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

@Injectable()
export class ProductService {
  private baseApi = ((window as any).__ADRIAN_API_BASE__ as string) || environment.apiUrl;
  private apiUrl = `${this.baseApi}/products`;
  private authUrl = `${this.baseApi}/auth`;
  private aboutUrl = `${this.baseApi}/about`;
  private storesUrl = `${this.baseApi}/stores`;
  private feedbackUrl = `${this.baseApi}/feedback`;

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

  /** === NEGOCIOS === */

  /** Lista de negocios abiertos (público) */
  getStores(): Observable<Store[]> {
    return this.http.get<Store[]>(this.storesUrl);
  }

  /** Info pública de un negocio por slug (null si no existe o está cerrado) */
  getStoreBySlug(slug: string): Observable<Store | null> {
    return this.http.get<Store | null>(`${this.storesUrl}/slug/${slug}`);
  }

  /** Todos los negocios con credenciales (solo superadmin) */
  getStoresAdmin(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.storesUrl}/admin`, { withCredentials: true });
  }

  /** Info del propio negocio (dueño), incluye si está cerrado */
  getOwnStore(id: string): Observable<Store | null> {
    return this.http.get<Store | null>(`${this.storesUrl}/${id}/me`, { withCredentials: true });
  }

  /** Crear un negocio (solo superadmin) */
  createStore(name: string, username: string, password: string): Observable<Store> {
    return this.http.post<Store>(this.storesUrl, { name, username, password }, { withCredentials: true });
  }

  /** Editar color, whatsapp default y prioridad (superadmin) */
  updateStoreAdmin(id: string, data: { color?: string; whatsappDefault?: string; priority?: number | null }): Observable<Store> {
    return this.http.patch<Store>(`${this.storesUrl}/${id}`, data, { withCredentials: true });
  }

  /** Cerrar o reabrir un negocio (superadmin) */
  setStoreClosed(id: string, isClosed: boolean): Observable<Store> {
    return this.http.patch<Store>(`${this.storesUrl}/${id}/closed`, { isClosed }, { withCredentials: true });
  }

  /** Eliminar un negocio y sus productos (superadmin) */
  deleteStore(id: string): Observable<any> {
    return this.http.delete<any>(`${this.storesUrl}/${id}`, { withCredentials: true });
  }

  /** El dueño edita su color y whatsapp default */
  updateOwnerStore(id: string, data: { color?: string; whatsappDefault?: string }): Observable<Store> {
    return this.http.put<Store>(`${this.storesUrl}/${id}/me`, data, { withCredentials: true });
  }

  /** El dueño cambia su usuario y/o contraseña */
  changeStoreCredentials(id: string, data: { username?: string; password?: string }): Observable<any> {
    return this.http.patch<any>(`${this.storesUrl}/${id}/credentials`, data, { withCredentials: true });
  }

  /** Productos de un negocio (públicos dentro de su sección) */
  getStoreProducts(storeId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/store/${storeId}`);
  }

  /** Productos del propio negocio para su dueño (incluye si está cerrado) */
  getOwnStoreProducts(storeId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/store/${storeId}/manage`, { withCredentials: true });
  }

  /** "Sobre mí" de un negocio por slug */
  getAboutStore(slug: string): Observable<AboutInfo> {
    return this.http.get<AboutInfo>(`${this.aboutUrl}/store/${slug}`);
  }

  /** Actualizar "Sobre mí" de un negocio (dueño o superadmin) */
  updateAboutStore(slug: string, formData: FormData): Observable<AboutInfo> {
    return this.http.put<AboutInfo>(`${this.aboutUrl}/store/${slug}`, formData, { withCredentials: true });
  }

  /** === FEEDBACK (reportes de error y sugerencias/valoraciones) === */

  /** Crear un reporte de error o sugerencia/valoración (público) */
  createFeedback(data: { kind: 'error' | 'suggestion'; name: string; phone?: string; message: string }): Observable<Feedback> {
    return this.http.post<Feedback>(this.feedbackUrl, data);
  }

  /** Sugerencias/valoraciones aprobadas y visibles (público) */
  getApprovedSuggestions(): Observable<FeedbackPublic[]> {
    return this.http.get<FeedbackPublic[]>(`${this.feedbackUrl}/suggestions`);
  }

  /** Bandeja de errores reportados (solo superadmin) */
  getAdminErrors(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.feedbackUrl}/admin/errors`, { withCredentials: true });
  }

  /** Bandeja de sugerencias/valoraciones (solo superadmin) */
  getAdminSuggestions(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.feedbackUrl}/admin/suggestions`, { withCredentials: true });
  }

  /** Aceptar/rechazar visibilidad de una sugerencia (solo superadmin) */
  approveSuggestion(id: string, approved: boolean): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.feedbackUrl}/${id}/approve`, { approved }, { withCredentials: true });
  }

  /** Eliminar un elemento de la bandeja (solo superadmin) */
  deleteFeedback(id: string): Observable<any> {
    return this.http.delete<any>(`${this.feedbackUrl}/${id}`, { withCredentials: true });
  }
}
