import {Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import {Location} from '@angular/common';
import {trigger, transition, query, style, animate} from '@angular/animations'
import {CallLog, PhoneBook} from '@app/models/callLog';
import {ApiService} from '@services/api/api.service';
import {DomSanitizer} from '@angular/platform-browser';
import {Subject} from 'rxjs';
// @ts-ignore
import moment from 'moment';
import {StoreService} from '@services/store/store.service';
import {pluck, take} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {
  FilterDate,
  DateOptions,
  AnimationInterval,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_READONLY,
  PERMISSION_TYPE_DENY,
  CMSUserType,
  NoPermissionAlertInteral
} from '../../constant';
import {ActivatedRoute, Router} from '@angular/router';
import {getStartAndEndDate, getFilterDateMode} from '../../utils';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-call-logs',
  templateUrl: './call-logs.component.html',
  styleUrls: ['./call-logs.component.scss'],
  animations: [
  ]
})

export class CallLogsComponent implements OnInit, OnDestroy {

  private filterSubscription: Subscription;

  // pagination params
  pageIndex = 1;
  pageSize = 20;

  // filter params
  filterValue = ''
  filterUnit = ''
  filterPanelOpened = false
  dateOptions = DateOptions
  dateMode = FilterDate.today.toString();
  strStartDate: string = null;
  strEndDate: string = null;


  totalCount = 0;
  sortActive = 'created';
  sortDirection = 'DESC';
  dateFilter = 'today';
  logs: any[] = [];
  showLogs: any[] = [];
  percentage = 0;

  val = null;
  searchValue = '';
  searchAttr = '';
  filterDateMode = '';
  additionalQuery = '';         // additional query value for call log api. is needed when the page is loading from activity page.

  // audio params
  isPlay = false;
  playId = null;
  content = null;

  // loading
  isLoading = false;
  isCountLoading = false;
  isApiCalling = false;
  isExporting = false;
  isStop = false;

  isAutoLoading = false;

  // edit
  current = 'contact';
  phonebook: PhoneBook = {
    name: null,
    email: null,
    street: null,
    city: null,
    state: null,
    country: null,
    postalCode: null,
    note: null,
    contact_number: null,
  };

  log: any = {};

  contactTab: boolean;
  emailTab: boolean = true;
  onEditing: boolean = false;
  editIndex: number = null;

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  autoLoadTimer = null

  dtOptions = {};
  dtTrigger: Subject<any> = new Subject<any>();

  constructor(
    public api: ApiService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private store: StoreService,
    public route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
  }

