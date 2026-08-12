import type { InferModel } from 'drizzle-orm';
import { products } from './product.schema';

export type Product = InferModel<typeof products>;
export type NewProduct = InferModel<typeof products, 'insert'>;
