import { createRoute, z } from "@hono/zod-openapi";
import { eq, and, or, desc, asc, count, sql, isNull, isNotNull, inArray } from "drizzle-orm";
import { messages, users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";

const messageRouter = createRouter();

// ===============================
// SCHEMA DEFINITIONS
// ===============================

const MessageSchema = z.object({
  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
  content: z.string().min(1).max(2000),
  propertyId: z.number().int().positive().optional(),
});

const MessageUpdateSchema = z.object({
  content: z.string().min(1).max(2000),
});

const MessageQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }),
  limit: z.string().optional().default("20").transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 20 : Math.min(num, 100);
  }),
  sortBy: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
  propertyId: z.string().optional().transform((val) => {
    if (!val || val.trim() === "") return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? undefined : num;
  }),
  unreadOnly: z.string().optional().transform((val) => val === "true"),
});

const ConversationQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }),
  limit: z.string().optional().default("10").transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 10 : Math.min(num, 50);
  }),
});

const MessageResponseSchema = z.object({
  id: z.number(),
  content: z.string(),
  senderId: z.number(),
  receiverId: z.number(),
  propertyId: z.number().nullable(),
  isRead: z.boolean(),
  isEdited: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  sender: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
  }),
  receiver: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
  }),
});

const ConversationResponseSchema = z.object({
  participantId: z.number(),
  participantName: z.string(),
  lastMessage: z.object({
    id: z.number(),
    content: z.string(),
    createdAt: z.string(),
    isRead: z.boolean(),
  }),
  unreadCount: z.number(),
});

const ErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
});

// ===============================
// HELPER FUNCTIONS
// ===============================

const getCurrentTimestamp = () => {
  return new Date(); // Return Date object for Drizzle
};

const validateUserId = (id) => {
  const num = parseInt(id, 10);
  if (isNaN(num) || num <= 0) {
    throw new Error(`Invalid user ID: ${id}`);
  }
  return num;
};
// ===============================
// MESSAGE ROUTES
// ===============================

