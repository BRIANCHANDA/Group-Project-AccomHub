import { createRoute, z } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import { createRouter } from "../libs/create-app";
import { users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { jwt } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCodes from "stoker/http-status-codes";

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

// Get all users (with pagination & filtering)
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
            schema: z.array(
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
          },
        },
        description: "List of users",
      },
    },
  }),
  async (c) => {
    const { userType, page = "1", limit = "10" } = c.req.valid("query");
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const query = userType ? db.select().from(users).where(eq(users.userType, userType)) : db.select().from(users);
    const allUsers = await query.limit(parseInt(limit)).offset(offset);

    const formattedUsers = allUsers.map(user => ({
      ...user,
      createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    }));

    return c.json(formattedUsers, HttpStatusCodes.OK);
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
