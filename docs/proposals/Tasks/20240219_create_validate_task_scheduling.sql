-- Function to validate cron expression
CREATE OR REPLACE FUNCTION is_valid_cron(
  p_cron text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Basic cron format validation
  -- Format: minute hour day_of_month month day_of_week
  IF NOT p_cron ~ '^(\S+\s+){4}\S+$' THEN
    RETURN false;
  END IF;
  
  -- Validate each field
  DECLARE
    v_parts text[];
    v_minute text;
    v_hour text;
    v_dom text;
    v_month text;
    v_dow text;
  BEGIN
    v_parts := regexp_split_to_array(p_cron, '\s+');
    v_minute := v_parts[1];
    v_hour := v_parts[2];
    v_dom := v_parts[3];
    v_month := v_parts[4];
    v_dow := v_parts[5];
    
    -- Minute: 0-59 or *
    IF NOT v_minute ~ '^(\*|[0-9]|[1-5][0-9])(\/[1-9][0-9]?)?$' THEN
      RETURN false;
    END IF;
    
    -- Hour: 0-23 or *
    IF NOT v_hour ~ '^(\*|[0-9]|1[0-9]|2[0-3])(\/[1-9][0-9]?)?$' THEN
      RETURN false;
    END IF;
    
    -- Day of month: 1-31 or *
    IF NOT v_dom ~ '^(\*|[1-9]|[12][0-9]|3[01])(\/[1-9][0-9]?)?$' THEN
      RETURN false;
    END IF;
    
    -- Month: 1-12 or *
    IF NOT v_month ~ '^(\*|[1-9]|1[0-2])(\/[1-9][0-9]?)?$' THEN
      RETURN false;
    END IF;
    
    -- Day of week: 0-6 or *
    IF NOT v_dow ~ '^(\*|[0-6])(\/[1-9][0-9]?)?$' THEN
      RETURN false;
    END IF;
    
    RETURN true;
  END;
END;
$$;

-- Function to validate interval format
CREATE OR REPLACE FUNCTION is_valid_interval(
  p_interval text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate interval format (milliseconds)
  RETURN p_interval ~ '^\d+$' AND
         p_interval::bigint >= 1000 AND -- Minimum 1 second
         p_interval::bigint <= 2592000000; -- Maximum 30 days
END;
$$;

-- Trigger function to validate task scheduling before insert/update
CREATE OR REPLACE FUNCTION validate_task_scheduling()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure at least one scheduling method is specified if task is active
  IF NEW.is_active AND 
     NEW.schedule_cron IS NULL AND 
     NEW.schedule_interval IS NULL AND
     NEW.due_date IS NULL THEN
    RAISE EXCEPTION 'Active task must have either a cron schedule, interval, or due date';
  END IF;
  
  -- Validate cron expression if provided
  IF NEW.schedule_cron IS NOT NULL AND NOT is_valid_cron(NEW.schedule_cron) THEN
    RAISE EXCEPTION 'Invalid cron expression';
  END IF;
  
  -- Validate interval if provided
  IF NEW.schedule_interval IS NOT NULL AND NOT is_valid_interval(NEW.schedule_interval) THEN
    RAISE EXCEPTION 'Invalid interval format. Must be milliseconds between 1 second and 30 days';
  END IF;
  
  -- Validate due date if provided
  IF NEW.due_date IS NOT NULL AND NEW.due_date <= CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'Due date must be in the future';
  END IF;
  
  -- Validate that only one scheduling method is used
  IF (CASE WHEN NEW.schedule_cron IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN NEW.schedule_interval IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN NEW.due_date IS NOT NULL THEN 1 ELSE 0 END) > 1 THEN
    RAISE EXCEPTION 'Task can only use one scheduling method (cron, interval, or due date)';
  END IF;
  
  -- All checks passed
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS task_scheduling_validation ON tasks;
CREATE TRIGGER task_scheduling_validation
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_scheduling(); 