// src/db/schemas.ts
import { sql } from 'drizzle-orm';
import { pgTable, serial, integer, varchar, text, decimal, boolean, timestamp, pgEnum, jsonb, unique, date, check } from 'drizzle-orm/pg-core';

// Enums
export const userTypeEnum = pgEnum('user_type_enum', ['student', 'landlord', 'admin']);
export const propertyTypeEnum = pgEnum('property_type_enum', ['apartment', 'house', 'shared_room', 'single_room']);
export const bookingStatusEnum = pgEnum('booking_status_enum', ['pending', 'approved', 'rejected', 'cancelled']);

// Users
export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  userType: userTypeEnum('user_type').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  approved: boolean('approved').default(false).notNull(),  // Added approved field
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Student Profiles
export const studentProfiles = pgTable('student_profiles', {
  studentId: serial('student_id').primaryKey(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  institution: varchar('institution', { length: 255 }),
  studentIdNumber: varchar('student_id_number', { length: 50 }),
  studyLevel: varchar('study_level', { length: 50 }),
  preferences: jsonb('preferences')
});

// Properties
export const properties = pgTable('properties', {
  propertyId: serial('property_id').primaryKey(),
  landlordId: integer('landlord_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  propertyType: propertyTypeEnum('property_type'),
  address: text('address').notNull(),
  monthlyRent: decimal('monthly_rent', { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Property Details
export const propertyDetails = pgTable('property_details', {
  detailId: serial('detail_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  furnished: boolean('furnished'),
  squareMeters: decimal('square_meters', { precision: 10, scale: 2 }),
  amenities: text('amenities').array(),
  rules: text('rules').array()
});

// Property Images
export const propertyImages = pgTable('property_images', {
  imageId: serial('image_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
});

// Bookings
export const bookings = pgTable('bookings', {
  bookingId: serial('booking_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  status: bookingStatusEnum('status').default('pending'),
  moveInDate: date('move_in_date'),
  createdAt: timestamp('created_at').defaultNow()
});

// Reviews
export const reviews = pgTable('reviews', {
  reviewId: serial('review_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  reviewerId: integer('reviewer_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').$type<1 | 2 | 3 | 4 | 5>(), // Type-safe rating
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  ratingCheck: check('rating_check', sql`rating BETWEEN 1 AND 5`)
}));

// Messages
export const messages = pgTable('messages', {
  messageId: serial('message_id').primaryKey(),
  senderId: integer('sender_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  receiverId: integer('receiver_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'set null' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Favorites
export const favorites = pgTable('favorites', {
  favoriteId: serial('favorite_id').primaryKey(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniqueFavorite: unique('unique_user_property_favorite').on(table.userId, table.propertyId)
}));

// Notifications
export const notifications = pgTable('notifications', {
  notificationId: serial('notification_id').primaryKey(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});