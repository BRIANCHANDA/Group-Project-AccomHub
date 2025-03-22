import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { notifications } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";

const notificationRouter = createRouter();

// Zod Schemas
const NotificationCreateSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  type: z.string().max(50).optional().nullable(),
});

const NotificationResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  type: z.string().nullable().optional(),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});

// Create Notification
notificationRouter.openapi(
  createRoute({
    tags:["Notifications"],
    method: "post",
    path: "/notifications",
    request: {
      body: {
        content: {
          "application/json": { schema: NotificationCreateSchema },
        },
      },
    },
    responses: {
      [HttpStatusCodes.CREATED]: {
        description: "Notification created",
        content: {
          "application/json": { schema: NotificationResponseSchema },
        },
      },
      [HttpStatusCodes.BAD_REQUEST]: {
        description: "Invalid input",
        content: {
          "application/json": { schema: z.object({ message: z.string() }) },
        },
      },
    },
  }),
  async (c) => {
    const data = c.req.valid("json");
    
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          title: data.title,
          content: data.content,
          type: data.type,
        })
        .returning({ 
          id: notifications.notificationId,
          title: notifications.title,
          content: notifications.content,
          type: notifications.type,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        });

      return c.json({
        ...notification,
        createdAt: notification.createdAt.toISOString(),
      }, HttpStatusCodes.CREATED);

    } catch (error) {
      throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
        message: "Invalid user ID or data format",
      });
    }
  }
);

// Get User Notifications
notificationRouter.openapi(
  createRoute({
    tags:["Notifications"],
    method: "get",
    path: "/users/{userId}/notifications",
    request: {
      params: z.object({
        userId: z.string().pipe(z.coerce.number().int().positive()),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        description: "User notifications",
        content: {
          "application/json": {
            schema: z.array(NotificationResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const { userId } = c.req.valid("param");
    
    try {
      const notificationsList = await db
        .select({
          id: notifications.notificationId,
          title: notifications.title,
          content: notifications.content,
          type: notifications.type,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId));

      return c.json(notificationsList.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })));

    } catch (error) {
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to fetch notifications",
      });
    }
  }
);

export default notificationRouter;