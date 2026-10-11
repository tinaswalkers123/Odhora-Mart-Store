import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type OrderLineSnapshot = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export const ordersTable = pgTable("odhora_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  area: text("area"),
  note: text("note"),
  items: jsonb("items").$type<OrderLineSnapshot[]>().notNull(),
  total: integer("total").notNull(),
  currency: text("currency").notNull().default("BDT"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
