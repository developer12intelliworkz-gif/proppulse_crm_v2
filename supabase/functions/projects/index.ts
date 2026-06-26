import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'
import { corsHeaders } from '../_shared/cors.ts'

interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description?: string
          rera_project_id?: string
          sales?: string
          notify_to_emails?: string[]
          launched_on?: string
          expected_completion?: string
          possession?: string
          is_active?: boolean
          inventory?: boolean
          enable_vr?: boolean
          vr_app_id?: string
          amenities?: any
          search_address?: string
          address?: string
          street?: string
          country?: string
          state?: string
          city?: string
          zip?: string
          locality?: string
          latitude?: string
          longitude?: string
          india_property_code?: string
          magicbricks_code?: string
          status?: string
          completed_steps?: any
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
        }
        Insert: {
          name: string
          description?: string
          rera_project_id?: string
          sales?: string
          notify_to_emails?: string[]
          launched_on?: string
          expected_completion?: string
          possession?: string
          is_active?: boolean
          inventory?: boolean
          enable_vr?: boolean
          vr_app_id?: string
          amenities?: any
          search_address?: string
          address?: string
          street?: string
          country?: string
          state?: string
          city?: string
          zip?: string
          locality?: string
          latitude?: string
          longitude?: string
          india_property_code?: string
          magicbricks_code?: string
          status?: string
          completed_steps?: any
          created_by?: string
        }
        Update: {
          name?: string
          description?: string
          rera_project_id?: string
          sales?: string
          notify_to_emails?: string[]
          launched_on?: string
          expected_completion?: string
          possession?: string
          is_active?: boolean
          inventory?: boolean
          enable_vr?: boolean
          vr_app_id?: string
          amenities?: any
          search_address?: string
          address?: string
          street?: string
          country?: string
          state?: string
          city?: string
          zip?: string
          locality?: string
          latitude?: string
          longitude?: string
          india_property_code?: string
          magicbricks_code?: string
          status?: string
          completed_steps?: any
          updated_at?: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Set auth
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const projectId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'GET':
        if (projectId && projectId !== 'projects') {
          // Get single project with related data
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
              *,
              project_specifications(*),
              project_brochures(*),
              project_price_quotes(*),
              project_banners(*)
            `)
            .eq('id', projectId)
            .eq('created_by', user.id)
            .single()

          if (projectError) {
            console.error('Error fetching project:', projectError)
            return new Response(
              JSON.stringify({ error: 'Project not found' }),
              { 
                status: 404, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          return new Response(
            JSON.stringify({ data: project }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          // Get all projects
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('created_by', user.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

          if (projectsError) {
            console.error('Error fetching projects:', projectsError)
            return new Response(
              JSON.stringify({ error: 'Failed to fetch projects' }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          return new Response(
            JSON.stringify({ data: projects }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

      case 'POST':
        const createData = await req.json()
        
        // Extract related data
        const { 
          specifications = [], 
          brochures = [], 
          priceQuotes = [], 
          banners = [], 
          ...projectData 
        } = createData

        // Create project
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            ...projectData,
            created_by: user.id
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating project:', createError)
          return new Response(
            JSON.stringify({ error: 'Failed to create project' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Create related data
        if (specifications.length > 0) {
          await supabase
            .from('project_specifications')
            .insert(specifications.map((spec: any) => ({
              ...spec,
              project_id: newProject.id
            })))
        }

        if (brochures.length > 0) {
          await supabase
            .from('project_brochures')
            .insert(brochures.map((brochure: any) => ({
              ...brochure,
              project_id: newProject.id
            })))
        }

        if (priceQuotes.length > 0) {
          await supabase
            .from('project_price_quotes')
            .insert(priceQuotes.map((quote: any) => ({
              ...quote,
              project_id: newProject.id
            })))
        }

        if (banners.length > 0) {
          await supabase
            .from('project_banners')
            .insert(banners.map((banner: any) => ({
              ...banner,
              project_id: newProject.id
            })))
        }

        return new Response(
          JSON.stringify({ data: newProject }),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'PUT':
        if (!projectId || projectId === 'projects') {
          return new Response(
            JSON.stringify({ error: 'Project ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const updateData = await req.json()
        const { 
          specifications = [], 
          brochures = [], 
          priceQuotes = [], 
          banners = [], 
          ...projectUpdateData 
        } = updateData

        // Update project
        const { data: updatedProject, error: updateError } = await supabase
          .from('projects')
          .update({
            ...projectUpdateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
          .eq('created_by', user.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating project:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update project' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Update related data (delete and recreate for simplicity)
        await supabase.from('project_specifications').delete().eq('project_id', projectId)
        await supabase.from('project_brochures').delete().eq('project_id', projectId)
        await supabase.from('project_price_quotes').delete().eq('project_id', projectId)
        await supabase.from('project_banners').delete().eq('project_id', projectId)

        // Recreate related data
        if (specifications.length > 0) {
          await supabase
            .from('project_specifications')
            .insert(specifications.map((spec: any) => ({
              ...spec,
              project_id: projectId
            })))
        }

        if (brochures.length > 0) {
          await supabase
            .from('project_brochures')
            .insert(brochures.map((brochure: any) => ({
              ...brochure,
              project_id: projectId
            })))
        }

        if (priceQuotes.length > 0) {
          await supabase
            .from('project_price_quotes')
            .insert(priceQuotes.map((quote: any) => ({
              ...quote,
              project_id: projectId
            })))
        }

        if (banners.length > 0) {
          await supabase
            .from('project_banners')
            .insert(banners.map((banner: any) => ({
              ...banner,
              project_id: projectId
            })))
        }

        return new Response(
          JSON.stringify({ data: updatedProject }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'DELETE':
        if (!projectId || projectId === 'projects') {
          return new Response(
            JSON.stringify({ error: 'Project ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Soft delete
        const { error: deleteError } = await supabase
          .from('projects')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', projectId)
          .eq('created_by', user.id)

        if (deleteError) {
          console.error('Error deleting project:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete project' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Project deleted successfully' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})