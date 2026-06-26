-- Create projects table with all required fields
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  name CHARACTER VARYING NOT NULL,
  description TEXT,
  rera_project_id CHARACTER VARYING,
  sales CHARACTER VARYING,
  notify_to_emails TEXT[],
  launched_on DATE,
  expected_completion DATE,
  possession DATE,
  is_active BOOLEAN DEFAULT true,
  inventory BOOLEAN DEFAULT false,
  enable_vr BOOLEAN DEFAULT false,
  vr_app_id CHARACTER VARYING,
  amenities JSONB DEFAULT '[]'::jsonb,
  search_address TEXT,
  address TEXT,
  street CHARACTER VARYING,
  country CHARACTER VARYING,
  state CHARACTER VARYING,
  city CHARACTER VARYING,
  zip CHARACTER VARYING,
  locality CHARACTER VARYING,
  latitude CHARACTER VARYING,
  longitude CHARACTER VARYING,
  india_property_code CHARACTER VARYING,
  magicbricks_code CHARACTER VARYING,
  status CHARACTER VARYING DEFAULT 'draft',
  completed_steps JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create project_specifications table
CREATE TABLE IF NOT EXISTS public.project_specifications (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title CHARACTER VARYING NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_brochures table
CREATE TABLE IF NOT EXISTS public.project_brochures (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name CHARACTER VARYING NOT NULL,
  active BOOLEAN DEFAULT true,
  subject CHARACTER VARYING,
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_price_quotes table
CREATE TABLE IF NOT EXISTS public.project_price_quotes (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  subject CHARACTER VARYING,
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_banners table
CREATE TABLE IF NOT EXISTS public.project_banners (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  banner_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_brochures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_price_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for project_specifications
CREATE POLICY "Users can view specifications of their projects" ON public.project_specifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_specifications.project_id 
    AND projects.created_by = auth.uid()
  ));

CREATE POLICY "Users can create specifications for their projects" ON public.project_specifications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_specifications.project_id 
    AND projects.created_by = auth.uid()
  ));

CREATE POLICY "Users can update specifications of their projects" ON public.project_specifications
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_specifications.project_id 
    AND projects.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete specifications of their projects" ON public.project_specifications
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_specifications.project_id 
    AND projects.created_by = auth.uid()
  ));

-- RLS Policies for project_brochures
CREATE POLICY "Users can manage brochures of their projects" ON public.project_brochures
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_brochures.project_id 
    AND projects.created_by = auth.uid()
  ));

-- RLS Policies for project_price_quotes
CREATE POLICY "Users can manage price quotes of their projects" ON public.project_price_quotes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_price_quotes.project_id 
    AND projects.created_by = auth.uid()
  ));

-- RLS Policies for project_banners
CREATE POLICY "Users can manage banners of their projects" ON public.project_banners
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_banners.project_id 
    AND projects.created_by = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_specifications_project_id ON public.project_specifications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_brochures_project_id ON public.project_brochures(project_id);
CREATE INDEX IF NOT EXISTS idx_project_price_quotes_project_id ON public.project_price_quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_banners_project_id ON public.project_banners(project_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();