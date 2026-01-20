-- Create settings table for global configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default warranty limit
INSERT INTO public.settings (key, value) 
VALUES ('default_warranty_limit', '2')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can read settings (needed for edge function)
CREATE POLICY "Everyone can read settings"
  ON public.settings FOR SELECT
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();