  async ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);

          resolve();
        }
      }, 100);
    });

    /**************************** permission checking *************************/
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      const guiVisibility = this.store.getGuiVisibility();


      this.permission = PERMISSION_TYPE_DENY;
      for (const v of guiVisibility) {
        if (v.GuiSection.name === 'CallLogs') {
          this.permission = v.GuiPermission.name;
          break;
        }
      }

      if (this.permission === PERMISSION_TYPE_DENY) {
        this.showWarn('You have no permission for this page')
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve();
          }, NoPermissionAlertInteral);
        });
        this.location.back();
      }
    }

    window.addEventListener('scroll', this.onScroll, true);
    this.getParams();

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: this.pageSize,
      processing: true
    };

    if (this.strStartDate != null && this.strEndDate != null) {
      this.filterDateMode = getFilterDateMode(this.dateMode, this.strStartDate, this.strEndDate);
      this.getLogsAndCount();

    } else {
      this.getFilters();
    }

    this.filterSubscription = this.store.filterObservable$.subscribe(() => {
      this.getFilters();
    });
    this.startAutoLoadTimer();
  }

  ngOnDestroy(): void {
    if(this.filterSubscription)
      this.filterSubscription.unsubscribe();
    window.removeEventListener('scroll', this.onScroll, true);
    this.stopAutoLoadTimer();
  }

  startAutoLoadTimer() {
    if (this.autoLoadTimer != null) {
      return;
    }

    this.autoLoadTimer = setInterval(() => {
      if (!this.isAutoLoading) {
        return;
      }
      if (this.filterDateMode !== 'Today') {
        return;
      }
      if (this.isCountLoading) {
        return;
      }

      const timeValueForStartDate = new Date(this.strStartDate + ':00.000Z').getTime() + new Date().getTimezoneOffset() * 60000;
      const timeValueForEndDate = new Date(this.strEndDate + ':59.999Z').getTime() + new Date().getTimezoneOffset() * 60000;

      let d1 = new Date(timeValueForStartDate).toISOString();
      const d2 = new Date(timeValueForEndDate).toISOString();

      let filterValue = '';
      if (this.searchAttr !== '') {
        filterValue = `${this.searchAttr}:"${this.searchValue}"`;

      } else {
        filterValue = this.searchValue
      }

      let customerId = '';
      let customerFilter = null;
      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        customerFilter = {
          customerId: this.store.getUser().customerId
        };
        customerId = this.store.getUser().customerId.toString();
      }

      // Hadoop Call
      this.api.getLogsFromNewBackend(this.sortActive, this.sortDirection, 1, this.pageSize, filterValue, d1, d2, customerId, this.dateFilter, this.val)
      // MySQL Call
      // this.api.getLogs(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, d1, d2, this.dateFilter, this.val)
      // this.api.getLogsFromSupport(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, d1, d2, this.dateFilter, this.val)
        .subscribe((rows) => {

          // Hadoop Call
          this.logs = [...rows.data];
          // MySQL Call
          // this.logs.pop();
          // this.logs = [...rows.data, ...this.logs];

          // Update Counter
          this.getLogsAndCount(true, false);

          // this.totalCount = rows.data.length;
        }, e => {
        });
    }, 5000);
  }

  stopAutoLoadTimer() {
    clearInterval(this.autoLoadTimer);
    this.autoLoadTimer = null;
  }

  getDateStringOfCallRecord(created) {
    const createdDate = new Date(created);
    return moment(createdDate).format('MMM DD, YYYY');
  }

  /**
   *
   */
  getParams = () => {
    this.route.queryParams.subscribe(p => {
      if (p && p.dateMode != undefined) {
        this.dateMode = p.dateMode;
        this.strStartDate = p.strStartDate;
        this.strEndDate = p.strEndDate;
        this.searchAttr = p.searchAttr;
        this.searchValue = p.searchValue;
      }
    });
  }

  /**
   *
   */
  getFilters = () => {
    this.store.state$.pipe(pluck('filters'), take(1)).subscribe(async filters => {

      if (!!filters) {
        this.dateMode = filters.dateMode;
        this.strStartDate = filters.startDate;
        this.strEndDate = filters.endDate;

        this.searchValue = ''
        this.searchAttr = ''
      }

      if (this.strStartDate == null || this.strEndDate == null) {
        const dates = await getStartAndEndDate(this.dateMode)
        if (dates.strStartDate != '') {
          this.strStartDate = dates.strStartDate
          this.strEndDate = dates.strEndDate
        }
      }

      this.filterDateMode = getFilterDateMode(this.dateMode, this.strStartDate, this.strEndDate)

      this.isAutoLoading = (!this.isAutoLoading && this.filterDateMode == 'Today') ? true : false

      // this is the code for getting only one page result from the server
      this.pageIndex = 1
      this.getLogsAndCount()

      // this is the code for getting all result from the server continuously
      // this.getAllResultsFromServer();
    });
  }

  /**
   * this is the function for getting all result from the server continuously
   */
  getAllResultsFromServer = async () => {
    this.logs = [];
    this.showLogs = [];
    this.pageIndex = 1;
    this.percentage = 0;
    this.isLoading = true;
    this.isStop = false;

    await this.getLogsAndCount();

    while (!this.isStop && this.logs.length < this.totalCount) {
      this.pageIndex++;
      await this.getLogsAndCount(false);
    }

    this.isLoading = false;
  }

  /**
   * this is the function for getting only one page.
   */
  getLogsAndCount(needCount = true, rewriteLogs = true): Promise<void> {
    return new Promise(async resolve => {
      const timeValueForStartDate = new Date(this.strStartDate + ':00.000Z').getTime() + new Date().getTimezoneOffset() * 60000;
      const timeValueForEndDate = new Date(this.strEndDate + ':59.999Z').getTime() + new Date().getTimezoneOffset() * 60000;
      const d1 = new Date(timeValueForStartDate).toISOString();
      const d2 = new Date(timeValueForEndDate).toISOString();

      // Check if search value matches regex of numbers
      if (this.searchValue && this.searchValue.length) {
        // This should be number
        if (/^([0-9 ()-]{10,})$/.test(this.searchValue)) {
          this.searchValue = this.searchValue.replace(new RegExp('[()\\- ]', 'g'), '');
        }
      }

      let filterValue = '';
      if (this.searchAttr !== '') {
        filterValue = `${this.searchAttr}:"${this.searchValue}"`;

      } else {
        filterValue = this.searchValue;
      }

      let customerId = '';
      let customerFilter = null;
      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        customerFilter = {
          customerId: this.store.getUser().customerId
        };
        customerId = this.store.getUser().customerId.toString();
      }

      if (needCount) {
        this.totalCount = -1;
        this.isCountLoading = true;
        this.api.getLogsCount(filterValue, d1, d2, customerFilter).subscribe((data) => {
          this.totalCount = parseInt(data.count);

          this.isCountLoading = false;
        }, e => {
          this.isCountLoading = false;
        });
      }

      this.isApiCalling = true;
      // Hadoop Call
      this.api.getLogsFromNewBackend(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, d1, d2, customerId, this.dateFilter, this.val)
      // MySQL Call
      // this.api.getLogs(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, d1, d2, this.dateFilter, this.val)
      // this.api.getLogsFromSupport(this.sortActive, this.sortDirection, this.pageIndex, this.pageSize, filterValue, d1, d2, this.dateFilter, this.val)
        .subscribe((data) => {
          //this.store.storeFilters({dateMode: this.dateMode, startDate: this.strStartDate, endDate: this.strEndDate});
          if (this.pageIndex === 1) {
            // this.totalCount = parseInt(data.total_count);
            // this.totalPages = Math.ceil(this.totalCount / this.pageSize);

            // Hadoop Call
            if (rewriteLogs) this.logs = data.data;

            // MySQL Call
            // this.logs = data.body
            // this.showLogs = data.data
          } else {
            // Hadoop Call
            if (rewriteLogs) this.logs = [...this.logs, ...data.data];
            // MySQL Call
            // this.logs = [...this.logs, ...data.body];
            // this.showLogs = [...this.showLogs, ...data.data]
          }

          // this.percentage = Math.ceil(this.logs.length / this.totalCount * 100)

          this.isApiCalling = false;
          resolve();

        }, (e) => {
        });
    });
  }

  /**
   *
   */
  onStop = () => {
    this.isStop = true;
  }

  /**
   *
   * @param event
   */
  onChangeSearchValue = (event) => {
    this.searchAttr = '';
    this.searchValue = event.target.value;
  }

  onSearch = (event) => {
    this.searchAttr = '';
    this.searchValue = this.filterValue //event.target.value;
    this.pageIndex = 1;
    this.getLogsAndCount();
  }

  /**
   *
   */
  onClickSearch = () => {
    this.pageIndex = 1;
    this.getLogsAndCount();
  }

  /**
   *
   * @param event
   */
  @HostListener('window:scroll', ['$event'])
  onScroll = (event: Event) => {
    const pos = document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight;
    const isLoading = max - pos <= window.innerHeight && max - pos > window.innerHeight - 30;
    if (isLoading && !this.isApiCalling && (this.totalCount == -1 || this.logs.length < this.totalCount)) {
      this.pageIndex++;
      this.getLogsAndCount(false);
    }
  }

  /**
   *
   */
  setPageSize = () => {
    const height = window.innerHeight - 48 - 40 - 31;
    const times = height / 90;
    // tslint:disable-next-line: max-line-length
    if (times < 10) {
      this.pageSize = 10;
    } else if (times < 20) {
      this.pageSize = 20;
    } else if (times < 30) {
      this.pageSize = 30;
    } else if (times < 40) {
      this.pageSize = 40;
    } else if (times < 50) {
      this.pageSize = 50;
    }
  }

  /**
   *
   * @param key
   * @param value
   */
  onClickItem = (key: string = null, value: string) => {
    if (key == 'number' && value.includes('+1')) {
      this.searchValue = value.substring(2);
    } else {
      this.searchValue = value;
    }
    this.searchAttr = key;
    this.pageIndex = 1;
    this.getLogsAndCount();
  }

  /**
   *
   * @param id
   * @param isPlay
   */
  onPlayAudio = (id: number, isPlay: boolean) => {
    if (isPlay) {
      try {
        this.api.getCallRecording(id).subscribe(res => {
          this.content = this.getUrl(res.content);
          this.playId = id;
          this.isPlay = isPlay;
        });

      } catch (e) {
      }
    } else {
      this.playId = id;
      this.isPlay = isPlay;
      this.content = null;
    }
  }

  /**
   *
   * @param content
   */
  getUrl = (content: string) => {
    return this.sanitizer.bypassSecurityTrustResourceUrl(content);
  }


  /**
   *
   */
  onExport = () => {
    const timeValueForStartDate = new Date(this.strStartDate + ':00.000Z').getTime() + new Date().getTimezoneOffset() * 60000;
    const timeValueForEndDate = new Date(this.strEndDate + ':00.000Z').getTime() + new Date().getTimezoneOffset() * 60000;
    const d1 = new Date(timeValueForStartDate).toISOString();
    const d2 = new Date(timeValueForEndDate).toISOString();

    let filterValue = '';
    if (this.searchAttr !== '') {
      filterValue = `${this.searchAttr}:"${this.searchValue}"`;
    } else {
      filterValue = this.searchValue;
    }

    let customerId = '';
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerId = this.store.getUser().customerId.toString();
    }

    this.isExporting = true;
    try {
      this.api.getCallLogExport(this.sortActive, this.sortDirection, 100000000, 1, filterValue, d1, d2, customerId, this.dateFilter, this.val)
        .subscribe((data) => {

          /**
           * Generate CSV File By using encodeURI
           */
          const csvContent = 'data:text/csv;charset=utf-8,' + data;
          const url = encodeURI(csvContent);
          let fileName = 'Call_Logs_By_';
          if (this.dateMode === FilterDate.range) {
            const firstDate = moment(this.strStartDate).format('YYYY-MM-DD hh:mm');
            const lastDate = moment(this.strEndDate).format('YYYY-MM-DD hh:mm');
            fileName += 'Range(' + firstDate + ' ~ ' + lastDate + ').csv';

          } else {
            const firstDate = moment(this.strStartDate).format('YYYY-MM-DD');
            const lastDate = moment(this.strEndDate).format('YYYY-MM-DD');
            fileName += this.filterDateMode + '(' + firstDate + ' ~ ' + lastDate + ').csv';
          }

          const tempLink = document.createElement('a');
          tempLink.href = url;
          tempLink.setAttribute('download', fileName);
          tempLink.click();

          this.isExporting = false;
        });
    } catch (e) {
    }
  }

  /**
   *
   * @param section
   */
  onSelect = (section: string) => {
    this.current = section;
  }

  /**
   *
   * @param event
   */
  onChangePhonebook = (event: any) => {
    if (event.target.name === 'contact_number') {
      this.phonebook[event.target.name] = event.target.value.replace(/\D/g, '');
    } else {
      this.phonebook[event.target.name] = event.target.value;
    }
  }

  /**
   *
   * @param isClose
   */
  onSaveChange = async (isClose?: boolean) => {

    this.phonebook.contact_number = this.phonebook.contact_number && this.phonebook.contact_number.replace(/\D/g, '');
    try {
      await this.api.addPhoneBook(this.phonebook).subscribe(async (res) => {
        this.log.Phonebook = res;
        await this.api.saveLogById(this.log).subscribe(res => {
          this.showSuccess('Updating Succeeded')
        });
        isClose && this.onClose();
      });
    } catch (e) {
    }
  }

  getRowIndex = (data) => {
    return this.logs.indexOf(data)
  }

  /**
   *
   * @param index
   * @param type
   */
  onEditPanelCollapse = (index, type) => {
    if (!this.onEditing) {
      this.log = this.logs[index];
      this.logs.splice(index + 1, 0, {...this.log, isCollapse: true});
      this.onPhonebookInit(this.log);
      this.onEditing = true;
      this.editIndex = index;

    } else {
      this.logs = this.logs.filter(log => !log.isCollapse);
      if (this.editIndex === index) {
        this.onEditing = false;
        this.editIndex = null;
        this.log = null;

      } else {
        const newIndex = index > this.editIndex ? index - 1 : index;
        this.log = this.logs[newIndex];
        this.logs.splice(newIndex + 1, 0, {...this.log, isCollapse: true});
        this.onPhonebookInit(this.log);
        this.editIndex = newIndex;
      }
    }
  }

  /**
   *
   * @param data
   */
  onPhonebookInit = (data) => {
    if (data.Phonebook) {
      this.phonebook = data.Phonebook;
    } else {
      this.phonebook = {
        name: null,
        email: null,
        street: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
        note: null,
        contact_number: null,
      };
    }
  }

  /**
   *
   */
  onClose = () => {
    this.logs = this.logs.filter(log => !log.isCollapse);
    this.onEditing = false;
    this.editIndex = null;
  }

  /**
   *
   * @param name
   */
  onSortChange = async (name) => {
    this.sortActive = name;
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';

    // if (this.sortActive === 'source') {
    //   this.logs.sort((a, b) => {
    //     const first = a.OpNumber && a.OpNumber.TrackingSources && a.OpNumber.TrackingSources.name || '';
    //     const second = b.OpNumber && b.OpNumber.TrackingSources && b.OpNumber.TrackingSources.name || '';
    //     if (this.sortDirection === 'ASC') {
    //       return second.localeCompare(first);
    //     } else {
    //       return first.localeCompare(second);
    //     }
    //   });
    //   return

    // }

    this.pageIndex = 1;
    await this.getLogsAndCount(false);
  }

  getSubstring = (v: string) => {
    if(!v)return v;
    return v.substring(0, 10)
  }

  toggleFilterPanel() : void {
    this.filterPanelOpened = !this.filterPanelOpened
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

  paginate = (event) => {
  }
}

