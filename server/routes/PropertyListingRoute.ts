import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { properties, propertyDetails, propertyImages, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { propertyTypeEnum } from '../db/schemas/mgh_db'; 
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { and, eq, gte, lte, sql, inArray } from "drizzle-orm";
import axios from "axios";
import NodeCache from "node-cache";

const propertyListing = createRouter();

// Get property type values from enum for validation
const propertyTypeValues = ['apartment', 'house', 'shared_room', 'single_room'] as const;

// Define common university values (can be expanded)
const universityValues = [
   'University of Zambia (UNZA)',
  'Copperbelt University (CBU)',
  'Mulungushi University',
  'Zambia Open University',
  'Cavendish University',
  'Texila American University',
  'Information and Communications University',
  'Levy Mwanawasa Medical University',
  'Rockview University',
  'Kwame Nkrumah University',
  'University of Lusaka',
  'Chalimbana University',
  'Other'
] as const;

/**
 * Helper function to safely parse decimal values from string
 * @param value The string value to parse
 * @returns The parsed decimal number or undefined if parsing fails
 */
const safeParseDecimal = (value?: string): number | undefined => {
  if (!value) return undefined;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
};

// Get all properties with detailed information for student view
propertyListing.openapi(
    createRoute({
      tags: ["propertyListing"],
      method: "get",
      path: "/propertyListing/student-view",
      request: {
        query: z.object({
          limit: z.string()
            .transform(val => parseInt(val, 10))
            .refine(val => !isNaN(val), "Limit must be a valid number")
            .refine(val => val > 0, "Limit must be positive")
            .default("10")
            .optional(),
          offset: z.string()
            .transform(val => parseInt(val, 10))
            .refine(val => !isNaN(val), "Offset must be a valid number")
            .refine(val => val >= 0, "Offset must be zero or positive")
            .default("0")
            .optional(),
          propertyType: z.enum(propertyTypeValues).optional(),
          minPrice: z.string()
            .transform(val => parseFloat(val))
            .refine(val => !isNaN(val), "Min price must be a valid number")
            .refine(val => val >= 0, "Min price must be positive")
            .optional(),
          maxPrice: z.string()
            .transform(val => parseFloat(val))
            .refine(val => !isNaN(val), "Max price must be a valid number")
            .refine(val => val >= 0, "Max price must be positive")
            .optional(),
          bedrooms: z.string()
            .transform(val => parseInt(val, 10))
            .refine(val => !isNaN(val), "Bedrooms must be a valid integer")
            .refine(val => val >= 0, "Bedrooms must be zero or positive")
            .optional(),
          // University filter
          university: z.enum(universityValues).optional(),
          // Map parameters
          neLat: z.string()
            .transform(val => parseFloat(val))
            .refine(val => !isNaN(val), "neLat must be a valid number")
            .optional(),
          neLng: z.string()
            .transform(val => parseFloat(val))
            .refine(val => !isNaN(val), "neLng must be a valid number")
            .optional(),
          swLat: z.string()
            .transform(val => parseFloat(val))
            .refine(val => !isNaN(val), "swLat must be a valid number")
            .optional(),
          swLng: z.string()
            .transform(val => parseFloat(val))
            .refine(val => !isNaN(val), "swLng must be a valid number")
            .optional(),
          mapOnly: z.enum(['true', 'false'])
            .transform(val => val === 'true')
            .default('false')
            .optional()
        }),
      },
      responses: {
        [HttpStatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.object({
                success: z.literal(true),
                data: z.object({
                  properties: z.array(
                    z.union([
                      // Detailed schema for list view
                      z.object({
                        propertyId: z.number(),
                        title: z.string(),
                        description: z.string().optional(),
                        propertyType: z.string(),
                        address: z.string(),
                        monthlyRent: z.number(),
                        isAvailable: z.boolean(),
                        latitude: z.number().optional(),
                        longitude: z.number().optional(),
                        targetUniversity: z.string(), 
                        distanceToUniversity: z.number().optional(), 
                        details: z.object({
                          bedrooms: z.number().optional(),
                          bathrooms: z.number().optional(),
                          squareMeters: z.number().optional(),
                          furnished: z.boolean().optional(),
                          amenities: z.array(z.string()).optional(),
                          rules: z.array(z.string()).optional(),
                        }).optional(),
                        images: z.array(
                          z.object({
                            imageId: z.number(),
                            imageUrl: z.string(),
                            isPrimary: z.boolean(),
                          })
                        ),
                        landlord: z.object({
                          landlordId: z.number(),
                          name: z.string(),
                          email: z.string().optional(),
                          phoneNumber: z.string().optional(),
                          responseRate: z.number().optional(),
                          responseTime: z.string().optional(),
                        }),
                      }),
                      // Simplified schema for map view
                      z.object({
                        propertyId: z.number(),
                        title: z.string(),
                        address: z.string(),
                        monthlyRent: z.number(),
                        latitude: z.number(),
                        longitude: z.number(),
                        targetUniversity: z.string(), 
                        imageUrl: z.string().optional(),
                      })
                    ])
                  ),
                  totalCount: z.number(),
                  hasMore: z.boolean(),
                  universities: z.array(z.string()).optional(), // Available universities filter
                }),
              })
            }
          },
          description: "List of properties with detailed information for student view",
        },
        [HttpStatusCodes.BAD_REQUEST]: {
          content: {
            "application/json": {
              schema: z.object({
                success: z.literal(false),
                error: z.union([
                  z.object({
                    name: z.literal('ZodError'),
                    issues: z.array(z.object({
                      code: z.string(),
                      expected: z.string(),
                      received: z.string(),
                      path: z.array(z.string()),
                      message: z.string(),
                    }))
                  }),
                  z.string()
                ])
              })
            }
          },
          description: "Invalid request parameters",
        },
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
          content: {
            "application/json": {
              schema: z.object({
                success: z.literal(false),
                error: z.string()
              })
            }
          },
          description: "Server error occurred",
        }
      },
    }),
    async (c) => {
      try {
        const query = c.req.valid("query");
        
        // Base query conditions
        let conditions = [eq(properties.isAvailable, true)];
        
        // Add university filter if specified
        if (query.university) {
          conditions.push(eq(properties.targetUniversity, query.university));
        }
        
        if (query.propertyType) {
          conditions.push(eq(properties.propertyType, query.propertyType));
        }
        
        if (query.minPrice !== undefined) {
          conditions.push(gte(properties.monthlyRent, query.minPrice.toString()));
        }
        
        if (query.maxPrice !== undefined) {
          conditions.push(lte(properties.monthlyRent, query.maxPrice.toString()));
        }
        
        // Add map bounds conditions if provided
        if (query.neLat !== undefined && query.neLng !== undefined && 
            query.swLat !== undefined && query.swLng !== undefined) {
          conditions.push(
            sql`${properties.latitude} BETWEEN ${Math.min(query.swLat, query.neLat)} AND ${Math.max(query.swLat, query.neLat)}`
          );
          conditions.push(
            sql`${properties.longitude} BETWEEN ${Math.min(query.swLng, query.neLng)} AND ${Math.max(query.swLng, query.neLng)}`
          );
        }
        
        // Count total matches for pagination info
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(properties)
          .where(and(...conditions));
        
        const countResult = await countQuery;
        const totalCount = Number(countResult[0].count);
        
        // Get distinct universities for filter options
        const universitiesResult = await db
          .selectDistinct({ university: properties.targetUniversity })
          .from(properties)
          .where(eq(properties.isAvailable, true));
        
        const availableUniversities = universitiesResult.map(u => u.university).filter(Boolean);
        
        // Define the limit and offset
        const limit = query.limit ?? 10;
        const offset = query.offset ?? 0;
        
        // Main query for properties
        const propertyResults = await db
          .select({
            propertyId: properties.propertyId,
            title: properties.title,
            description: properties.description,
            propertyType: properties.propertyType,
            address: properties.address,
            monthlyRent: sql<string>`${properties.monthlyRent}::text`,
            isAvailable: properties.isAvailable,
            latitude: sql<string>`${properties.latitude}::text`,
            longitude: sql<string>`${properties.longitude}::text`,
            targetUniversity: properties.targetUniversity,
            landlordId: properties.landlordId,
          })
          .from(properties)
          .where(and(...conditions))
          .limit(limit)
          .offset(offset);
        
        const enrichedProperties = [];
        let filteredCount = 0;
        
        for (const property of propertyResults) {
          const monthlyRent = safeParseDecimal(property.monthlyRent) || 0;
          const latitude = safeParseDecimal(property.latitude);
          const longitude = safeParseDecimal(property.longitude);
          
          // If mapOnly=true, return simplified data for map markers
          if (query.mapOnly) {
            const [primaryImage] = await db
              .select({ imageUrl: propertyImages.imageUrl })
              .from(propertyImages)
              .where(
                and(
                  eq(propertyImages.propertyId, property.propertyId),
                  eq(propertyImages.isPrimary, true)
                )
              )
              .limit(1);
            
            enrichedProperties.push({
              propertyId: property.propertyId,
              title: property.title,
              address: property.address,
              monthlyRent,
              latitude: latitude || 0,
              longitude: longitude || 0,
              targetUniversity: property.targetUniversity,
              imageUrl: primaryImage?.imageUrl,
            });
            continue;
          }
          
          // Full details for list view
          const [details] = await db
            .select({
              bedrooms: propertyDetails.bedrooms,
              bathrooms: propertyDetails.bathrooms,
              squareMeters: sql<string>`${propertyDetails.squareMeters}::text`,
              furnished: propertyDetails.furnished,
              amenities: propertyDetails.amenities,
              rules: propertyDetails.rules
            })
            .from(propertyDetails)
            .where(eq(propertyDetails.propertyId, property.propertyId))
            .limit(1);
          
          // Filter by bedrooms if specified (post-query filter)
          if (query.bedrooms !== undefined && details?.bedrooms !== query.bedrooms) {
            filteredCount++;
            continue;
          }
          
          const squareMeters = safeParseDecimal(details?.squareMeters);
          
          const propertyImageResults = await db
            .select({
              imageId: propertyImages.imageId,
              imageUrl: propertyImages.imageUrl,
              isPrimary: propertyImages.isPrimary,
            })
            .from(propertyImages)
            .where(eq(propertyImages.propertyId, property.propertyId));
          
          // Ensure there's at least an empty array if no images found
          const propertyImagesData = propertyImageResults.length > 0 ? propertyImageResults.map(img => ({
            imageId: img.imageId,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          })) : [];
          
          const [landlord] = await db
            .select({
              landlordId: users.userId,
              name: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
              email: users.email,
              phoneNumber: users.phoneNumber,
            })
            .from(users)
            .where(eq(users.userId, property.landlordId))
            .limit(1);
          
          
          let distanceToUniversity: number | undefined;
          if (latitude && longitude) {
            
            distanceToUniversity = Math.sqrt(Math.pow(latitude, 2) + Math.pow(longitude, 2));
          }
          
          enrichedProperties.push({
            propertyId: property.propertyId,
            title: property.title,
            description: property.description || undefined,
            propertyType: property.propertyType ?? "unknown",
            address: property.address,
            monthlyRent,
            isAvailable: property.isAvailable,
            latitude: latitude ?? undefined,
            longitude: longitude ?? undefined,
            targetUniversity: property.targetUniversity,
            distanceToUniversity,
            details: details ? {
              bedrooms: details.bedrooms || undefined,
              bathrooms: details.bathrooms || undefined,
              squareMeters: squareMeters ?? undefined,
              furnished: details.furnished || undefined,
              amenities: details.amenities || [],
              rules: details.rules || [],
            } : undefined,
            images: propertyImagesData,
            landlord: {
              landlordId: landlord.landlordId,
              name: landlord.name,
              email: landlord.email || undefined,
              phoneNumber: landlord.phoneNumber || undefined,
              responseRate: 0, 
              responseTime: 'N/A', 
            },
          });
        }
        
        // Adjust total count for post-query filtering
        const adjustedTotal = totalCount - filteredCount;
        
        const successResponse = {
          success: true,
          data: {
            properties: enrichedProperties,
            totalCount: adjustedTotal,
            hasMore: (offset + enrichedProperties.length) < adjustedTotal,
            universities: availableUniversities,
          }
        };
        
        return c.json(successResponse);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorResponse = {
            success: false,
            error: {
              name: "ZodError",
              issues: error.issues
            }
          };
          return c.json(errorResponse, HttpStatusCodes.BAD_REQUEST);
        }
        
        console.error("Error fetching properties for student view:", error);
        const serverErrorResponse = {
          success: false,
          error: "Internal server error"
        };
        return c.json(serverErrorResponse, HttpStatusCodes.INTERNAL_SERVER_ERROR);
      }
    }
);



