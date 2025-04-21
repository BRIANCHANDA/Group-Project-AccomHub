import { createRoute, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import { messages, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";

const messageRouter = createRouter();

// 1. Schema Validation
const MessageSchema = z.object({
  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
  propertyId: z.number().int().positive().optional(),
});

// 2. Routes
messageRouter
  // Send Message
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "post",
      path: "/messages",
      request: {
        body: {
          content: { "application/json": { schema: MessageSchema } },
        },
      },
      responses: {
        201: {
          description: "Message sent",
          content: {
            "application/json": {
              schema: z.object({
                id: z.number(),
                content: z.string(),
                createdAt: z.string().nullable(),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      const data = c.req.valid("json");

      const [message] = await db
        .insert(messages)
        .values(data)
        .returning({
          id: messages.messageId,
          content: messages.content,
          createdAt: messages.createdAt,
        });

      return c.json(message, 201);
    }
  )

  // Get User Messages
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "get",
      path: "/users/{id}/messages",
      request: {
        params: z.object({ id: z.string().transform(Number) }),
      },
      responses: {
        200: {
          description: "User messages",
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  id: z.number(),
                  content: z.string(),
                  sender: z.string(),
                  createdAt: z.string().nullable(),
                })
              ),
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = Number(c.req.param("id"));

      const userMessages = await db
        .select({
          id: messages.messageId,
          sender: users.firstName,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .innerJoin(users, eq(users.userId, messages.senderId))
        .where(eq(messages.receiverId, userId));

      return c.json(userMessages);
    }
  );

export default messageRouter;
