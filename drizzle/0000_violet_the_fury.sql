DO $$ BEGIN
 CREATE TYPE "public"."booking_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."property_type_enum" AS ENUM('apartment', 'house', 'shared_room', 'single_room');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_type_enum" AS ENUM('student', 'landlord', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"booking_id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"status" "booking_status_enum" DEFAULT 'pending',
	"move_in_date" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorites" (
	"favorite_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_property_favorite" UNIQUE("user_id","property_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"message_id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"property_id" integer,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"notification_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "properties" (
	"property_id" serial PRIMARY KEY NOT NULL,
	"landlord_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"property_type" "property_type_enum",
	"main_image" text,
	"address" text NOT NULL,
	"monthly_rent" numeric(10, 2) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_details" (
	"detail_id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"furnished" boolean,
	"square_meters" numeric(10, 2),
	"amenities" text[],
	"rules" text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_images" (
	"image_id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"review_id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"rating" integer,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_profiles" (
	"student_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"institution" varchar(255),
	"student_id_number" varchar(50),
	"study_level" varchar(50),
	"preferences" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"user_type" "user_type_enum" NOT NULL,
	"phone_number" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("property_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_student_id_users_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_properties_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("property_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_user_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_property_id_properties_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("property_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "properties" ADD CONSTRAINT "properties_landlord_id_users_user_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_details" ADD CONSTRAINT "property_details_property_id_properties_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("property_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("property_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_properties_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("property_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
