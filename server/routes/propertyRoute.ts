import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { properties } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { ilike, and, gte, lte, eq } from "drizzle-orm";

const propertyRouter = createRouter();

// Zod schema for property validation
const propertySchema = z.object({
  landlordId: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  propertyType: z.enum(["apartment", "house", "shared_room", "single_room"]),
  address: z.string().min(1),
  monthlyRent: z.number().positive(),
  isAvailable: z.boolean().default(true),
});

const updatePropertySchema = propertySchema.partial();

// Helper function to find a property by ID
const findPropertyById = async (propertyId: number) => {
  const [property] = await db.select().from(properties).where(eq(properties.propertyId, propertyId)).limit(1);
  return property;
};

// Create a new property
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "post",
    path: "/properties",
    request: {
      body: {
        content: {
          "application/json": {
            schema: propertySchema,
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              property: z.object({
                propertyId: z.number(),
                title: z.string(),
              }),
            }),
          },
        },
        description: "Property created successfully",
      },
      [HttpStatusCodes.BAD_REQUEST]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Invalid input",
      },
    },
  }),
  async (c) => {
    const propertyData = c.req.valid("json");
    const propertyDataWithStringRent = {
      ...propertyData,
      monthlyRent: propertyData.monthlyRent.toString()
    };

    const [newProperty] = await db
      .insert(properties)
      .values(propertyDataWithStringRent)
      .returning({ propertyId: properties.propertyId, title: properties.title });

    return c.json(
      {
        message: "Property created successfully",
        property: newProperty,
      },
      HttpStatusCodes.CREATED
    );
  }
);

// List all properties
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                propertyId: z.number(),
                title: z.string(),
                description: z.string().optional(),
                propertyType: z.string(),
                address: z.string(),
                monthlyRent: z.number(),
                isAvailable: z.boolean(),
              })
            ),
          },
        },
        description: "List of properties",
      },
    },
  }),
  async (c) => {
    const allProperties = await db.select().from(properties);
    const formattedProperties = allProperties.map(p => ({
      propertyId: p.propertyId,
      title: p.title,
      description: p.description ?? undefined,
      propertyType: p.propertyType ?? "apartment",
      address: p.address,
      monthlyRent: Number(p.monthlyRent),
      isAvailable: p.isAvailable ?? true
    }));
    return c.json(formattedProperties);
  }
);




// Get a specific property by ID
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/{id}",
    request: {
      params: z.object({
        id: z.string().pipe(z.coerce.number().int().positive()),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: propertySchema, // Your success schema without message
          },
        },
        description: "Property details",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
             // message: z.string(),
            }),
          },
        },
        description: "Property not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    
    try {
      const [property] = await db.select({
        propertyId: properties.propertyId,
        title: properties.title,
        description: properties.description,
        propertyType: properties.propertyType,
        address: properties.address,
        monthlyRent: properties.monthlyRent,
        isAvailable: properties.isAvailable,
      }).from(properties).where(eq(properties.propertyId, id)).limit(1);

      if (!property) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Property not found",
        });
      }

      return c.json(property); // Matches success schema
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
);

// Update a property
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "put",
    path: "/properties/{id}",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
      body: {
        content: {
          "application/json": {
            schema: updatePropertySchema,
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
              property: z.object({
                propertyId: z.number(),
                title: z.string(),
              }),
            }),
          },
        },
        description: "Property updated successfully",
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
    const formattedUpdateData = {
      ...updateData,
      monthlyRent: updateData.monthlyRent?.toString()
    };

    const [updatedProperty] = await db
      .update(properties)
      .set(formattedUpdateData)
      .where(eq(properties.propertyId, id))
      .returning({ propertyId: properties.propertyId, title: properties.title });

    if (!updatedProperty) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Property not found",
      });
    }

    return c.json({
      message: "Property updated successfully",
      property: updatedProperty,
    });
  }
);

// Delete a property
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "delete",
    path: "/properties/{id}",
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
        description: "Property deleted successfully",
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

    const [deletedProperty] = await db
      .delete(properties)
      .where(eq(properties.propertyId, id))
      .returning({ propertyId: properties.propertyId });

    if (!deletedProperty) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Property not found",
      });
    }

    return c.json({
      message: "Property deleted successfully",
    });
  }
);

export default propertyRouter;