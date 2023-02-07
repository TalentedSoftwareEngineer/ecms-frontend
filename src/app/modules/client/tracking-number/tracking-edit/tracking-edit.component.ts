import {ConfirmationService, MessageService} from 'primeng/api';
import { routingFormValidator } from './../routing-form-validator';
import { Location} from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@services/api/api.service';
import { FormGroup, Validators, FormControl } from '@angular/forms'
import { Country, GetNumbers, GetSources } from '@app/models/tracking_numbers';
import { DialNumber, ReceivingNumber } from '@app/models/receiving-number';
import { AnimationInterval, PERMISSION_TYPE_ALL, PERMISSION_TYPE_DENY, CMSUserType, NoPermissionAlertInteral } from '../../constant';
import { RoutingActionEnum } from '../../../../models/routing-action';
import { SipGateways } from '../../../../models/sip-gateway';
import { StoreService } from '../../../../services/store/store.service';
import { RouteNames } from '@app/modules/client/client.routes';
import { catchError, tap } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: 'app-tracking-edit',
  templateUrl: './tracking-edit.component.html',
  styleUrls: ['./tracking-edit.component.scss'],
  providers: [ConfirmationService],
  animations: [
  ]
})

export class TrackingEditComponent implements OnInit {

  dialogPosition: string = "top";

  id = null
  currentSection = 'number-name'
  data: GetNumbers
  sources: GetSources[] = []
  // filteredSources: GetSources[] = []
  countries: Country[]
  filteredCountries: Country[]
  isCollapsed = false
  selectedCountry: Country
  dialNumbers: DialNumber[] = []
  isOpen = false
  customerList: any[] = []
  originCustomerId: number = null
  open = false

  cmsUserType = CMSUserType

  isReleasing = false     // the flag if the tracking number is releasing

  routingAction = RoutingActionEnum.ForwardTo.key
  sipGatewayId: any = 0
  receivingNumberId: any = 0
  receivingNumbers: ReceivingNumber[]
  sipGateways: SipGateways[]

  object = Object
  routingActionEnum = RoutingActionEnum

  routingForm: FormGroup

  selectedSource : GetSources
  selectedCustomer : any
  selectedDescription = ''
  selectedRoutingAction : any
  selectedReceivingNumber : any
  selectedSipGateway : any
  selectedFailSafeNumber = ''

  goingFrom = ''

  blockContent = false

