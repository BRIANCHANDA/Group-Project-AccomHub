import { sql } from 'drizzle-orm';
import { 
  pgTable, serial, integer, varchar, text, decimal, boolean, 
  timestamp, pgEnum, unique, primaryKey, index 
} from 'drizzle-orm/pg-core';

// Enums
export const userTypeEnum = pgEnum('user_type_enum', ['student', 'landlord', 'admin']);
export const propertyTypeEnum = pgEnum('property_type_enum', ['apartment', 'house', 'shared_room', 'single_room']);
export const inquiryStatusEnum = pgEnum('inquiry_status_enum', ['pending', 'responded', 'closed']);
export const contactPreferenceEnum = pgEnum('contact_preference_enum', ['email', 'phone', 'any']);

// Users table
export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  userType: userTypeEnum('user_type').notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  approved: boolean('approved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  userTypeIdx: index('idx_users_user_type').on(table.userType),
  approvedIdx: index('idx_users_approved').on(table.approved),
}));

// Properties table
export const properties = pgTable('properties', {
  propertyId: serial('property_id').primaryKey(),
  landlordId: integer('landlord_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  propertyType: propertyTypeEnum('property_type'),
  address: text('address').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  monthlyRent: decimal('monthly_rent', { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  targetUniversity: varchar('target_university', { length: 255 }).notNull(), 
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  landlordIdx: index('idx_properties_landlord_id').on(table.landlordId),
  propertyTypeIdx: index('idx_properties_property_type').on(table.propertyType),
  availabilityIdx: index('idx_properties_is_available').on(table.isAvailable),
  rentIdx: index('idx_properties_monthly_rent').on(table.monthlyRent),
  locationIdx: index('idx_properties_location').on(table.latitude, table.longitude),
  rentCheck: sql`check (monthly_rent >= 0)`,
  latCheck: sql`check (latitude BETWEEN -90 AND 90)`,
  lngCheck: sql`check (longitude BETWEEN -180 AND 180)`
}));

// Property details table
export const propertyDetails = pgTable('property_details', {
  detailId: serial('detail_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull().unique(),
  bedrooms: integer('bedrooms'),
  bathrooms: integer('bathrooms'),
  furnished: boolean('furnished'),
  squareMeters: decimal('square_meters', { precision: 10, scale: 2 }),
  amenities: text('amenities').array(),
  rules: text('rules').array()
}, (table) => ({
  bedroomsCheck: sql`check (bedrooms >= 0)`,
  bathroomsCheck: sql`check (bathrooms >= 0)`,
  sqmCheck: sql`check (square_meters >= 0)`
}));

// Property images table
export const propertyImages = pgTable('property_images', {
  imageId: serial('image_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
}, (table) => ({
  propertyIdx: index('idx_property_images_property_id').on(table.propertyId),
  primaryIdx: index('idx_property_images_is_primary').on(table.isPrimary),
}));

// Inquiries table
export const inquiries = pgTable('inquiries', {
  inquiryId: serial('inquiry_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  studentId: integer('student_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  status: inquiryStatusEnum('status').default('pending'),
  contactPreference: contactPreferenceEnum('contact_preference').default('any'),
  responseMessage: text('response_message'),
  createdAt: timestamp('created_at').defaultNow(),
  respondedAt: timestamp('responded_at')
}, (table) => ({
  propertyIdx: index('idx_inquiries_property_id').on(table.propertyId),
  studentIdx: index('idx_inquiries_student_id').on(table.studentId),
  statusIdx: index('idx_inquiries_status').on(table.status),
  createdAtIdx: index('idx_inquiries_created_at').on(table.createdAt),
}));

// Reviews table
export const reviews = pgTable('reviews', {
  reviewId: serial('review_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  reviewerId: integer('reviewer_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  propertyReviewerUnique: unique('property_reviewer_unique').on(table.propertyId, table.reviewerId),
  propertyIdx: index('idx_reviews_property_id').on(table.propertyId),
  reviewerIdx: index('idx_reviews_reviewer_id').on(table.reviewerId),
  ratingIdx: index('idx_reviews_rating').on(table.rating),
  ratingCheck: sql`check (rating BETWEEN 1 AND 5)`,
}));

// Messages table
export const messages = pgTable('messages', {
  messageId: serial('message_id').primaryKey(),
  senderId: integer('sender_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  receiverId: integer('receiver_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'set null' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  senderIdx: index('idx_messages_sender_id').on(table.senderId),
  receiverIdx: index('idx_messages_receiver_id').on(table.receiverId),
  propertyIdx: index('idx_messages_property_id').on(table.propertyId),
  readStatusIdx: index('idx_messages_is_read').on(table.isRead),
  createdAtIdx: index('idx_messages_created_at').on(table.createdAt),
}));