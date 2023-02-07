import { Component, OnInit } from '@angular/core';
import {ApiService} from "@services/api/api.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {StripeService} from "ngx-stripe";
import {StoreService} from "@services/store/store.service";
import {
  CMSUserType,
  NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_DENY
} from "@app/modules/client/constant";
import {formatDate, Location} from "@angular/common";
import Countries from "../../../../../assets/data/countries.json";
import {ActivatedRoute} from "@angular/router";
import moment from 'moment';

@Component({
  selector: 'app-billing-settings',
  templateUrl: './billing-settings.component.html',
  providers: [ConfirmationService],
  styleUrls: ['./billing-settings.component.scss']
})
export class BillingSettingsComponent implements OnInit {

  isShowInformation = false
  isLoaded = false
  blockContent = false
  goingFrom = 0

  userId: number = 0;
  customerId: number = 0;
  user: any = {};
  balance = 0

  permission = PERMISSION_TYPE_ALL;
  permissionTypeDeny = PERMISSION_TYPE_DENY;

  isBillingPhoneNumber = false
  selectedBillingPhoneNumber = ''

  priceFalls = [];
  priceCharges = [];
  selectedPriceFall = { name: '$15.00', value: 15 }
  selectedPriceCharge = { name: '$35.00', value: 35 }

  countries : any[]
  selectedCountry : any

  filterPaymentHistoryValue = ''
  filterAccountLogValue = ''

  paymentMethods = [];
  filteredPaymentMethod = []
  selectedPaymentMethod : any

  selectedAmount = 0

  editingPaymentMethod: any
  isEditPaymentMethod = false
  selectedPaymentCountry : any
  selectedPaymentName = ''

  transactions = []

  constructor(public api: ApiService,
              private messageService: MessageService,
              private stripeService: StripeService,
              private confirmationService: ConfirmationService,
              public store: StoreService,
              public route: ActivatedRoute,
              private location: Location) {
    this.init()
  }

  init() {
    this.countries = Countries.map(item => ({"label": item.name, "value": item.code.toLowerCase()}))
    this.selectedCountry = { "label": "United States", "value": "us" }
    this.selectedPaymentCountry = { "label": "United States", "value": "us" }

    for (let i=15; i<2000; i+=5) {
      this.priceFalls.push({ name: '$'+i+'.00', value: i })
    }

    let i = 35
    while (i<=50000) {
      this.priceCharges.push({ name: '$'+i+'.00', value: i })
      if (i<250)  i+=5
      else if (i<500) i+=10
      else if (i<1000)  i+=25
      else if (i<2000)  i+=100
      else if (i<10000) i+=250
      else i+=1000
    }
  }

