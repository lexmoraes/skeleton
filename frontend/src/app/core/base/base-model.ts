/**
 * Every API resource in this app extends BaseModel so BaseService can do
 * generic CRUD by `id` (create()/update()/delete()).
 */
export class BaseModel {
  id?: number;
  created_at?: string;
  updated_at?: string;

  // View-only, never sent to the API (BaseService strips it).
  loading?: boolean;
}

/** Fields that exist only on the client or are read-only on the server. */
export const NON_PAYLOAD_FIELDS = ['id', 'created_at', 'updated_at', 'loading'] as const;
