/*
  # Schema Update for Study Room Reservation System

  1. Update users table to work with Supabase Auth
  2. Create seats table for individual seats
  3. Update reservations table to reference seats instead of room directly
  4. Create check_ins table for tracking check-ins
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Anyone can read study rooms" ON study_rooms;
DROP POLICY IF EXISTS "Users can read their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;

-- Update users table to work with Supabase Auth
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email text UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS auth_id uuid REFERENCES auth.users(id);

-- Create seats table
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES study_rooms(id) NOT NULL,
  seat_number text NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(room_id, seat_number)
);

-- Update reservations table
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS seat_id uuid REFERENCES seats(id),
  DROP COLUMN IF EXISTS seat_number;

-- Create check_ins table
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) NOT NULL,
  check_in_time timestamptz NOT NULL,
  check_out_time timestamptz,
  status text DEFAULT 'on_time',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Create updated policies
CREATE POLICY "Public users profiles are viewable by everyone"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "Anyone can read study rooms"
  ON study_rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read seats"
  ON seats
  FOR SELECT
  USING (true);

CREATE POLICY "Users can read all reservations"
  ON reservations
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create reservations"
  ON reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON reservations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read all check_ins"
  ON check_ins
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create check_ins"
  ON check_ins
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.id = check_ins.reservation_id
    AND reservations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own check_ins"
  ON check_ins
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.id = check_ins.reservation_id
    AND reservations.user_id = auth.uid()
  ));

-- Create trigger function to update seat availability on reservation
CREATE OR REPLACE FUNCTION update_seat_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE seats SET is_available = false WHERE id = NEW.seat_id;
  ELSIF NEW.status IN ('canceled', 'completed') THEN
    UPDATE seats SET is_available = true WHERE id = NEW.seat_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_seat_availability_trigger ON reservations;
CREATE TRIGGER update_seat_availability_trigger
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_seat_availability(); 