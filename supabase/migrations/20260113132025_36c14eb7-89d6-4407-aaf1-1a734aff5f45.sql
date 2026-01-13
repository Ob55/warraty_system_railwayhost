-- Create enum for product types
CREATE TYPE public.product_type AS ENUM ('EPC', 'LPG', 'OTHER');

-- Create enum for warranty status
CREATE TYPE public.warranty_status AS ENUM ('active', 'expired');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create products table (with static QR codes)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type product_type NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  qr_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranty_owners table (users with access codes)
CREATE TABLE public.warranty_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create warranties table
CREATE TABLE public.warranties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.warranty_owners(id) ON DELETE CASCADE NOT NULL,
  activation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '365 days'),
  status warranty_status NOT NULL DEFAULT 'active',
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for admin management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Products policies
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Warranty owners policies
CREATE POLICY "Warranty owners are viewable by everyone"
  ON public.warranty_owners FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create warranty owner"
  ON public.warranty_owners FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update warranty owners"
  ON public.warranty_owners FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete warranty owners"
  ON public.warranty_owners FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Warranties policies
CREATE POLICY "Warranties are viewable by everyone"
  ON public.warranties FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create warranty"
  ON public.warranties FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update warranty view count"
  ON public.warranties FOR UPDATE
  USING (true);

CREATE POLICY "Only admins can delete warranties"
  ON public.warranties FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warranty_owners_updated_at
  BEFORE UPDATE ON public.warranty_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warranties_updated_at
  BEFORE UPDATE ON public.warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-update warranty status
CREATE OR REPLACE FUNCTION public.update_warranty_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date < CURRENT_DATE THEN
    NEW.status = 'expired';
  ELSE
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_update_warranty_status
  BEFORE INSERT OR UPDATE ON public.warranties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_warranty_status();

-- Create function to generate access code
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create function to generate QR code data (URL-safe string)
CREATE OR REPLACE FUNCTION public.generate_qr_code_data(product_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(product_id::text::bytea, 'base64');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Enable realtime for warranties table
ALTER PUBLICATION supabase_realtime ADD TABLE public.warranties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;