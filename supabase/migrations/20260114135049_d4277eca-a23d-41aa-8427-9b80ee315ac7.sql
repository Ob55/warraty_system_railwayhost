-- Create serial_numbers table
CREATE TABLE public.serial_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used')),
  warranty_id UUID REFERENCES public.warranties(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Serial numbers are viewable by everyone"
ON public.serial_numbers
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert serial numbers"
ON public.serial_numbers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update serial numbers"
ON public.serial_numbers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete serial numbers"
ON public.serial_numbers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_serial_numbers_serial ON public.serial_numbers(serial_number);
CREATE INDEX idx_serial_numbers_status ON public.serial_numbers(status);