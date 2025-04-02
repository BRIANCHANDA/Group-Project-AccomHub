import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { properties } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { eq, sql } from "drizzle-orm";
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
  propertyId:z.string().optional(),
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

    // Convert monthlyRent to string if needed
    const propertyDataWithRentAsString = {
      ...propertyData,
      monthlyRent: propertyData.monthlyRent.toString(),
    };

    // Use enhanced geocoding function
    let geocodingResult = { latitude: null, longitude: null, formattedAddress: undefined };
    
    // Only geocode if we don't already have coordinates
    if (!propertyData.latitude || !propertyData.longitude) {
      const result = await geocodeAddress(propertyData.address);
      
      if (result.success && result.latitude !== null && result.longitude !== null) {
        geocodingResult = {
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress,
        };
      } else {
        // Log the error but continue with property creation
        console.warn(`Unable to geocode address: ${result.error}`);
      }
    } else {
      // Use provided coordinates
      geocodingResult = {
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
      };
    }

    // Insert property with geocoding data
    const [newProperty] = await db
      .insert(properties)
      .values({
        ...propertyDataWithRentAsString,
        latitude: geocodingResult.latitude,
        longitude: geocodingResult.longitude,
        // Add formatted address if your schema supports it
        ...(geocodingResult.formattedAddress ? { address: geocodingResult.formattedAddress } : {}),
      })
      .returning({
        propertyId: properties.propertyId,
        title: properties.title,
        propertyType: properties.propertyType,
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
      propertyType: p.propertyType ?? "apartment",
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
          propertyType: properties.propertyType,
          address: properties.address,
          monthlyRent: properties.monthlyRent,
          isAvailable: properties.isAvailable,
          latitude: properties.latitude,
          longitude: properties.longitude,
        })
        .from(properties)
        .where(eq(properties.propertyId, id))
        .limit(1);

      if (!property) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Property not found",
        });
      }

      return c.json(property);
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
      .select()
      .from(properties)
      .where(
        // Only consider properties with coordinates
        sql`${properties.latitude} IS NOT NULL AND ${properties.longitude} IS NOT NULL`
      );
    
    // Calculate distance using Haversine formula
    const nearbyProperties = allProperties
      .map(property => {
        // Skip properties without coordinates
        if (property.latitude === null || property.longitude === null) {
          return null;
        }
        
        // Calculate distance in kilometers using Haversine formula
        const distance = calculateHaversineDistance(
          lat, 
          lng, 
          Number(property.latitude), 
          Number(property.longitude)
        );
        
        return {
          ...property,
          distance: parseFloat(distance.toFixed(2)),
          monthlyRent: Number(property.monthlyRent),
        };
      })
      .filter(p => p !== null && p!.distance <= radius)
      .sort((a, b) => a!.distance - b!.distance);
    
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

export default propertyRouter;