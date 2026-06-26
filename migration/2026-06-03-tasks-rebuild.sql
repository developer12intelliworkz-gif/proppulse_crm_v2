-- Task Management rebuild: flexible associations, status, comments, activity log

CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  due_on TIMESTAMPTZ,
  due_time TIME,
  assignees TEXT[] DEFAULT '{}',
  remark TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(32) DEFAULT 'open',
  document VARCHAR(500),
  created_by TEXT NOT NULL,
  project_id INTEGER,
  lead_id INTEGER,
  association_type VARCHAR(20) DEFAULT 'standalone',
  reminder_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS lead_id INTEGER;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'open';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_time TIME;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS association_type VARCHAR(20) DEFAULT 'standalone';

ALTER TABLE public.tasks ALTER COLUMN project_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.task_activity_log (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_on ON public.tasks(due_on) WHERE deleted_at IS NULL;
