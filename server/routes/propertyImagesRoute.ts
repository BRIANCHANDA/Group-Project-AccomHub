import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { db } from "../db";
import { propertyImages } from "../db/schemas/mgh_db";
import { eq } from "drizzle-orm";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const propertyImageRouter = createRouter();

// Zod schema for image upload
const imageUploadSchema = z.object({
  propertyId: z.number(),
  image: z.string(), // Base64 or URL of the image
  isPrimary: z.boolean().optional(),
});

// Upload an image
propertyImageRouter.openapi(
  createRoute({
    tags: ["Property Images"],
    method: "post",
    path: "/property-images",
    request: {
      body: {
        content: {
          "application/json": {
            schema: imageUploadSchema,
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
    const { propertyId, image, isPrimary } = c.req.valid("json");

    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: "property_images",
      });

      // Store in DB
      const [newImage] = await db
        .insert(propertyImages)
        .values({
          propertyId,
          imageUrl: result.secure_url,
          isPrimary: isPrimary ?? false,
        })
        .returning({ imageUrl: propertyImages.imageUrl });

      return c.json(
        {
          message: "Image uploaded successfully",
          imageUrl: newImage.imageUrl,
        },
        HttpStatusCodes.CREATED
      );
    } catch (error) {
      throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
        message: "Failed to upload image",
      });
    }
  }
);

// List images for a property
propertyImageRouter.openapi(
  createRoute({
    tags: ["Property Images"],
    method: "get",
    path: "/property-images/{propertyId}",
    request: {
      params: z.object({
        propertyId: z.string().transform(Number),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                imageId: z.number(),
                imageUrl: z.string(),
                isPrimary: z.boolean(),
                uploadedAt: z.string(),
              })
            ),
          },
        },
        description: "List of images for a property",
      },
    },
  }),
  async (c) => {
    const { propertyId } = c.req.valid("param");

    const images = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId));

    return c.json(images);
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
    const publicId = image.imageUrl.split("/").pop()?.split(".")[0];
    if (publicId) {
      await cloudinary.uploader.destroy(`property_images/${publicId}`);
    }

    // Delete from DB
    await db.delete(propertyImages).where(eq(propertyImages.imageId, imageId));

    return c.json({ message: "Image deleted successfully" });
  }
);

export default propertyImageRouter;
