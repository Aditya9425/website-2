-- Create feedbacks table for storing user feedback
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policy to allow public inserts
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert feedback
CREATE POLICY "Allow public to insert feedback" ON feedbacks
    FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users to view feedback (optional)
CREATE POLICY "Allow authenticated users to view feedback" ON feedbacks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT INSERT ON feedbacks TO anon;
GRANT SELECT ON feedbacks TO authenticated;
GRANT USAGE ON SEQUENCE feedbacks_id_seq TO anon;
