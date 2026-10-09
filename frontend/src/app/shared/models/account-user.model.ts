export interface AccountUser {
  id: number;
  email: string;
  username: string;
  registration_number: string;
  first_name: string;
  last_name: string;
  cellphone: string | null;
  is_staff: boolean;
}
