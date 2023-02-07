export const ROUTES = {
	dashboard: {
		base: 'dashboard',
	},
	account: {
		base: 'account'
	},
	tickets: {
		base: 'tickets',
	},
	chat: {
		base: 'chat'
	},
	notifications: {
		base: 'notifications',
	},
	billing: {
		base: 'billing'
	},
	users: {
		base: 'users',
		profile: ':id',
		settings: 'settings',
		edit: 'user/edit/:id',
		delete: 'user/delete/:id',
		add: 'user/add'
	},
  numberman: {
    management: '/service/numberman',
    add: '/service/numberman/add',
    edit: '/service/numberman/edit/:id',
    delete: '/service/numberman/delete/:id'
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
      management: '/service/numberman',
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
	system: {
		base: 'system',
		general: 'general',
		customers: {
			base: 'customers',
			list: 'customer-list',
			users: 'users',
			profiles: 'profiles'
		}
	},
};

export const PATHS = {

	// CALL
	log: `/${ROUTES.services.base}/${ROUTES.services.call.base}/${ROUTES.services.call.logs.log}`,
	maps: `/${ROUTES.services.base}/${ROUTES.services.call.base}/${ROUTES.services.call.logs}/${ROUTES.services.call.logs.maps}`,
	export: `/${ROUTES.services.base}/${ROUTES.services.call.base}/${ROUTES.services.call.logs}/${ROUTES.services.call.logs.export}`,
	blocked: `/${ROUTES.services.base}/${ROUTES.services.call.base}/${ROUTES.services.call.settings}/${ROUTES.services.call.settings.blocked}`,
	dncl: `/${ROUTES.services.base}/${ROUTES.services.call.base}/${ROUTES.services.call.settings}/${ROUTES.services.call.settings.dncl}`,
	scoring: `/${ROUTES.services.base}/${ROUTES.services.call.base}/${ROUTES.services.call.settings}/${ROUTES.services.call.settings.scoring}`,

	// NUMBER
	add: `/${ROUTES.services.base}/${ROUTES.services.number.base}/${ROUTES.services.number.add}`,
  port: `/${ROUTES.services.base}/${ROUTES.services.number.base}/${ROUTES.services.number.port}`,
	tracking: `/${ROUTES.services.base}/${ROUTES.services.number.base}/${ROUTES.services.number.tracking}`,
	numsettings: `/${ROUTES.services.base}/${ROUTES.services.number.base}/${ROUTES.services.number.settings}`,
  management: `/${ROUTES.services.base}/${ROUTES.services.number.base}/${ROUTES.services.number.management}`,

	// ROUTING
	ivr: `/${ROUTES.services.base}/${ROUTES.services.routing.base}/${ROUTES.services.routing.ivr}`,
	schedules: `/${ROUTES.services.base}/${ROUTES.services.routing.base}/${ROUTES.services.routing.schedules}`,
	receiving: `/${ROUTES.services.base}/${ROUTES.services.routing.base}/${ROUTES.services.routing.receiving}`,
	sipgateway: `/${ROUTES.services.base}/${ROUTES.services.routing.base}/${ROUTES.services.routing.sipgateway}`,

	// DYNAMIC NUMBERS
	target: `/${ROUTES.services.base}/${ROUTES.services.dynamic.base}/${ROUTES.services.dynamic.target}`,
	trackingsource: `/${ROUTES.services.base}/${ROUTES.services.dynamic.base}/${ROUTES.services.dynamic.trackingsource}`,
	trackingcode: `/${ROUTES.services.base}/${ROUTES.services.dynamic.base}/${ROUTES.services.dynamic.trackingcode}`,

	// DIALERS
	auto: `/${ROUTES.services.base}/${ROUTES.services.dialers.base}/${ROUTES.services.dialers.auto}`,

	// REPORTING
	// tslint:disable-next-line: max-line-length
	overview: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.custom.base}/${ROUTES.services.reporting.custom.overview}`,
	// tslint:disable-next-line: max-line-length
	activity: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.reports.base}/${ROUTES.services.reporting.reports.activity}`,
	// tslint:disable-next-line: max-line-length
	roi: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.reports.base}/${ROUTES.services.reporting.reports.roi}`,
	// tslint:disable-next-line: max-line-length
	accuracy: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.reports.base}/${ROUTES.services.reporting.reports.accuracy}`,
	// tslint:disable-next-line: max-line-length
	account: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.usage.base}/${ROUTES.services.reporting.usage.account}`,
	// tslint:disable-next-line: max-line-length
	notification: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.notification.base}/${ROUTES.services.reporting.notification.notifications}`,
	// tslint:disable-next-line: max-line-length
	reports: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.settings.base}/${ROUTES.services.reporting.settings.reports}`,
	// tslint:disable-next-line: max-line-length
	tags: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.settings.base}/${ROUTES.services.reporting.settings.tags}`,
	// tslint:disable-next-line: max-line-length
	keywords: `/${ROUTES.services.base}/${ROUTES.services.reporting.base}/${ROUTES.services.reporting.settings.base}/${ROUTES.services.reporting.settings.keywords}`,

	// SYSTEM
	general: `/${ROUTES.system.base}/${ROUTES.system.general}`,
	list: `/${ROUTES.system.base}/${ROUTES.system.customers.base}/${ROUTES.system.customers.list}`,
	users: `/${ROUTES.system.base}/${ROUTES.system.customers.base}/${ROUTES.system.customers.users}`,
	profiles: `/${ROUTES.system.base}/${ROUTES.system.customers.base}/${ROUTES.system.customers.profiles}`,

	// GENERAL
	dashboard: `/${ROUTES.services.base}/${ROUTES.dashboard.base}`,
	tickets: `/${ROUTES.tickets.base}`,
	notifications: `/${ROUTES.notifications.base}`,
	chat: `/${ROUTES.chat.base}`,

	// USER
	profile: `/${ROUTES.users.base}/`,
	billing: `/${ROUTES.services.base}/${ROUTES.billing.base}`,
	settings: `/${ROUTES.users.base}/${ROUTES.users.settings}`,
	useredit: `/${ROUTES.users.edit}/:id`
	// account_setting: `/${ROUTES.users.edit}/`
};
