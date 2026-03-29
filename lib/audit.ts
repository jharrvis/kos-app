import { createClient } from '@/lib/supabase/server'

export async function logAdminAction(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>
) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('audit_logs').insert({
    admin_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata: metadata || null,
  })

  if (error) {
    console.error('Failed to log admin action:', error)
  }
}

export async function requireAdminRole(userId: string) {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || profile?.role !== 'admin') {
    return false
  }

  return true
}
