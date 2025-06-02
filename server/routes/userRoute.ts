import { createRoute, z } from "@hono/zod-openapi";
import { eq, and, sql, SQL, type DrizzleTypeError } from "drizzle-orm";
import { createRouter } from "../libs/create-app";
import { users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { jwt } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { PgSelectBase } from "drizzle-orm/pg-core";

const JWT_SECRET = "Wg4m8v2Lp9qRjT3cNwXyZ6bBdFhJkMnQ";
const userRouter = createRouter();

// JWT Middleware
const authMiddleware = jwt({
  secret: JWT_SECRET,
  cookie: "auth",
});

// Zod schemas for request validation
const userFilterSchema = z.object({
  userType: z.enum(["student", "landlord", "admin"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

/// Update the existing /users endpoint
userRouter.openapi(
  createRoute({
    tags: ["Users"],
    method: "get",
    path: "/users",
    request: {
      query: userFilterSchema,
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              users: z.array(
                z.object({
                  userId: z.number(),
                  email: z.string(),
                  firstName: z.string(),
                  lastName: z.string(),
                  userType: z.enum(["student", "landlord", "admin"]),
                  phoneNumber: z.string().nullable(),
                  createdAt: z.string(),
                })
              ),
              counts: z.object({
                total: z.number(),
                student: z.number(),
                landlord: z.number(),
                admin: z.number(),
              }),
            }),
          },
        },
        description: "List of users with counts",
      },
    },
  }),
  async (c) => {
    const { userType, page = "1", limit = "10" } = c.req.valid("query");
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get paginated users
    const baseQuery = userType 
      ? db.select().from(users).where(eq(users.userType, userType))
      : db.select().from(users);
      
    const paginatedUsers = await baseQuery.limit(parseInt(limit)).offset(offset);

    // Get total counts
    const totalResult = await db.select({
      total: sql<number>`count(*)::int`,
      student: sql<number>`count(*) filter (where user_type = 'student')::int`,
      landlord: sql<number>`count(*) filter (where user_type = 'landlord')::int`,
      admin: sql<number>`count(*) filter (where user_type = 'admin')::int`,
    }).from(users);

    const counts = totalResult[0] || {
      total: 0,
      student: 0,
      landlord: 0,
      admin: 0
    };

    // Format response
    const formattedUsers = paginatedUsers.map(user => ({
      ...user,
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    }));

    return c.json({
      users: formattedUsers,
      counts: {
        total: counts.total || 0,
        student: counts.student || 0,
        landlord: counts.landlord || 0,
        admin: counts.admin || 0,
      }
    }, HttpStatusCodes.OK);
  }
);


// Get a single user by ID
userRouter.openapi(
  createRoute({
    tags: ["Users"],
    method: "get",
    path: "/users/{id}",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              userId: z.number(),
              email: z.string(),
              firstName: z.string(),
              lastName: z.string(),
              userType: z.enum(["student", "landlord", "admin"]),
              phoneNumber: z.string().nullable(),
              createdAt: z.string(),
            }),
          },
        },
        description: "User details",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
        description: "User not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const user = await db.select().from(users).where(eq(users.userId, parseInt(id))).limit(1);

    if (!user.length) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, { message: "User not found" });
    }

    const formattedUser = {
      ...user[0],
      createdAt: user[0].createdAt ? user[0].createdAt.toISOString() : new Date().toISOString(),
    };

    return c.json(formattedUser, HttpStatusCodes.OK);
  }
);

// Update user information
userRouter.openapi(
  createRoute({
    tags: ["Users"],
    method: "patch",
    path: "/users/{id}",
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: {
          "application/json": {
            schema: updateUserSchema,
          },
        },
      },
    },
    responses: {
      [HttpStatusCodes.OK]: {
        description: "User updated successfully",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");
    await db.update(users).set(updateData).where(eq(users.userId, parseInt(id)));

    return c.json({ message: "User updated successfully" }, HttpStatusCodes.OK);
  }
);

// Delete a user
userRouter.openapi(
  createRoute({
    tags: ["Users"],
    method: "delete",
    path: "/users/{id}",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      [HttpStatusCodes.NO_CONTENT]: {
        description: "User deleted successfully",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    await db.delete(users).where(eq(users.userId, parseInt(id)));

    c.status(HttpStatusCodes.NO_CONTENT);
    return c.json({ message: "User deleted successfully" });
  }
);



export default userRouter;


