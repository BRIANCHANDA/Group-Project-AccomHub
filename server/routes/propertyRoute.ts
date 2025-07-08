import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { properties, propertyImages, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { and, eq, sql, inArray } from "drizzle-orm";
import axios from "axios";
import NodeCache from "node-cache";

// Cache setup
const geocodeCache = new NodeCache({ stdTTL: 3600, checkperiod: 600, useClones: false });

// Interface for geocoding results
interface GeocodingResult {
  latitude: number | null;
  longitude: number | null;
  formattedAddress?: string;
  success: boolean;
  error?: string;
  cached?: boolean;
}

// Custom error classes
class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Google Maps geocoding
async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || address.trim() === "") {
    return { latitude: null, longitude: null, success: false, error: "Invalid address" };
  }

  const cacheKey = `google:${address.trim().toLowerCase()}`;
  const cachedResult = geocodeCache.get<GeocodingResult>(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for Google: ${address}`);
    return { ...cachedResult, cached: true };
  }

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: { address, key: process.env.GOOGLE_MAPS_API_KEY },
      timeout: 10000,
    });

    if (response.data.status !== "OK" || !response.data.results.length) {
      return { latitude: null, longitude: null, success: false, error: response.data.error_message || "No results" };
    }

    const { lat, lng } = response.data.results[0].geometry.location;
    const result: GeocodingResult = {
      latitude: lat,
      longitude: lng,
      formattedAddress: response.data.results[0].formatted_address,
      success: true,
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Google geocoding failed for "${address}":`, error);
    return { latitude: null, longitude: null, success: false, error: "Google geocoding failed" };
  }
}

// Nominatim geocoding
async function geocodeWithNominatim(address: string): Promise<GeocodingResult> {
  if (!address || address.trim() === "") {
    return { latitude: null, longitude: null, success: false, error: "Invalid address" };
  }

  const cacheKey = `nominatim:${address.trim().toLowerCase()}`;
  const cachedResult = geocodeCache.get<GeocodingResult>(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for Nominatim: ${address}`);
    return { ...cachedResult, cached: true };
  }

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q: address, format: "json", limit: 1, addressdetails: 1 },
      timeout: 10000,
      headers: { "User-Agent": "PropertyApp/1.0 (your-email@example.com)" }, // Replace with your email
    });

    if (!response.data.length) {
      return { latitude: null, longitude: null, success: false, error: "No results" };
    }

    const result: GeocodingResult = {
      latitude: parseFloat(response.data[0].lat),
      longitude: parseFloat(response.data[0].lon),
      formattedAddress: response.data[0].display_name,
      success: true,
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Nominatim geocoding failed for "${address}":`, error);
    return { latitude: null, longitude: null, success: false, error: "Nominatim geocoding failed" };
  }
}

