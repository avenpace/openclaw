import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readNumberParam, readToolStringParam } from "./common.js";

/**
 * Marketplace tools for the Marketplace Head.
 *
 * One Head runs every channel the business sells on, so these tools are
 * deliberately platform-neutral: the agent works in shops, orders, products,
 * stock and prices, and never sees `order_sn` or `shop_cipher`. The host
 * resolves a `shop` id to the right connector.
 *
 * WHAT IS NOT HERE
 * ----------------
 * Nothing cancels an order, refunds a buyer, or removes a listing. Those change
 * what a customer has already been promised, so they belong in the owner's
 * Review Queue as a proposal — not in a tool an agent can call on its own. The
 * Head asks for them the same way it asks for anything else binding.
 *
 * Stock and price ARE here: they are routine shop-keeping, and a business that
 * cannot correct its own stock level from chat is not worth automating.
 */

export type MarketplaceShop = {
  id: string;
  platform: string;
  platformLabel: string;
  label: string;
  shopName: string | null;
  status: string;
  needsReconnect: boolean;
  lastError: string | null;
};

export type MarketplaceHandler = {
  listShops: () => Promise<MarketplaceShop[]>;
  listOrders: (
    shopId: string,
    opts: { state?: string; days?: number; pageSize?: number; cursor?: string },
  ) => Promise<unknown>;
  getOrder: (shopId: string, orderId: string) => Promise<unknown>;
  listProducts: (shopId: string, opts: { pageSize?: number; cursor?: string }) => Promise<unknown>;
  setStock: (
    shopId: string,
    productId: string,
    variantId: string | undefined,
    stock: number,
  ) => Promise<unknown>;
  setPrice: (
    shopId: string,
    productId: string,
    variantId: string | undefined,
    price: number,
  ) => Promise<unknown>;
  shipOrder: (
    shopId: string,
    orderId: string,
    opts: { trackingNo?: string; carrier?: string },
  ) => Promise<unknown>;
};

const ShopsSchema = Type.Object({});

const OrdersSchema = Type.Object({
  shop: Type.String({ description: "Shop id from marketplace_shops" }),
  state: Type.Optional(
    Type.String({
      description: "NEW, PREPARING, SHIPPED, DELIVERED or CANCELLED. Omit for all.",
    }),
  ),
  days: Type.Optional(
    Type.Number({ description: "How far back to look, in days. Default 7, maximum 15." }),
  ),
  pageSize: Type.Optional(Type.Number({ description: "Orders per page, default 20" })),
  cursor: Type.Optional(Type.String({ description: "nextCursor from a previous call" })),
});

const OrderSchema = Type.Object({
  shop: Type.String({ description: "Shop id from marketplace_shops" }),
  orderId: Type.String({ description: "The order id as this shop reports it" }),
});

const ProductsSchema = Type.Object({
  shop: Type.String({ description: "Shop id from marketplace_shops" }),
  pageSize: Type.Optional(Type.Number({ description: "Products per page, default 20" })),
  cursor: Type.Optional(Type.String({ description: "nextCursor from a previous call" })),
});

const StockSchema = Type.Object({
  shop: Type.String({ description: "Shop id from marketplace_shops" }),
  productId: Type.String({ description: "Product id from marketplace_products" }),
  variantId: Type.Optional(
    Type.String({
      description: "Variant id. Required on TikTok Shop and Shopify, which hold stock per variant.",
    }),
  ),
  stock: Type.Number({ description: "The new available quantity" }),
});

const PriceSchema = Type.Object({
  shop: Type.String({ description: "Shop id from marketplace_shops" }),
  productId: Type.String({ description: "Product id from marketplace_products" }),
  variantId: Type.Optional(
    Type.String({ description: "Variant id. Required on TikTok Shop and Shopify." }),
  ),
  price: Type.Number({ description: "The new price, in the shop's currency, whole units" }),
});

const ShipSchema = Type.Object({
  shop: Type.String({ description: "Shop id from marketplace_shops" }),
  orderId: Type.String({ description: "The order to hand to the courier" }),
  trackingNo: Type.Optional(Type.String({ description: "Tracking number, if you have one" })),
  carrier: Type.Optional(Type.String({ description: "Courier name or id" })),
});

/** Every tool answers with data or with `{error}` — never a thrown exception,
 *  which the agent cannot read. */
async function guard(fn: () => Promise<unknown>) {
  try {
    return jsonResult(await fn());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResult({ error: message });
  }
}

export function createMarketplaceShopsTool(handler: MarketplaceHandler): AnyAgentTool {
  return {
    label: "Marketplace Shops",
    name: "marketplace_shops",
    description:
      "List the marketplace shops this business has connected (TikTok Shop, Shopee, Shopify). " +
      "Call this first — every other marketplace tool needs a shop id from here.",
    parameters: ShopsSchema,
    execute: async () => guard(() => handler.listShops()),
  };
}

