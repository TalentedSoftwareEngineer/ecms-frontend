import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ApiService } from '@services/api/api.service'
import { ReceivingNumber } from '@app/models/receiving-number'
import { trigger, transition, query, style, animate } from '@angular/animations'
import { AnimationInterval, CMSUserType, PERMISSION_TYPE_DENY, NoPermissionAlertInteral, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import { of, pipe } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-receiving-numbers',
  templateUrl: './receiving-numbers.component.html',
  styleUrls: ['./receiving-numbers.component.scss'],
  animations: [

  ]
})
export class ReceivingNumbersComponent implements OnInit {

  receivingNumbers: ReceivingNumber[];
  filterName = '';
  filterAttr = '';
  filterValue = '';
  sortActive = '';
  sortDirection = '';
  resultsLength = -1;
  isLoading = true;
  isExporting = false;
  pageSize = 10;
  pageIndex = 1;

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  constructor(public api: ApiService,
    private store: StoreService,
    private messageService: MessageService,
    private location: Location) { }

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

      this.permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "ReceivingNumbers") {
          this.permission = v.GuiPermission.name
          break
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

    /**************************** page started *************************/
    this.getNumbers();
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

  getNumbers = async () => {
    this.isLoading = true;
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    }



    try {
      let filterValue = this.filterValue.replace('(', '').replace('-', '').replace(') ', '').replace(')', '')
      await this.api.getReceivingNumbers(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, customerFilter)
        .pipe(tap(res => {
          this.receivingNumbers = res.body

          this.isLoading = false;
        }), catchError((_) => {
          return of(0);
        })).toPromise()

      this.resultsLength = -1
      await this.api.getReceivingNumbersCount(filterValue, customerFilter)
        .pipe(tap(res => {
          this.resultsLength = res.count
        }), catchError((_) => {
          return of(0);
        })).toPromise();
    } catch (e) {

      this.isLoading = false
    }
  }

  onExport = (event: Event) => {
    let filterValue = this.filterValue
    if (this.filterAttr != '') {
      filterValue = `${this.filterAttr}:"${filterValue}"`
    }

    let customerFilter = null
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    }


    this.isExporting = true

    try {
      this.api.downloadAllReceivingNumber(filterValue, customerFilter).subscribe(res => {
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `ReceivingNumbers.csv`)
        tempLink.click()

        this.isExporting = false
      })

    } catch (e) {

    }
  }

  onSortChange = async (name) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.pageIndex = 1;
    await this.getNumbers();
  }

  onPageIndexChange = async (pageIndex) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize);
    if (pageIndex === 0 || pageIndex > totalPageCount) { return; }
    if (pageIndex === this.pageIndex) {return;}
    this.pageIndex = pageIndex;
    await this.getNumbers();
  }

  paginate = (event) => {
    this.onPageIndexChange(event.page+1);
  }

  onChangePageSize = async (event: Event) => {
    this.pageSize = +(event.target as HTMLInputElement).value;
    this.pageIndex = 1;
    await this.getNumbers();
  }

  onSearch = (event) => {
    this.filterValue = event.target.value;
    this.getNumbers();
  }

  onClickFilter = () => this.getNumbers();

  onChangeFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterValue = (event.target as HTMLInputElement).value;
  }
}
