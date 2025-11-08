-- Quick Database Initialization Script
-- Run this file to set up the entire database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run the main schema
\i schema.sql

-- Run settings schema if exists
\i settings_schema.sql

-- Run seed data
\i seed.sql

