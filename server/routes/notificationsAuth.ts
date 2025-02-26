import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { notifications } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";

const notificationRouter = createRouter();

// 1. Schema Validation
const NotificationSchema = z.object({
  userId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  type: z.enum(["info", "alert", "reminder"]).optional()
});

// 2. Routes
notificationRouter
  // Create Notification
  .openapi(
    createRoute({
      method: "post",
      path: "/notifications",
      request: {
        body: {
          content: { "application/json": { schema: NotificationSchema } }
        }
      },
      responses: {
        201: {
          description: "Notification created",
          content: {
            "application/json": {
              schema: z.object({
                id: z.number(),
                title: z.string(),
                createdAt: z.string()
              })
            }
          }
        }
      }
    }),
    async (c) => {
      const data = c.req.valid("json");
      const [notification] = await db.insert(notifications)
        .values(data)
        .returning({ 
          id: notifications.notificationId,
          title: notifications.title,
          createdAt: notifications.createdAt
        });

      const formattedNotification = {
        ...notification,
        createdAt: notification.createdAt ? notification.createdAt.toISOString() : new Date().toISOString()
      };

      return c.json(formattedNotification, 201);
    }
  )

  // Get User Notifications
  .openapi(
    createRoute({
      method: "get",
      path: "/users/{id}/notifications",
      request: {
        params: z.object({ id: z.string().transform(Number) })
      },
      responses: {
        200: {
          description: "User notifications",
          content: {
            "application/json": {
              schema: z.array(z.object({
                id: z.number(),
                title: z.string(),
                content: z.string(),
                isRead: z.boolean()
              }))
            }
          }
        }
      }
    }),
    async (c) => {
      const userId = Number(c.req.param("id"));
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId));

      return c.json(userNotifications);
    }
  );

export default notificationRouter;