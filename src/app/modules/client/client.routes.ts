export const RouteNames = {
  auth: {
    login: 'auth/login',
    signup: 'auth/signup'
  },
  dashboard: '/service/dashboard',
  callLogs: '/service/call-log',
  user: {
    users: '/service/user',
    add: 'service/user/add/:id',
    edit: 'service/user/edit/:id',
    delete: 'service/user/delete/:id',
  },
  billing: 'billing',
  receiving: {
    numbers: '/service/routing/receiving',
    sipgateways: '/service/routing/sipgateway'
  },
  numberman: {
    management: '/service/numberman',
    add: 'service/numberman/add',
    edit: 'service/numberman/edit/:id',
    delete: 'service/numberman/delete/:id'
  },
  tracking_number: {
    numbers: '/service/tracking-number',
    setup: '/service/tracking-number/setup',
    add: '/service/tracking-number/add',
    edit: 'service/tracking-number/edit/:id',
    delete: 'service/tracking-number/delete/:id'
  },
  tracking_source: {
    sources: '/service/tracking-source',
    add: 'service/tracking-source/add',
    edit: 'service/tracking-source/:id'
  },
  reports: {
    activity_reports: '/service/reporting/reports/activity-reports',
    roi_reports: '/service/reporting/reports/roi-reports',
    overview: '/service/reporting/custom-reports/overview'
  },
  customer: {
    customers: '/service/customer',
    add: 'service/customer/add/:id',
    edit: 'service/customer/edit/:id',
    delete: 'service/customer/delete/:id',
  },
  role: {
    roles: '/service/role',
    add: 'service/role/add/:id',
    edit: 'service/role/edit/:id',
    delete: 'service/role/delete/:id',
  },
  services: {
    base: 'services',
    call: {
      base: 'call',
      logs: {
        base: 'logs',
        log: 'call-log',
        log_edit: 'call-log/edit/:id/:tag',
        maps: 'maps',
        export: 'export-calls'
      },
      settings: {
        base: 'settings',
        blocked: 'blocked-numbers',
        dncl: 'donotcall-list',
        scoring: 'scoring'
      }
    },
    number: {
      base: 'number',
      add: 'add-numbers',
      tracking: 'tracking-numbers',
      tracking_edit: 'tracking-numbers/edit/:id',
      tracking_delete: 'tracking-numbers/delete/:id',
      port: 'port-numbers',
      settings: 'call-settings'
    },
    routing: {
      base: 'routing',
      ivr: 'ivr',
      schedules: 'schedules',
      receiving: 'receiving',
      receiving_edit: 'receiving/edit/:id',
      receiving_add: 'receiving/add',
      receiving_delete: 'receiving/delete/:id',
      sipgateway: 'sipgateway',
      sipgateway_edit: 'sipgateway/edit/:id',
      sipgateway_add: 'sipgateway/add',
      sipgateway_delete: 'sipgateway/delete/:id'
    },
    dynamic: {
      base: 'dynamic',
      target: 'target',
      trackingsource: 'tracking-sources',
      trackingsource_edit: 'tracking-sources/edit/:id',
      trackingsource_new: 'tracking-sources/new',
      assignment: 'assignment',
      trackingcode: 'tracking-code'
    },
    dialers: {
      base: 'dialers',
      auto: 'auto-dialers'
    },
    reporting: {
      base: 'reporting',
      custom: {
        base: 'custom-reports',
        overview: 'overview'
      },
      reports: {
        base: 'reports',
        activity: 'activity-reports',
        roi: 'roi-reports',
        accuracy: 'accuracy-reports'
      },
      usage: {
        base: 'usage',
        account: 'account-usage'
      },
      notification: {
        base: 'notification',
        notifications: 'notifications'
      },
      settings: {
        base: 'settings',
        reports: 'reports',
        tags: 'tags',
        keywords: 'keywords-spotting'
      }
    }
  },
}