messageRouter
  // 1. Send Message - FIXED
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
          description: "Message sent successfully",
          content: {
            "application/json": { schema: MessageResponseSchema },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
        404: {
          description: "Sender or receiver not found",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
      },
    }),
    async (c) => {
      try {
        const data = c.req.valid("json");
        
        console.log("Sending message with data:", data);

        // Step 1: Verify sender and receiver exist
        const [senderExists, receiverExists] = await Promise.all([
          db.select({ userId: users.userId }).from(users).where(eq(users.userId, data.senderId)).limit(1),
          db.select({ userId: users.userId }).from(users).where(eq(users.userId, data.receiverId)).limit(1),
        ]);

        if (!senderExists.length || !receiverExists.length) {
          return c.json({ error: "NOT_FOUND", message: "Sender or receiver not found" }, 404);
        }

        // Step 2: Insert message with proper timestamp handling
        const currentTime = getCurrentTimestamp(); // Returns Date object
        const insertData = {
          senderId: data.senderId,
          receiverId: data.receiverId,
          content: data.content,
          propertyId: data.propertyId || null,
          createdAt: currentTime, // Date object
          updatedAt: null,
          isRead: false,
          isEdited: false,
        };

        console.log("Inserting message with data:", insertData);

        const [insertedMessage] = await db
          .insert(messages)
          .values(insertData)
          .returning();

        console.log("Message inserted:", insertedMessage);

        // Step 3: Get user details separately
        const [senderDetails, receiverDetails] = await Promise.all([
          db.select().from(users).where(eq(users.userId, data.senderId)).limit(1),
          db.select().from(users).where(eq(users.userId, data.receiverId)).limit(1),
        ]);

        // Step 4: Construct the response
        const fullMessage = {
          id: insertedMessage.messageId,
          content: insertedMessage.content,
          senderId: insertedMessage.senderId,
          receiverId: insertedMessage.receiverId,
          propertyId: insertedMessage.propertyId,
          isRead: insertedMessage.isRead,
          isEdited: insertedMessage.isEdited,
          // Convert Date objects to ISO strings for response
          createdAt: insertedMessage.createdAt.toISOString(),
          updatedAt: insertedMessage.updatedAt?.toISOString() || null,
          sender: {
            id: senderDetails[0].userId,
            firstName: senderDetails[0].firstName,
            lastName: senderDetails[0].lastName,
          },
          receiver: {
            id: receiverDetails[0].userId,
            firstName: receiverDetails[0].firstName,
            lastName: receiverDetails[0].lastName,
          },
        };

        return c.json(fullMessage, 201);
      } catch (error) {
        console.error("Detailed error sending message:", error);
        console.error("Error stack:", error.stack);
        return c.json({ 
          error: "INTERNAL_ERROR", 
          message: "Failed to send message",
          details: error.message 
        }, 500);
      }
    }
  )

  // 2. Get Messages Between Two Users (Conversation) - FIXED
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "get",
      path: "/messages/conversation/{userId1}/{userId2}",
      request: {
        params: z.object({
          userId1: z.string().transform((val) => validateUserId(val)),
          userId2: z.string().transform((val) => validateUserId(val)),
        }),
        query: MessageQuerySchema,
      },
      responses: {
        200: {
          description: "Conversation messages",
          content: {
            "application/json": {
              schema: z.object({
                messages: z.array(MessageResponseSchema),
                pagination: z.object({
                  page: z.number(),
                  limit: z.number(),
                  total: z.number(),
                  totalPages: z.number(),
                }),
              }),
            },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
      },
    }),
    async (c) => {
      try {
        const { userId1, userId2 } = c.req.valid("param");
        const { page, limit, sortBy, sortOrder, search, propertyId, unreadOnly } = c.req.valid("query");

        console.log("Fetching conversation between users:", userId1, userId2);
        console.log("Query params:", { page, limit, sortBy, sortOrder, search, propertyId, unreadOnly });
        
        const offset = (page - 1) * limit;

        // Step 1: Build base conditions for conversation
        const conversationCondition = or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        );

        // Step 2: Add additional filters
        let whereConditions = [conversationCondition];

        if (search && search.trim()) {
          whereConditions.push(sql`LOWER(${messages.content}) LIKE LOWER(${`%${search.trim()}%`})`);
        }

        if (propertyId !== undefined) {
          whereConditions.push(eq(messages.propertyId, propertyId));
        }

        if (unreadOnly) {
          whereConditions.push(eq(messages.isRead, false));
        }

        const finalWhereCondition = whereConditions.length > 1 ? and(...whereConditions) : conversationCondition;

        // Step 3: Get total count first
        const totalCountResult = await db
          .select({ count: count() })
          .from(messages)
          .where(finalWhereCondition);

        const totalCount = totalCountResult[0]?.count || 0;

        // Step 4: Get messages
        const messageResults = await db
          .select()
          .from(messages)
          .where(finalWhereCondition)
          .orderBy(sortOrder === "asc" ? asc(messages[sortBy]) : desc(messages[sortBy]))
          .limit(limit)
          .offset(offset);

        // Step 5: Get unique user IDs and fetch user details
        const userIds = [...new Set([
          ...messageResults.map(m => m.senderId),
          ...messageResults.map(m => m.receiverId)
        ])];

        if (userIds.length === 0) {
          return c.json({
            messages: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          });
        }

        const userDetails = await db
          .select()
          .from(users)
          .where(inArray(users.userId, userIds));

        // Step 6: Create a user lookup map
        const userMap = new Map(userDetails.map(user => [user.userId, user]));

        // Step 7: Construct final response
        const conversationMessages = messageResults.map(message => {
          const sender = userMap.get(message.senderId);
          const receiver = userMap.get(message.receiverId);

          return {
            id: message.messageId,
            content: message.content,
            senderId: message.senderId,
            receiverId: message.receiverId,
            propertyId: message.propertyId,
            isRead: message.isRead,
            isEdited: message.isEdited,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            sender: {
              id: sender?.userId || message.senderId,
              firstName: sender?.firstName || "Unknown",
              lastName: sender?.lastName || "User",
            },
            receiver: {
              id: receiver?.userId || message.receiverId,
              firstName: receiver?.firstName || "Unknown",
              lastName: receiver?.lastName || "User",
            },
          };
        });

        return c.json({
          messages: conversationMessages,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        });
      } catch (error) {
        console.error("Detailed error fetching conversation:", error);
        console.error("Error stack:", error.stack);
        
        // Handle specific validation errors
        if (error.message.includes("Invalid user ID")) {
          return c.json({ 
            error: "BAD_REQUEST", 
            message: error.message 
          }, 400);
        }
        
        return c.json({ 
          error: "INTERNAL_ERROR", 
          message: "Failed to fetch conversation",
          details: error.message 
        }, 500);
      }
    }
  )

  // 3. Get User's All Conversations - UPDATED
