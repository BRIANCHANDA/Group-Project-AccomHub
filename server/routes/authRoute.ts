import dontev from"dotenv/config";
import dotenv from "dotenv";
dotenv.config(); 
import { createRoute, z } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { sign } from "jsonwebtoken";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
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
  userType: z.enum(["student", "landlord", "admin"]),
  phoneNumber: z.string().optional(),
});

// JWT middleware
const authMiddleware = jwt({
  secret: JWT_SECRET,
  cookie: "auth",
});

const authRouter = createRouter();

// Helper functions
const generateToken = (userId: number, userType: "student" | "landlord" | "admin") => {
  return sign({ userId, userType }, JWT_SECRET, { expiresIn: "24h" });
};

const findUserByEmail = async (email: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
};

const createUser = async (userData: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  userType: "student" | "landlord" | "admin";
  phoneNumber?: string;
}) => {
  const [newUser] = await db.insert(users).values(userData).returning({ userId: users.userId, email: users.email });
  return newUser;
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
                token: z.string(),
                user: z.object({
                  id: z.number(),
                  email: z.string(),
                  userType: z.enum(["student", "landlord", "admin"]),
                }),
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

      const token = generateToken(user.userId, user.userType as "student" | "landlord" | "admin");

      return c.json({
        token,
        user: {
          id: user.userId,
          email: user.email,
          userType: user.userType as "student" | "landlord" | "admin",
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
                }),
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
      const newUser = await createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        userType: userType as "student" | "landlord" | "admin",
        phoneNumber,
      });

      return c.json({
        message: "User successfully registered",
        user: {
          id: newUser.userId,
          email: newUser.email,
        },
      }, HttpStatusCodes.CREATED);
    }
  );

export default authRouter;