propertyListing.openapi(
  createRoute({
    tags: ["propertyListing"],
    method: "patch",
    path: "/propertyListing/{id}/unpublish",
    request: {
      params: z.object({
        id: z.string().pipe(z.coerce.number().int().positive()),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              message: z.string(),
              property: z.object({
                propertyId: z.number(),
                isAvailable: z.boolean(),
              }),
            }),
          },
        },
        description: "Property successfully unpublished",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              error: z.string(),
            }),
          },
        },
        description: "Property not found",
      },
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              error: z.string(),
            }),
          },
        },
        description: "Server error occurred",
      },
    },
  }),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const propertyId = Number(id);

      // Unpublish the property by setting isAvailable to false
      const [updatedProperty] = await db
        .update(properties)
        .set({ isAvailable: false })
        .where(eq(properties.propertyId, propertyId))
        .returning({ 
          propertyId: properties.propertyId,
          isAvailable: properties.isAvailable
        });

      if (!updatedProperty) {
        return c.json(
          {
            success: false,
            error: "Property not found",
          },
          HttpStatusCodes.NOT_FOUND
        );
      }

      return c.json(
        {
          success: true,
          message: "Property listing has been successfully unpublished",
          property: {
            propertyId: updatedProperty.propertyId,
            isAvailable: updatedProperty.isAvailable,
          },
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      console.error("Error unpublishing property:", error);
      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
);



propertyListing.openapi(
  createRoute({
    tags: ["propertyListing"],
    method: "patch",
    path: "/propertyListing/{id}/publish",
    request: {
      params: z.object({
        id: z.string().pipe(z.coerce.number().int().positive()),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(true),
              message: z.string(),
              property: z.object({
                propertyId: z.number(),
                isAvailable: z.boolean(),
              }),
            }),
          },
        },
        description: "Property successfully published",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              error: z.string(),
            }),
          },
        },
        description: "Property not found",
      },
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              error: z.string(),
            }),
          },
        },
        description: "Server error occurred",
      },
    },
  }),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const propertyId = Number(id);

      // Publish the property by setting isAvailable to true
      const [updatedProperty] = await db
        .update(properties)
        .set({ isAvailable: true })
        .where(eq(properties.propertyId, propertyId))
        .returning({ 
          propertyId: properties.propertyId,
          isAvailable: properties.isAvailable
        });

      if (!updatedProperty) {
        return c.json(
          {
            success: false,
            error: "Property not found",
          },
          HttpStatusCodes.NOT_FOUND
        );
      }

      return c.json(
        {
          success: true,
          message: "Property listing has been successfully published",
          property: {
            propertyId: updatedProperty.propertyId,
            isAvailable: updatedProperty.isAvailable,
          },
        },
        HttpStatusCodes.OK
      );
    } catch (error) {
      console.error("Error publishing property:", error);
      return c.json(
        {
          success: false,
          error: "Internal server error",
        },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
);

export default propertyListing;