.openapi(
  createRoute({
    tags: ["Messages"],
    method: "get",
    path: "/users/{userId}/conversations",
    request: {
      params: z.object({ 
        userId: z.string().transform((val) => validateUserId(val))
      }),
      query: ConversationQuerySchema,
    },
    responses: {
      200: {
        description: "User conversations",
        content: {
          "application/json": {
            schema: z.object({
              conversations: z.array(ConversationResponseSchema),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": { schema: ErrorSchema },
        },
      },
    },
  }),
  async (c) => {
    try {
      const userId = c.req.valid("param").userId;
      const { page, limit } = c.req.valid("query");
      const offset = (page - 1) * limit;

      console.log("Fetching conversations for user:", userId);

      // Get all distinct conversation partners
      const conversationPartnersQuery = await db
        .select({
          participantId: sql<number>`
            CASE 
              WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} 
              ELSE ${messages.senderId} 
            END
          `.as('participant_id'),
          lastMessageTime: sql<string>`MAX(${messages.createdAt})`.as('last_message_time')
        })
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
        .groupBy(sql`participant_id`)
        .orderBy(desc(sql`last_message_time`))
        .limit(limit)
        .offset(offset);

      console.log("Found conversation partners:", conversationPartnersQuery);

      if (conversationPartnersQuery.length === 0) {
        return c.json({
          conversations: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      // Get conversation details for each partner
      const conversations = await Promise.all(
        conversationPartnersQuery.map(async (partner) => {
          // Get the last message with sender details
          const lastMessageQuery = await db
            .select({
              id: messages.messageId,
              content: messages.content,
              createdAt: messages.createdAt,
              isRead: messages.isRead,
              senderId: users.userId,
              senderFirstName: users.firstName,
              senderLastName: users.lastName,
            })
            .from(messages)
            .innerJoin(users, eq(users.userId, messages.senderId))
            .where(
              or(
                and(eq(messages.senderId, userId), eq(messages.receiverId, partner.participantId)),
                and(eq(messages.senderId, partner.participantId), eq(messages.receiverId, userId))
              )
            )
            .orderBy(desc(messages.createdAt))
            .limit(1);

          const lastMessage = lastMessageQuery[0];

          // Get unread count (messages sent TO the user that are unread)
          const [unreadResult] = await db
            .select({ count: count() })
            .from(messages)
            .where(
              and(
                eq(messages.senderId, partner.participantId),
                eq(messages.receiverId, userId),
                eq(messages.isRead, false)
              )
            );

          // Get participant details
          const [participant] = await db
            .select({
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.userId, partner.participantId));

          return {
            participantId: partner.participantId,
            participantName: participant ? `${participant.firstName} ${participant.lastName}` : "Unknown User",
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              isRead: lastMessage.isRead,
              // Add sender information
              sender: {
                id: lastMessage.senderId,
                firstName: lastMessage.senderFirstName,
                lastName: lastMessage.senderLastName,
              },
            } : {
              id: 0,
              content: "No messages yet",
              createdAt: new Date().toISOString(),
              isRead: true,
              sender: {
                id: 0,
                firstName: "System",
                lastName: "",
              },
            },
            unreadCount: unreadResult?.count || 0,
          };
        })
      );

      // Get total count of unique conversations
      const totalConversationsResult = await db
        .select({
          count: sql<number>`COUNT(DISTINCT CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END)`.as('count')
        })
        .from(messages)
        .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));

      const totalConversations = totalConversationsResult[0]?.count || 0;

      return c.json({
        conversations,
        pagination: {
          page,
          limit,
          total: totalConversations,
          totalPages: Math.ceil(totalConversations / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      console.error("Error stack:", error.stack);
      
      // Handle specific validation errors
      if (error.message.includes("Invalid user ID")) {
        return c.json({ 
          error: "BAD_REQUEST", 
          message: error.message 
        }, 400);
      }
      
      return c.json({ 
        error: "INTERNAL_ERROR", 
        message: "Failed to fetch conversations",
        details: error.message 
      }, 500);
    }
  }
)

  // 4. Get Single Message - SIMPLIFIED
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "get",
      path: "/messages/{messageId}",
      request: {
        params: z.object({ 
          messageId: z.string().transform((val) => {
            const num = parseInt(val, 10);
            if (isNaN(num) || num <= 0) {
              throw new Error(`Invalid message ID: ${val}`);
            }
            return num;
          })
        }),
      },
      responses: {
        200: {
          description: "Message details",
          content: {
            "application/json": { schema: MessageResponseSchema },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
        404: {
          description: "Message not found",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
      },
    }),
    async (c) => {
      try {
        const messageId = c.req.valid("param").messageId;

        // Get message first
        const [message] = await db
          .select()
          .from(messages)
          .where(eq(messages.messageId, messageId))
          .limit(1);

        if (!message) {
          return c.json({ error: "NOT_FOUND", message: "Message not found" }, 404);
        }

        // Get user details
        const [senderDetails, receiverDetails] = await Promise.all([
          db.select().from(users).where(eq(users.userId, message.senderId)).limit(1),
          db.select().from(users).where(eq(users.userId, message.receiverId)).limit(1),
        ]);

        const fullMessage = {
          id: message.messageId,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          propertyId: message.propertyId,
          isRead: message.isRead,
          isEdited: message.isEdited,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          sender: {
            id: senderDetails[0]?.userId || message.senderId,
            firstName: senderDetails[0]?.firstName || "Unknown",
            lastName: senderDetails[0]?.lastName || "User",
          },
          receiver: {
            id: receiverDetails[0]?.userId || message.receiverId,
            firstName: receiverDetails[0]?.firstName || "Unknown",
            lastName: receiverDetails[0]?.lastName || "User",
          },
        };

        return c.json(fullMessage);
      } catch (error) {
        console.error("Error fetching message:", error);
        
        if (error.message.includes("Invalid message ID")) {
          return c.json({ 
            error: "BAD_REQUEST", 
            message: error.message 
          }, 400);
        }
        
        return c.json({ 
          error: "INTERNAL_ERROR", 
          message: "Failed to fetch message",
          details: error.message 
        }, 500);
      }
    }
  )

  // 5. Update Message (Edit) - SIMPLIFIED
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "put",
      path: "/messages/{messageId}",
      request: {
        params: z.object({ 
          messageId: z.string().transform((val) => {
            const num = parseInt(val, 10);
            if (isNaN(num) || num <= 0) {
              throw new Error(`Invalid message ID: ${val}`);
            }
            return num;
          })
        }),
        body: {
          content: { "application/json": { schema: MessageUpdateSchema } },
        },
      },
      responses: {
        200: {
          description: "Message updated successfully",
          content: {
            "application/json": { schema: MessageResponseSchema },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
        404: {
          description: "Message not found",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
      },
    }),
    async (c) => {
      try {
        const messageId = c.req.valid("param").messageId;
        const { content } = c.req.valid("json");

        const [updatedMessage] = await db
          .update(messages)
          .set({
            content,
            isEdited: true,
            updatedAt: getCurrentTimestamp(),
          })
          .where(eq(messages.messageId, messageId))
          .returning();

        if (!updatedMessage) {
          return c.json({ error: "NOT_FOUND", message: "Message not found" }, 404);
        }

        // Get user details
        const [senderDetails, receiverDetails] = await Promise.all([
          db.select().from(users).where(eq(users.userId, updatedMessage.senderId)).limit(1),
          db.select().from(users).where(eq(users.userId, updatedMessage.receiverId)).limit(1),
        ]);

        const fullMessage = {
          id: updatedMessage.messageId,
          content: updatedMessage.content,
          senderId: updatedMessage.senderId,
          receiverId: updatedMessage.receiverId,
          propertyId: updatedMessage.propertyId,
          isRead: updatedMessage.isRead,
          isEdited: updatedMessage.isEdited,
          createdAt: updatedMessage.createdAt,
          updatedAt: updatedMessage.updatedAt,
          sender: {
            id: senderDetails[0]?.userId || updatedMessage.senderId,
            firstName: senderDetails[0]?.firstName || "Unknown",
            lastName: senderDetails[0]?.lastName || "User",
          },
          receiver: {
            id: receiverDetails[0]?.userId || updatedMessage.receiverId,
            firstName: receiverDetails[0]?.firstName || "Unknown",
            lastName: receiverDetails[0]?.lastName || "User",
          },
        };

        return c.json(fullMessage);
      } catch (error) {
        console.error("Error updating message:", error);
        
        if (error.message.includes("Invalid message ID")) {
          return c.json({ 
            error: "BAD_REQUEST", 
            message: error.message 
          }, 400);
        }
        
        return c.json({ 
          error: "INTERNAL_ERROR", 
          message: "Failed to update message",
          details: error.message 
        }, 500);
      }
    }
  )

  // Rest of the routes remain the same but with improved error handling...
  // 6. Delete Message
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "delete",
      path: "/messages/{messageId}",
      request: {
        params: z.object({ 
          messageId: z.string().transform((val) => {
            const num = parseInt(val, 10);
            if (isNaN(num) || num <= 0) {
              throw new Error(`Invalid message ID: ${val}`);
            }
            return num;
          })
        }),
      },
      responses: {
        204: {
          description: "Message deleted successfully",
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
        404: {
          description: "Message not found",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
      },
    }),
    async (c) => {
      try {
        const messageId = c.req.valid("param").messageId;

        const result = await db
          .delete(messages)
          .where(eq(messages.messageId, messageId))
          .returning({ id: messages.messageId });

        if (!result.length) {
          return c.json({ error: "NOT_FOUND", message: "Message not found" }, 404);
        }

        return c.body(null, 204);
      } catch (error) {
        console.error("Error deleting message:", error);
        
        if (error.message.includes("Invalid message ID")) {
          return c.json({ 
            error: "BAD_REQUEST", 
            message: error.message 
          }, 400);
        }
        
        return c.json({ 
          error: "INTERNAL_ERROR", 
          message: "Failed to delete message",
          details: error.message 
        }, 500);
      }
    }
  )

  // 7. Mark Message as Read
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "patch",
      path: "/messages/{messageId}/read",
      request: {
        params: z.object({ 
          messageId: z.string().transform((val) => {
            const num = parseInt(val, 10);
            if (isNaN(num) || num <= 0) {
              throw new Error(`Invalid message ID: ${val}`);
            }
            return num;
          })
        }),
      },
      responses: {
        200: {
          description: "Message marked as read",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                messageId: z.number(),
              }),
            },
          },
        },
        400: {
          description: "Bad request",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
        404: {
          description: "Message not found",
          content: {
            "application/json": { schema: ErrorSchema },
          },
        },
      },
    }),
    async (c) => {
      try {
        const messageId = c.req.valid("param").messageId;

        const [updatedMessage] = await db
          .update(messages)
          .set({ isRead: true })
          .where(eq(messages.messageId, messageId))
          .returning({ id: messages.messageId });

        if (!updatedMessage) {
          return c.json({ error: "NOT_FOUND", message: "Message not found" }, 404);
        }

        return c.json({ success: true, messageId });
      } catch (error) {
        console.error("Error marking message as read:", error);
        
        if (error.message.includes("Invalid message ID")) {
          return c.json({ 
            error: "BAD_REQUEST", 
            message: error.message 
          }, 400);
        }
        
        return c.json({ 
          error: "INTERNAL_ERROR", 
          message: "Failed to mark message as read",
          details: error.message 
        }, 500);
      }
    }
  )

  // 8. Mark All Messages as Read (for a conversation)
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "patch",
      path: "/messages/conversation/{userId1}/{userId2}/read",
      request: {
        params: z.object({
          userId1: z.string().transform(Number),
          userId2: z.string().transform(Number),
        }),
      },
      responses: {
        200: {
          description: "Messages marked as read",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                markedCount: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const { userId1, userId2 } = c.req.valid("param");

        const result = await db
          .update(messages)
          .set({ isRead: true })
          .where(
            and(
              or(
                and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
                and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
              ),
              eq(messages.isRead, false)
            )
          )
          .returning({ id: messages.messageId });

        return c.json({ success: true, markedCount: result.length });
      } catch (error) {
        console.error("Error marking conversation as read:", error);
        return c.json({ error: "INTERNAL_ERROR", message: "Failed to mark conversation as read" }, 500);
      }
    }
  )

  // 9. Get Unread Messages Count
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "get",
      path: "/users/{userId}/messages/unread/count",
      request: {
        params: z.object({ userId: z.string().transform(Number) }),
      },
      responses: {
        200: {
          description: "Unread messages count",
          content: {
            "application/json": {
              schema: z.object({
                unreadCount: z.number(),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const userId = c.req.valid("param").userId;

        const [result] = await db
          .select({ count: count() })
          .from(messages)
          .where(and(eq(messages.receiverId, userId), eq(messages.isRead, false)));

        return c.json({ unreadCount: result.count });
      } catch (error) {
        console.error("Error fetching unread count:", error);
        return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch unread count" }, 500);
      }
    }
  )

  // 10. Search Messages
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "get",
      path: "/messages/search",
      request: {
        query: z.object({
          q: z.string().min(1),
          userId: z.string().transform(Number).optional(),
          page: z.string().optional().default("1").transform(Number),
          limit: z.string().optional().default("20").transform(Number),
        }),
      },
      responses: {
        200: {
          description: "Search results",
          content: {
            "application/json": {
              schema: z.object({
                messages: z.array(MessageResponseSchema),
                pagination: z.object({
                  page: z.number(),
                  limit: z.number(),
                  total: z.number(),
                  totalPages: z.number(),
                }),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const { q, userId, page, limit } = c.req.valid("query");
        const offset = (page - 1) * limit;

        let whereConditions = [sql`${messages.content} ILIKE ${`%${q}%`}`];
        
        if (userId) {
          whereConditions.push(
            or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
          );
        }

        const whereCondition = and(...whereConditions);

        const [searchResults, totalCount] = await Promise.all([
          db
            .select({
              id: messages.messageId,
              content: messages.content,
              senderId: messages.senderId,
              receiverId: messages.receiverId,
              propertyId: messages.propertyId,
              isRead: messages.isRead,
              isEdited: messages.isEdited,
              createdAt: messages.createdAt,
              updatedAt: messages.updatedAt,
              sender: {
                id: sql<number>`sender.user_id`,
                firstName: sql<string>`sender.first_name`,
                lastName: sql<string>`sender.last_name`,
              },
              receiver: {
                id: sql<number>`receiver.user_id`,
                firstName: sql<string>`receiver.first_name`,
                lastName: sql<string>`receiver.last_name`,
              },
            })
            .from(messages)
            .innerJoin(sql`${users} as sender`, sql`sender.user_id = ${messages.senderId}`)
            .innerJoin(sql`${users} as receiver`, sql`receiver.user_id = ${messages.receiverId}`)
            .where(whereCondition)
            .orderBy(desc(messages.createdAt))
            .limit(limit)
            .offset(offset),
          
          db
            .select({ count: count() })
            .from(messages)
            .where(whereCondition)
            .then(result => result[0].count)
        ]);

        return c.json({
          messages: searchResults,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        });
      } catch (error) {
        console.error("Error searching messages:", error);
        return c.json({ error: "INTERNAL_ERROR", message: "Failed to search messages" }, 500);
      }
    }
  )

  // 11. Get Messages by Property
  .openapi(
    createRoute({
      tags: ["Messages"],
      method: "get",
      path: "/properties/{propertyId}/messages",
      request: {
        params: z.object({ propertyId: z.string().transform(Number) }),
        query: MessageQuerySchema,
      },
      responses: {
        200: {
          description: "Property messages",
          content: {
            "application/json": {
              schema: z.object({
                messages: z.array(MessageResponseSchema),
                pagination: z.object({
                  page: z.number(),
                  limit: z.number(),
                  total: z.number(),
                  totalPages: z.number(),
                }),
              }),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const propertyId = c.req.valid("param").propertyId;
        const { page, limit, sortBy, sortOrder } = c.req.valid("query");
        const offset = (page - 1) * limit;

        const [propertyMessages, totalCount] = await Promise.all([
          db
            .select({
              id: messages.messageId,
              content: messages.content,
              senderId: messages.senderId,
              receiverId: messages.receiverId,
              propertyId: messages.propertyId,
              isRead: messages.isRead,
              isEdited: messages.isEdited,
              createdAt: messages.createdAt,
              updatedAt: messages.updatedAt,
              sender: {
                id: sql<number>`sender.user_id`,
                firstName: sql<string>`sender.first_name`,
                lastName: sql<string>`sender.last_name`,
              },
              receiver: {
                id: sql<number>`receiver.user_id`,
                firstName: sql<string>`receiver.first_name`,
                lastName: sql<string>`receiver.last_name`,
              },
            })
            .from(messages)
            .innerJoin(sql`${users} as sender`, sql`sender.user_id = ${messages.senderId}`)
            .innerJoin(sql`${users} as receiver`, sql`receiver.user_id = ${messages.receiverId}`)
            .where(eq(messages.propertyId, propertyId))
            .orderBy(sortOrder === "asc" ? asc(messages[sortBy]) : desc(messages[sortBy]))
            .limit(limit)
            .offset(offset),
          
          db
            .select({ count: count() })
            .from(messages)
            .where(eq(messages.propertyId, propertyId))
            .then(result => result[0].count)
        ]);

        return c.json({
          messages: propertyMessages,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        });
      } catch (error) {
        console.error("Error fetching property messages:", error);
        return c.json({ error: "INTERNAL_ERROR", message: "Failed to fetch property messages" }, 500);
      }
    }
  );

export default messageRouter;