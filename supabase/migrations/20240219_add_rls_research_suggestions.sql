-- Enable RLS on research_suggestions table
ALTER TABLE research_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting suggestions
CREATE POLICY "Enable insert for authenticated users with valid session"
ON research_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM research_sessions
    WHERE research_sessions.id = research_suggestions.session_id
    AND research_sessions.user_id = auth.uid()
  )
);

-- Create policy for selecting suggestions
CREATE POLICY "Enable read access for users with access to the session"
ON research_suggestions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM research_sessions
    WHERE research_sessions.id = research_suggestions.session_id
    AND research_sessions.user_id = auth.uid()
  )
);

-- Create policy for updating suggestions
CREATE POLICY "Enable update for users with access to the session"
ON research_suggestions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM research_sessions
    WHERE research_sessions.id = research_suggestions.session_id
    AND research_sessions.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM research_sessions
    WHERE research_sessions.id = research_suggestions.session_id
    AND research_sessions.user_id = auth.uid()
  )
);

-- Create policy for deleting suggestions
CREATE POLICY "Enable delete for users with access to the session"
ON research_suggestions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM research_sessions
    WHERE research_sessions.id = research_suggestions.session_id
    AND research_sessions.user_id = auth.uid()
  )
); 