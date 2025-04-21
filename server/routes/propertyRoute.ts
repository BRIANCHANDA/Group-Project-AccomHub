import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { properties, propertyDetails,propertyImages, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { propertyTypeEnum } from '../db/schemas/mgh_db'; 
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import axios from "axios";
import NodeCache from "node-cache";

const propertyRouter = createRouter();

// Simple cache to reduce API calls
const geocodeCache = new NodeCache({ stdTTL: 86400 }); // Cache for 24 hours

interface GeocodingResult {
  latitude: number | null;
  longitude: number | null;
  formattedAddress?: string;
  success: boolean;
  error?: string;
}

/**
 * Geocodes an address using Google Maps API
 * @param address The address to geocode
 * @returns Object containing latitude, longitude, and status information
 */
async function geocodeAddress(address: string): Promise<GeocodingResult> {
  // Check cache first
  const cacheKey = `geocode:${address}`;
  const cachedResult = geocodeCache.get<GeocodingResult>(cacheKey);
  
  if (cachedResult) {
    console.log(`Using cached geocoding for: ${address}`);
    return cachedResult;
  }
  
  // Default result
  const result: GeocodingResult = {
    latitude: null,
    longitude: null,
    success: false
  };
  
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key is not configured");
    }
    
    const geoResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 5000, // 5 second timeout
      }
    );
    
    // Check for API error responses
    if (geoResponse.data.status !== "OK") {
      result.error = `Geocoding API error: ${geoResponse.data.status}`;
      if (geoResponse.data.error_message) {
        result.error += ` - ${geoResponse.data.error_message}`;
      }
      return result;
    }
    
    // Process results
    if (geoResponse.data.results.length > 0) {
      const location = geoResponse.data.results[0].geometry.location;
      result.latitude = location.lat;
      result.longitude = location.lng;
      result.formattedAddress = geoResponse.data.results[0].formatted_address;
      result.success = true;
      
      // Cache the successful result
      geocodeCache.set(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    // Handle request errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Geocoding error for address "${address}": ${errorMessage}`);
    
    result.error = `Geocoding request failed: ${errorMessage}`;
    return result;
  }
}

const propertyTypeValues = [
  'apartment',
  'house',
  'shared_room',
  'single_room'
] as const;

// Updated Zod schema with optional latitude and longitude
const propertySchema = z.object({
  propertyId: z.string().optional(),
  landlordId: z.number(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  propertyType: z.enum(propertyTypeValues),
  address: z.string().min(1),
  monthlyRent: z.number().positive(),
  isAvailable: z.boolean().default(true),
  latitude: z.number().optional(),   
  longitude: z.number().optional(),    
});

const updatePropertySchema = propertySchema.partial();

// Helper function to find a property by ID
const findPropertyById = async (propertyId: number) => {
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.propertyId, propertyId))
    .limit(1);
  return property;
};



//To craete a minimal proeprty to generate a propertyId
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "post",
    path: "/draft",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              landlordId: z.number()
            }),
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: {
        content: {
          "application/json": {
            schema: z.object({
              propertyId: z.number()
            }),
          },
        },
        description: "Draft property created successfully",
      },
    },
  }),
  async (c) => {
    const { landlordId } = c.req.valid("json");

    // Insert a minimal/draft property record.
    const [newDraft] = await db.insert(properties)
      .values({
        landlordId: landlordId,
        title: "Draft",
        propertyType: "apartment", // or a default type
        address: "",
        monthlyRent: 1,
        isAvailable: false
      })
      .returning({
        propertyId: properties.propertyId
      });

    return c.json(newDraft, HttpStatusCodes.CREATED);
  }
);






// Create a new property with enhanced geocoding integration
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
                propertyType: z.enum(propertyTypeValues),
                title: z.string(),
                latitude: z.number().optional(),
                longitude: z.number().optional(),
                formattedAddress: z.string().optional(),
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

    // Add validation for landlordId
    if (!propertyData.landlordId) {
      throw new HTTPException(400, { message: "landlordId is required" });
    }

    // Geocode the address
    const geocodingResult = await geocodeAddress(propertyData.address);

    // Make sure landlordId is a number
    const propertyDataWithRentAsString = {
      ...propertyData,
      monthlyRent: propertyData.monthlyRent.toString(),
      landlordId: Number(propertyData.landlordId) // Ensure it's a number
    };

    // Then ensure all required fields have values before insertion
    const valuesToInsert = {
      ...propertyDataWithRentAsString,
      latitude: geocodingResult.latitude,
      longitude: geocodingResult.longitude,
      ...(geocodingResult.formattedAddress ? { address: geocodingResult.formattedAddress } : {})
    };

    // Log the values for debugging
    console.log("Property insert values:", valuesToInsert);

    // Add a check to ensure we're not inserting undefined values
    const cleanedValues = Object.fromEntries(
      Object.entries(valuesToInsert).filter(([_, v]) => v !== undefined)
    );

    const [newProperty] = await db
      .insert(properties)
      .values(cleanedValues)
      .returning({
        propertyId: properties.propertyId,
        title: properties.title,
        propertyType: properties.propertyType ?? "apartment",
        latitude: properties.latitude,
        longitude: properties.longitude,
        address: properties.address,
      });

    return c.json(
      {
        message: "Property created successfully",
        property: newProperty,
      },
      HttpStatusCodes.CREATED
    );
  }
);


