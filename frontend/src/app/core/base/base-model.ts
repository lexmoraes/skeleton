/**
 * Every API resource in this app extends BaseModel so BaseService can
 * do generic CRUD (create()/update()/delete() rely on `id` and `url`).
 */
export class BaseModel {
  id?: number;
  url?: string;
  created_at?: string;
  updated_at?: string;

  // View-only, never sent to the API.
  loading?: boolean;
}
