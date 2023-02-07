import { ReceivingNumber } from './receiving-number'
import { SipGateways } from './sip-gateway'

export interface RoutingAction {
  id?: number;
  action: string;
  sip_gatewayId: number;
  receiving_numberId: number;

  SipGateways?: SipGateways;
  ReceivingNumber?: ReceivingNumber;
}

export const RoutingActionEnum = {
  ForwardTo: {
    key: 'FORWARD_TO',
    value: 'Forward to'
  },
  RemapForwardTo: {
    key: 'REMAP_FORWARD_TO',
    value: 'Remap forward to'
  }
}