// Get all property types from the enum
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/property-types",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                value: z.string()
              })
            ),
          },
        },
        description: "List of property types",
      },
    },
  }),
  async (c) => {
    try {
      // Return hardcoded property types instead of querying the database
      const formattedPropertyTypes = propertyTypeValues.map((type, index) => ({
        id: (index + 1).toString(),
        name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
        value: type
      }));
      
      return c.json(formattedPropertyTypes);
    } catch (error) {
      console.error("Error fetching property types:", error);
      // Fallback to hardcoded property types if query fails
      const fallbackTypes = [
        { id: '1', name: 'Apartment', value: 'apartment' },
        { id: '2', name: 'House', value: 'house' },
        { id: '3', name: 'Shared Room', value: 'shared_room' },
        { id: '4', name: 'Single Room', value: 'single_room' }
      ];
      
      return c.json(fallbackTypes);
    }
  }
);

// List all properties (including latitude and longitude)
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
                latitude: z.number().optional(),
                longitude: z.number().optional(),
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
    const formattedProperties = allProperties.map((p) => ({
      propertyId: p.propertyId,
      title: p.title,
      description: p.description ?? undefined,
      propertyType: p.propertyType ?? "apartment", // Ensure propertyType is never null
      address: p.address,
      monthlyRent: Number(p.monthlyRent),
      isAvailable: p.isAvailable ?? true,
      latitude: p.latitude ?? undefined,
      longitude: p.longitude ?? undefined,
    }));
    return c.json(formattedProperties);
  }
);

// Get a specific property by ID (including coordinates)
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
            schema: propertySchema,
          },
        },
        description: "Property details",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({}),
          },
        },
        description: "Property not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    
    try {
      const [property] = await db
        .select({
          propertyId: properties.propertyId,
          title: properties.title,
          description: properties.description,
          propertyType: properties.propertyType || "apartment", // Ensure propertyType is never null
          address: properties.address,
          monthlyRent: properties.monthlyRent, // Use the database column directly
          isAvailable: properties.isAvailable,
          latitude: properties.latitude ?? null, // Use latitude as a number or null
          longitude: properties.longitude ?? null, // Use longitude as a number or null,
          landlordId: properties.landlordId // Include landlordId in the response
        })
        .from(properties)
        .where(eq(properties.propertyId, id))
        .limit(1);

      if (!property) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Property not found",
        });
      }

      return c.json(property, HttpStatusCodes.OK);
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
);

// Update a property with geocoding update if address changes
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
                latitude: z.number().optional(),
                longitude: z.number().optional(),
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
    
    // Get current property to check if address is changed
    const currentProperty = await findPropertyById(id);
    
    if (!currentProperty) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Property not found",
      });
    }
    
    // Prepare update data with string conversion for rent
    let formattedUpdateData = {
      ...updateData,
      monthlyRent: updateData.monthlyRent?.toString(),
    };
    
    // If address is being updated, update coordinates
    if (updateData.address && updateData.address !== currentProperty.address) {
      const geocodingResult = await geocodeAddress(updateData.address);
      
      if (geocodingResult.success) {
        formattedUpdateData = {
          ...formattedUpdateData,
          latitude: geocodingResult.latitude,
          longitude: geocodingResult.longitude,
          // Optionally update with formatted address
          ...(geocodingResult.formattedAddress ? { address: geocodingResult.formattedAddress } : {})
        };
      }
    }

    const [updatedProperty] = await db
      .update(properties)
      .set(formattedUpdateData)
      .where(eq(properties.propertyId, id))
      .returning({ 
        propertyId: properties.propertyId, 
        title: properties.title,
        latitude: properties.latitude,
        longitude: properties.longitude,
      });

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

