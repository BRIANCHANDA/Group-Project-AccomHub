import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq, type SQLWrapper } from "drizzle-orm";
import { propertyDetails } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const propertyDetailRouter = createRouter();

// Zod schema for property details validation
const propertyDetailSchema = z.object({
  propertyId: z.number(),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  amenities: z.array(z.string()).optional(),
  squareFootage: z.number().optional(),
});

const updatePropertyDetailSchema = propertyDetailSchema.partial();

// Helper function to find property details by property ID
const findPropertyDetailById = async (propertyId: number | SQLWrapper) => {
  const [detail] = await db
    .select()
    .from(propertyDetails)
    .where(eq(propertyDetails.propertyId, propertyId))
    .limit(1);
  return detail;
};

// Get property details
propertyDetailRouter.openapi(
  createRoute({
    tags: ["Property Details"],
    method: "get",
    path: "/properties/{id}/details",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: propertyDetailSchema,
          },
        },
        description: "Property details retrieved successfully",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Property details not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const propertyDetail = await findPropertyDetailById(id);

    if (!propertyDetail) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Property details not found",
      });
    }

    return c.json(propertyDetail);
  }
);

// Update property details
propertyDetailRouter.openapi(
  createRoute({
    tags: ["Property Details"],
    method: "put",
    path: "/properties/{id}/details",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
      body: {
        content: {
          "application/json": {
            schema: updatePropertyDetailSchema,
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
              details: propertyDetailSchema,
            }),
          },
        },
        description: "Property details updated successfully",
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
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");

    const [updatedDetail] = await db
      .update(propertyDetails)
      .set(updateData)
      .where(eq(propertyDetails.propertyId, id))
      .returning();

    if (!updatedDetail) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Property details not found",
      });
    }

    return c.json({
      message: "Property details updated successfully",
      details: updatedDetail,
    });
  }
);

export default propertyDetailRouter;
