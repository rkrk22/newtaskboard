-- Add status column to tasks so we can distinguish completed items
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo';

-- Enforce limited set of statuses we care about
ALTER TABLE public.tasks
ADD CONSTRAINT IF NOT EXISTS tasks_status_check
CHECK (status IN ('todo', 'done'));