// Find properties within a radius of a given location
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/nearby",
    request: {
      query: z.object({
        lat: z.string().transform(Number),
        lng: z.string().transform(Number),
        radius: z.string().transform(Number).default("5"), // Default 5km radius
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                propertyId: z.number(),
                title: z.string(),
                address: z.string(),
                distance: z.number(),
                // Other property fields...
              })
            ),
          },
        },
        description: "List of nearby properties",
      },
    },
  }),
  async (c) => {
    const { lat, lng, radius } = c.req.valid("query");
    
    // Select properties that have coordinates
    const allProperties = await db
      .select({
        propertyId: properties.propertyId,
        title: properties.title,
        address: properties.address,
        latitude: properties.latitude,
        longitude: properties.longitude
      })
      .from(properties)
      .where(
        // Only consider properties with coordinates
        sql`${properties.latitude} IS NOT NULL AND ${properties.longitude} IS NOT NULL`
      );
    
    // Calculate distance using Haversine formula and format response
    const nearbyProperties = allProperties
      .map(property => {
        if (property.latitude === null || property.longitude === null) {
          return null;
        }
        
        const distance = calculateHaversineDistance(
          lat, 
          lng, 
          Number(property.latitude), 
          Number(property.longitude)
        );
        
        return {
          propertyId: property.propertyId,
          title: property.title,
          address: property.address,
          distance: parseFloat(distance.toFixed(2))
        };
      })
      .filter((p): p is { propertyId: number; title: string; address: string; distance: number; } => 
        p !== null && p.distance <= radius
      )
      .sort((a, b) => a.distance - b.distance);
    
    return c.json(nearbyProperties);
  }
);

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in kilometers
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



// Get all properties with detailed information for student view
// Get all properties with detailed information for student view
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/student-view",
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
          .default(0)
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
              success: z.literal(true).or(z.literal(false)),
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
                      imageUrl: z.string().optional(),
                    })
                  ])
                ),
                totalCount: z.number(),
                hasMore: z.boolean(),
              }).optional(),
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
              ]).optional()
            })
          }
        },
        description: "List of properties with detailed information for student view",
      }
    },
  }),
  async (c) => {
    try {
      const query = c.req.valid("query");
      
      // Base query conditions
      let conditions = [eq(properties.isAvailable, true)];
      
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
      
      // Count total matches
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(and(...conditions));
      
      const countResult = await countQuery;
      const totalCount = Number(countResult[0].count);
      
      // Main query
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
          landlordId: properties.landlordId,
        })
        .from(properties)
        .where(and(...conditions))
        .limit(query.limit ?? 10)
        .offset(query.offset ?? 0);
      
      const enrichedProperties = [];
      
      for (const property of propertyResults) {
        const monthlyRent = safeParseDecimal(property.monthlyRent) || 0;
        const latitude = safeParseDecimal(property.latitude);
        const longitude = safeParseDecimal(property.longitude);
        
        // If mapOnly=true, return simplified data
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
        
        if (query.bedrooms !== undefined && details?.bedrooms !== query.bedrooms) {
          continue;
        }
        
        const squareMeters = safeParseDecimal(details?.squareMeters);
        
        const images = await db
          .select({
            imageId: propertyImages.imageId,
            imageUrl: propertyImages.imageUrl,
            isPrimary: propertyImages.isPrimary,
          })
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, property.propertyId));
        
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
          details: details ? {
            bedrooms: details.bedrooms || undefined,
            bathrooms: details.bathrooms || undefined,
            squareMeters: squareMeters ?? undefined,
            furnished: details.furnished || undefined,
            amenities: details.amenities || [],
            rules: details.rules || [],
          } : undefined,
          images: images.map(img => ({
            imageId: img.imageId,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          })),
          landlord: {
            landlordId: landlord.landlordId,
            name: landlord.name,
            email: landlord.email || undefined,
            phoneNumber: landlord.phoneNumber || undefined,
            responseRate: 0, // Default value
            responseTime: 'N/A', // Default value
          },
        });
      }
      
      return c.json({
        success: true,
        data: {
          properties: enrichedProperties,
          totalCount,
          hasMore: query.offset + query.limit < totalCount,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({
          success: false,
          error: {
            issues: error.issues,
            name: "ZodError"
          }
        }, HttpStatusCodes.BAD_REQUEST);
      }
      
      console.error("Error fetching properties for student view:", error);
      return c.json({
        success: false,
        error: "Internal server error"
      }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
);







export default propertyRouter;

function safeParseDecimal(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}
