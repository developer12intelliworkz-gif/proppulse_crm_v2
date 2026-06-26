-- Create projects table with all required fields for multi-step form
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Step 1: About the Project
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rera_project_id VARCHAR(100),
  sales VARCHAR(100),
  notify_to_emails TEXT[],
  launched_on DATE,
  expected_completion DATE,
  possession DATE,
  is_active BOOLEAN DEFAULT true,
  inventory BOOLEAN DEFAULT false,
  
  -- Step 2: Address Information
  search_address TEXT,
  address TEXT,
  street VARCHAR(255),
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  zip VARCHAR(20),
  locality VARCHAR(255),
  latitude VARCHAR(50),
  longitude VARCHAR(50),
  
  -- Step 3: Virtual Walkthrough
  enable_vr BOOLEAN DEFAULT false,
  vr_app_id VARCHAR(100),
  
  -- Step 4: Amenities (JSONB for flexibility)
  amenities JSONB DEFAULT '{}',
  
  -- Step 6: Portal Integration
  india_property_code VARCHAR(100),
  magicbricks_code VARCHAR(100),
  
  -- Form status tracking
  status VARCHAR(20) DEFAULT 'draft',
  completed_steps JSONB DEFAULT '[]'
);

-- Create project_specifications table
CREATE TABLE IF NOT EXISTS public.project_specifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_brochures table
CREATE TABLE IF NOT EXISTS public.project_brochures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  subject VARCHAR(255),
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_price_quotes table
CREATE TABLE IF NOT EXISTS public.project_price_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  subject VARCHAR(255),
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_brochures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_price_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = created_by);

-- RLS Policies for project_specifications
CREATE POLICY "Users can view specifications of their projects" 
ON public.project_specifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_specifications.project_id 
  AND projects.created_by = auth.uid()
));

CREATE POLICY "Users can create specifications for their projects" 
ON public.project_specifications 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_specifications.project_id 
  AND projects.created_by = auth.uid()
));

CREATE POLICY "Users can update specifications of their projects" 
ON public.project_specifications 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_specifications.project_id 
  AND projects.created_by = auth.uid()
));

CREATE POLICY "Users can delete specifications of their projects" 
ON public.project_specifications 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_specifications.project_id 
  AND projects.created_by = auth.uid()
));

-- RLS Policies for project_brochures
CREATE POLICY "Users can manage brochures of their projects" 
ON public.project_brochures 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_brochures.project_id 
  AND projects.created_by = auth.uid()
));

-- RLS Policies for project_price_quotes
CREATE POLICY "Users can manage price quotes of their projects" 
ON public.project_price_quotes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE projects.id = project_price_quotes.project_id 
  AND projects.created_by = auth.uid()
));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();