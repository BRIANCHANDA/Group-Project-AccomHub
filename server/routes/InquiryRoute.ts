import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { inquiries, notifications } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const inquiryRouter = createRouter();

// Zod schema for inquiry validation
const inquirySchema = z.object({
  propertyId: z.number(),
  studentId: z.number(),
  status: z.enum(["pending", "responded", "closed"]).default("pending"),
  message: z.string().min(1),
  contactPreference: z.enum(["email", "phone", "any"]).default("any"),
});

const updateInquirySchema = inquirySchema.partial();

// Define response status type to be consistent across routes
const inquiryStatusType = z.enum(["pending", "responded", "closed"]).nullable();

// Helper function to find an inquiry by ID
const findInquiryById = async (inquiryId: number) => {
  const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.inquiryId, inquiryId)).limit(1);
  return inquiry;
};

// Helper function to create a notification
const createNotification = async (data: {
  userId: number;
  title: string;
  content: string;
  type?: string | null;
}) => {
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

    return {
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};

// Create a new inquiry with notification
inquiryRouter.openapi(
  createRoute({
    tags: ["Inquiries"],
    method: "post",
    path: "/inquiries",
    request: {
      body: {
        content: {
          "application/json": {
            schema: inquirySchema,
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
              inquiry: z.object({
                inquiryId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: inquiryStatusType.optional(),
                message: z.string(),
                contactPreference: z.string(),
              }),
              notification: z.object({
                id: z.number(),
                title: z.string(),
                content: z.string(),
                type: z.string().nullable().optional(),
                isRead: z.boolean(),
                createdAt: z.string(),
              }).optional().nullable(),
            }),
          },
        },
        description: "Inquiry created successfully with notification",
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
    const inquiryData = c.req.valid("json");

    // Start a transaction to ensure inquiry and notification are created together
    const result = await db.transaction(async (tx) => {
      // Create the inquiry
      const [newInquiry] = await tx
        .insert(inquiries)
        .values(inquiryData)
        .returning({ 
          inquiryId: inquiries.inquiryId, 
          propertyId: inquiries.propertyId, 
          studentId: inquiries.studentId,
          status: inquiries.status,
          message: inquiries.message,
          contactPreference: inquiries.contactPreference
        });

      // Create notification for the student
      const notification = await createNotification({
        userId: inquiryData.studentId,
        title: "Inquiry Submitted",
        content: `Your inquiry for property #${inquiryData.propertyId} has been submitted and is awaiting response.`,
        type: "inquiry_created",
      });

      // TODO: Also create notification for property owner/manager
      // This would require additional information about the property owner

      return { newInquiry, notification };
    });

    return c.json(
      {
        message: "Inquiry created successfully",
        inquiry: result.newInquiry,
        notification: result.notification,
      },
      HttpStatusCodes.CREATED
    );
  }
);

// List all inquiries
inquiryRouter.openapi(
  createRoute({
    tags: ["Inquiries"],
    method: "get",
    path: "/inquiries",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                inquiryId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: inquiryStatusType,
                message: z.string(),
                contactPreference: z.string(),
                createdAt: z.string().nullable(),
              })
            ),
          },
        },
        description: "List of inquiries",
      },
    },
  }),
  async (c) => {
    const allInquiries = await db.select().from(inquiries);
    
    // Convert dates to strings and ensure consistent status type
    const formattedInquiries = allInquiries.map(inquiry => ({
      ...inquiry,
      createdAt: inquiry.createdAt ? inquiry.createdAt.toISOString() : null,
      status: inquiry.status
    }));
    
    return c.json(formattedInquiries);
  }
);

