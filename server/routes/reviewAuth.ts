import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq, and, sql } from "drizzle-orm";
import { reviews, properties, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const reviewRouter = createRouter();

// Zod Schemas
const reviewSchema = z.object({
  propertyId: z.number(),
  reviewerId: z.number(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

const updateReviewSchema = reviewSchema.partial();

// Helper Functions
const verifyReviewOwnership = async (reviewId: number, userId: number) => {
  const review = await db.select()
    .from(reviews)
    .where(and(
      eq(reviews.reviewId, reviewId),
      eq(reviews.reviewerId, userId)
    ))
    .limit(1);
  return review[0];
};

// Create Review
reviewRouter.openapi(
  createRoute({
    tags: ["Reviews"],
    method: "post",
    path: "/reviews",
    request: {
      body: {
        content: {
          "application/json": {
            schema: reviewSchema,
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
              rating: z.number(),
              comment: z.string(),
            }),
          },
        },
        description: "Review created successfully",
      },
    },
  }),
  async (c) => {
    const reviewData = c.req.valid("json");
    
    // Verify property exists
    const property = await db.select()
      .from(properties)
      .where(eq(properties.propertyId, reviewData.propertyId))
      .limit(1);

    if (!property[0]) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Property not found",
      });
    }

    const [newReview] = await db.insert(reviews).values({
      ...reviewData,
      rating: reviewData.rating as 1 | 2 | 3 | 4 | 5
    }).returning();
    return c.json(newReview, HttpStatusCodes.CREATED);
  }
);

// Get Property Reviews
reviewRouter.openapi(
  createRoute({
    tags: ["Reviews"],
    method: "get",
    path: "/properties/{id}/reviews",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.number(),
                rating: z.number(),
                comment: z.string(),
                reviewer: z.object({
                  id: z.number(),
                  name: z.string(),
                }),
              })
            ),
          },
        },
        description: "List of property reviews",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const propertyReviews = await db.select({
      id: reviews.reviewId,
      rating: reviews.rating,
      comment: reviews.comment,
      reviewer: {
        id: users.userId,
        name: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
      },
    })
    .from(reviews)
    .where(eq(reviews.propertyId, id))
    .leftJoin(users, eq(reviews.reviewerId, users.userId));

    return c.json(reviews);
  }
);

// Update Review
reviewRouter.openapi(
  createRoute({
    tags: ["Reviews"],
    method: "put",
    path: "/reviews/{id}",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
      body: {
        content: {
          "application/json": {
            schema: updateReviewSchema,
          },
        },
      },
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
        description: "Review updated",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");
    const userId = c.get("user").id; // From authentication middleware

    const review = await verifyReviewOwnership(Number(id), userId);
    if (!review) {
      throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
        message: "Not authorized to update this review",
      });
    }

    await db.update(reviews)
      .set({
        ...updateData,
        rating: updateData.rating as 1 | 2 | 3 | 4 | 5
      })
      .where(eq(reviews.reviewId, Number(id)));

    return c.json({ message: "Review updated successfully" });
  }
);

// Delete Review
reviewRouter.openapi(
  createRoute({
    tags: ["Reviews"],
    method: "delete",
    path: "/reviews/{id}",
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
        description: "Review deleted",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const userId = c.get("user").id;

    const review = await verifyReviewOwnership(Number(id), userId);
    if (!review) {
      throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
        message: "Not authorized to delete this review",
      });
    }

    await db.delete(reviews).where(eq(reviews.reviewId, Number(id)));
    return c.json({ message: "Review deleted successfully" });
  }
);

export default reviewRouter;