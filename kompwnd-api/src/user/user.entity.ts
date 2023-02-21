import { Date } from 'neo4j-driver';

export class User {
  id?: string;
  account_name: string;
  pin_hash?: string;
  current_role?: string;
  created_at?: Date;
}
