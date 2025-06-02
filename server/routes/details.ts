import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { properties, propertyDetails, propertyImages, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { propertyTypeEnum } from '../db/schemas/mgh_db'; 
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import axios from "axios";
import NodeCache from "node-cache";

const Details = createRouter();

// Get property type values from enum for validation
const propertyTypeValues = ['apartment', 'house', 'shared_room', 'single_room'] as const;

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

// Get property details by ID
Details.openapi(
  createRoute({
    tags: ["details"],
    method: "get",
    path: "/details/{id}",
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
              data: z.object({
                propertyId: z.number(),
                title: z.string(),
                description: z.string().optional(),
                propertyType: z.string(),
                address: z.string(),
                monthlyRent: z.number(),
                isAvailable: z.boolean(),
                latitude: z.number().optional(),
                longitude: z.number().optional(),
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
            })
          }
        },
        description: "Detailed property information",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              error: z.string()
            })
          }
        },
        description: "Property not found",
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
      const { id } = c.req.valid("param");
      
      // Get base property information
      const [property] = await db
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
          landlordId: properties.landlordId,
        })
        .from(properties)
        .where(eq(properties.propertyId, id))
        .limit(1);

      if (!property) {
        return c.json({
          success: false,
          error: "Property not found"
        }, HttpStatusCodes.NOT_FOUND);
      }

      // Get property details
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
      
      // Get property images
      const propertyImageResults = await db
        .select({
          imageId: propertyImages.imageId,
          imageUrl: propertyImages.imageUrl,
          isPrimary: propertyImages.isPrimary,
        })
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, property.propertyId));
      
      // Get landlord information
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

      // Parse decimal values
      const monthlyRent = safeParseDecimal(property.monthlyRent) || 0;
      const latitude = safeParseDecimal(property.latitude);
      const longitude = safeParseDecimal(property.longitude);
      const squareMeters = safeParseDecimal(details?.squareMeters);
      
      // Ensure there's at least an empty array if no images found
      const propertyImagesData = propertyImageResults.length > 0 ? propertyImageResults.map(img => ({
        imageId: img.imageId,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
      })) : [];

      // Construct the response
      const successResponse = {
        success: true,
        data: {
          propertyId: property.propertyId,
          title: property.title,
          description: property.description || undefined,
          propertyType: property.propertyType ?? "unknown",
          address: property.address,
          monthlyRent,
          isAvailable: property.isAvailable,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
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
            responseRate: 0, // Default value
            responseTime: 'N/A', // Default value
          },
        }
      };
      
      return c.json(successResponse);
    } catch (error) {
      console.error("Error fetching property by ID:", error);
      
      if (error instanceof HTTPException) throw error;
      
      return c.json({
        success: false,
        error: "Internal server error"
      }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
);



export default Details;
