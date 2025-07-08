import { eq, and, sql } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();
import { createRoute, z } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { sign } from "jsonwebtoken";
import { HTTPException } from "hono/http-exception";
import { eq, and } from "drizzle-orm";
import { hash, compare } from "bcrypt";
import { users } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "Wg4m8v2Lp9qRjT3cNwXyZ6bBdFhJkMnQ";
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// Zod schemas for request validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  userType: z.enum(["student", "landlord","admin"]),
  phoneNumber: z.string().optional(),
});

const approvalSchema = z.object({
  userId: z.number(),
  approved: z.boolean(),
});

// New schema for check-auth response
const checkAuthSchema = z.object({
  isAuthenticated: z.boolean(),
  studentId: z.number().optional(),
});

// New schema for student details response
const studentSchema = z.object({
  studentId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  profileImage: z.string().optional(),
});

// JWT middleware
const authMiddleware = jwt({
  secret: JWT_SECRET,
  cookie: "auth",
});

// Admin middleware
const adminMiddleware = async (c, next) => {
  const payload = c.get('jwtPayload');
  if (payload.userType !== 'admin') {
    throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
      message: "Admin access required",
    });
  }
  return next();
};

const authRouter = createRouter();

// Helper functions
const generateToken = (userId: number, userType: "student" | "landlord" | "admin", approved: boolean = true) => {
  if (userType === "landlord" && !approved) {
    return null;
  }
  return sign({ userId, userType }, JWT_SECRET, { expiresIn: "24h" });
};

const findUserByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
};

const findUserById = async (userId: number) => {
  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1);
  return user;
};

const createUser = async (userData: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  userType: "student" | "landlord" | "admin";
  phoneNumber?: string;
  approved: boolean;
}) => {
  const [newUser] = await db
    .insert(users)
    .values(userData)
    .returning({ 
      userId: users.userId, 
      email: users.email,
      userType: users.userType,
      approved: users.approved 
    });
  return newUser;
};

const updateUserApproval = async (userId: number, approved: boolean) => {
  const [updatedUser] = await db
    .update(users)
    .set({ approved })
    .where(eq(users.userId, userId))
    .returning({ 
      userId: users.userId, 
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      approved: users.approved 
    });
  return updatedUser;
};

