-- Add Twenty calendar features to calendar_events table
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS is_canceled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS conference_solution TEXT,
ADD COLUMN IF NOT EXISTS conference_link TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'SHARE_EVERYTHING' CHECK (visibility IN ('SHARE_EVERYTHING', 'METADATA')),
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]';

-- Create index for visibility
CREATE INDEX IF NOT EXISTS idx_calendar_events_visibility ON calendar_events(visibility);

-- Update existing records to have default visibility
UPDATE calendar_events SET visibility = 'SHARE_EVERYTHING' WHERE visibility IS NULL;