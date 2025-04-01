/*
  # Initial Schema Setup for Study Room Reservation System

  1. New Tables
    - users
      - id (uuid, primary key)
      - student_id (text, unique)
      - name (text)
      - credit_score (integer)
      - created_at (timestamp)
    
    - study_rooms
      - id (uuid, primary key)
      - room_number (text)
      - capacity (integer)
      - status (text)
      - location (text)
      - created_at (timestamp)
    
    - reservations
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - room_id (uuid, foreign key)
      - seat_number (integer)
      - start_time (timestamp)
      - end_time (timestamp)
      - status (text)
      - check_in_time (timestamp)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  name text NOT NULL,
  credit_score integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Create study_rooms table
CREATE TABLE study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL,
  capacity integer NOT NULL,
  status text DEFAULT 'available',
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  room_id uuid REFERENCES study_rooms(id) NOT NULL,
  seat_number integer NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'pending',
  check_in_time timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can read study rooms"
  ON study_rooms
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their own reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);