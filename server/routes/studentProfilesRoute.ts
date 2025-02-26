import { createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { studentProfiles } from "../db/schemas/mgh_db";
import { db } from "../db";
import { createRouter } from "../libs/create-app";
import * as HttpStatusCodes from "stoker/http-status-codes";

const studentProfileRouter = createRouter();

// **Zod Schema for Student Profiles**
const studentProfileSchema = z.object({
  userId: z.number(),
  institution: z.string().max(255).optional(),
  studentIdNumber: z.string().max(50).optional(),
  studyLevel: z.string().max(50).optional(),
  preferences: z.record(z.any()).optional(), // JSONB preferences
});

const updateStudentProfileSchema = studentProfileSchema.partial();

// **Helper Function: Find Student Profile by ID**
const findStudentProfileById = async (studentId: number) => {
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.studentId, studentId)).limit(1);
  return profile;
};

// **1. Create a Student Profile**
studentProfileRouter.openapi(
  createRoute({
    tags: ["Student Profiles"],
    method: "post",
    path: "/student-profiles",
    request: {
      body: {
        content: {
          "application/json": {
            schema: studentProfileSchema,
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
              profile: z.object({
                studentId: z.number(),
                userId: z.number(),
              }),
            }),
          },
        },
        description: "Student profile created successfully",
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
    const profileData = c.req.valid("json");

    const [newProfile] = await db
      .insert(studentProfiles)
      .values(profileData)
      .returning({ studentId: studentProfiles.studentId, userId: studentProfiles.userId });

    return c.json(
      {
        message: "Student profile created successfully",
        profile: newProfile,
      },
      HttpStatusCodes.CREATED
    );
  }
);

// **2. List All Student Profiles**
studentProfileRouter.openapi(
  createRoute({
    tags: ["Student Profiles"],
    method: "get",
    path: "/student-profiles",
    responses: {
      [HttpStatusCodes.OK]: {
        content: {
          "application/json": {
            schema: z.array(
              z.object({
                studentId: z.number(),
                userId: z.number(),
                institution: z.string().optional(),
                studentIdNumber: z.string().optional(),
                studyLevel: z.string().optional(),
                preferences: z.record(z.any()).optional(),
              })
            ),
          },
        },
        description: "List of student profiles",
      },
    },
  }),
  async (c) => {
    const allProfiles = await db.select().from(studentProfiles);
    return c.json(allProfiles);
  }
);

// **3. Get a Specific Student Profile by ID**
studentProfileRouter.openapi(
  createRoute({
    tags: ["Student Profiles"],
    method: "get",
    path: "/student-profiles/{id}",
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
              studentId: z.number(),
              userId: z.number(),
              institution: z.string().optional(),
              studentIdNumber: z.string().optional(),
              studyLevel: z.string().optional(),
              preferences: z.record(z.any()).optional(),
            }),
          },
        },
        description: "Student profile details",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Student profile not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const profile = await findStudentProfileById(id);

    if (!profile) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Student profile not found",
      });
    }

    return c.json(profile);
  }
);

// **4. Update a Student Profile**
studentProfileRouter.openapi(
  createRoute({
    tags: ["Student Profiles"],
    method: "put",
    path: "/student-profiles/{id}",
    request: {
      params: z.object({
        id: z.string().transform(Number),
      }),
      body: {
        content: {
          "application/json": {
            schema: updateStudentProfileSchema,
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
              profile: z.object({
                studentId: z.number(),
                userId: z.number(),
              }),
            }),
          },
        },
        description: "Student profile updated successfully",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Student profile not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");

    const [updatedProfile] = await db
      .update(studentProfiles)
      .set(updateData)
      .where(eq(studentProfiles.studentId, id))
      .returning({ studentId: studentProfiles.studentId, userId: studentProfiles.userId });

    if (!updatedProfile) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Student profile not found",
      });
    }

    return c.json({
      message: "Student profile updated successfully",
      profile: updatedProfile,
    });
  }
);

// **5. Delete a Student Profile**
studentProfileRouter.openapi(
  createRoute({
    tags: ["Student Profiles"],
    method: "delete",
    path: "/student-profiles/{id}",
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
        description: "Student profile deleted successfully",
      },
      [HttpStatusCodes.NOT_FOUND]: {
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
        description: "Student profile not found",
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    const [deletedProfile] = await db
      .delete(studentProfiles)
      .where(eq(studentProfiles.studentId, id))
      .returning({ studentId: studentProfiles.studentId });

    if (!deletedProfile) {
      throw new HTTPException(HttpStatusCodes.NOT_FOUND, {
        message: "Student profile not found",
      });
    }

    return c.json({
      message: "Student profile deleted successfully",
    });
  }
);

export default studentProfileRouter;
