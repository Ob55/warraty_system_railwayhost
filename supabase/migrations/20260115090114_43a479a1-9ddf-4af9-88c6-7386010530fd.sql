-- Add warranty_limit column to warranty_owners table (default 2)
ALTER TABLE public.warranty_owners 
ADD COLUMN warranty_limit INTEGER NOT NULL DEFAULT 2;

-- Add comment
COMMENT ON COLUMN public.warranty_owners.warranty_limit IS 'Maximum number of warranties this phone number can register';