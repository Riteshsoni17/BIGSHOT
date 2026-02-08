export type Role = "admin" | "operator" | "viewer";

export type Shipment = {
  id: string;
  awb: string;
  customer_name: string;
  phone: string | null;
  address: string | null;
  pincode: string | null;
  courier: string | null;
  shipment_date: string | null;
  expected_delivery: string | null;
  cod_amount: number | null;
  current_status: string | null;
  remarks: string | null;
  last_updated_at: string;
  created_by: string | null;
  created_at: string;
};

export type ShipmentUpdate = {
  id: string;
  shipment_id: string;
  status: string;
  remark: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
  created_by_profile?: { full_name: string | null } | null;
};

export type Profile = {
  user_id: string;
  role: Role;
  full_name: string | null;
  created_at: string;
};
