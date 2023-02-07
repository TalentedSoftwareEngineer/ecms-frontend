import { PATHS } from '@app/app.routes';

export interface IService {
	id: number;
	name: string;
	label: string;
	description: string;
}

export interface IServiceItem {
	id: number;
	serviceId: number;
	name: string;
	enabled: boolean;
}

export interface ISubMenu {
	label: string;
	icon: string;
	link: string;
	toggle: boolean;
	enabled: boolean;
	menus?: ISubMenu[];
}

// Hard coded example
export const servicesMenu: ISubMenu[] = [
	// {
	// 	label: 'Home',
	// 	icon: 'home',
	// 	link: PATHS.dashboard,
	// 	enabled: true,
	// 	toggle: false,
	// 	menus: [
	// 		{
	// 			link: PATHS.dashboard,
	// 			label: 'Dashboard',
	// 			enabled: true,
	// 			toggle: false,
	// 			icon: 'bar-chart'
	// 		}
	// 	],
	// },
	{
		label: 'Call',
		icon: 'phone',
		link: PATHS.dashboard,
		enabled: true,
		toggle: false,
		menus: [
			{
				link: PATHS.log,
				label: 'Call Logs',
				enabled: true,
				toggle: false,
				icon: '',
				// icon: 'file-edit',
				// menus: [
				// 	{
				// 		link: PATHS.log,
				// 		label: 'Call Log',
				// 		enabled: true,
				// 		toggle: false,
				// 		icon: 'arrow-right-s'
				// 	},
				// 	// {
				// 	// 	link: PATHS.maps,
				// 	// 	label: 'Maps',
				// 	// 	enabled: true,
				// 	// 	toggle: false,
				// 	// 	icon: 'arrow-right-s'
				// 	// },
				// 	// {
				// 	// 	link: PATHS.export,
				// 	// 	label: 'Export Calls',
				// 	// 	enabled: true,
				// 	// 	toggle: false,
				// 	// 	icon: 'arrow-right-s'
				// 	// },
				// ]
			},
			// {
			// 	link: '#',
			// 	label: 'Settings',
			// 	enabled: true,
			// 	toggle: false,
			// 	icon: 'settings-5',
			// 	menus: [
			// 		{
			// 			link: PATHS.blocked,
			// 			label: 'Blocked Numbers',
			// 			enabled: true,
			// 			toggle: false,
			// 			icon: 'arrow-right-s'
			// 		},
			// 		{
			// 			link: PATHS.dncl,
			// 			label: 'Do Not Call List',
			// 			enabled: true,
			// 			toggle: false,
			// 			icon: 'arrow-right-s'
			// 		},
			// 		{
			// 			link: PATHS.scoring,
			// 			label: 'Scoring',
			// 			enabled: true,
			// 			toggle: false,
			// 			icon: 'arrow-right-s'
			// 		}
			// 	]
			// }
		]
	},
	{
		label: 'Numbers',
		icon: 'numbers',
		link: PATHS.dashboard,
		enabled: true,
		toggle: false,
		menus: [
			{
				link: '#',
				label: 'Management',
				enabled: true,
				toggle: false,
				icon: '',
				// icon: 'keyboard-box',
				menus: [
					{
						link: PATHS.add,
						label: 'Add Numbers',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					},
					{
						link: PATHS.tracking,
						label: 'Tracking Numbers',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					},
					// {
					// 	link: PATHS.port,
					// 	label: 'Port Numbers',
					// 	enabled: true,
					// 	toggle: false,
					// 	icon: 'arrow-right-s'
					// },
					// {
					// 	link: PATHS.numsettings,
					// 	label: 'Call Settings',
					// 	enabled: true,
					// 	toggle: false,
					// 	icon: 'arrow-right-s'
					// },
				]
			},
			{
				link: '#',
				label: 'Routing',
				enabled: true,
				toggle: false,
				icon: '',
				// icon: 'route',
				menus: [
					// {
					// 	link: PATHS.ivr,
					// 	label: 'Voice Menus (IVR)',
					// 	enabled: true,
					// 	toggle: false,
					// 	icon: 'arrow-right-s'
					// },
					// {
					// 	link: PATHS.schedules,
					// 	label: 'Schedules',
					// 	enabled: true,
					// 	toggle: false,
					// 	icon: 'arrow-right-s'
					// },
					{
						link: PATHS.receiving,
						label: 'Receiving Numbers',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					}
				]
			},
			{
				link: '#',
				label: 'Dynamic Numbers',
				enabled: true,
				toggle: false,
				icon: '',
				// icon: 'computer',
				menus: [
					// {
					// 	link: PATHS.target,
					// 	label: 'Target Numbers',
					// 	enabled: true,
					// 	toggle: false,
					// 	icon: 'arrow-right-s'
					// },
					{
						link: PATHS.trackingsource,
						label: 'Tracking Sources',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					},
					// {
					// 	link: PATHS.trackingcode,
					// 	label: 'Tracking Code',
					// 	enabled: true,
					// 	toggle: false,
					// 	icon: 'arrow-right-s'
					// }
				]
			},
			// {
			// 	link: '#',
			// 	label: 'Dialers',
			// 	enabled: true,
			// 	toggle: false,
			// 	icon: 'keyboard',
			// 	menus: [
			// 		{
			// 			link: PATHS.auto,
			// 			label: 'Auto Dialers',
			// 			enabled: true,
			// 			toggle: false,
			// 			icon: 'arrow-right-s'
			// 		},
			// 	]
			// }
		]
	},
	{
		label: 'Reporting',
		icon: 'pie-chart',
		link: PATHS.dashboard,
		enabled: true,
		toggle: false,
		menus: [
			{
				link: '#',
				label: 'Reports',
				enabled: true,
				toggle: false,
				icon: '',
				// icon: 'bar-chart-grouped',
				menus: [
					{
						link: PATHS.activity,
						label: 'Activity Reports',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					},
					{
						link: PATHS.roi,
						label: 'ROI Reports',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					},
					// {
					// 	link: PATHS.accuracy,
					// 	label: 'Accuracy Reports',
					// 	enabled: true,
					// 	toggle: false,
					// 	icon: 'arrow-right-s'
					// }
				]
			},
			{
				link: '#',
				label: 'Custom Reports',
				enabled: true,
				toggle: false,
				icon: '',
				// icon: 'bar-chart',
				menus: [
					{
						link: PATHS.overview,
						label: 'Overview',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					}
				]
			}
			// {
			// 	link: '#',
			// 	label: 'Usage',
			// 	enabled: true,
			// 	toggle: false,
			// 	icon: 'loader-4',
			// 	menus: [
			// 		{
			// 			link: PATHS.account,
			// 			label: 'Account Usage',
			// 			enabled: true,
			// 			toggle: false,
			// 			icon: 'arrow-right-s'
			// 		},
			// 	]
			// },
			// {
			// 	link: '#',
			// 	label: 'Notifications',
			// 	enabled: true,
			// 	toggle: false,
			// 	icon: 'notification',
			// 	menus: [
			// 		{
			// 			link: PATHS.notification,
			// 			label: 'Notifications',
			// 			enabled: true,
			// 			toggle: false,
			// 			icon: 'arrow-right-s'
			// 		},
			// 	]
			// },

		]
	},
	{
		link: '#',
		label: 'Settings',
		enabled: true,
		toggle: false,
		icon: 'settings-3',
		menus: [
			{
				link: '#',
				label: 'User Management',
				enabled: true,
				toggle: false,
				icon: '',
				menus: [
					{
						link: PATHS.profile,
						label: 'Manage Users',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					}
				]
			}
			/*{
				link: '#',
				label: 'Account Management',
				enabled: true,
				toggle: false,
				icon: '',
				menus: [
					{
						link: PATHS.account_setting,
						label: 'Account Settings',
						enabled: true,
						toggle: false,
						icon: 'arrow-right-s'
					}
				]
			}*/
		]
	}
];
