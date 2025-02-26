import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq, and, sql } from "drizzle-orm";
import { favorites, properties, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const favoriteRouter = createRouter();

// Zod Schema
const favoriteSchema = z.object({
  propertyId: z.number(),
});

// Add Favorite
favoriteRouter.openapi(
  createRoute({
    tags: ["Favorites"],
    method: "post",
    path: "/favorites",
    request: {
      body: {
        content: {
          "application/json": {
            schema: favoriteSchema,
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: {
        content: {
          "application/json": {
            schema: z.object({
              id: z.number(),
              property: z.object({
                id: z.number(),
                title: z.string(),
              }),
            }),
          },
        },
        description: "Favorite added",
      },
    },
  }),
  async (c) => {
    const userId = c.get("user").id;
    const { propertyId } = c.req.valid("json");

    try {
      const [newFavorite] = await db.insert(favorites).values({
        userId,
        propertyId,
      }).returning();

      const property = await db.select()
        .from(properties)
        .where(eq(properties.propertyId, propertyId))
        .limit(1);

      return c.json({
        id: newFavorite.favoriteId,
        property: {
          id: property[0].propertyId,
          title: property[0].title,
        },
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
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.number(),
                property: z.object({
                  id: z.number(),
                  title: z.string(),
                  price: z.number(),
                  mainImage: z.string().optional(),
                }),
              })
            ),
          },
        },
        description: "User favorites",
      },
    },
  }),
  async (c) => {
    const userId = c.get("user").id;
    const userFavorites = await db.select({
      id: favorites.favoriteId,
      property: {
        id: properties.propertyId,
        title: properties.title,
        price: sql<number>`CAST(${properties.monthlyRent} AS DECIMAL)`, 
        mainImage: properties.mainImage ?? "",
      },
    })
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .leftJoin(properties, eq(favorites.propertyId, properties.propertyId));

    return c.json(userFavorites, HttpStatusCodes.OK);
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
        id: z.string().transform(Number),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Favorite removed",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("user").id;

    await db.delete(favorites)
      .where(and(
        eq(favorites.favoriteId, Number(id)),
        eq(favorites.userId, userId)
      ));

    return c.json({ message: "Favorite removed successfully" }, HttpStatusCodes.OK);
  }
);

export default favoriteRouter;
