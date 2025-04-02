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
const JWT_SECRET = "Wg4m8v2Lp9qRjT3cNwXyZ6bBdFhJkMnQ";
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
  userType: z.enum(["student", "landlord"]),
  phoneNumber: z.string().optional(),
});

const approvalSchema = z.object({
  userId: z.number(),
  approved: z.boolean(),
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
  // Don't generate token for unapproved landlords
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
      userType: users.userType,
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

      // Check if landlord account is approved
      if (user.userType === "landlord" && !user.approved) {
        return c.json({
          token: null,
          user: {
            id: user.userId,
            email: user.email,
            userType: user.userType as "student" | "landlord" | "admin",
            approved: false,
          },
          message: "Your account is pending admin approval"
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
      
      // Auto-approve students, but not landlords
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

      // Generate token for students, not for unapproved landlords
      const token = generateToken(newUser.userId, userType as "student" | "landlord" | "admin", approved);
      
      let message = "User successfully registered";
      if (userType === "landlord") {
        message += ". Your account requires admin approval before you can access all features.";
        
        // Optionally, send notification to admins about new landlord registration
        try {
          const admins = await db
            .select({ userId: users.userId })
            .from(users)
            .where(eq(users.userType, "admin"));
            
          // Create notifications for all admins
          if (admins.length > 0) {
            const notifications = admins.map(admin => ({
              userId: admin.userId,
              title: "New Landlord Registration",
              content: `${firstName} ${lastName} (${email}) has registered as a landlord and requires approval.`,
              type: "landlord_approval",
              isRead: false,
            }));
            
            await db.insert(notifications).into("notifications");
          }
        } catch (error) {
          console.error("Failed to notify admins:", error);
          // Don't fail the registration if notification fails
        }
      }

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
  // Admin endpoint to approve/reject landlords
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
    // Apply JWT and admin middleware
    {
      beforeHandle: [authMiddleware, adminMiddleware],
    },
    async (c) => {
      const { userId, approved } = c.req.valid("json");

      // Find the user
      const user = await findUserById(userId);
      if (!user) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "User not found",
        });
      }

      // Ensure the user is a landlord
      if (user.userType !== "landlord") {
        throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
          message: "Only landlord accounts require approval",
        });
      }

      // Update approval status
      const updatedUser = await updateUserApproval(userId, approved);
      
      // Send notification to the landlord
      try {
        await db.insert({
          userId: userId,
          title: approved ? "Account Approved" : "Account Not Approved",
          content: approved 
            ? "Your landlord account has been approved. You can now log in and list properties." 
            : "Your landlord account has not been approved. Please contact support for more information.",
          type: "account_status",
          isRead: false,
        }).into("notifications");
      } catch (error) {
        console.error("Failed to notify landlord:", error);
        // Don't fail the approval if notification fails
      }

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
  // Admin endpoint to get all pending landlords
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
    // Apply JWT and admin middleware
    {
      beforeHandle: [authMiddleware, adminMiddleware],
    },
    async (c) => {
      // Find all landlords with approved = false
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
  // Add endpoint for landlords to check their approval status
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
      
      // Get the user
      const user = await findUserById(userId);
      if (!user) {
        throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
          message: "User not found",
        });
      }
      
      // Check if user is a landlord
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
  );

export default authRouter;