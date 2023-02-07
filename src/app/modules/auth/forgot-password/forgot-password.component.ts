import { Component, OnInit } from '@angular/core';
import {ApiService} from "@services/api/api.service";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  providers: [
  ]
})
export class ForgotPasswordComponent implements OnInit {

  selectedEmail = ''

  blockContent = false

  constructor(public api: ApiService, private messageService: MessageService) {

  }

  ngOnInit(): void {
  }

  onForgotPassword = () => {
    if (this.selectedEmail=='') {
      this.showWarning("Please input email address to recover password")
      return
    }

    // this.api.accountReset(this.user.id).subscribe(res => {
    //   if (res) {
    //     this.showSuccess('Account successfully reset. Check given mailbox for instructions.')
    //   } else {
    //     this.showWarning('Unable to reset account. Contact an administrator for details.')
    //   }
    // })
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
