export enum FilterDate {
  range = 'range',
  today = 'today',
  yesterday = 'yesterday',
  thisWeek = 'thisWeek',
  lastWeek = 'lastWeek',
  thisMonth = 'thisMonth',
  lastMonth = 'lastMonth',
  last7 = 'last7',
  last30 = 'last30',
}

  // filter params
 export const DateOptions = [
    {value: FilterDate.range, text: 'Is Between'},
    {value: FilterDate.today, text: 'Is Today'},
    {value: FilterDate.yesterday, text: 'Is Yesterday'},
    {value: FilterDate.thisWeek, text: 'Is This Week'},
    {value: FilterDate.lastWeek, text: 'Is Last Week'},
    {value: FilterDate.thisMonth, text: 'Is This Month'},
    {value: FilterDate.lastMonth, text: 'Is Last Month'},
    {value: FilterDate.last7, text: 'Is Last 7 Days'},
    {value: FilterDate.last30, text: 'Is Last 30 Days'},
 ]

export const DateButtonOptions = [
  {value: FilterDate.today, text: 'Today'},
  {value: FilterDate.yesterday, text: 'Yesterday'},
  // {value: FilterDate.thisWeek, text: 'This Week'},
  {value: FilterDate.lastWeek, text: 'Last Week'},
  {value: FilterDate.thisMonth, text: 'This Month'},
  {value: FilterDate.lastMonth, text: 'Last Month'},
  {value: FilterDate.last7, text: 'Last 7 Days'},
  {value: FilterDate.last30, text: 'Last 30 Days'},
  {value: FilterDate.range, text: 'Between'},
]

export enum CMSUserType {
  superAdmin = 'super_admin',
  primaryAdmin = 'primary_admin',
  administrator = 'administrator',
  normalUser = 'normal_user'
}

export const AnimationInterval = 1000
export const NoPermissionAlertInteral = 2000

export const ROUTE_TO_SIP_URI = "ROUTE_TO_SIP_URI"

export const RECEIVING_NUMBER_ROUTES = [{
    value: ROUTE_TO_SIP_URI,
    desc: "Route to sip uri"
}]

export const USER_TYPE_ADMINISTRATOR  = "ADMINISTRATOR"
export const USER_TYPE_NORMAL_USER    = "NORMAL_USER"

export const PERMISSION_TYPE_ALL      = "PERMITALL"
export const PERMISSION_TYPE_READONLY = "READONLY"
export const PERMISSION_TYPE_DENY     = "DENY"

export const PERMISSION_READABLE      = "readable"
export const PERMISSION_WRITEABLE     = "writeable"

export const PERMISSION_ID_DENY       = 1
export const PERMISSION_ID_READONLY   = 2
export const PERMISSION_ID_ALL        = 3

export const GUI_VISIBILITY_MATCH = {
  CallLogs: 'Call Logs',
  Dashboard: 'Dashboard',
  NumbersManagement: 'Buy Numbers',
  TrackingNumbers: 'Tracking Number',
  Overview: 'Overview',
  TrackingSources: 'Tracking Sources',
  ActivityReports: 'Activity Reports',
  ReceivingNumbers: 'Receiving Numbers',
  SipGateways: 'Sip Gateways',
  Role: 'Manage Roles',
  User: 'Manage Users',
  Customer: 'Manage Customers',
  Billing: 'Manage Billing',
}

export const DEFAULT_PRIMARY_ADMIN_PASSWORD = "default2021!!"
