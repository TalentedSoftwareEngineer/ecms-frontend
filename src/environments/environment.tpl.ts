export const environment = {
	production: true,
	api: {
		core: {
			uri: '{{BACKEND_PROTO}}://{{HOST_FQDN}}:{{BACKEND_HTTPS_PORT}}',
			path: '/api/v1'
		},
		ws: {
			uri: 'ws://{{HOST_IP}}:8081'
		}
	},
  stripe: {
    key: "{{STRIPE_CLIENT_KEY}}"
  }
};
