CREATE TABLE IF NOT EXISTS admin_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('positive', 'negative', 'suggestion')),
  feedback_text TEXT NOT NULL,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_feedback_created ON admin_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_type ON admin_feedback(type);
CREATE INDEX IF NOT EXISTS idx_admin_feedback_user ON admin_feedback(user_id);
