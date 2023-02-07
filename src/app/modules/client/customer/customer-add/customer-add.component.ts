import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '@services/api/api.service';
import {timezones} from '@app/modules/client/user/user-edit/timezone';
import {RouteNames} from '@app/modules/client/client.routes';
import { trigger, transition, query, style, animate} from '@angular/animations'
import { AnimationInterval, DEFAULT_PRIMARY_ADMIN_PASSWORD, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL } from '../../constant';
import { IUser } from '../../../../models/user';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";


@Component({
  selector: 'app-customer-add',
  templateUrl: './customer-add.component.html',
  styleUrls: ['./customer-add.component.scss'],
  animations: [
  ]
})

export class CustomerAddComponent implements OnInit {

  roles = [];

  username = null;
  languages = [];
  selectedRoleId = null;

  firstName = null;
  lastName = null;
  vatNumber = null;
  email = null;
  emailaccount = null;
  companyName = null;
  companyId = null;
  address = null;
  city = null;
  state = null;
  zip = null;
  phone = null;
  token = null;
  settings = null;

  blockContent = false

  constructor(public api: ApiService,
    public store: StoreService,
    public messageService: MessageService,
    private router: Router,
    public location: Location) { }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser()) {
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
        if (v.GuiSection.name == "Customer") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarning("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

  }

  getRoles = () => {
    this.api.getRoles().subscribe(res => {
      this.roles = res;
      this.selectedRoleId = -1;
    });
  }

  handleChange = (event: any) => {
    this[event.target.name] = event.target.value;
  }

  checkValid = () => {
    if (!this.companyName) {
      return 'Please input company name!';
    }
    if (!this.companyId) {
      return 'Please input company ID!';
    }
    if (!this.email) {
      return 'Please input billing email!';
    }
    if (!this.address) {
      return 'Please input address!';
    }
    if (!this.city) {
      return 'Please input city!';
    }
    if (!this.state) {
      return 'Please input state!';
    }
    if (!this.zip) {
      return 'Please input zip code!';
    }
    if (!this.phone) {
      return 'Please input phone number!';
    }
    if (!this.firstName) {
      return 'Please input first name!';
    }
    if (!this.lastName) {
      return 'Please input last name!';
    }
    if (!this.emailaccount) {
      return 'Please input contact email!';
    }

    const emailValidator = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!this.email) {
      return 'Please fill email address!';
    }
    if (!emailValidator.test(this.email)) {
      return 'Please input a valid email address!';
    }
    return 'valid';
  }

  createCustomer = () => {
    if (this.checkValid() === 'valid') {

      const customer = {
        id: null,
        enabled: 1,
        balance: 0,
        billingEmail: this.email,
        contactEmail: this.emailaccount,
        firstName: this.firstName,
        lastName: this.lastName,
        vatNumber: this.vatNumber,
        companyName: this.companyName,
        companyId: this.companyId,
        address: this.address,
        city: this.city,
        state: this.state,
        zip: this.zip,
        phone: this.phone,
        token: this.token,
        settings: this.settings
      };

      this.blockContent = true
      this.api.addCustomer(customer).subscribe(res => {
        if (!res || !res.id) {
          this.showWarning('Error creating user, please check input and try again!')
          return

        }

        this.showSuccess('User successfully created!')

        const primaryAdminUser = {
          activated: 1,
          email: this.emailaccount,
          emailVerified: 1,
          username: this.emailaccount,
          firstName: this.firstName,
          lastName: this.lastName,
          primaryAdmin: 1,
          languagesId: 1,
          timezone: '-00:00',
          password: DEFAULT_PRIMARY_ADMIN_PASSWORD,
          customerId: res.id,
        }

        this.api.addUser(primaryAdminUser).subscribe(userRes => {
          this.blockContent = false
          if (!userRes || !userRes.id) {
            this.showWarning('Error creating user')
            return
          }

          this.router.navigateByUrl(RouteNames.customer.customers)
        }, error => {
          this.blockContent = false
        })

      }, error => {
        this.blockContent = false
      });

    } else {
      this.showWarning(this.checkValid());
    }
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