// Get a specific inquiry by ID
inquiryRouter.openapi(
  createRoute({
    tags: ["Inquiries"],
    method: "get",
    path: "/inquiries/{id}",
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
              inquiryId: z.number(),
              propertyId: z.number(),
              studentId: z.number(),
              status: inquiryStatusType,
              message: z.string(),
              contactPreference: z.string(),
              createdAt: z.string().nullable(),
            }),
          },
        },
        description: "Inquiry details",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Inquiry not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const inquiry = await findInquiryById(id);

    if (!inquiry) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Inquiry not found",
      });
    }

    return c.json(
      {
        inquiryId: inquiry.inquiryId,
        propertyId: inquiry.propertyId,
        studentId: inquiry.studentId,
        status: inquiry.status,
        message: inquiry.message,
        contactPreference: inquiry.contactPreference,
        createdAt: inquiry.createdAt ? inquiry.createdAt.toISOString() : null,
      },
      HttpStatusCodes.OK
    );
  }
);

// Update an inquiry with notification
inquiryRouter.openapi(
  createRoute({
    tags: ["Inquiries"],
    method: "put",
    path: "/inquiries/{id}",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
      body: {
        content: {
          "application/json": {
            schema: updateInquirySchema.extend({
              responseMessage: z.string().optional(),
            }),
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
              inquiry: z.object({
                inquiryId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: inquiryStatusType,
                message: z.string(),
                contactPreference: z.string(),
              }),
              notification: z.object({
                id: z.number(),
                title: z.string(),
                content: z.string(),
                type: z.string().nullable().optional(),
                isRead: z.boolean(),
                createdAt: z.string(),
              }).optional().nullable(),
            }),
          },
        },
        description: "Inquiry updated successfully with notification",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Inquiry not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");
    const { responseMessage, ...inquiryUpdateData } = updateData;

    // Find the inquiry first to get student ID for notification
    const existingInquiry = await findInquiryById(id);
    
    if (!existingInquiry) {
      return c.json(
        { message: "Inquiry not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Start a transaction to ensure inquiry update and notification are created together
    const result = await db.transaction(async (tx) => {
      // Update the inquiry
      const [updatedInquiry] = await tx
        .update(inquiries)
        .set(inquiryUpdateData)
        .where(eq(inquiries.inquiryId, id))
        .returning({ 
          inquiryId: inquiries.inquiryId, 
          propertyId: inquiries.propertyId, 
          studentId: inquiries.studentId,
          status: inquiries.status,
          message: inquiries.message,
          contactPreference: inquiries.contactPreference 
        });

      let notification = null;
      
      // Create notification based on status change
      if (updateData.status) {
        let title = "Inquiry Status Updated";
        let content = `Your inquiry for property #${existingInquiry.propertyId} has been updated to ${updateData.status}.`;
        let type = "inquiry_updated";

        if (updateData.status === "responded") {
          title = "Inquiry Responded";
          content = responseMessage 
            ? `Your inquiry has received a response: "${responseMessage}"`
            : `Your inquiry for property #${existingInquiry.propertyId} has received a response.`;
          type = "inquiry_responded";
        } else if (updateData.status === "closed") {
          title = "Inquiry Closed";
          content = `Your inquiry for property #${existingInquiry.propertyId} has been closed.`;
          type = "inquiry_closed";
        }

        notification = await createNotification({
          userId: existingInquiry.studentId,
          title,
          content,
          type
        });
      }

      return { updatedInquiry, notification };
    });

    return c.json({
      message: "Inquiry updated successfully",
      inquiry: result.updatedInquiry,
      notification: result.notification
    }, HttpStatusCodes.OK);
  }
);

// Delete an inquiry with notification
inquiryRouter.openapi(
  createRoute({
    tags: ["Inquiries"],
    method: "delete",
    path: "/inquiries/{id}",
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
              notification: z.object({
                id: z.number(),
                title: z.string(),
                content: z.string(),
                type: z.string().nullable().optional(),
                isRead: z.boolean(),
                createdAt: z.string(),
              }).optional().nullable(),
            }),
          },
        },
        description: "Inquiry deleted successfully with notification",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Inquiry not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    // Find the inquiry first to get student ID for notification
    const existingInquiry = await findInquiryById(id);
    
    if (!existingInquiry) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Inquiry not found",
      });
    }

    // Start a transaction to delete inquiry and create notification
    const result = await db.transaction(async (tx) => {
      // Delete the inquiry
      await tx.delete(inquiries).where(eq(inquiries.inquiryId, id));

      // Create notification for the student
      const notification = await createNotification({
        userId: existingInquiry.studentId,
        title: "Inquiry Deleted",
        content: `Your inquiry for property #${existingInquiry.propertyId} has been deleted.`,
        type: "inquiry_deleted",
      });

      return { notification };
    });

    return c.json({
      message: "Inquiry deleted successfully",
      notification: result.notification
    });
  }
);

