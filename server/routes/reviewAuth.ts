import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { desc, eq, and, sql, SQL,gte } from "drizzle-orm";
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
              propertyId: z.number(),
              reviewerId: z.number(),
              rating: z.number().nullable(),
              comment: z.string(),
              createdAt: z.string().datetime(),
            }),
          },
        },
        description: "Review created successfully",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Property not found",
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
      rating: reviewData.rating as 1 | 2 | 3 | 4 | 5,
    }).returning();
    
    if (!newReview) {
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to create review",
      });
    }

    return c.json({
      id: newReview.reviewId,
      propertyId: newReview.propertyId,
      reviewerId: newReview.reviewerId,
      rating: newReview.rating,
      comment: newReview.comment || "",
      createdAt: newReview.createdAt.toISOString(),
    }, HttpStatusCodes.CREATED);
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
    
    const results = await db.select({
      id: reviews.reviewId,
      rating: reviews.rating,
      comment: reviews.comment,
      reviewerId: users.userId,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.reviewerId, users.userId))
    .where(eq(reviews.propertyId, id));

    const formattedReviews = results.map((review) => ({
      id: review.id,
      rating: review.rating || 0,
      comment: review.comment || "",
      reviewer: {
        id: review.reviewerId,
        name: `${review.firstName} ${review.lastName}`,
      },
    }));

    return c.json(formattedReviews);
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
              updatedFields: updateReviewSchema,
            }),
          },
        },
        description: "Review updated",
      },
      [HttpStatusCodes.FORBIDDEN]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Unauthorized",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json") as {
      propertyId?: number;
      reviewerId?: number;
      rating?: 1 | 2 | 3 | 4 | 5;
      comment?: string;
    };
    const userId = c.get("user").id;

    const review = await verifyReviewOwnership(Number(id), userId);
    if (!review) {
      throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
        message: "Not authorized to update this review",
      });
    }

    const [updatedReview] = await db.update(reviews)
      .set(updateData)
      .where(eq(reviews.reviewId, Number(id)))
      .returning();

    return c.json({
      message: "Review updated successfully",
      updatedFields: updateData,
    });
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
      [HttpStatusCodes.FORBIDDEN]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Unauthorized",
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


// Add this to your existing reviewRouter
reviewRouter.openapi(
  createRoute({
    tags: ["Reviews"],
    method: "get",
    path: "/reviews/average",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              average: z.number().nullable().describe("Overall average rating across all properties. Null if no reviews exist")
            }),
          },
        },
        description: "Overall average rating of all properties",
      },
    },
  }),
  async (c) => {
    // Calculate overall average rating
    const [result] = await db.select({
      average: sql<number | null>`ROUND(AVG(${reviews.rating})::numeric, 2)`
    }).from(reviews);

    return c.json({ average: result?.average ?? null });
  }
);

export default reviewRouter;

