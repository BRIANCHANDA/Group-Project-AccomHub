/*import { sql } from 'drizzle-orm';
import { pgTable, serial, integer, varchar, text, decimal, boolean, timestamp, pgEnum, jsonb, unique, date, check } from 'drizzle-orm/pg-core';

// Enums
export const userTypeEnum = pgEnum('user_type_enum', ['student', 'landlord', 'admin']);
export const propertyTypeEnum = pgEnum('property_type_enum', ['apartment', 'house', 'shared_room', 'single_room']);
export const inquiryStatusEnum = pgEnum('inquiry_status_enum', ['pending', 'responded', 'closed']);
export const contactPreferenceEnum = pgEnum('contact_preference_enum', ['email', 'phone', 'any']);

// Users
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
  latitude: decimal('latitude', { precision: 10, scale: 7 }),  // Added latitude field
  longitude: decimal('longitude', { precision: 10, scale: 7 }), // Added longitude field
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

// Inquiries (replacing Bookings)
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
});

// Reviews
export const reviews = pgTable('reviews', {
  reviewId: serial('review_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  reviewerId: integer('reviewer_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').$type<1 | 2 | 3 | 4 | 5>(),
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

*/
import { sql } from 'drizzle-orm';
import { pgTable, serial, integer, varchar, text, decimal, boolean, timestamp, pgEnum, jsonb, unique, date, check } from 'drizzle-orm/pg-core';

// Enums (unchanged)
export const userTypeEnum = pgEnum('user_type_enum', ['student', 'landlord', 'admin']);
export const propertyTypeEnum = pgEnum('property_type_enum', ['apartment', 'house', 'shared_room', 'single_room']);
export const inquiryStatusEnum = pgEnum('inquiry_status_enum', ['pending', 'responded', 'closed']);
export const contactPreferenceEnum = pgEnum('contact_preference_enum', ['email', 'phone', 'any']);

// Users - Add default values for numeric fields
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
});

// Student Profiles - Add checks for numeric fields
export const studentProfiles = pgTable('student_profiles', {
  studentId: serial('student_id').primaryKey(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  institution: varchar('institution', { length: 255 }),
  studentIdNumber: varchar('student_id_number', { length: 50 }),
  studyLevel: varchar('study_level', { length: 50 }),
  preferences: jsonb('preferences')
}, (table) => ({
  // Add numeric field constraints
  idNumberCheck: check('id_number_check', sql`student_id_number ~ '^[0-9]+$'`)
}));

// Properties - Add constraints and default values
export const properties = pgTable('properties', {
  propertyId: serial('property_id').primaryKey(),
  landlordId: integer('landlord_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  propertyType: propertyTypeEnum('property_type'),
  address: text('address').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).default('0.0'),  // Default value
  longitude: decimal('longitude', { precision: 10, scale: 7 }).default('0.0'), // Default value
  monthlyRent: decimal('monthly_rent', { precision: 10, scale: 2 }).notNull().default('0.00'),
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  // Add constraints for numeric fields
  rentCheck: check('rent_check', sql`monthly_rent >= 0`),
  latCheck: check('lat_check', sql`latitude BETWEEN -90 AND 90`),
  lngCheck: check('lng_check', sql`longitude BETWEEN -180 AND 180`)
}));

// Property Details - Add constraints for numeric fields
export const propertyDetails = pgTable('property_details', {
  detailId: serial('detail_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  bedrooms: integer('bedrooms').default(0).notNull(),  // Default value
  bathrooms: integer('bathrooms').default(0).notNull(), // Default value
  furnished: boolean('furnished'),
  squareMeters: decimal('square_meters', { precision: 10, scale: 2 }).default('0.00'),
  amenities: text('amenities').array(),
  rules: text('rules').array()
}, (table) => ({
  // Add constraints for numeric fields
  bedroomsCheck: check('bedrooms_check', sql`bedrooms >= 0`),
  bathroomsCheck: check('bathrooms_check', sql`bathrooms >= 0`),
  squareMetersCheck: check('square_meters_check', sql`square_meters >= 0`)
}));

// Property Images (unchanged)
export const propertyImages = pgTable('property_images', {
  imageId: serial('image_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  imageUrl: varchar('image_url', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
});

// Inquiries (unchanged)
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
});

// Reviews - Add constraints for rating
export const reviews = pgTable('reviews', {
  reviewId: serial('review_id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  reviewerId: integer('reviewer_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').$type<1 | 2 | 3 | 4 | 5>().notNull(), // Ensure not null
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  ratingCheck: check('rating_check', sql`rating BETWEEN 1 AND 5`)
}));

// Messages (unchanged)
export const messages = pgTable('messages', {
  messageId: serial('message_id').primaryKey(),
  senderId: integer('sender_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  receiverId: integer('receiver_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'set null' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// Favorites (unchanged)
export const favorites = pgTable('favorites', {
  favoriteId: serial('favorite_id').primaryKey(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  propertyId: integer('property_id').references(() => properties.propertyId, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniqueFavorite: unique('unique_user_property_favorite').on(table.userId, table.propertyId)
}));

// Notifications (unchanged)
export const notifications = pgTable('notifications', {
  notificationId: serial('notification_id').primaryKey(),
  userId: integer('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});