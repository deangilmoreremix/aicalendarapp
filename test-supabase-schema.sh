#!/bin/bash
# Supabase Schema Testing Script for AI Calendar App

echo "🔍 Testing Supabase Database Schema and Functionality"
echo "=================================================="

# Test 1: Database Connection
echo -e "\n1. Testing Database Connection..."
supabase db query --linked "SELECT '✅ Database Connected Successfully' as status;"

# Test 2: Core Tables Exist
echo -e "\n2. Verifying Core Tables..."
supabase db query --linked "
SELECT table_name, '✅ Exists' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('calendar_events', 'tasks', 'contacts', 'deals', 'profiles')
ORDER BY table_name;"

# Test 3: Calendar Events Schema (After Migration)
echo -e "\n3. Testing Calendar Events Schema..."
supabase db query --linked "
SELECT
    CASE
        WHEN column_name = 'is_canceled' THEN '✅ Twenty column added: ' || column_name
        WHEN column_name = 'conference_solution' THEN '✅ Twenty column added: ' || column_name
        WHEN column_name = 'conference_link' THEN '✅ Twenty column added: ' || column_name
        WHEN column_name = 'visibility' THEN '✅ Twenty column added: ' || column_name
        WHEN column_name = 'participants' THEN '✅ Twenty column added: ' || column_name
        ELSE '✅ Existing column: ' || column_name
    END as column_status
FROM information_schema.columns
WHERE table_name = 'calendar_events'
AND column_name IN ('id', 'title', 'is_canceled', 'conference_solution', 'conference_link', 'visibility', 'participants')
ORDER BY ordinal_position;"

# Test 4: Insert Test Data
echo -e "\n4. Testing Data Insertion..."
supabase db query --linked "
INSERT INTO calendar_events (
    tenant_id, title, event_type, start_time, end_time,
    is_canceled, conference_solution, conference_link,
    visibility, participants
) VALUES (
    gen_random_uuid(),
    'Test Twenty Event',
    'meeting',
    NOW(),
    NOW() + INTERVAL '1 hour',
    false,
    'zoom',
    'https://zoom.us/test',
    'SHARE_EVERYTHING',
    '[{\"displayName\": \"John Doe\", \"firstName\": \"John\", \"lastName\": \"Doe\"}]'::jsonb
) RETURNING id, title, '✅ Insert Successful' as status;"

# Test 5: Query Test Data
echo -e "\n5. Testing Data Retrieval..."
supabase db query --linked "
SELECT
    id,
    title,
    is_canceled,
    conference_solution,
    conference_link,
    visibility,
    jsonb_array_length(participants) as participant_count,
    '✅ Query Successful' as status
FROM calendar_events
WHERE title = 'Test Twenty Event'
ORDER BY created_at DESC
LIMIT 1;"

# Test 6: Schema Indexes
echo -e "\n6. Verifying Database Indexes..."
supabase db query --linked "
SELECT
    indexname,
    '✅ Index exists: ' || indexname as status
FROM pg_indexes
WHERE tablename = 'calendar_events'
AND indexname LIKE '%visibility%'
OR indexname LIKE '%calendar_events%';"

echo -e "\n🎉 Schema Testing Complete!"
echo "=================================================="
echo "If all tests show ✅, your Supabase schema is working correctly!"
echo "Note: Manual migration may be needed if Twenty columns are missing."