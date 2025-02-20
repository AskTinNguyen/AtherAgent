-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependencies(
  p_task_id uuid,
  p_depends_on_task_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_visited uuid[];
  v_is_circular boolean;
BEGIN
  -- Initialize visited array with the current task
  v_visited := ARRAY[p_task_id];
  
  -- Check for circular dependencies
  WITH RECURSIVE dependency_chain AS (
    -- Base case: direct dependencies
    SELECT 
      task_id,
      depends_on_task_id,
      ARRAY[task_id] as path
    FROM task_dependencies
    WHERE task_id = p_depends_on_task_id
    
    UNION ALL
    
    -- Recursive case: follow the chain
    SELECT
      td.task_id,
      td.depends_on_task_id,
      dc.path || td.task_id
    FROM task_dependencies td
    INNER JOIN dependency_chain dc ON td.task_id = dc.depends_on_task_id
    WHERE NOT td.task_id = ANY(dc.path) -- Prevent infinite recursion
  )
  SELECT EXISTS (
    SELECT 1 FROM dependency_chain
    WHERE depends_on_task_id = p_task_id
  ) INTO v_is_circular;
  
  RETURN v_is_circular;
END;
$$;

-- Trigger function to validate dependencies before insert/update
CREATE OR REPLACE FUNCTION validate_task_dependency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the dependency would create a circular reference
  IF check_circular_dependencies(NEW.task_id, NEW.depends_on_task_id) THEN
    RAISE EXCEPTION 'Circular dependency detected';
  END IF;
  
  -- Check if both tasks exist
  IF NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE id IN (NEW.task_id, NEW.depends_on_task_id)
    HAVING COUNT(*) = 2
  ) THEN
    RAISE EXCEPTION 'One or both tasks do not exist';
  END IF;
  
  -- All checks passed
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS task_dependency_validation ON task_dependencies;
CREATE TRIGGER task_dependency_validation
  BEFORE INSERT OR UPDATE ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION validate_task_dependency(); 