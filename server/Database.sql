

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geographical feature

-- Create custom enum types
CREATE TYPE user_type_enum AS ENUM ('student', 'landlord', 'admin');
CREATE TYPE property_type_enum AS ENUM ('apartment', 'house', 'shared_room', 'single_room');
CREATE TYPE inquiry_status_enum AS ENUM ('pending', 'responded', 'closed');
CREATE TYPE contact_preference_enum AS ENUM ('email', 'phone', 'any');

-- Users table - Central user management
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type user_type_enum NOT NULL,
    phone_number VARCHAR(20),
    approved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student profiles 
CREATE TABLE student_profiles (
    student_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    institution VARCHAR(255),
    student_id_number VARCHAR(50),
    study_level VARCHAR(50),
    preferences JSONB,
    UNIQUE(user_id)
);

-- Properties table 
CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    landlord_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type property_type_enum,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    monthly_rent DECIMAL(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property details 
CREATE TABLE property_details (
    detail_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    furnished BOOLEAN,
    square_meters DECIMAL(10, 2),
    amenities TEXT[],
    rules TEXT[],
    UNIQUE(property_id)
);

-- Property images 
CREATE TABLE property_images (
    image_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inquiries 
CREATE TABLE inquiries (
    inquiry_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE NOT NULL,
    student_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    status inquiry_status_enum DEFAULT 'pending',
    contact_preference contact_preference_enum DEFAULT 'any',
    response_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

-- Reviews Table- Property reviews and ratings
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE NOT NULL,
    reviewer_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(property_id, reviewer_id)
);

-- Messages 
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    receiver_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favorites - User's favorite properties
CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

-- Notifications 
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for improved perfpormance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_approved ON users(approved);

CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_institution ON student_profiles(institution);

CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_is_available ON properties(is_available);
CREATE INDEX idx_properties_monthly_rent ON properties(monthly_rent);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);

CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_is_primary ON property_images(is_primary);

CREATE INDEX idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX idx_inquiries_student_id ON inquiries(student_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);

CREATE INDEX idx_reviews_property_id ON reviews(property_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_property_id ON messages(property_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for setting responded_at in inquiries
CREATE OR REPLACE FUNCTION set_inquiry_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status AND NEW.status = 'responded' THEN
        NEW.responded_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inquiry_responded_at 
    BEFORE UPDATE ON inquiries 
    FOR EACH ROW 
    EXECUTE FUNCTION set_inquiry_responded_at();

-- Create function to ensure only one primary image per property
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE property_images 
        SET is_primary = FALSE 
        WHERE property_id = NEW.property_id AND image_id != NEW.image_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON property_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_image();



COMMENT ON DATABASE CURRENT_DATABASE() IS 'Student Housing Platform Database - Connects students with landlords for rental properties';
COMMENT ON TABLE users IS 'Central user management for students, landlords, and administrators';
COMMENT ON TABLE properties IS 'Property listings with location and basic information';
COMMENT ON TABLE inquiries IS 'Student inquiries about properties, replacing traditional booking system';
COMMENT ON TABLE reviews IS 'Property reviews and ratings from students';
COMMENT ON TABLE messages IS 'Direct messaging system between users';
COMMENT ON TABLE favorites IS 'User favorite properties for quick access';
COMMENT ON TABLE notifications IS 'System notifications for user engagement';

-- Database creation completed
SELECT 'Student Housing Database Schema Created Successfully!' AS status;
