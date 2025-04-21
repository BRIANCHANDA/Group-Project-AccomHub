import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { bookings, notifications } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const bookingRouter = createRouter();

// Zod schema for booking validation
const bookingSchema = z.object({
  propertyId: z.number(),
  studentId: z.number(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).default("pending"),
  moveInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO 8601 date format (YYYY-MM-DD)
});

const updateBookingSchema = bookingSchema.partial();

// Define response status type to be consistent across routes
const bookingStatusType = z.enum(["pending", "approved", "rejected", "cancelled"]).nullable();

// Helper function to find a booking by ID
const findBookingById = async (bookingId: number) => {
  const [booking] = await db.select().from(bookings).where(eq(bookings.bookingId, bookingId)).limit(1);
  return booking;
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

// Create a new booking with notification
bookingRouter.openapi(
  createRoute({
    tags: ["Bookings"],
    method: "post",
    path: "/bookings",
    request: {
      body: {
        content: {
          "application/json": {
            schema: bookingSchema,
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
              booking: z.object({
                bookingId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: bookingStatusType.optional(),
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
        description: "Booking created successfully with notification",
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
    const bookingData = c.req.valid("json");

    // Start a transaction to ensure booking and notification are created together
    const result = await db.transaction(async (tx) => {
      // Create the booking
      const [newBooking] = await tx
        .insert(bookings)
        .values(bookingData)
        .returning({ 
          bookingId: bookings.bookingId, 
          propertyId: bookings.propertyId, 
          studentId: bookings.studentId,
          status: bookings.status 
        });

      // Create notification for the student
      const notification = await createNotification({
        userId: bookingData.studentId,
        title: "Booking Request Submitted",
        content: `Your booking request for property #${bookingData.propertyId} has been submitted and is pending approval.`,
        type: "booking_created",
      });

      return { newBooking, notification };
    });

    return c.json(
      {
        message: "Booking created successfully",
        booking: result.newBooking,
        notification: result.notification,
      },
      HttpStatusCodes.CREATED
    );
  }
);

// List all bookings
bookingRouter.openapi(
  createRoute({
    tags: ["Bookings"],
    method: "get",
    path: "/bookings",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                bookingId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: bookingStatusType,
                moveInDate: z.string().nullable(),
                createdAt: z.string().nullable(),
              })
            ),
          },
        },
        description: "List of bookings",
      },
    },
  }),
  async (c) => {
    const allBookings = await db.select().from(bookings);
    
    // Convert dates to strings and ensure consistent status type
    const formattedBookings = allBookings.map(booking => ({
      ...booking,
      createdAt: booking.createdAt ? booking.createdAt.toISOString() : null,
      status: booking.status
    }));
    
    return c.json(formattedBookings);
  }
);

// Get a specific booking by ID
bookingRouter.openapi(
  createRoute({
    tags: ["Bookings"],
    method: "get",
    path: "/bookings/{id}",
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
              bookingId: z.number(),
              propertyId: z.number(),
              studentId: z.number(),
              status: bookingStatusType,
              moveInDate: z.string().nullable(),
              createdAt: z.string().nullable(),
            }),
          },
        },
        description: "Booking details",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Booking not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const booking = await findBookingById(id);

    if (!booking) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Booking not found",
      });
    }

    return c.json(
      {
        bookingId: booking.bookingId,
        propertyId: booking.propertyId,
        studentId: booking.studentId,
        status: booking.status,
        moveInDate: booking.moveInDate ?? null,
        createdAt: booking.createdAt ? booking.createdAt.toISOString() : null,
      },
      HttpStatusCodes.OK
    );
  }
);

// Update a booking with notification
bookingRouter.openapi(
  createRoute({
    tags: ["Bookings"],
    method: "put",
    path: "/bookings/{id}",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
      body: {
        content: {
          "application/json": {
            schema: updateBookingSchema,
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
              booking: z.object({
                bookingId: z.number(),
                propertyId: z.number(),
                studentId: z.number(),
                status: bookingStatusType,
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
        description: "Booking updated successfully with notification",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Booking not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");

    // Find the booking first to get student ID for notification
    const existingBooking = await findBookingById(id);
    
    if (!existingBooking) {
      return c.json(
        { message: "Booking not found" },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Start a transaction to ensure booking update and notification are created together
    const result = await db.transaction(async (tx) => {
      // Update the booking
      const [updatedBooking] = await tx
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.bookingId, id))
        .returning({ 
          bookingId: bookings.bookingId, 
          propertyId: bookings.propertyId, 
          studentId: bookings.studentId,
          status: bookings.status 
        });

      let notification = null;
      
      // Create notification based on status change
      if (updateData.status) {
        let title = "Booking Status Updated";
        let content = `Your booking request for property #${existingBooking.propertyId} has been updated to ${updateData.status}.`;
        let type = "booking_updated";

        if (updateData.status === "approved") {
          title = "Booking Approved";
          content = `Your booking request for property #${existingBooking.propertyId} has been approved!`;
          type = "booking_approved";
        } else if (updateData.status === "rejected") {
          title = "Booking Rejected";
          content = `Your booking request for property #${existingBooking.propertyId} has been rejected.`;
          type = "booking_rejected";
        } else if (updateData.status === "cancelled") {
          title = "Booking Cancelled";
          content = `Your booking for property #${existingBooking.propertyId} has been cancelled.`;
          type = "booking_cancelled";
        }

        notification = await createNotification({
          userId: existingBooking.studentId,
          title,
          content,
          type
        });
      }

      return { updatedBooking, notification };
    });

    return c.json({
      message: "Booking updated successfully",
      booking: result.updatedBooking,
      notification: result.notification
    }, HttpStatusCodes.OK);
  }
);

// Delete a booking with notification
bookingRouter.openapi(
  createRoute({
    tags: ["Bookings"],
    method: "delete",
    path: "/bookings/{id}",
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
        description: "Booking deleted successfully with notification",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Booking not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    // Find the booking first to get student ID for notification
    const existingBooking = await findBookingById(id);
    
    if (!existingBooking) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Booking not found",
      });
    }

    // Start a transaction to delete booking and create notification
    const result = await db.transaction(async (tx) => {
      // Delete the booking
      await tx.delete(bookings).where(eq(bookings.bookingId, id));

      // Create notification for the student
      const notification = await createNotification({
        userId: existingBooking.studentId,
        title: "Booking Deleted",
        content: `Your booking request for property #${existingBooking.propertyId} has been deleted.`,
        type: "booking_deleted",
      });

      return { notification };
    });

    return c.json({
      message: "Booking deleted successfully",
      notification: result.notification
    });
  }
);

// Get User Notifications
bookingRouter.openapi(
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
bookingRouter.openapi(
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

export default bookingRouter;