import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { bookings } from "../db/schemas/mgh_db";
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

// Helper function to find a booking by ID
const findBookingById = async (bookingId: number) => {
  const [booking] = await db.select().from(bookings).where(eq(bookings.bookingId, bookingId)).limit(1);
  return booking;
};

// Create a new booking
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
              }),
            }),
          },
        },
        description: "Booking created successfully",
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

    const [newBooking] = await db
      .insert(bookings)
      .values(bookingData)
      .returning({ bookingId: bookings.bookingId, propertyId: bookings.propertyId, studentId: bookings.studentId });

    return c.json(
      {
        message: "Booking created successfully",
        booking: newBooking,
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
                status: z.string().nullable(),
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
    return c.json(allBookings);
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
              status: z.string(),
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
        status: booking.status ?? "pending",
        moveInDate: booking.moveInDate ?? null,
        createdAt: booking.createdAt ? booking.createdAt.toISOString() : null,
      },
      HttpStatusCodes.OK
    );
  }
);

// Update a booking
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
              }),
            }),
          },
        },
        description: "Booking updated successfully",
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

    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.bookingId, id))
      .returning({ bookingId: bookings.bookingId, propertyId: bookings.propertyId, studentId: bookings.studentId });

    if (!updatedBooking) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Booking not found",
      });
    }

    return c.json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  }
);

// Delete a booking
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
            }),
          },
        },
        description: "Booking deleted successfully",
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

    const [deletedBooking] = await db
      .delete(bookings)
      .where(eq(bookings.bookingId, id))
      .returning({ bookingId: bookings.bookingId });

    if (!deletedBooking) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Booking not found",
      });
    }

    return c.json({
      message: "Booking deleted successfully",
    });
  }
);

export default bookingRouter;