// Routes
authRouter
  .openapi(
    createRoute({
      tags: ["Auth"],
      method: "post",
      path: "/login",
      request: {
        body: {
          content: {
            "application/json": {
              schema: loginSchema,
            },
          },
        },
      },
      responses: {
        [HttpStatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.object({
                token: z.string().nullable(),
                user: z.object({
                  id: z.number(),
                  email: z.string(),
                  userType: z.enum(["student", "landlord", "admin"]),
                  approved: z.boolean(),
                }),
                message: z.string().optional(),
              }),
            },
          },
          description: "Successfully logged in",
        },
        [HttpStatusCodes.UNAUTHORIZED]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Invalid credentials",
        },
      },
    }),
    async (c) => {
      const { email, password } = c.req.valid("json");

      const user = await findUserByEmail(email);
      if (!user || !(await compare(password, user.passwordHash))) {
        throw new HTTPException(HttpStatusCodes.UNAUTHORIZED, {
          message: "Invalid credentials",
        });
      }

      if (user.userType === "landlord" && !user.approved) {
        return c.json({
          token: null,
          user: {
            id: user.userId,
            email: user.email,
            userType: user.userType as "student" | "landlord" | "admin",
            approved: false,
          },
          message: "Your account is pending admin approval",
        }, HttpStatusCodes.OK);
      }

      const token = generateToken(user.userId, user.userType as "student" | "landlord" | "admin", user.approved);

      return c.json({
        token,
        user: {
          id: user.userId,
          email: user.email,
          userType: user.userType as "student" | "landlord" | "admin",
          approved: user.approved,
        },
      }, HttpStatusCodes.OK);
    }
  )
  .openapi(
    createRoute({
      tags: ["Auth"],
      method: "post",
      path: "/register",
      request: {
        body: {
          content: {
            "application/json": {
              schema: registerSchema,
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
                user: z.object({
                  id: z.number(),
                  email: z.string(),
                  approved: z.boolean(),
                }),
                token: z.string().nullable(),
              }),
            },
          },
          description: "User successfully registered",
        },
        [HttpStatusCodes.CONFLICT]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Email already exists",
        },
      },
    }),
    async (c) => {
      const { email, password, firstName, lastName, userType, phoneNumber } = c.req.valid("json");

      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        throw new HTTPException(HttpStatusCodes.CONFLICT, {
          message: "Email already exists",
        });
      }

      const passwordHash = await hash(password, SALT_ROUNDS);
      const approved = userType === "student";
      
      const newUser = await createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        userType: userType as "student" | "landlord" | "admin",
        phoneNumber,
        approved,
      });

      const token = generateToken(newUser.userId, userType as "student" | "landlord" | "admin", approved);

      const message = approved
        ? "Registration successful"
        : "Registration successful. Your account is pending admin approval.";

      return c.json({
        message,
        user: {
          id: newUser.userId,
          email: newUser.email,
          approved,
        },
        token,
      }, HttpStatusCodes.CREATED);
    }
  )
  .openapi(
    createRoute({
      tags: ["Auth"],
      method: "patch",
      path: "/admin/landlord-approval",
      request: {
        body: {
          content: {
            "application/json": {
              schema: approvalSchema,
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
                user: z.object({
                  id: z.number(),
                  email: z.string(),
                  firstName: z.string(),
                  lastName: z.string(),
                  userType: z.string(),
                  approved: z.boolean(),
                }),
              }),
            },
          },
          description: "Landlord approval status updated",
        },
        [HttpStatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "User not found",
        },
        [HttpStatusCodes.FORBIDDEN]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Admin access required",
        },
      },
    }),
    {
      beforeHandle: [authMiddleware, adminMiddleware],
    },
    async (c) => {
      const { userId, approved } = c.req.valid("json");

      const user = await findUserById(userId);
      if (!user) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "User not found",
        });
      }

      if (user.userType !== "landlord") {
        throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
          message: "Only landlord accounts require approval",
        });
      }

      const updatedUser = await updateUserApproval(userId, approved);

      return c.json({
        message: approved ? "Landlord account approved" : "Landlord account disapproved",
        user: {
          id: updatedUser.userId,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          userType: updatedUser.userType,
          approved: updatedUser.approved,
        },
      }, HttpStatusCodes.OK);
    }
  )
  .openapi(
    createRoute({
      tags: ["Auth"],
      method: "get",
      path: "/admin/pending-landlords",
      responses: {
        [HttpStatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.object({
                pendingLandlords: z.array(z.object({
                  id: z.number(),
                  email: z.string(),
                  firstName: z.string(),
                  lastName: z.string(),
                  phoneNumber: z.string().nullable(),
                  createdAt: z.string(),
                })),
                total: z.number(),
              }),
            },
          },
          description: "List of landlords pending approval",
        },
        [HttpStatusCodes.FORBIDDEN]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Admin access required",
        },
      },
    }),
    {
      beforeHandle: [authMiddleware, adminMiddleware],
    },
    async (c) => {
      const pendingLandlords = await db
        .select({
          id: users.userId,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          phoneNumber: users.phoneNumber,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.userType, "landlord"),
            eq(users.approved, false)
          )
        );

      return c.json({
        pendingLandlords,
        total: pendingLandlords.length,
      }, HttpStatusCodes.OK);
    }
  )
  .openapi(
    createRoute({
      tags: ["Auth"],
      method: "get",
      path: "/landlord/approval-status",
      responses: {
        [HttpStatusCodes.OK]: {
          content: {
            "application/json": {
              schema: z.object({
                approved: z.boolean(),
                message: z.string(),
              }),
            },
          },
          description: "Landlord approval status",
        },
        [HttpStatusCodes.FORBIDDEN]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Not a landlord account",
        },
      },
    }),
    {
      beforeHandle: [authMiddleware],
    },
    async (c) => {
      const payload = c.get('jwtPayload');
      const userId = payload.userId;

      const user = await findUserById(userId);
      if (!user) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "User not found",
        });
      }

      if (user.userType !== "landlord") {
        throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
          message: "This endpoint is only for landlord accounts",
        });
      }

      let message = user.approved 
        ? "Your account is approved. You can list properties and access all landlord features." 
        : "Your account is pending approval by an administrator.";

      return c.json({
        approved: user.approved,
        message,
      }, HttpStatusCodes.OK);
    }
  )
  // New route: Check authentication status
  .openapi(
    createRoute({
      tags: ["Auth"],
      method: "get",
      path: "/check-auth",
      responses: {
        [HttpStatusCodes.OK]: {
          content: {
            "application/json": {
              schema: checkAuthSchema,
            },
          },
          description: "Authentication status checked",
        },
      },
    }),
    async (c) => {
      try {
        // Attempt to get JWT payload (will throw if token is invalid or missing)
        const payload = c.get('jwtPayload');
        const user = await findUserById(payload.userId);

        if (!user) {
          return c.json({
            isAuthenticated: false,
          }, HttpStatusCodes.OK);
        }

        return c.json({
          isAuthenticated: true,
          studentId: user.userId, // Use studentId to match frontend expectation
        }, HttpStatusCodes.OK);
      } catch (err) {
        // If JWT validation fails or no token is provided, return unauthenticated
        return c.json({
          isAuthenticated: false,
        }, HttpStatusCodes.OK);
      }
    }
  )
  // New route: Get student details
  .openapi(
    createRoute({
      tags: ["Student"],
      method: "get",
      path: "/students/{id}",
      request: {
        params: z.object({
          id: z.string().regex(/^\d+$/).transform(Number), // Ensure ID is a number
        }),
      },
      responses: {
        [HttpStatusCodes.OK]: {
          content: {
            "application/json": {
              schema: studentSchema,
            },
          },
          description: "Student details retrieved",
        },
        [HttpStatusCodes.NOT_FOUND]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Student not found",
        },
        [HttpStatusCodes.FORBIDDEN]: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Access denied",
        },
      },
    }),
    {
      beforeHandle: [authMiddleware],
    },
    async (c) => {
      const { id } = c.req.valid("param");
      const payload = c.get('jwtPayload');
      const requestingUserId = payload.userId;
      const requestingUserType = payload.userType;

      // Allow access if the user is requesting their own data or is an admin
      if (id !== requestingUserId && requestingUserType !== 'admin') {
        throw new HTTPException(HttpStatusCodes.FORBIDDEN, {
          message: "You can only access your own student data",
        });
      }

      const user = await findUserById(id);
      if (!user) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "Student not found",
        });
      }

      // Ensure the user is a student
      if (user.userType !== "student") {
        throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
          message: "User is not a student",
        });
      }

      return c.json({
        studentId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage || undefined,
      }, HttpStatusCodes.OK);
    }
  );



  authRouter.openapi(
  createRoute({
    tags: ["Auth"],
    method: "get",
    path: "/user-type-stats",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                name: z.string(),
                value: z.number(),
                color: z.string(),
              })
            ),
          },
        },
        description: "User type statistics for dashboard",
      },
      [HttpStatusCodes.INTERNAL_SERVER_ERROR]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
        description: "Error fetching user statistics",
      },
    },
  }),
  async (c) => {
    try {
      // Get counts for each user type using Drizzle ORM
      const studentCount = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.userType, "student"));

      const landlordCount = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.userType, "landlord"));

      const adminCount = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.userType, "admin"));

      const formattedData = [
        { 
          name: 'Students', 
          value: Number(studentCount[0]?.count) || 0, 
          color: '#3b82f6' 
        },
        { 
          name: 'Landlords', 
          value: Number(landlordCount[0]?.count) || 0, 
          color: '#10b981' 
        },
        { 
          name: 'Admins', 
          value: Number(adminCount[0]?.count) || 0, 
          color: '#f59e0b' 
        }
      ];

      return c.json(formattedData, HttpStatusCodes.OK);
      
    } catch (error) {
      console.error("Error fetching user type stats:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      
      throw new HTTPException(HttpStatusCodes.INTERNAL_SERVER_ERROR, {
        message: "Failed to fetch user type statistics",
        error: errorMessage,
      });
    }
  }
);

export default authRouter;