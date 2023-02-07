import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { ApiService } from '@services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ICustomer } from '@app/models/user';
import { RouteNames } from '@app/modules/client/client.routes';
import { AnimationInterval, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss'],
  animations: [
  ]
})

export class CustomerEditComponent implements OnInit {

  cmsUserType = CMSUserType;

  currentSection = 'customer-detail';

  email = null;
  username = null;
  languages = [];
  customers = [];

  localdid: number = 2.00;
  localdid_fee: number = 0.00;
  tollfree: number = 3.00;
  tollfree_fee: number = 0.00;

  customer: ICustomer = {
    id: null,
    balance: null,
    enabled: null,
    firstName: null,
    lastName: null,
    contactEmail: null,
    companyName: null,
    companyId: null,
    vatNumber: null,
    billingEmail: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    phone: null,
    token: null,
    settings: null
  };

  blockContent = false

  constructor(public api: ApiService,
              public store: StoreService,
              public messageService: MessageService,
              public router: ActivatedRoute,
              private routes: Router,
              public location: Location) { }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser()) {
          clearInterval(mainUserInterval);
          resolve();
        }
      }, 100);
    });

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      this.showWarning('You have no permission for this page')
      await new Promise<void>(resolve => { setTimeout(() => { resolve(); }, NoPermissionAlertInteral); });
      this.location.back();
    }

    /**************************** permission checking *************************/
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      const guiVisibility = this.store.getGuiVisibility();

      let permission = PERMISSION_TYPE_DENY;
      for (const v of guiVisibility) {
        if (v.GuiSection.name === 'Customer') {
          permission = v.GuiPermission.name;
          break;
        }
      }

      if (permission !== PERMISSION_TYPE_ALL) {
        this.showWarning('You have no permission for this page')
        await new Promise<void>(resolve => { setTimeout(() => { resolve(); }, NoPermissionAlertInteral); });
        this.location.back();
      }
    }

    /**************************** page started *************************/
    this.api.getCustomer(this.router.snapshot.params.id).subscribe(res => {
      this.customer = res;
      this.handleCustomerSettings();
    });

  }

  scrollTo(section) {
    this.currentSection = section;
    const element = document.getElementById(section);
    element.scrollIntoView(true);
  }

  handleChange = (key: string, event: any) => {
    this.customer[key] = event.target.value;
  }

  checkValid = () => {
    if (this.customer.companyName == null || this.customer.companyName.trim().length < 1) {
      return 'Please input company name!';
    }

    if (this.customer.companyId != null && this.customer.companyId.trim().length < 1) {
      return 'Please input company ID!';
    }

    if (this.customer.billingEmail != null && (this.customer.billingEmail.trim().length > 2 && this.customer.billingEmail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) === null)) {
      return 'Please input a valid billing email!';
    }

    if (this.customer.contactEmail != null && (this.customer.contactEmail.trim().length < 3 || this.customer.contactEmail.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/) === null)) {
      return 'Please input billing email!';
    }

    /* Not really needed for having a valid customer
    if (this.customer.address.trim().length === 0) {
      return 'Please input address!';
    }
    if (this.customer.city.trim().length === 0) {
      return 'Please input city!';
    }
    if (this.customer.state.trim().length === 0) {
      return 'Please input state!';
    }
    if (this.customer.zip.trim().length === 0) {
      return 'Please input zip code!';
    }
    if (this.customer.phone.trim().length === 0) {
      return 'Please input phone number!';
    }
    if (this.customer.vatNumber.trim().length === 0) {
      return 'Please input vat number!';
    }

    const emailValidator = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

    if (this.customer.billingEmail.trim().length === 0) {
      return 'Please fill billing email address!';
    }
    if (!emailValidator.test(this.customer.billingEmail)) {
      return 'Please input a valid billing email address!';
    }
    if (this.customer.contactEmail.trim().length === 0) {
      return 'Please fill contact email address!';
    }
    if (!emailValidator.test(this.customer.contactEmail)) {
      return 'Please input a valid contact email address!';
    }
    */

    return 'valid';
  }

  /**
   * Handle Customer JSON Settings
   */
   handleCustomerSettings() {
    if (this.customer.settings) {

      let settings = JSON.parse(this.customer.settings)

      if (settings.localdid != undefined) {
        this.localdid = settings.localdid;
      }

      if (settings.localdid_fee != undefined) {
        this.localdid_fee = settings.localdid_fee;
      }

      if (settings.tollfree != undefined) {
        this.tollfree = settings.tollfree;
      }

      if (settings.tollfree_fee != undefined) {
        this.tollfree_fee = settings.tollfree_fee;
      }

    } else {
      this.applySettings()
    }
  }

  /**
   * save ui settings into the session storage and update user information
   */
   applySettings = () => {

    // Retrieve the settings from the session storage
    let settings = JSON.parse(this.customer.settings)

    // Initialize it if null
    settings = (settings == null) ? {} : settings;

    settings.localdid = this.localdid
    settings.localdid_fee = this.localdid_fee
    settings.tollfree = this.tollfree
    settings.tollfree_fee = this.tollfree_fee

    // Save customer settings to store
    this.customer.settings = JSON.stringify(settings);

  }

  onSaveDetail = () => {
    const checkResult = this.checkValid();
    if (checkResult !== 'valid') {
      this.showWarning(checkResult);
      return;
    }

    this.blockContent = true
    this.applySettings();
    this.api.updateCustomer(this.customer).subscribe(res => {
      this.blockContent = false
      this.customer = res;
      this.showSuccess('Customer update succeeded!');
      this.routes.navigateByUrl(RouteNames.customer.customers);
    }, error => {
      this.blockContent = false
    });
  }

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

}
