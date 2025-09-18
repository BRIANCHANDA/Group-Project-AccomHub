import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import { propertyImages, properties, propertyDetails } from "../db/schemas/mgh_db";
import  { FormData } from "@types/node-fetch";
import { eq } from "drizzle-orm";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS
  api_proxy: process.env.CLOUDINARY_PROXY
});

const propertyImageRouter = createRouter();

// Function to convert file to base64
async function fileToBase64(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Error converting file to base64:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to convert file to base64: ${errorMessage}`);
  }
}

// Detailed inspection of the file object
function inspectFile(file: any): string {
  try {
    const inspectionDetails = {
      constructor: file.constructor ? file.constructor.name : "unknown",
      isFile: file instanceof File,
      prototype: Object.getPrototypeOf(file) ? Object.getPrototypeOf(file).constructor.name : "unknown",
      keys: Object.keys(file),
      type: typeof file,
      properties: {} as { [key: string]: any },
    };

    // Try to safely inspect common File properties
    if (file) {
      try { inspectionDetails.properties["name"] = file.name; } catch (e) {}
      try { inspectionDetails.properties["size"] = file.size; } catch (e) {}
      try { inspectionDetails.properties["type"] = file.type; } catch (e) {}
      try { inspectionDetails.properties["lastModified"] = file.lastModified; } catch (e) {}
      
      // Check for Blob properties
      try { inspectionDetails.properties["isBlob"] = file instanceof Blob; } catch (e) {}
      
      // Try methods
      try { inspectionDetails.properties["hasArrayBuffer"] = typeof file.arrayBuffer === 'function'; } catch (e) {}
      try { inspectionDetails.properties["hasText"] = typeof file.text === 'function'; } catch (e) {}
      try { inspectionDetails.properties["hasStream"] = typeof file.stream === 'function'; } catch (e) {}
    }

    return JSON.stringify(inspectionDetails, null, 2);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `Error inspecting file: ${errorMessage}`;
  }
}

// Upload an image
propertyImageRouter.openapi(
  createRoute({
    tags: ["Property Images"],
    method: "post",
    path: "/property-images",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              propertyId: z.string().transform((val) => parseInt(val, 10)),
              image: z.any(), // File upload
              isPrimary: z.string().optional().transform((val) => val === "true"),
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
              imageUrl: z.string(),
            }),
          },
        },
        description: "Image uploaded successfully",
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
    try {
      console.log("Starting image upload process");
      
      // Get form data
      const formData = await c.req.formData();
      console.log("Form data keys received:", Array.from(formData.entries()).map(([key]) => key));
      
     
      console.log("Request content type:", c.req.header("content-type"));
      console.log("Request method:", c.req.method);
      
      // Extract and validate the form data
      const propertyIdStr = formData.get("propertyId");
      console.log("Property ID (raw):", propertyIdStr);
      
      if (!propertyIdStr || typeof propertyIdStr !== 'string') {
        throw new Error("propertyId is missing or not a string");
      }
      
      const propertyId = parseInt(propertyIdStr, 10);
      console.log("Property ID (parsed):", propertyId);
      
      if (isNaN(propertyId)) {
        throw new Error("propertyId is not a valid number");
      }
      
      // Get the image file and inspect it in detail
      const imageFile = formData.get("image");
      console.log("Image file exists:", !!imageFile);
      
      if (!imageFile) {
        throw new Error("image file is missing from form data");
      }
      
      // Detailed inspection of the image file object
      console.log("Image file detailed inspection:");
      console.log(inspectFile(imageFile));
      
      // Check if we can process it as a File
      let isFileOrBlob = false;
      try {
        isFileOrBlob = imageFile instanceof File || imageFile instanceof Blob;
        console.log("Is File or Blob:", isFileOrBlob);
      } catch (e) {
        console.error("Error checking if file is File or Blob:", e);
      }
      
      if (!isFileOrBlob) {
        // Try to determine what type of object we're dealing with
        console.log("Image is not a File or Blob. Attempting to identify...");
        try {
          if (typeof imageFile === 'string') {
            console.log("Image appears to be a string, length:", imageFile.length);
            // Check if it looks like base64
            if (imageFile.startsWith('data:')) {
              console.log("Image appears to be a base64 string already");
            }
          } else if (Buffer.isBuffer(imageFile)) {
            console.log("Image appears to be a Buffer, length:", imageFile.length);
          } else {
            console.log("Image is an unknown type:", typeof imageFile);
          }
        } catch (e) {
          console.error("Error identifying image type:", e);
        }
      }
      
      const isPrimaryStr = formData.get("isPrimary");
      console.log("isPrimary (raw):", isPrimaryStr);
      const isPrimary = isPrimaryStr === "true";
      
      // Process the image based on its type
      let base64Image;
      console.log("Processing image based on type...");
      
      if (imageFile instanceof File) {
        console.log("Processing as File...");
        base64Image = await fileToBase64(imageFile);
      } else if (imageFile instanceof Blob) {
        console.log("Processing as Blob...");
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64Image = `data:${imageFile.type || 'application/octet-stream'};base64,${buffer.toString("base64")}`;
      } else if (typeof imageFile === 'string' && imageFile.startsWith('data:')) {
        console.log("Using provided base64 string directly");
        base64Image = imageFile;
      } else if (Buffer.isBuffer(imageFile)) {
        console.log("Processing as Buffer...");
        base64Image = `data:application/octet-stream;base64,${imageFile.toString("base64")}`;
      } else {
        throw new Error(`Unsupported image type: ${typeof imageFile}`);
      }
      
      console.log(`Processed image size: ${Math.round(base64Image.length / 1024)} KB`);

      // Verify Cloudinary configuration
      console.log("Cloudinary config check:", {
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
      });
      
      // Upload to Cloudinary
      
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: "property_images",
      });
      console.log("Cloudinary upload result:", result.secure_url);

      // Store in DB
      console.log("Storing in database...");
      const [newImage] = await db
        .insert(propertyImages)
        .values({
          propertyId,
          imageUrl: result.secure_url,
          isPrimary: isPrimary ?? false,
        })
        .returning({ imageUrl: propertyImages.imageUrl });
      console.log("Database insert complete:", newImage);

      return c.json(
        {
          message: "Image uploaded successfully",
          imageUrl: newImage.imageUrl,
        },
        HttpStatusCodes.CREATED
      );
    } catch (error) {
      console.error("Image upload error:", error);
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
      
      // Provide a more specific error message
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message || "Unknown error";
      }
      
      throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
        message: `Failed to upload image: ${errorMessage}`,
      });
    }
  }
);

//get images based on their landlordId and priopoerty id
propertyImageRouter.openapi(
  createRoute({
    tags: ["Property Images"],
    method: "get",
    path: "/landlords/{landlordId}/properties",
    request: {
      params: z.object({
        landlordId: z.string().transform(Number),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              landlordName: z.string().optional(),
              properties: z.array(
                z.object({
                  id: z.number(),
                  title: z.string().optional(),
                  description: z.string().optional(),
                  location: z.string(),
                  price: z.string(),
                  status: z.string().optional(),
                  inquiries: z.number().optional(),
                  imageUrl: z.string().nullable(),
                  propertyType: z.string().optional(),
                  details: z.object({
                    bedrooms: z.number().optional(),
                    bathrooms: z.number().optional(),
                    furnished: z.boolean().optional(),
                    squareMeters: z.number().optional(),
                    amenities: z.array(z.string()).optional(),
                    rules: z.array(z.string()).optional()
                  }).optional()
                })
              ),
            }),
          },
        },
        description: "List of properties with primary images and details for a landlord",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "No properties found for this landlord",
      },
    },
  }),
  async (c) => {
    try {
      console.log("Starting to fetch landlord properties");
      const { landlordId } = c.req.valid("param");
      console.log(`LandlordId: ${landlordId}`);

      if (!landlordId || isNaN(landlordId)) {
        console.error("Invalid landlordId:", landlordId);
        throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
          message: "Invalid landlord ID",
        });
      }

      // First, get all properties for this landlord
      console.log("Fetching properties for landlord:", landlordId);
      const landlordProperties = await db
        .select()
        .from(properties)
        .where(eq(properties.landlordId, landlordId));

      console.log(`Found ${landlordProperties.length} properties`);

      if (landlordProperties.length === 0) {
        // Return empty array instead of returning undefined
        return c.json({
          landlordName: "Landlord",
          properties: [],
        }, HttpStatusCodes.OK);
      }

      // Create a result array that matches what the frontend expects
      const propertiesWithImagesAndDetails = [];

      // For each property, get its primary image (or any image if no primary) and details
      for (const property of landlordProperties) {
        try {
          console.log(`Processing property ID: ${property.propertyId}`);
          
          // Get primary image first, fallback to any image
          console.log("Fetching images for property");
          let propertyImagesResult: string | any[] = [];
          try {
            propertyImagesResult = await db
              .select()
              .from(propertyImages)
              .where(eq(propertyImages.propertyId, property.propertyId))
              .orderBy((columns) => [
                { column: columns.isPrimary, order: "desc" }, // Primary images first
                { column: columns.uploadedAt, order: "desc" } // Then most recent
              ])
              .limit(1);
            console.log(`Found ${propertyImagesResult.length} images`);
          } catch (imageError) {
            console.error("Error fetching property images:", imageError);
            // Continue without images
          }

          // Get property details
          console.log("Fetching details for property");
          let propertyDetailsResult: string | any[] = [];
          try {
            propertyDetailsResult = await db
              .select()
              .from(propertyDetails)
              .where(eq(propertyDetails.propertyId, property.propertyId))
              .limit(1);
            console.log(`Found ${propertyDetailsResult.length} detail records`);
          } catch (detailsError) {
            console.error("Error fetching property details:", detailsError);
            // Continue without details
          }

          // Format property details - with safe handling of possibly undefined values
          let details;
          if (propertyDetailsResult.length > 0) {
            const detailRecord = propertyDetailsResult[0];
            details = {
              bedrooms: detailRecord.bedrooms ?? undefined,
              bathrooms: detailRecord.bathrooms ?? undefined,
              furnished: detailRecord.furnished ?? undefined,
              squareMeters: detailRecord.squareMeters ? Number(detailRecord.squareMeters) : undefined,
              amenities: Array.isArray(detailRecord.amenities) ? detailRecord.amenities : [],
              rules: Array.isArray(detailRecord.rules) ? detailRecord.rules : []
            };
          }

          // Format the monthly rent safely
          let priceDisplay = "K0";
          if (property.monthlyRent) {
            try {
              const rentValue = property.monthlyRent.toString();
              priceDisplay = `K${rentValue}`;
            } catch (rentError) {
              console.error("Error formatting rent:", rentError);
            }
          }

          // Add property with its primary image and details to the result
          propertiesWithImagesAndDetails.push({
            id: property.propertyId,
            title: property.title || "",
            description: property.description || "",
            location: property.address || "Address not available",
            price: priceDisplay,
            status: property.isAvailable ? "Available" : "Not Available",
            inquiries: property.inquiries || 0,
            imageUrl: propertyImagesResult.length > 0 ? propertyImagesResult[0].imageUrl : null,
            propertyType: property.propertyType || undefined,
            details: details
          });
        } catch (propertyError) {
          console.error(`Error processing property ${property.propertyId}:`, propertyError);
          // Continue with next property
        }
      }

      console.log(`Successfully processed ${propertiesWithImagesAndDetails.length} properties`);

      // Always return a valid response
      return c.json({
        landlordName: "Landlord",
        properties: propertiesWithImagesAndDetails,
      }, HttpStatusCodes.OK);
    } catch (error) {
      console.error("Error fetching landlord properties:", error);
      
      if (error instanceof HTTPException) {
        throw error;
      }
      
      // Provide more detailed error information
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: `Failed to fetch landlord properties: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
);



// Delete an image
propertyImageRouter.openapi(
  createRoute({
    tags: ["Property Images"],
    method: "delete",
    path: "/property-images/{imageId}",
    request: {
      params: z.object({
        imageId: z.string().transform(Number),
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
        description: "Image deleted successfully",
      },
    },
  }),
  async (c) => {
    const { imageId } = c.req.valid("param");

    // Find the image in DB
    const [image] = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.imageId, imageId))
      .limit(1);

    if (!image) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Image not found",
      });
    }

    // Delete from Cloudinary
    try {
      const publicId = image.imageUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`property_images/${publicId}`);
      }
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
      // Continue with DB deletion even if Cloudinary delete fails
    }

    // Delete from DB
    await db.delete(propertyImages).where(eq(propertyImages.imageId, imageId));

    return c.json({ message: "Image deleted successfully" });
  }
);





export default propertyImageRouter;