import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import {
  CreateOrderBody,
  CreateOrderResponse,
  GetProductParams,
  GetProductResponse,
  ListProductsResponse,
} from "@workspace/api-zod";
import { products } from "../lib/catalog";

const router: IRouter = Router();
const DELIVERY_FEE = 80;

router.get("/products", (_req, res) => {
  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:id", (req, res) => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const product = products.find((item) => item.id === params.data.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(product));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const lines = parsed.data.items.map((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product
      ? {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: line.quantity,
        }
      : null;
  });
  if (lines.some((line) => line === null)) {
    res.status(400).json({ error: "One or more products are unavailable." });
    return;
  }

  const confirmedLines = lines.filter((line) => line !== null);
  const subtotal = confirmedLines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const total = subtotal + DELIVERY_FEE;
  const orderNumber = `OM-${randomUUID().slice(0, 8).toUpperCase()}`;

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      address: parsed.data.address,
      city: parsed.data.city,
      area: parsed.data.area ?? null,
      note: parsed.data.note ?? null,
      items: confirmedLines,
      total,
    })
    .returning({ id: ordersTable.id });

  res.status(201).json(
    CreateOrderResponse.parse({
      id: order.id,
      orderNumber,
      total,
      currency: "BDT",
      status: "confirmed",
    }),
  );
});

export default router;
