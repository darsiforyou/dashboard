export interface ApiResponse<T> {
  data: Data<T>;
  message: string;
}

export interface Data<T> {
  docs: T;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: null;
  page: number;
  pagingCounter: number;
  prevPage: null;
  totalDocs: number;
  totalPages: number;
}

export interface Order {
  _id: string;
  order_number: number;
  cart: Cart;
  address: string;
  name: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  orderStatus: string;
  paymentStatus: boolean;
  applied_Referral_Code: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  items: Item2[];
  prd: Prd[];
  vendorDetail: VendorDetail2[];
  user?: string;
}

export type OrderStatus =
  | "Order Accepted"
  | "Pending"
  | "Order Processing"
  | "Delivered"
  | "Out of Delivery"
  | "Cancelled";

export interface Cart {
  totalQty: number;
  totalCost: number;
  discount: number;
  shippingCharges: number;
  netCost: number;
  totalProfitMargin: number;
  items: Item[];
}

export interface BankAccount {
  _id: string;
  user: string;
  title: string;
  type: string;
  bankName: string;
  account_number: string;
  iban: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  userDetails: User[];
}

export interface Item {
  productId: string;
  vendor: string;
  qty: number;
  price: number;
  profitMargin: number;
  title: string;
  productCode: string;
  _id: string;
  options: Option[];
}

export interface Option {
  key: string;
  selected: string;
  _id: string;
}

export interface Product {
  _id: string;
  productCode: string;
  title: string;
  media?: Media[];
  profitMargin: number;
  description: string;
  vendorPrice: number;
  price: number;
  totalSale: number;
  category: string;
  category_name?: string;
  brand?: string;
  brand_name?: string;
  tags?: string;
  options?: Option[];
  vendor: string;
  isbn?: string;
  available: boolean;
  isActive: boolean;
  isFeatured: boolean;
  stockCountPending: number;
  stockCountConsumed: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  categories: Category[];
  vendors: Vendor[];
  brands: Brand[];
  vendor_name?: string;
  imageId?: string;
  imageURL?: string;
}

export interface Media {
  imageURL: string;
  imageId: string;
  isFront: boolean;
  _id: string;
}

export interface Option {
  key: string;
  values: string[];
  _id: string;
}

export interface Category {
  _id: string;
  title: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  imageId: string;
  imageURL: string;
  rank: number;
}
export interface Item2 {
  productId: string;
  vendor: string;
  qty: number;
  price: number;
  profitMargin: number;
  title: string;
  productCode: string;
  _id: string;
  options: Option2[];
  lineItems?: LineItems;
  vendorDetail: VendorDetail;
}

export interface Option2 {
  key: string;
  selected: string;
  _id: string;
}

export interface LineItems {
  _id: string;
  productCode: string;
  title: string;
  media: Medum[];
  profitMargin: number;
  description: string;
  vendorPrice: number;
  price: number;
  totalSale: number;
  category: string;
  category_name: string;
  brand: string;
  brand_name: string;
  tags: string;
  options: Option3[];
  vendor: string;
  vendor_name: string;
  isbn: string;
  available: boolean;
  isActive: boolean;
  isFeatured: boolean;
  stockCountPending: number;
  stockCountConsumed: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  subject?: string;
  subject_name?: string;
  updatedBy?: string;
}
export interface Medum {
  imageURL: string;
  imageId: string;
  isFront: boolean;
  _id: string;
}

export interface Option3 {
  key: string;
  values: string[];
  _id: string;
}

export interface VendorDetail {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  user_code: string;
  referred_by: string;
  commission: number;
  orderCount: number;
  totalSale: number;
  totalVendorProductSold: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  refreshToken?: string;
}

export interface Prd {
  _id: string;
  productCode: string;
  title: string;
  media: Medum2[];
  profitMargin: number;
  description: string;
  vendorPrice: number;
  price: number;
  totalSale: number;
  category: string;
  category_name: string;
  brand: string;
  brand_name: string;
  tags: string;
  options: Option4[];
  vendor: string;
  isbn: string;
  available: boolean;
  isActive: boolean;
  isFeatured: boolean;
  stockCountPending: number;
  stockCountConsumed: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  vendor_name: string;
  subject?: string;
  subject_name?: string;
  updatedBy?: string;
}

export interface Medum2 {
  imageURL: string;
  imageId: string;
  isFront: boolean;
  _id: string;
}

export interface Option4 {
  key: string;
  values: string[];
  _id: string;
}

export interface VendorDetail2 {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  user_code: string;
  referred_by: string;
  commission: number;
  orderCount: number;
  totalSale: number;
  totalVendorProductSold: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  refreshToken?: string;
}

export interface Vendor {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  user_code: string;
  referred_by: string;
  commission?: number;
  orderCount?: number;
  totalSale?: number;
  totalVendorProductSold: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  refreshToken?: string;
  referral_package?: string;
  referral_benefit?: string;
}

export interface Brand {
  _id: string;
  title: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  imageId?: string;
  imageURL?: string;
}

export interface Package {
  __v: number;
  _id: string;
  commission: string;
  createdAt: Date;
  description: string;
  discount_percentage: string;
  imageURL: string;
  price: number;
  title: string;
  updatedAt: Date;
  valid_time: string;
}
export interface User {
  __v: number;
  _id: string;
  commission: number;
  createdAt: Date;
  email: string;
  firstname: string;
  lastname: string;
  orderCount: number;
  password: string;
  referral_package?: string;
  packageName: Package[];
  referred_by: ReferredBy;
  refreshToken?: string;
  role: Role;
  referral_payment_status: boolean;
  totalSale: number;
  totalVendorProductSold: number;
  updatedAt: Date;
  user_code: string;
}

export enum ReferredBy {
  Empty = "",
  FazPak24GmailCOM81863944 = "faz.pak24@gmail.com-8186-3944",
  FazPak25GmailCOM54126763 = "faz.pak25@gmail.com-5412-6763",
}

export enum Role {
  Customer = "Customer",
  Referrer = "Referrer",
  Vendor = "Vendor",
}

export interface DashboardSetting {
  __v: number;
  _id: string;
  btn_text: string;
  createdAt: Date;
  description: string;
  imageId: string;
  imageURL: string;
  sub_title: string;
  title: string;
  updatedAt: Date;
}
