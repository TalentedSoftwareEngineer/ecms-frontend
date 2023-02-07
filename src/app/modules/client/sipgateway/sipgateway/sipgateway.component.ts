import {GetNumbers} from '@app/models/tracking_numbers'
import {Component, OnInit} from '@angular/core'
import {Location} from '@angular/common';
import {ApiService} from '@services/api/api.service'
import {SipGateways} from '@app/models/sip-gateway'
import {
  CMSUserType,
  NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_READONLY
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {catchError, tap} from "rxjs/operators";
import {of} from "rxjs";
import {MessageService} from "primeng/api";


@Component({
  selector: 'app-sipgateway',
  templateUrl: './sipgateway.component.html',
  styleUrls: ['./sipgateway.component.scss'],
  animations: [
  ]
})
export class SipGatewaysComponent implements OnInit {

  sipGateways: SipGateways[];
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

  trackingNumbers: GetNumbers[];

  constructor(public api: ApiService,
              private store: StoreService,
              private messageService: MessageService,
              private location: Location) {
  }

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
      // let guiVisibility = this.store.getGuiVisibility()
      //
      // this.permission = PERMISSION_TYPE_DENY
      // for (let v of guiVisibility) {
      //   if (v.GuiSection.name == "SipGateways") {
      //     this.permission = v.GuiPermission.name
      //     break
      //   }
      // }
      //
      // if (this.permission == PERMISSION_TYPE_DENY) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      // }
    }

    this.getSipGateways()
  }

  /**
   * get sip gateways from backend via api
   */
  getSipGateways = async () => {
    this.isLoading = true;
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    }


    try {
      let filterValue = this.filterValue.replace('(', '').replace('-', '').replace(') ', '').replace(')', '')
      await this.api.getSipGateways(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, customerFilter)
        .pipe(tap(res => {
          this.sipGateways = res.body
          this.isLoading = false;
        }), catchError((_) => {
          return of(0);
        })).toPromise();
      this.resultsLength = -1
      await this.api.getSipGatewayCount(filterValue, customerFilter)
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
      this.api.downloadAllSipGates(filterValue, customerFilter).subscribe(res => {
        const csvContent = 'data:text/csv;charset=utf-8,' + res.csv_data
        const url = encodeURI(csvContent)
        const tempLink = document.createElement('a')
        tempLink.href = url
        tempLink.setAttribute('download', `SipGateways.csv`)
        tempLink.click()

        this.isExporting = false
      })

    } catch (e) {

    }
  }


  /**
   * this is called at clicking header name of sip gateway table
   * @param name header name for sorting
   */
  onSortChange = async (name) => {
    this.sortActive = name
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC'
    this.pageIndex = 1
    await this.getSipGateways()
  }

  /**
   * this is called at clicking page direction button like first, prev, next, last
   * @param pageIndex page index
   */
  onPageIndexChange = async (pageIndex) => {
    const totalPageCount = Math.ceil(this.resultsLength / this.pageSize)
    if (pageIndex === 0 || pageIndex > totalPageCount) {
      return
    }

    if (pageIndex === this.pageIndex) {
      return
    }

    this.pageIndex = pageIndex
    await this.getSipGateways()
  }

  /**
   *
   * @param event
   */
  onChangePageSize = async (event: Event) => {
    this.pageSize = +(event.target as HTMLInputElement).value;
    this.pageIndex = 1
    await this.getSipGateways()
  }

  /**
   * clear filter
   */
  onClearFilter = () => {
    this.filterValue = ''
    this.getSipGateways()
  }

  onClickFilter = () => this.getSipGateways()

  /**
   * this is called at changing filter input field value
   * @param event filer input field
   */
  onChangeFilter = (event: Event) => {
    this.pageIndex = 1;
    this.filterValue = (event.target as HTMLInputElement).value
  }

  paginate = (event) => {
    this.onPageIndexChange(event.page+1);
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