  constructor(
    private confirmationService: ConfirmationService,
    public route: ActivatedRoute,
    public api: ApiService,
    private messageService: MessageService,
    private location: Location,
    private router: Router,
    public store: StoreService,
  ) { }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      let guiVisibility = this.store.getGuiVisibility()

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "TrackingNumbers") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

    this.routingForm = new FormGroup({
      sipGateway: new FormControl(this.sipGatewayId, [
        Validators.required
      ]),
      receivingNumber: new FormControl(this.receivingNumberId, [
        Validators.required
      ]),
    }, { validators: routingFormValidator })

    await this.getSources()

    try {
      await this.api.getDetailById(this.route.snapshot.params.id)
        .pipe(tap(async data => {

          this.dialNumbers = data.ReceivingNumber?.number ? [{
            id: 0, number: data.ReceivingNumber?.number,
            schedule: null
          }] : []

          this.data = data
          if (data.routing_action)  {
            this.routingAction = data.routing_action;
            this.selectedRoutingAction = data.routing_action == this.routingActionEnum.ForwardTo.key ? this.routingActionEnum.ForwardTo : this.routingActionEnum.RemapForwardTo
          }

          if (data.ReceivingNumber) {
            this.receivingNumberId = data.ReceivingNumber.id;
            this.selectedReceivingNumber = data.ReceivingNumber;
          }

          if (data.SipGateways)     {
            this.sipGatewayId = data.SipGateways.id;
            this.selectedSipGateway = data.SipGateways;
          }

          this.originCustomerId = data.customerId
          this.selectedSource = data.TrackingSources
          this.selectedCustomer = data.Customer
          this.selectedDescription = data.description
          this.selectedFailSafeNumber = data.failsafe_number

          if (this.store.getUserType() !== CMSUserType.superAdmin && this.store.getUser().customerId !== data.customerId) {
            this.showWarn('You have no permission for this tracking number')
            await new Promise<void>(resolve => { setTimeout(() => { resolve(); }, NoPermissionAlertInteral); })
            this.location.back();
          }
          // Call update filtered tracking sources again
          // this.updateFilteredTrackingSources();
        })).toPromise();

      this.api.getAllReceivingNumbers().subscribe(res => {
        this.receivingNumbers = res.body
      })

      this.api.getAllSipGateways().subscribe(res => {

        this.sipGateways = res
      })

      if (this.store.getUserType() == CMSUserType.superAdmin) {
        this.api.getAllCustomerList().subscribe(res => {
          this.customerList = res;
          // this.updateFilteredTrackingSources();
        })

      } else {
        this.customerList.push(this.store.getUser().Customer)
      }

    } catch (e) {

    }

    this.id = this.route.snapshot.params.id;
    if (this.route.snapshot.queryParamMap.get('from')) {
      this.goingFrom = this.route.snapshot.queryParamMap.get('from');
    }
  }

  // validator for sip gateway control
  get sipGatewayValidator() {return this.routingForm.get('sipGateway')}

  // validator for receiving number control
  get receivingNumberValidator() {return this.routingForm.get('receivingNumber')}

  /**
   *
   * @param msg
   */
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  }

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }

  /**
   *
   */
  getSources = () => {
      let filter = {}
      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        filter = {
          where: {
            customerId: this.store.getUser().customerId
          }
        };
      }
      return this.api.getSourcesByFilter(filter)
        .pipe(tap(res => {
          this.sources = res;

          // when source is retrieved,
          // this.updateFilteredTrackingSources();
        }), catchError((_) => {
          return of(0);
        })).toPromise();
  }

  /**
   * this is called at changing tag input field
   * @param event tag list input field
   */
  onChangeTag = (event: Event) => {
    this.data.number_tags = (event.target as HTMLInputElement).value;
  }

  /**
   * Show Confirmation Popup before Tracking Number Release
   */
  confirmDeletion() {
    this.confirmationService.confirm({
      message: 'Are you sure to release number?',
      header: 'Tracking Number Release',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.onDeleteNumber();
      },
      reject: () => {
        this.showWarn("Number release cancelled.")
      },
      key: "trackingRelease"
    });
  }

  /**
   * this is called at clicking Release Tracking Number button
   */
  onDeleteNumber = async () => {
    // remove tracking number
    this.blockContent = true
    let payload = { number: JSON.stringify(this.data) };
    this.api.releaseProviderNumber(payload).subscribe(res => {
      this.blockContent = false
      this.isReleasing = false;
      this.showSuccess("Number successfully released.")

      if (this.goingFrom=='setup') {
        this.router.navigateByUrl(RouteNames.tracking_number.setup)
      }
      else
        this.router.navigateByUrl(RouteNames.tracking_number.numbers)
    }, error => {
      this.blockContent = false
    })
  }

  onChangeCustomer = (event) => {
    const newCustomerId = parseInt(event.value.id);
    this.data.customerId = newCustomerId;
    this.data.Customer.id = newCustomerId;
    // this.updateFilteredTrackingSources();
  }

  /** Why this shitty method
  updateFilteredTrackingSources = () => {
    this.filteredSources = this.sources.filter(src => {
       return src.customerId === this.data?.customerId ?? 0;
    });

    // Set to the first tracking source id of the list.
    if (this.filteredSources.length) {
      this.data.tracking_sourceId = this.filteredSources[0].id;
      this.data.TrackingSources.id = this.filteredSources[0].id;
    } else {
      this.data.tracking_sourceId = undefined;
    }
  }
  *(

  )
  /**
   * this is called at changing source field
   * @param event source select field
   */
  onChangeSource = (event) => {
    const newSourceId = parseInt(event.value.id);
    this.data.tracking_sourceId = newSourceId;
    this.data.TrackingSources.id = newSourceId;
  }

  onUpdateCallLogChange = (event) => {
    if (this.data) {
      this.data.update_call_logs = event.checked;
    }
  }

  /**
   * this is called at clicking save button
   */
  saveChange = async () => {

    // Validate data
    if (!this.data.tracking_sourceId) {
      this.showWarn("Please specify the tracking source or select customer with tracking sources")
      return;
    }

    if (this.routingAction == RoutingActionEnum.ForwardTo.key)
      this.receivingNumberId = 0

    if (this.sipGatewayId == 0)
      this.sipGatewayId = null

    if (this.receivingNumberId == 0)
      this.receivingNumberId = null

    this.data.routing_action = this.routingAction
    this.data.sip_gatewayId = this.sipGatewayId
    if (this.data.SipGateways)
      this.data.SipGateways.id = this.sipGatewayId

    this.data.receiving_numberId = this.receivingNumberId
    if (this.data.ReceivingNumber)
      this.data.ReceivingNumber.id = this.receivingNumberId

    this.data.description = this.selectedDescription
    this.data.failsafe_number = this.selectedFailSafeNumber ? this.selectedFailSafeNumber.replace(/\D/g, '') : "";

    this.blockContent = true

    // save tracking number information
    this.api.saveDetailById(this.data, this.id).subscribe(data => {
      this.blockContent = false
      this.showSuccess('Updating Succeeded')
      if (this.goingFrom=='setup')
        this.router.navigateByUrl(RouteNames.tracking_number.setup)
      else
        this.router.navigateByUrl(RouteNames.tracking_number.numbers)
    },err => {
      this.blockContent = false
    });
  }

  /**
   * convert the telephone number to masked number like 1 (xxx) xxx-xxxx
   * @param number telephone number
   * @returns
   */
  getMaskedNumber = (number) => {
    let maskedNumber = `1 (${number.substring(1, 4)}) ${number.substring(4, 7)}-${number.substring(7)}`
    return maskedNumber
  }
}

