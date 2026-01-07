
export type View = 
  | 'dashboard' 
  | 'tickets' 
  | 'review_reports' 
  | 'customers' 
  | 'schedule' 
  | 'reports' 
  | 'settings' 
  | 'supports' 
  | 'brand_ivoomi' 
  | 'brand_elista'
  | 'laptop_dashboard'
  | 'laptop_data'
  | 'task_dashboard'
  | 'task_my_works'
  | 'task_schedule'
  | 'task_reports'
  | 'staff_reports_dashboard'
  | 'staff_reports_financial'
  | 'staff_reports_ratings'
  | 'customer_dashboard' 
  | 'customer_supports' 
  | 'customer_profile';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'CUSTOMER';

export interface AppNotification {
  id: string;
  userId: string; // The specific owner of this notification
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'urgent';
  read: boolean;
  link?: View;
}

export interface OperationalZone {
  id: string;
  name: string;
  color: string;
  headBranchId?: string;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  password?: string;
  photo?: string;
  experience?: string;
  mobile?: string;
  address?: string;
  zoneId?: string; // Assigned operational zone
  storeId?: string; // Assigned primary store location
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  city?: string;
  pincode?: string;
  notes?: string;
}

export interface TicketHistory {
  id: string;
  date: string;
  timestamp: number;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
}

export interface Ticket {
  id: string;
  ticketId: string;
  customerId: string;
  name: string;
  number: string;
  email: string;
  address: string;
  date: string;
  deviceType: string;
  brand?: string;
  model?: string;
  serial?: string;
  chargerIncluded?: boolean;
  deviceDescription?: string;
  store: string;
  status: string;
  priority: string;
  issueDescription: string;
  estimatedAmount?: number;
  holdReason?: string;
  progressReason?: string;
  progressNote?: string;
  warranty: boolean;
  billNumber?: string;
  assignedToId?: string;
  scheduledDate?: string;
  history?: TicketHistory[];
  zoneId?: string; // Tagged zone
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  assignedToId?: string;
  type: 'general' | 'meeting' | 'maintenance';
  status: 'pending' | 'completed';
  priority?: 'normal' | 'urgent';
  createdBy: string;
  zoneId?: string;
  technicianNote?: string;
}

export interface ChecklistItem { id: string; label: string; }
export interface ChecklistCategory { id: string; title: string; items: ChecklistItem[]; }
export interface ChecklistState { [key: string]: 'pass' | 'fail' | null; }

export interface BatteryStats {
  chargePercent: string;
  remainingPercent: string;
  duration: string;
  health: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Replace';
}

export interface ReportHistory {
  id: string;
  timestamp: number;
  date: string;
  actor: string;
  action: string;
  details: string;
}

export interface Report {
  id: string;
  date: string;
  deviceInfo: {
    laptopNo: string;
    customerName: string;
    technicianName: string;
  };
  checklist: ChecklistState;
  battery: BatteryStats;
 actionRequired: string | null;  
  notes: string;
  status: 'Draft' | 'Completed';
  progress: number;
  history?: ReportHistory[];
  zoneId?: string;
}

export interface OfficialPerformanceRecord {
  id: string;
  techId: string;
  day?: number;
  month: number; 
  year: number;
  attendanceDays?: number;
  fixedUnitsOverride?: number;
  adminBonus?: number;
  adminBonusReason?: string;
  managementCut?: number;
  warrantyReturns?: number;
  salaryPaid?: boolean;
  customersHandled?: number;
  servicesDone?: number;
  sellAmount?: number;
  profitAmount?: number;
  salaryAmount?: number;
  otherExpenses?: number;
  zoneId?: string;
}

export interface AppSettings {
  zones: OperationalZone[];
  stores: Store[];
  deviceTypes: DeviceType[];
  ticketStatuses: TicketStatus[];
  priorities: Priority[];
  holdReasons: HoldReason[];
  progressReasons: ProgressReason[];
  serviceBrands: Brand[];
  laptopDealers: Dealer[];
  sla: SLAConfig;
  teamMembers: User[];
  supportGuidelines: SupportGuideline[];
  officialRecords?: OfficialPerformanceRecord[];
}

export interface Store { 
  id: string; 
  name: string; 
  address?: string;
  phone?: string;
  zoneId?: string; // Assigned zone
}
export interface DeviceType { id: string; name: string; }
export interface TicketStatus { id: string; name: string; isSystem?: boolean; }
export interface Priority { id: string; name: string; }
export interface HoldReason { id: string; name: string; }
export interface ProgressReason { id: string; name: string; }
export interface SLAConfig { high: number; medium: number; low: number; }
export interface Brand { id: string; name: string; }
export interface Dealer { 
  id: string; 
  name: string; 
  address?: string;
  phone?: string;
  serviceTeamPhone?: string;
  officePhone?: string;
  speciality?: string;
  notes?: string;
}
export interface SupportGuideline { id: string; title: string; category: string; content: string; }
