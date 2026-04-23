import { db } from '@/lib/supabase'

export type AuditActionType =
  | 'SECURITY_LOGIN'
  | 'SECURITY_LOGOUT'
  | 'ACCESS_SHARE_LINK_GENERATED'
  | 'ACCESS_SHARE_LINK_OPENED'
  | 'DATA_DESTRUCTION'
  | 'ADMIN_OVERRIDE';

export const auditLogger = {
  /**
   * Main dispatch proxy for generic frontend interactions
   */
  log: async (userId: string, action: AuditActionType, entityType: string, entityId: string | undefined, metadata: Record<string, any> = {}) => {
    try {
      await db.from('audit_logs').insert([{
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata
      }])
    } catch (error) {
      console.warn('Silent audit failure', error) // Never block UI threads
    }
  },

  logLogin: (userId: string,  method: string) => 
    auditLogger.log(userId, 'SECURITY_LOGIN', 'system.auth', undefined, { provider: method }),
    
  logLogout: (userId: string) => 
    auditLogger.log(userId, 'SECURITY_LOGOUT', 'system.auth', undefined, {}),

  logShareLinkGenerated: (userId: string, projectId: string) =>
    auditLogger.log(userId, 'ACCESS_SHARE_LINK_GENERATED', 'projects', projectId, {}),
}