  async ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('from')) {
      this.goingFrom = parseInt(this.route.snapshot.queryParamMap.get('from'));
    }

    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser()) {
          clearInterval(mainUserInterval);
          resolve();
        }
      }, 100);
    });

    this.initUser()
  }

  initUser() {
    let _user = this.store.getUser()
    if(_user) {
      this.userId = _user.id;
      this.customerId = _user.customerId;
    }

    if(this.userId) this.api.getUser(this.userId).subscribe(async res => {
      this.user = res;

      if(this.user.hasOwnProperty('Customer') && this.user.Customer.hasOwnProperty('balance'))
        this.balance = this.user.Customer['balance'];
      else
        this.balance = 0;

      /**************************** permission checking *************************/
      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        const guiVisibility = this.store.getGuiVisibility();

        let permission = PERMISSION_TYPE_DENY;
        if(guiVisibility != null) for (let v of guiVisibility) {
          if (v.GuiSection.name === 'User') {
            permission = v.GuiPermission.name;
            break;
          }
        }

        if (permission !== PERMISSION_TYPE_ALL && this.store.getUser() && this.store.getUser().id !== this.user.id) {
          this.showWarning('You have no permission for this page')
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve();
            }, NoPermissionAlertInteral);
          });
          this.location.back();
        }

        // check if other customer user is trying to edit user or no primary user is trying to edit primary user
        // tslint:disable-next-line:max-line-length
        if (this.store.getUser().customerId != this.user.customerId || (this.store.getUserType() != CMSUserType.primaryAdmin && this.user.primaryAdmin)) {
          this.showWarning("You have no permission for this user")
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve()
            }, NoPermissionAlertInteral)
          })
          this.location.back()
        }

        this.permission = permission
        this.isLoaded = true
      }
    });

    // subscribe for balance update
    this.store.getBalance().subscribe((value: any) => {
      if(value)
        this.balance = value;
    })

    this.getPaymentMethodsList()
    this.getTransactionsList()
  }

  saveGeneral() {
    if (this.selectedBillingPhoneNumber=='')
      this.isBillingPhoneNumber = true

    let priceFall = this.selectedPriceFall.value
    let priceCharge = this.selectedPriceCharge.value

    console.log("general", this.selectedBillingPhoneNumber, priceFall, priceCharge)
  }

  filterPaymentMethod(event) {
    let filtered = []
    let query = event.query;

    for (let i=0; i<this.paymentMethods.length; i++) {
      let name = this.paymentMethods[i].description + ' for ' + this.paymentMethods[i].name
      if (name.indexOf(query)>=0)
        filtered.push({label: name, value: this.paymentMethods[i]})
    }

    this.filteredPaymentMethod = filtered
  }

  editPaymentMethod() {
    if (!this.selectedPaymentMethod || !this.selectedPaymentMethod.hasOwnProperty("value"))
      return

    this.editPaymentMethodList(this.selectedPaymentMethod.value.id)
  }

  editPaymentMethodList(id) {
    let method = this.paymentMethods.filter((item) => item.id==id)
    if (method==null || method.length==0) {
      return
    }

    let item = method[0]
    this.editingPaymentMethod = item
    this.selectedPaymentName = item.name
    this.isEditPaymentMethod = true
  }

  savePaymentMethod() {
    this.isEditPaymentMethod = false
  }

  getPaymentMethodsList() {
    return new Promise((resolve, reject) => {
      this.api.getPaymentMethods(this.customerId).subscribe(res => {
        if (res) {
          this.paymentMethods = res.map(item => ({...item, expireDate: moment(item.expDate).format('YYYY-M-D').toString()}));
          resolve(res)
        }
        else{
          reject()
        }
      }, error => {
        reject(error)
      })
    })
  }

  makePayment() {
    if (!this.selectedPaymentMethod || !this.selectedPaymentMethod.hasOwnProperty("value")) {
      this.showWarning("Please select payment method.")
      return;
    }

    if (this.selectedAmount<2.5) {
      this.showWarning("Please enter amount greater than $2.5.")
      return;
    }

    this.confirmDialog("You're charging your wallet. Would you like to continue?", "Charge Request", { action: 'charge' })
  }

  confirmDialog(content: string, title: string, payload: any) {
    this.confirmationService.confirm({
      message: content,
      header: 'Order Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        payload = JSON.parse(JSON.stringify(payload));
        if(payload.action == 'subscribe' || payload.action == 'unsubscribe') {
        } else if(payload.action == 'charge') {
          const pm: any = this.selectedPaymentMethod.value;
          if(pm.token != null && pm.token.trim().length > 0)
            this.chargeCustomer(this.selectedAmount, pm.token);
          else
            this.showWarning("Invalid payment method selected.")
        } else {
          this.showWarning("Request cancelled.")
        }
      },
      reject: () => {
        this.showWarning("Request cancelled.")
      },
      key: "overallDialog"
    });
  }

  chargeCustomer(amount, token) {
    let pr = new Promise((resolve, reject) => {
      this.blockContent = true
      this.api.chargeCustomer(amount, token).subscribe(p_method => {
        if (p_method) {
          // this.paymentMethods = p_method;
          p_method = Array(1).fill(p_method);
          this.api.getCustomerBalance().subscribe(balance => {
            this.blockContent = false
            if (balance) {
              this.store.setBalance(balance.balance);
              this.showSuccess("Wallet correctly charged");
            }
            resolve(p_method);
          }, error => {
            this.blockContent = false
            reject(error);
          }, () => {
            this.blockContent = false
          });
        } else {
          this.blockContent = false
          reject();
        }
      }, error => {
        this.blockContent = false
        reject(error)
      }, () => {
        this.blockContent = false
      })
    })
  }

  getTransactionsList() {
    return new Promise((resolve, reject) => {
      this.api.getTransactions(this.customerId).subscribe(res => {
        if (res) {
          this.transactions = JSON.parse(JSON.stringify(res));
          resolve(res)
        }
        else{
          reject()
        }
      }, error => {
        reject(error)
      })
    })
  }

  dateFormat(date, format = 'mediumDate') {
    return (!date || date.trim().length <= 0) ? "" : formatDate(date, format, 'EN_us');
  }

  exportExcel() {
    import("xlsx").then(xlsx => {
      const worksheet = xlsx.utils.json_to_sheet(this.transactions);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, "transactions");
    });
  }

  saveAsExcelFile(buffer: any, fileName: string): void {
    import("file-saver").then(FileSaver => {
      let EXCEL_TYPE =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      let EXCEL_EXTENSION = ".xlsx";
      const data: Blob = new Blob([buffer], {
        type: EXCEL_TYPE
      });
      FileSaver.saveAs(
        data,
        fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
      );
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
