import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  CreateAdminSessionBody,
  CreateAdminSessionResponse,
  DeleteAdminOrderParams,
  GetAdminSessionResponse,
  ListAdminOrdersResponse,
  UpdateAdminOrderStatusBody,
  UpdateAdminOrderStatusParams,
  UpdateAdminOrderStatusResponse,
} from "@workspace/api-zod";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionToken,
  getAdminSecrets,
  isAdminRequest,
  passwordMatches,
} from "../lib/admin-session";

const router: IRouter = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/admin/session", (req, res) => {
  if (!getAdminSecrets()) {
    res.status(503).json({ error: "Admin sign-in is not configured." });
    return;
  }
  res.json(GetAdminSessionResponse.parse({ authenticated: isAdminRequest(req) }));
});

router.post("/admin/session", (req, res) => {
  const parsed = CreateAdminSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const secrets = getAdminSecrets();
  if (!secrets) {
    req.log.error("Admin password or session signing secret is not configured");
    res.status(503).json({ error: "Admin sign-in is not configured." });
    return;
  }
  if (!passwordMatches(parsed.data.password, secrets.password)) {
    res.status(401).json({ error: "The password is incorrect." });
    return;
  }

  res.cookie(
    ADMIN_COOKIE_NAME,
    createAdminSessionToken(secrets.signingSecret),
    adminCookieOptions(),
  );
  res.json(CreateAdminSessionResponse.parse({ authenticated: true }));
});

router.delete("/admin/session", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, adminCookieOptions());
  res.sendStatus(204);
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Admin session required." });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));
  const response = orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
  }));
  res.json(ListAdminOrdersResponse.parse(response));
});

router.delete("/admin/orders/:id", async (req, res): Promise<void> => {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Admin session required." });
    return;
  }

  const params = DeleteAdminOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deletedOrder] = await db
    .delete(ordersTable)
    .where(eq(ordersTable.id, params.data.id))
    .returning({ id: ordersTable.id });

  if (!deletedOrder) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  res.sendStatus(204);
});

router.patch("/admin/orders/:id", async (req, res): Promise<void> => {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Admin session required." });
    return;
  }

  const params = UpdateAdminOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAdminOrderStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  res.json(
    UpdateAdminOrderStatusResponse.parse({
      ...order,
      createdAt: order.createdAt.toISOString(),
    }),
  );
});

export default router;
