import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq, type SQLWrapper } from "drizzle-orm";
import { propertyDetails } from "../db/schemas/mgh_db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../db";

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
            schema: z.object({
              propertyId: z.number(),
              bedrooms: z.number().nullable(),
              bathrooms: z.number().nullable(),
              amenities: z.array(z.string()).nullable(),
              detailId: z.number(),
              furnished: z.boolean().nullable(),
              squareMeters: z.string().nullable(),
              rules: z.array(z.string()).nullable(),
            }),
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

    return c.json(propertyDetail, HttpStatusCodes.OK);
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
              details: z.object({
                propertyId: z.number(),
                bedrooms: z.number().nullable(),
                bathrooms: z.number().nullable(),
                amenities: z.array(z.string()).nullable(),
                detailId: z.number(),
                furnished: z.boolean().nullable(),
                squareMeters: z.string().nullable(),
                rules: z.array(z.string()).nullable(),
              }),
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
      [HttpStatusCodes.CREATED]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              details: z.object({
                propertyId: z.number(),
                bedrooms: z.number().nullable(),
                bathrooms: z.number().nullable(),
                amenities: z.array(z.string()).nullable(),
                detailId: z.number(),
                furnished: z.boolean().nullable(),
                squareMeters: z.string().nullable(),
                rules: z.array(z.string()).nullable(),
              }),
            }),
          },
        },
        description: "Property details created successfully",
      },
    },
  }),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const updateData = c.req.valid("json");
      
      // First check if the property exists
      const existingDetail = await findPropertyDetailById(id);
      
      let result;
      
      if (existingDetail) {
        // Update existing property details
        [result] = await db
          .update(propertyDetails)
          .set(updateData)
          .where(eq(propertyDetails.propertyId, id))
          .returning();
          
        return c.json({
          message: "Property details updated successfully",
          details: result,
        });
      } else {
        // Create new property details if they don't exist
        [result] = await db
          .insert(propertyDetails)
          .values({
            propertyId: id,
            ...updateData
          })
          .returning();
          
        return c.json({
          message: "Property details created successfully",
          details: result,
        }, HttpStatusCodes.CREATED);
      }
    } catch (error) {
      console.error("Property details operation error:", error);
      
      // Re-throw the error if it's already an HTTPException
      if (error instanceof HTTPException) {
        throw error;
      }
      
      // Otherwise throw a generic server error
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "An error occurred while processing property details",
      });
    }
  }
);

export default propertyDetailRouter;