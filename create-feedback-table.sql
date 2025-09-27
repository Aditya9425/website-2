-- Create feedback table for storing user feedback
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'new'
);

-- Enable Row Level Security (RLS)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert feedback (anonymous users can submit)
CREATE POLICY "Allow anonymous feedback submission" ON feedbacks
    FOR INSERT 
    WITH CHECK (true);

-- Create policy to allow admin to read all feedback
CREATE POLICY "Allow admin to read feedback" ON feedbacks
    FOR SELECT 
    USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);