// Get all inquiries for a specific property
inquiryRouter.openapi(
  createRoute({
    tags: ["Inquiries"],
    method: "get",
    path: "/properties/{propertyId}/inquiries",
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
                inquiryId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: inquiryStatusType,
                message: z.string(),
                contactPreference: z.string(),
                createdAt: z.string().nullable(),
              })
            ),
          },
        },
        description: "List of inquiries for the property",
      },
    },
  }),
  async (c) => {
    const { propertyId } = c.req.valid("param");
    
    const propertyInquiries = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.propertyId, propertyId));
    
    // Convert dates to strings and ensure consistent status type
    const formattedInquiries = propertyInquiries.map(inquiry => ({
      ...inquiry,
      createdAt: inquiry.createdAt ? inquiry.createdAt.toISOString() : null,
      status: inquiry.status
    }));
    
    return c.json(formattedInquiries);
  }
);

// Get all inquiries for a specific student
inquiryRouter.openapi(
  createRoute({
    tags: ["Inquiries"],
    method: "get",
    path: "/students/{studentId}/inquiries",
    request: {
      params: z.object({
        studentId: z.string().transform(Number),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                inquiryId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: inquiryStatusType,
                message: z.string(),
                contactPreference: z.string(),
                createdAt: z.string().nullable(),
              })
            ),
          },
        },
        description: "List of inquiries for the student",
      },
    },
  }),
  async (c) => {
    const { studentId } = c.req.valid("param");
    
    const studentInquiries = await db
      .select()
      .from(inquiries)
      .where(eq(inquiries.studentId, studentId));
    
    // Convert dates to strings and ensure consistent status type
    const formattedInquiries = studentInquiries.map(inquiry => ({
      ...inquiry,
      createdAt: inquiry.createdAt ? inquiry.createdAt.toISOString() : null,
      status: inquiry.status
    }));
    
    return c.json(formattedInquiries);
  }
);

// Get User Notifications
inquiryRouter.openapi(
  createRoute({
    tags: ["Notifications"],
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
            schema: z.array(z.object({
              id: z.number(),
              title: z.string(),
              content: z.string(),
              type: z.string().nullable().optional(),
              isRead: z.boolean(),
              createdAt: z.string(),
            })),
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

// Mark notification as read
inquiryRouter.openapi(
  createRoute({
    tags: ["Notifications"],
    method: "patch",
    path: "/notifications/{id}/read",
    request: {
      params: z.object({
        id: z.string().pipe(z.coerce.number().int().positive()),
      }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        description: "Notification marked as read",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              notification: z.object({
                id: z.number(),
                isRead: z.boolean(),
              }),
            }),
          },
        },
      },
      [HttpStatusCodes.NOT_FOUND]: {
        description: "Notification not found",
        content: {
          "application/json": { schema: z.object({ message: z.string() }) },
        },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    
    try {
      const [updated] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.notificationId, id))
        .returning({ 
          id: notifications.notificationId,
          isRead: notifications.isRead
        });
      
      if (!updated) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Notification not found",
        });
      }

      return c.json({
        message: "Notification marked as read",
        notification: updated,
      });
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to update notification",
      });
    }
  }
);

export default inquiryRouter;