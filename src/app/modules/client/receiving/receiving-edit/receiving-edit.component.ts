import {Component, OnInit} from '@angular/core'
import {Location} from '@angular/common';
import {ApiService} from '@services/api/api.service'
import {ActivatedRoute, Router} from '@angular/router'
import {ReceivingNumber} from '@app/models/receiving-number'
import {trigger, transition, query, style, animate} from '@angular/animations'
import {
  AnimationInterval,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';
import {FormGroup, Validators, FormControl} from '@angular/forms'
import {generalFormValidator} from '../general-form-validator'
import {StoreService} from '../../../../services/store/store.service';
import {tap} from "rxjs/operators";
import {RouteNames} from "@app/modules/client/client.routes";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-receiving-edit',
  templateUrl: './receiving-edit.component.html',
  styleUrls: ['./receiving-edit.component.scss'],
  animations: [
  ]
})
export class ReceivingEditComponent implements OnInit {

  receivingNumber: ReceivingNumber = {
    number: '',
    description: null,
    tracking_numbers: [],
    customerId: null
  }

  generalTab = true;
  generalForm: FormGroup;
  isFormValid: Boolean = false;

  // Standard North US Number Matching (+1 is optional)
  phoneRegex: RegExp = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;
  customerList: any[] = [];
  customerSelectable =  true;

  selectedCustomer : any
  selectedNumber = ''
  selectedDescription = ''

  blockContent = false

  constructor(public api: ApiService,
              public route: ActivatedRoute,
              public messageService: MessageService,
              public store: StoreService,
              public location: Location,
              private router: Router,
  ) {
    this.generalForm = new FormGroup({
      year: new FormControl("", {
        validators: [Validators.required, Validators.pattern(this.phoneRegex)],
        updateOn: "blur"
      })
    });
  }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      this.customerSelectable = false;
      this.receivingNumber.customerId = this.store.getUser().customerId;
      const guiVisibility = this.store.getGuiVisibility()

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name === 'ReceivingNumbers') {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn('You have no permission for this page')
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

    await this.api.getAllCustomerList().pipe(
      tap(res => {
        this.customerList = res;
      })
    ).toPromise();

    this.api.getReceivingNumberById(this.route.snapshot.params.id).subscribe(res => {
      // this.receivingNumber = res;
      this.receivingNumber.id = res.id;
      this.receivingNumber.number = res.number;
      this.receivingNumber.customerId = res.customerId;
      this.receivingNumber.description = res.description;

      this.selectedNumber = this.receivingNumber.number
      this.selectedDescription = this.receivingNumber.description
      this.selectedCustomer = this.customerList.find((cus) => cus.id==res.customerId)

      this.validateForm(this.receivingNumber.number);
    }, e => {

    });
  }

  // validator for number control
  get numberValidator() {
    return this.generalForm.get('number')
  }

  validateForm = (number: string) => {
    if (this.phoneRegex.test(number)) {
      this.isFormValid = true;
    } else {
      this.isFormValid = false;
    }
  }

  /**
   * this is called at changing the value of number, description input field
   * @param event input field
   */
  handleChange = (event: any) => {
    if (event.target.name === 'number') {
      this.validateForm(event.target.value);
      this.receivingNumber[event.target.name] = event.target.value.replace(/\D/g, '');
    } else {
      this.receivingNumber[event.target.name] = event.target.value;
    }
  }

  /**
   * this is called at clicking save button
   */
  onSaveChange = () => {
    if (this.selectedDescription == '') {
      this.showWarn("Please enter description of Receiving Number")
      return
    }

    this.blockContent = true
    this.receivingNumber['description'] = this.selectedDescription
    this.api.updateReceivingNumberById(this.receivingNumber).subscribe(res => {
      this.blockContent = false
      this.showSuccess('Updating Succeeded!')
      this.router.navigateByUrl(RouteNames.receiving.numbers)
    }, e => {
      this.blockContent = false
    })
  }

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };
}
