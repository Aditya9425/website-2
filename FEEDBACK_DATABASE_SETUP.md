# Feedback Database Setup Guide

## Overview
This guide will help you set up the feedback storage system in your Supabase database.

## Step 1: Create the Feedbacks Table

1. **Open your Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the SQL Script**
   - Copy and paste the contents of `create-feedbacks-table.sql`
   - Click "Run" to execute the script

## Step 2: Verify Table Creation

1. **Check Table Structure**
   - Go to "Table Editor" in the left sidebar
   - Look for the "feedbacks" table
   - Verify it has the correct columns:
     - `id` (auto-increment primary key)
     - `message` (text)
     - `submitted_at` (timestamp with timezone)

2. **Test Permissions**
   - The table should allow public inserts (for anonymous users)
   - Authenticated users can view feedback

## Step 3: Test the Feedback System

1. **Open your website**
2. **Click "Click Here to Give Feedback" button**
3. **Submit a test feedback message**
4. **Check the database**
   - Go to Table Editor → feedbacks
   - Verify your test feedback appears in the table

## Table Structure

```sql
CREATE TABLE feedbacks (
    id SERIAL PRIMARY KEY,                    -- Auto-increment primary key
    message TEXT NOT NULL,                    -- User feedback message
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- Submission timestamp
);
```

## Security Features

- **Row Level Security (RLS)** is enabled
- **Public insert access** for anonymous users
- **Authenticated read access** for viewing feedback
- **No sensitive data** is stored

## Troubleshooting

### If feedback is not saving:
1. Check browser console for errors
2. Verify Supabase connection is working
3. Ensure the table was created successfully
4. Check RLS policies are correct

### If you get permission errors:
1. Verify the RLS policies are created correctly
2. Check that the anon role has INSERT permissions
3. Ensure the sequence permissions are granted

## Monitoring Feedback

To view submitted feedback:
1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Select the "feedbacks" table
4. View all submitted feedback messages with timestamps

## Next Steps

- Consider adding email notifications for new feedback
- Set up automated responses
- Add feedback categorization
- Create an admin dashboard for feedback management