// MapBox geocoding
async function geocodeWithMapbox(address: string): Promise<GeocodingResult> {
  if (!process.env.MAPBOX_ACCESS_TOKEN) {
    return { latitude: null, longitude: null, success: false, error: "MapBox not configured" };
  }

  const cacheKey = `mapbox:${address.trim().toLowerCase()}`;
  const cachedResult = geocodeCache.get<GeocodingResult>(cacheKey);
  if (cachedResult) {
    console.log(`Cache hit for MapBox: ${address}`);
    return { ...cachedResult, cached: true };
  }

  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`, {
      params: { access_token: process.env.MAPBOX_ACCESS_TOKEN, limit: 1 },
      timeout: 10000,
    });

    if (!response.data.features.length) {
      return { latitude: null, longitude: null, success: false, error: "No results" };
    }

    const [longitude, latitude] = response.data.features[0].center;
    const result: GeocodingResult = {
      latitude,
      longitude,
      formattedAddress: response.data.features[0].place_name,
      success: true,
    };

    geocodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`MapBox geocoding failed for "${address}":`, error);
    return { latitude: null, longitude: null, success: false, error: "MapBox geocoding failed" };
  }
}

// Fallback geocoding logic
async function geocodeAddressWithFallback(address: string): Promise<GeocodingResult> {
  if (!address || address.trim() === "") {
    return { latitude: null, longitude: null, success: false, error: "Invalid address" };
  }

  console.log(`Geocoding "${address}" with fallback...`);

  // Try Google Maps
  if (process.env.GOOGLE_MAPS_API_KEY) {
    const googleResult = await geocodeAddress(address);
    if (googleResult.success) return googleResult;
    console.log("Google Maps failed, falling back...");
  }

  // Try Nominatim
  const nominatimResult = await geocodeWithNominatim(address);
  if (nominatimResult.success) return nominatimResult;

  // Try MapBox if configured
  if (process.env.MAPBOX_ACCESS_TOKEN) {
    const mapboxResult = await geocodeWithMapbox(address);
    if (mapboxResult.success) return mapboxResult;
  }

  return { latitude: null, longitude: null, success: false, error: "All geocoding services failed" };
}

// Validate coordinates
function validateCoordinates(lat: number, lng: number): { valid: boolean; error?: string } {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }
  
  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: 'Coordinates cannot be NaN' };
  }
  
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90 degrees' };
  }
  
  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180 degrees' };
  }
  
  return { valid: true };
}

// Safe database operation wrapper
async function safeDbOperation<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`Database operation '${operationName}' failed:`, error);
    throw new DatabaseError(`Database operation failed: ${operationName}`, error);
  }
}

// Router setup
const propertyRouter = createRouter();

const propertyTypeValues = ['apartment', 'house', 'shared_room', 'single_room'] as const;

// Property schema
const propertySchema = z.object({
  propertyId: z.number().optional(),
  landlordId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  propertyType: z.enum(propertyTypeValues),
  address: z.string().min(1).max(500),
  monthlyRent: z.number().positive(),
  isAvailable: z.boolean().default(true),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
   targetUniversity: z.string().min(1).max(255), 
});

const updatePropertySchema = propertySchema.partial();

// Property finder
const findPropertyById = async (propertyId: number) => {
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    throw new ValidationError("Invalid property ID", "propertyId");
  }
  
  return await safeDbOperation(
    async () => {
      const [property] = await db.select().from(properties).where(eq(properties.propertyId, propertyId)).limit(1);
      return property;
    },
    "find property by ID"
  );
};

// Geocoding endpoint
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/geocoding",
    request: {
      query: z.object({
        address: z.string().min(1, "Address is required").max(500, "Address too long"),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              latitude: z.number().nullable(),
              longitude: z.number().nullable(),
              formattedAddress: z.string().optional(),
              success: z.boolean(),
              error: z.string().optional(),
              cached: z.boolean().optional(),
            }),
          },
        },
        description: "Geocode an address",
      },
      [HttpStatusCodes.BAD_REQUEST]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
        description: "Invalid address or geocoding failure",
      },
    },
  }),
  async (c) => {
    try {
      const { address } = c.req.valid("query");
      const result = await geocodeAddressWithFallback(address);

      if (!result.success) {
        throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
          message: "Geocoding failed",
          error: result.error,
        });
      }

      return c.json(result, HttpStatusCodes.OK);
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error("Unexpected error in geocoding endpoint:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Internal server error during geocoding",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Draft property creation
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
              landlordId: z.number().int().positive("Landlord ID must be a positive integer"),
               targetUniversity: z.string().min(1).max(255), 
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
              propertyId: z.number(),
              message: z.string(),
            }),
          },
        },
        description: "Draft property created successfully",
      },
      [HttpStatusCodes.BAD_REQUEST]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
        description: "Invalid input",
      },
    },
  }),
  async (c) => {
    try {
      const { landlordId ,targetUniversity} = c.req.valid("json");

      const [newDraft] = await safeDbOperation(
        async () => {
          return await db.insert(properties)
            .values({
              landlordId,
              title: "Draft",
              propertyType: "apartment",
              address: "",
              monthlyRent: 1,
              isAvailable: false,
              location: sql`ST_GeogFromText('POINT(0 0)')`,
              targetUniversity
            })
            .returning({ propertyId: properties.propertyId });
        },
        "create property draft"
      );

      return c.json({ ...newDraft, message: "Draft property created successfully" }, HttpStatusCodes.CREATED);
    } catch (error) {
      if (error instanceof HTTPException || error instanceof ValidationError || error instanceof DatabaseError) throw error;
      console.error("Unexpected error creating property draft:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to create property draft",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Property creation
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "post",
    path: "/properties",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              title: z.string().min(1, "Title is required").max(255, "Title too long"),
              propertyType: z.enum(propertyTypeValues).optional(),
              monthlyRent: z.number().positive("Monthly rent must be positive"),
              landlordId: z.number().int().positive("Landlord ID must be a positive integer"),
              address: z.string().min(1, "Address is required").max(500, "Address too long"),
              latitude: z.number().optional(),
              longitude: z.number().optional(),
              description: z.string().max(200, "Description too long").optional(),
                targetUniversity: z.string().min(1, "Target university is required").max(255),
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
              message: z.string(),
              property: z.object({
                propertyId: z.number(),
                propertyType: z.enum(propertyTypeValues),
                title: z.string(),
                latitude: z.number(),
                longitude: z.number(),
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
              error: z.string().optional(),
            }),
          },
        },
        description: "Invalid input",
      },
    },
  }),
  async (c) => {
    try {
      const propertyData = c.req.valid("json");
      let latitude = propertyData.latitude;
      let longitude = propertyData.longitude;
      let formattedAddress = propertyData.address;

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        const coordValidation = validateCoordinates(latitude, longitude);
        if (!coordValidation.valid) {
          throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
            message: "Invalid coordinates provided",
            error: coordValidation.error,
          });
        }
      } else {
        const geocodingResult = await geocodeAddressWithFallback(propertyData.address);
        if (!geocodingResult.success || !geocodingResult.latitude || !geocodingResult.longitude) {
          throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
            message: "Failed to geocode the provided address",
            error: geocodingResult.error,
          });
        }
        latitude = geocodingResult.latitude;
        longitude = geocodingResult.longitude;
        formattedAddress = geocodingResult.formattedAddress || propertyData.address;
      }

      const [newProperty] = await safeDbOperation(
        async () => {
          return await db.insert(properties)
            .values({
              ...propertyData,
              address: formattedAddress,
              monthlyRent: propertyData.monthlyRent,
              propertyType: propertyData.propertyType ?? "apartment",
                targetUniversity: propertyData.targetUniversity,
              location: sql`ST_GeogFromText('POINT(${longitude} ${latitude})')`,
            })
            .returning({
              propertyId: properties.propertyId,
              title: properties.title,
              propertyType: properties.propertyType,
              address: properties.address,
              latitude: sql`ST_Y(ST_Transform(location::geometry, 4326))`.as('latitude'),
              longitude: sql`ST_X(ST_Transform(location::geometry, 4326))`.as('longitude'),
               targetUniversity: properties.targetUniversity,
            });
        },
        "create property"
      );

      return c.json(
        {
          message: "Property created successfully",
          property: {
            ...newProperty,
            propertyType: newProperty.propertyType ?? "apartment",
            formattedAddress,
             targetUniversity: newProperty.targetUniversity,
          },
        },
        HttpStatusCodes.CREATED
      );
    } catch (error) {
      if (error instanceof HTTPException || error instanceof ValidationError || error instanceof DatabaseError) throw error;
      console.error("Unexpected error creating property:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Error creating property in database",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Batch geocoding
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "post",
    path: "/properties/batch-geocode",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              processed: z.number(),
              successful: z.number(),
              failed: z.number(),
              errors: z.array(z.object({
                propertyId: z.number(),
                error: z.string(),
              })).optional(),
            }),
          },
        },
        description: "Batch geocoding completed",
      },
    },
  }),
  async (c) => {
    try {
      const propertiesNeedingCoordinates = await safeDbOperation(
        async () => {
          return await db.select({
            propertyId: properties.propertyId,
            address: properties.address,
          }).from(properties)
            .where(
              sql`${properties.address} IS NOT NULL 
                  AND ${properties.address} != '' 
                  AND (${properties.location} IS NULL 
                       OR ST_X(${properties.location}::geometry) = 0 
                       AND ST_Y(${properties.location}::geometry) = 0)`
            );
        },
        "fetch properties needing geocoding"
      );

      let successful = 0;
      let failed = 0;
      const errors: Array<{ propertyId: number; error: string }> = [];

      for (const property of propertiesNeedingCoordinates) {
        if (!property.address?.trim()) {
          failed++;
          errors.push({ propertyId: property.propertyId, error: "Empty or invalid address" });
          continue;
        }

        try {
          const geocodingResult = await geocodeAddressWithFallback(property.address);
          if (geocodingResult.success && geocodingResult.latitude !== null && geocodingResult.longitude !== null) {
            await safeDbOperation(
              async () => {
                return await db.update(properties)
                  .set({
                    location: sql`ST_GeogFromText('POINT(${geocodingResult.longitude} ${geocodingResult.latitude})')`,
                    ...(geocodingResult.formattedAddress ? { address: geocodingResult.formattedAddress } : {}),
                  })
                  .where(eq(properties.propertyId, property.propertyId));
              },
              `update property ${property.propertyId} coordinates`
            );
            successful++;
          } else {
            failed++;
            errors.push({ propertyId: property.propertyId, error: geocodingResult.error || "Unknown geocoding error" });
          }
        } catch (error) {
          failed++;
          errors.push({ propertyId: property.propertyId, error: error instanceof Error ? error.message : "Unknown error" });
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
      }

      return c.json({
        message: "Batch geocoding completed",
        processed: propertiesNeedingCoordinates.length,
        successful,
        failed,
        ...(errors.length > 0 ? { errors: errors.slice(0, 10) } : {}),
      }, HttpStatusCodes.OK);
    } catch (error) {
      if (error instanceof HTTPException || error instanceof DatabaseError) throw error;
      console.error("Error during batch geocoding:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Error during batch geocoding process",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Random properties with university filtering
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/random",
    request: {
      query: z.object({
        limit: z.string().transform((val) => {
          const num = parseInt(val);
          if (isNaN(num) || num <= 0 || num > 100) {
            throw new z.ZodError([{ code: 'custom', message: 'Limit must be a positive integer between 1 and 100', path: ['limit'] }]);
          }
          return num;
        }).default("8").optional(),
        university: z.string().optional(),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.number(),
                title: z.string(),
                location: z.string(),
                price: z.string(),
                features: z.array(z.string()),
                image: z.string().nullable(),
                tag: z.string().nullable().optional(),
                university: z.string(),
              }),
            ),
          },
        },
        description: "Random selection of properties",
      },
    },
  }),
  async (c) => {
    try {
      const { limit = 8, university } = c.req.valid("query");
      
      let query = db.select({ propertyId: properties.propertyId })
        .from(properties)
        .where(eq(properties.isAvailable, true));
      
      if (university) {
        query = query.where(eq(properties.targetUniversity, university));
      }

      const randomPropertyIds = await query
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      if (!randomPropertyIds.length) {
        return c.json([]);
      }

      const randomProperties = await db.select({
        id: properties.propertyId,
        title: properties.title,
        location: properties.address,
        price: sql`CONCAT('K', ${properties.monthlyRent}, ' / month')`.as('price'),
        description: properties.description,
        image: propertyImages.imageUrl,
        tag: properties.propertyType,
        university: properties.targetUniversity,
      }).from(properties)
      .leftJoin(
        propertyImages,
        and(
          eq(properties.propertyId, propertyImages.propertyId),
          eq(propertyImages.isPrimary, true)
        )
      )
      .where(inArray(properties.propertyId, randomPropertyIds.map(p => p.propertyId)))
        .groupBy(properties.propertyId, propertyImages.imageUrl);

      const formattedProperties = randomProperties.map(property => ({
        id: property.id,
        title: property.title,
        location: property.location,
        price: property.price,
        features: property.description ? [property.description] : ['No description available'],
        image: property.image || '/placeholder-property.jpg',
        tag: property.tag || 'property',
        university: property.university,
      }));

      return c.json(formattedProperties);
    } catch (error) {
      console.error("Error fetching random properties:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to fetch random properties",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Property types
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/property-types/properties",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                value: z.string(),
              }),
            ),
          },
        },
        description: "List of property types",
      },
    },
  }),
  async (c) => {
    try {
      const formattedPropertyTypes = propertyTypeValues.map((type, index) => ({
        id: (index + 1).toString(),
        name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
        value: type,
      }));
      return c.json(formattedPropertyTypes);
    } catch (error) {
      console.error("Error fetching property types:", error);
      return c.json([
        { id: '1', name: 'Apartment', value: 'apartment' },
        { id: '2', name: 'House', value: 'house' },
        { id: '3', name: 'Shared Room', value: 'shared_room' },
        { id: '4', name: 'Single Room', value: 'single_room' },
      ]);
    }
  }
);

// Add this to your propertyRouter

// Admin properties list with targetUniversity
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/properties",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                propertyId: z.number(),
                title: z.string(),
                description: z.string().optional(),
                address: z.string(),
                monthlyRent: z.number(),
                isAvailable: z.boolean(),
                propertyType: z.string(),
                landlordName: z.string().optional(),
                landlordEmail: z.string().optional(),
                targetUniversity: z.string(),
              })
            ),
          },
        },
        description: "List of properties for admin dashboard",
      },
    },
  }),
  async (c) => {
    try {
      const allProperties = await db
        .select({
          propertyId: properties.propertyId,
          title: properties.title,
          description: properties.description,
          address: properties.address,
          monthlyRent: properties.monthlyRent,
          isAvailable: properties.isAvailable,
          propertyType: properties.propertyType,
          landlordName: users.firstName,
          landlordEmail: users.email,
          targetUniversity: properties.targetUniversity,
        })
        .from(properties)
        .leftJoin(users, eq(properties.landlordId, users.userId));

      return c.json(
        allProperties.map(p => ({
          ...p,
          monthlyRent: Number(p.monthlyRent),
          propertyType: p.propertyType || 'apartment',
          description: p.description || undefined,
          landlordName: p.landlordName || undefined,
          landlordEmail: p.landlordEmail || undefined,
          targetUniversity: p.targetUniversity,
        })),
        HttpStatusCodes.OK
      );
    } catch (error) {
      console.error("Error fetching properties:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to fetch properties",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get specific property
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/properties/{id}",
    request: {
      params: z.object({
        id: z.string().pipe(z.coerce.number().int()),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: propertySchema,
          },
        },
        description: "Get property details",
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
    try {
      const { id } = c.req.valid("param");
      const [property] = await db.select({
        propertyId: properties.propertyId,
        title: properties.title,
        description: properties.description,
        propertyType: properties.propertyType,
        address: properties.address,
        monthlyRent: properties.monthlyRent,
        isAvailable: properties.isAvailable,
        landlordId: properties.landlordId,
        latitude: sql`ST_Y(ST_Transform(location::geometry, 4326))`.as('latitude'),
        longitude: sql`ST_X(ST_Transform(location::geometry, 4326))`.as('longitude'),
      }).from(properties).where(eq(properties.propertyId, id)).limit(1);

      if (!property) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Property not found",
        });
      }

      return c.json(property, HttpStatusCodes.OK);
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Internal server error",
        error: "Failed to retrieve property",
      });
    }
  }
);
// Update property endpoint
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
                address: z.string(),
                monthlyRent: z.number(),
                isAvailable: z.boolean(),
                propertyType: z.string(),
                targetUniversity: z.string(),
                latitude: z.number().nullable(),
                longitude: z.number().nullable(),
              }),
            }),
          },
        },
        description: "Property updated successfully",
      },
      [HttpStatusCodes.BAD_REQUEST]: {
        description: "Invalid input",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        description: "Property not found",
      },
    },
  }),
  async (c) => {
    try {
      const { id: propertyId } = c.req.valid("param");
      const updateData = c.req.valid("json");

      // Validate property exists
      const existingProperty = await findPropertyById(propertyId);
      if (!existingProperty) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Property not found",
        });
      }

      // Handle geocoding if address is being updated
      let latitude = updateData.latitude ?? existingProperty.latitude;
      let longitude = updateData.longitude ?? existingProperty.longitude;
      let formattedAddress = updateData.address ?? existingProperty.address;

      if (updateData.address && updateData.address !== existingProperty.address) {
        const geocodingResult = await geocodeAddressWithFallback(updateData.address);
        if (!geocodingResult.success || !geocodingResult.latitude || !geocodingResult.longitude) {
          throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
            message: "Failed to geocode the provided address",
            error: geocodingResult.error,
          });
        }
        latitude = geocodingResult.latitude;
        longitude = geocodingResult.longitude;
        formattedAddress = geocodingResult.formattedAddress || updateData.address;
      }

      // Perform the update
      const [updatedProperty] = await safeDbOperation(
        async () => {
          return await db.update(properties)
            .set({
              ...updateData,
              address: formattedAddress,
              latitude,
              longitude,
              updatedAt: new Date(),
            })
            .where(eq(properties.propertyId, propertyId))
            .returning({
              propertyId: properties.propertyId,
              title: properties.title,
              address: properties.address,
              monthlyRent: properties.monthlyRent,
              isAvailable: properties.isAvailable,
              propertyType: properties.propertyType,
              targetUniversity: properties.targetUniversity,
              latitude: properties.latitude,
              longitude: properties.longitude,
            });
        },
        `update property ${propertyId}`
      );

      return c.json({
        message: "Property updated successfully",
        property: updatedProperty,
      }, HttpStatusCodes.OK);
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error("Error updating property:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to update property",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
// Delete property
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "delete",
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
    try {
      const { id } = c.req.valid("param");
      const [deletedProperty] = await db.delete(properties)
        .where(eq(properties.propertyId, id))
        .returning({ id: properties.propertyId });

      if (!deletedProperty) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Property not found",
        });
      }

      return c.json({ message: "Property deleted successfully" }, HttpStatusCodes.OK);
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error("Error deleting property:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Error deleting property",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Nearby properties
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/nearby",
    request: {
      query: z.object({
        lat: z.string().transform(Number).refine((val) => !isNaN(val) && val >= -90 && val <= 90, {
          message: "Latitude must be a number between -90 and 90",
        }),
        lng: z.string().transform(Number).refine((val) => !isNaN(val) && val >= -180 && val <= 180, {
          message: "Longitude must be a number between -180 and 180",
        }),
        radius: z.string().transform(Number).refine((val) => !isNaN(val) && val >= 100 && val <= 100000, {
          message: "Radius must be a number between 100 and 100000 meters",
        }).default("5000"),
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
              })
            ),
          },
        },
        description: "List of nearby properties",
      },
      [HttpStatusCodes.BAD_REQUEST]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
        description: "Invalid input",
      },
    },
  }),
  async (c) => {
    try {
      const { lat, lng, radius } = c.req.valid("query");

      const nearbyProperties = await safeDbOperation(
        async () => {
          return await db.select({
            propertyId: properties.propertyId,
            title: properties.title,
            address: properties.address,
            distance: sql`ST_Distance(location, ST_GeogFromText('POINT(${lng} ${lat})'))`.as('distance'),
          }).from(properties)
            .where(
              and(
                eq(properties.isAvailable, true),
                sql`ST_DWithin(location, ST_GeogFromText('POINT(${lng} ${lat})'), ${radius})`
              )
            )
            .orderBy(sql`distance`)
            .limit(20);
        },
        "fetch nearby properties"
      );

      const formattedProperties = nearbyProperties.map(p => ({
        propertyId: p.propertyId,
        title: p.title,
        address: p.address,
        distance: Number(p.distance),
      }));

      return c.json(formattedProperties, HttpStatusCodes.OK);
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error("Error fetching nearby properties:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to fetch nearby properties",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);


// Count properties
propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/count",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              total: z.number(),
              available: z.number().optional(),
              unavailable: z.number().optional(),
              byType: z.record(z.string(), z.number()).optional(),
            }),
          },
        },
        description: "Returns property counts",
      },
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
        description: "Error fetching property counts",
      },
    },
  }),
  async (c) => {
    try {
      // Fetch total property count
      const [totalResult] = await safeDbOperation(
        () => db.select({ count: sql<number>`count(*)` }).from(properties),
        "count total properties"
      );

      // Fetch counts by availability status
      const availabilityResult = await safeDbOperation(
        () => db
          .select({
            isAvailable: properties.isAvailable,
            count: sql<number>`count(*)`,
          })
          .from(properties)
          .groupBy(properties.isAvailable),
        "count properties by availability"
      );

      // Fetch counts by property type
      const typeResult = await safeDbOperation(
        () => db
          .select({
            propertyType: properties.propertyType,
            count: sql<number>`count(*)`,
          })
          .from(properties)
          .groupBy(properties.propertyType),
        "count properties by type"
      );

      // Transform results
      const byType: Record<string, number> = {};
      typeResult.forEach(row => {
        byType[row.propertyType || 'unknown'] = row.count;
      });

      return c.json({
        total: Number(totalResult?.count || 0),
        available: availabilityResult.find(r => r.isAvailable === true)?.count || 0,
        unavailable: availabilityResult.find(r => r.isAvailable === false)?.count || 0,
        byType,
      }, HttpStatusCodes.OK);
    } catch (error) {
      console.error("Error counting properties:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to count properties",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

propertyRouter.openapi(
  createRoute({
    tags: ["Properties"],
    method: "get",
    path: "/properties/type-stats",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                type: z.string(),
                count: z.number(),
                percentage: z.number(),
              })
            ),
          },
        },
        description: "Property type statistics",
      },
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
        description: "Error fetching property type statistics",
      },
    },
  }),
  async (c) => {
    try {
      // Fetch counts by property type
      const typeResult = await safeDbOperation(
        () => db
          .select({
            propertyType: properties.propertyType,
            count: sql<number>`count(*)::int`,
          })
          .from(properties)
          .groupBy(properties.propertyType),
        "count properties by type"
      );

      // Calculate total properties
      const total = typeResult.reduce((sum, row) => sum + (row.count || 0), 0);

      // Map to the required format with display names and percentages
      const typeMap: Record<string, { display: string; count: number }> = {
        apartment: { display: 'Apartments', count: 0 },
        house: { display: 'Houses', count: 0 },
        shared_room: { display: 'Shared Rooms', count: 0 },
        single_room: { display: 'Single Rooms', count: 0 },
      };

      // Populate counts from query results
      typeResult.forEach(row => {
        if (row.propertyType && typeMap[row.propertyType]) {
          typeMap[row.propertyType].count = row.count || 0;
        }
      });

      // Calculate percentages and format response
      const formattedData = Object.values(typeMap).map(item => ({
        type: item.display,
        count: item.count,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }));

      return c.json(formattedData, HttpStatusCodes.OK);
    } catch (error) {
      console.error("Error fetching property type stats:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to fetch property type statistics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);


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
                address: z.string(),
                monthlyRent: z.number(),
                isAvailable: z.boolean(),
                propertyType: z.string(),
                landlordName: z.string().optional(),
                landlordEmail: z.string().optional(),
                // Add these new fields
                images: z.array(
                  z.object({
                    imageId: z.number(),
                    imageUrl: z.string(),
                    isPrimary: z.boolean(),
                  })
                ).optional(),
                details: z.object({
                  bedrooms: z.number().optional(),
                  bathrooms: z.number().optional(),
                  squareMeters: z.number().optional(),
                  furnished: z.boolean().optional(),
                }).optional(),
                landlord: z.object({
                  userId: z.number(),
                  name: z.string(),
                  email: z.string(),
                  phoneNumber: z.string().optional(),
                }).optional(),
                rating: z.number().optional(),
                inquiries: z.number().optional(),
              })
            ),
          },
        },
        description: "List of properties with full details",
      },
    },
  }),
  async (c) => {
    try {
      const allProperties = await db
        .select({
          propertyId: properties.propertyId,
          title: properties.title,
          description: properties.description,
          address: properties.address,
          monthlyRent: properties.monthlyRent,
          isAvailable: properties.isAvailable,
          propertyType: properties.propertyType,
          landlordName: users.firstName,
          landlordEmail: users.email,
        })
        .from(properties)
        .leftJoin(users, eq(properties.landlordId, users.userId));

      // Enhanced query to include additional data
      const enhancedProperties = await Promise.all(allProperties.map(async prop => {
        // Fetch images
        const images = await db
          .select({
            imageId: propertyImages.imageId,
            imageUrl: propertyImages.imageUrl,
            isPrimary: propertyImages.isPrimary,
          })
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, prop.propertyId));

        // Fetch details
        const [details] = await db
          .select({
            bedrooms: propertyDetails.bedrooms,
            bathrooms: propertyDetails.bathrooms,
            squareMeters: propertyDetails.squareMeters,
            furnished: propertyDetails.furnished,
          })
          .from(propertyDetails)
          .where(eq(propertyDetails.propertyId, prop.propertyId));

        // Fetch landlord info
        const [landlord] = await db
          .select({
            userId: users.userId,
            name: sql`concat(${users.firstName}, ' ', ${users.lastName})`.as('name'),
            email: users.email,
            phoneNumber: users.phoneNumber,
          })
          .from(users)
          .where(eq(users.userId, prop.landlordId));

        // Fetch rating (average review)
        const [ratingResult] = await db
          .select({ avg: sql<number>`coalesce(avg(rating), 0)` })
          .from(reviews)
          .where(eq(reviews.propertyId, prop.propertyId));

        // Fetch inquiry count
        const [inquiryResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(inquiries)
          .where(eq(inquiries.propertyId, prop.propertyId));

        return {
          ...prop,
          images,
          details,
          landlord,
          rating: Number(ratingResult?.avg) || 0,
          inquiries: Number(inquiryResult?.count) || 0,
        };
      }));

      return c.json(enhancedProperties, HttpStatusCodes.OK);
    } catch (error) {
      console.error("Error:", error);
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to fetch properties",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);




export default propertyRouter;