export function createMarketplaceOrdersTool(handler: MarketplaceHandler): AnyAgentTool {
  return {
    label: "Marketplace Orders",
    name: "marketplace_orders",
    description:
      "List recent orders from one shop. Returns a page of orders with buyer, total, state " +
      "and items, plus nextCursor when there is more.",
    parameters: OrdersSchema,
    execute: async (_id, raw) => {
      const p = raw as Record<string, unknown>;
      return guard(() =>
        handler.listOrders(readToolStringParam(p, "shop", { required: true })!, {
          state: readToolStringParam(p, "state", { required: false }),
          days: readNumberParam(p, "days"),
          pageSize: readNumberParam(p, "pageSize"),
          cursor: readToolStringParam(p, "cursor", { required: false }),
        }),
      );
    },
  };
}

export function createMarketplaceOrderTool(handler: MarketplaceHandler): AnyAgentTool {
  return {
    label: "Marketplace Order",
    name: "marketplace_order",
    description: "Fetch one order in full, including its line items and shipping details.",
    parameters: OrderSchema,
    execute: async (_id, raw) => {
      const p = raw as Record<string, unknown>;
      return guard(() =>
        handler.getOrder(
          readToolStringParam(p, "shop", { required: true })!,
          readToolStringParam(p, "orderId", { required: true })!,
        ),
      );
    },
  };
}

export function createMarketplaceProductsTool(handler: MarketplaceHandler): AnyAgentTool {
  return {
    label: "Marketplace Products",
    name: "marketplace_products",
    description:
      "List the products listed on one shop, with their variants, prices and stock levels.",
    parameters: ProductsSchema,
    execute: async (_id, raw) => {
      const p = raw as Record<string, unknown>;
      return guard(() =>
        handler.listProducts(readToolStringParam(p, "shop", { required: true })!, {
          pageSize: readNumberParam(p, "pageSize"),
          cursor: readToolStringParam(p, "cursor", { required: false }),
        }),
      );
    },
  };
}

export function createMarketplaceSetStockTool(handler: MarketplaceHandler): AnyAgentTool {
  return {
    label: "Marketplace Set Stock",
    name: "marketplace_set_stock",
    description:
      "Set the available stock for a product or variant on one shop. This changes what buyers " +
      "see immediately, so check the number before you send it.",
    parameters: StockSchema,
    execute: async (_id, raw) => {
      const p = raw as Record<string, unknown>;
      return guard(async () => {
        const stock = readNumberParam(p, "stock", { required: true })!;
        if (stock < 0) return { error: "Stock cannot be negative." };
        await handler.setStock(
          readToolStringParam(p, "shop", { required: true })!,
          readToolStringParam(p, "productId", { required: true })!,
          readToolStringParam(p, "variantId", { required: false }),
          stock,
        );
        return { ok: true, stock };
      });
    },
  };
}

export function createMarketplaceSetPriceTool(handler: MarketplaceHandler): AnyAgentTool {
  return {
    label: "Marketplace Set Price",
    name: "marketplace_set_price",
    description:
      "Set the price of a product or variant on one shop. This is live to buyers at once — " +
      "confirm the figure with the owner before repricing anything they did not ask you to.",
    parameters: PriceSchema,
    execute: async (_id, raw) => {
      const p = raw as Record<string, unknown>;
      return guard(async () => {
        const price = readNumberParam(p, "price", { required: true })!;
        if (price <= 0) return { error: "A price must be greater than zero." };
        await handler.setPrice(
          readToolStringParam(p, "shop", { required: true })!,
          readToolStringParam(p, "productId", { required: true })!,
          readToolStringParam(p, "variantId", { required: false }),
          price,
        );
        return { ok: true, price };
      });
    },
  };
}

export function createMarketplaceShipTool(handler: MarketplaceHandler): AnyAgentTool {
  return {
    label: "Marketplace Ship Order",
    name: "marketplace_ship",
    description:
      "Mark an order as handed to the courier, optionally with a tracking number. " +
      "The buyer is notified, so only do this once the parcel has actually gone.",
    parameters: ShipSchema,
    execute: async (_id, raw) => {
      const p = raw as Record<string, unknown>;
      return guard(async () => {
        await handler.shipOrder(
          readToolStringParam(p, "shop", { required: true })!,
          readToolStringParam(p, "orderId", { required: true })!,
          {
            trackingNo: readToolStringParam(p, "trackingNo", { required: false }),
            carrier: readToolStringParam(p, "carrier", { required: false }),
          },
        );
        return { ok: true };
      });
    },
  };
}

export function createMarketplaceTools(handler: MarketplaceHandler): AnyAgentTool[] {
  return [
    createMarketplaceShopsTool(handler),
    createMarketplaceOrdersTool(handler),
    createMarketplaceOrderTool(handler),
    createMarketplaceProductsTool(handler),
    createMarketplaceSetStockTool(handler),
    createMarketplaceSetPriceTool(handler),
    createMarketplaceShipTool(handler),
  ];
}
