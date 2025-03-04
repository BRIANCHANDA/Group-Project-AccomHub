import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq, and, sql } from "drizzle-orm";
import { favorites, properties, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const favoriteRouter = createRouter();

// Zod Schemas
const favoriteSchema = z.object({
  propertyId: z.number().int().positive(),
});

const favoriteResponseSchema = z.object({
  id: z.number(),
  property: z.object({
    id: z.number(),
    title: z.string(),
    price: z.number(),
    mainImage: z.string().optional(),
  }),
});

// Add Favorite
favoriteRouter.openapi(
  createRoute({
    tags: ["Favorites"],
    method: "post",
    path: "/favorites",
    request: {
      body: {
        required: true,
        content: {
          "application/json": { schema: favoriteSchema },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: {
        content: { "application/json": { schema: favoriteResponseSchema } },
        description: "Favorite added successfully",
      },
      [HttpStatusCodes.CONFLICT]: {
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
        description: "Property already in favorites",
      },
    },
  }),
  async (c) => {
    const userId = c.get("user").id;
    const { propertyId } = c.req.valid("json");

    try {
      const [newFavorite] = await db
        .insert(favorites)
        .values({ userId, propertyId })
        .returning({
          id: favorites.favoriteId,
          property: sql<{ id: number; title: string; price: number; mainImage?: string }>`
            (SELECT json_build_object(
              'id', ${properties.propertyId},
              'title', ${properties.title},
              'price', CAST(${properties.monthlyRent} AS DECIMAL),
              'mainImage', ${properties.mainImage}
            ) FROM ${properties}
            WHERE ${properties.propertyId} = ${propertyId}
          `,
        });

      return c.json({
        id: newFavorite.id,
        property: newFavorite.property,
      }, HttpStatusCodes.CREATED);

    } catch (error) {
      throw new HTTPException(HttpStatusCodes.CONFLICT, {
        message: "Property already in favorites",
      });
    }
  }
);

// Get User Favorites
favoriteRouter.openapi(
  createRoute({
    tags: ["Favorites"],
    method: "get",
    path: "/favorites",
    responses: {
      [HttpStatusCodes.OK]: {
        content: { "application/json": { schema: z.array(favoriteResponseSchema) } },
        description: "List of user favorites",
      },
    },
  }),
  async (c) => {
    const userId = c.get("user").id;

    const userFavorites = await db
      .select({
        id: favorites.favoriteId,
        property: sql<{ id: number; title: string; price: number; mainImage?: string }>`
          json_build_object(
            'id', ${properties.propertyId},
            'title', ${properties.title},
            'price', CAST(${properties.monthlyRent} AS DECIMAL),
            'mainImage', ${properties.mainImage}
          )
        `,
      })
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.propertyId))
      .where(eq(favorites.userId, userId));

    return c.json(userFavorites);
  }
);

// Remove Favorite
favoriteRouter.openapi(
  createRoute({
    tags: ["Favorites"],
    method: "delete",
    path: "/favorites/{id}",
    request: {
      params: z.object({
        id: z.string().pipe(z.coerce.number().int().positive()),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
        description: "Favorite removed successfully",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: { "application/json": { schema: z.object({ message: z.string() }) } },
        description: "Favorite not found",
      },
    },
  }),
  async (c) => {
    const userId = c.get("user").id;
    const { id } = c.req.valid("param");

    const [deleted] = await db
      .delete(favorites)
      .where(and(
        eq(favorites.favoriteId, id),
        eq(favorites.userId, userId)
      ))
      .returning({ id: favorites.favoriteId });

    if (!deleted) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Favorite not found",
      });
    }

    return c.json({ message: "Favorite removed successfully" });
  }
);

export default favoriteRouter;