import {Component, Inject, OnInit} from '@angular/core';
import {trigger, transition, query, style, animate} from '@angular/animations'
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {ApiService} from '@services/api/api.service';
import {GetNumbers} from '@app/models/tracking_numbers';
import {toBase64} from '@app/helper/utils';
import {FormBuilder, FormGroup} from '@angular/forms';
import * as XLSX from 'xlsx';
import {
  AnimationInterval,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {tap} from 'rxjs/operators';
import {RoutingActionEnum} from '@app/models/routing-action';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-tracking-add',
  templateUrl: './tracking-add.component.html',
  styleUrls: ['./tracking-add.component.scss'],
  animations: [
  ]
})
export class TrackingAddComponent implements OnInit {

  number: GetNumbers = {
    tracking_number: null,
    customerId: 0,
    notifications: 0,
    text_support: 0,
    tracking_sourceId: 1
  }

  isError = false
  data: any[][] = []
  origin: any[][] = []
  currentSection: string = 'new_number'
  filter: string = null
  isOpen: boolean = false
  isEdit: boolean = false
  id = null
  originId = null
  selected = []
  form: FormGroup
  encoded_file = null
  file_extension = null
  editStage = 'nothing'
  header = ''
  action: string = 'append'
  importPanelOpened = false

  selCustomerId = 1

  customerList: any[] = []
  cmsUserType = CMSUserType
  canBulkUpload = false
  routingAction = RoutingActionEnum.ForwardTo.key;
  routingActionEnum = RoutingActionEnum
  object = Object
  isUploading = false

  types : any[] = [
    { key: 'append', value: 'Append' },
    { key: 'update', value: 'Update' },
    { key: 'delete', value: 'Delete' },
  ]

  bulkSampleData: any[] = [
    { number: '(877) 534-5444', source: '4243920017', routing: 'routing', receiving: 'test1' },
    { number: '(877) 534-5445', source: '3824935435', routing: 'routing', receiving: 'test2' },
  ]

  selectedTrackingNumber = ''
  selectedCustomer : any

  blockContent = false

  constructor(
    public api: ApiService,
    public router: Router,
    private fb: FormBuilder,
    private messageService: MessageService,
    private location: Location,
    public store: StoreService
  ) {
    this.form = this.fb.group({
      encoded_file: [''],
      file_extension: ''
    })
  }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          this.number.customerId = this.store.getUser().customerId
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      let guiVisibility = this.store.getGuiVisibility();

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "TrackingNumbers") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page");
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

    /**************************** page started *************************/

    if (this.store.getUserType() == CMSUserType.superAdmin) {
      this.canBulkUpload = true;
      this.api.getAllCustomerList().subscribe(res => {
        this.customerList = res
      })

      this.selectedCustomer = this.store.getUser().Customer
    } else {
      this.customerList.push(this.store.getUser().Customer);
      this.selCustomerId = this.store.getUser().Customer.id;
    }
  }

  /**
   *
   * @param isCsv
   */
  onCreateNumber = async (isCsv?: boolean) => {
    this.number.tracking_number = this.selectedTrackingNumber

    if (!isCsv) {
      if (!this.number.tracking_number || this.number.tracking_number.length != 10) {
        this.isError = true
        return

      } else {
        this.isError = false
      }

      this.blockContent = true
      this.api.addNumber(this.number)
        .subscribe(res => {
          this.blockContent = false
          this.router.navigateByUrl(`service/tracking-number/edit/${res.id}`);
        }, e => {
          this.blockContent = false
          this.showError("Error is occured while creating tacking number: " + e)
        });
    } else {
      const data = [[...this.header.split(',')], ...this.data]
      const convertedData = data.map(e => e.join(',')).join('\n')

      // const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n')
      const blob = new Blob([convertedData], {type: 'text/csv;charset=utf-8;'})
      this.encoded_file = await toBase64(blob)
      this.encoded_file = this.encoded_file.split(',')[1]

      this.isUploading = true;
      this.blockContent = true
      this.api.bulkTNumbersUpload({
        encoded_file: this.encoded_file,
        file_extension: this.file_extension,
        customer_id: this.selCustomerId,
        action: this.action,
        routingAction: this.routingAction
      }).subscribe(res => {
        this.blockContent = false
        this.showSuccess(res.message)
        this.data = [];
        this.isUploading = false;
      }, (e) => {
        this.blockContent = false
      });
    }
  }

  /**
   *
   * @param event
   * @param id
   */
  onEditChange = (event: any, id: number) => {
    this.selected[id] = event.target.value;
  }

  /**
   *
   */
  onSaveChange = () => {
    this.data[this.id] = this.selected;
    this.isEdit = false;
    this.editStage = 'nothing';
  }

  /**
   *
   */
  onCancel = () => {
    this.editStage === 'append' && this.data.splice(this.id, 1)
    this.isEdit = false
    this.editStage = 'nothing'
  }

  /**
   *
   */
  setFilter = () => {
    this.data = this.origin.filter(o => {
      return o[0] && o[0].replace(/\D/g, '').includes(this.filter) || o[1] && o[1].toString().includes(this.filter) || o[2] && o[2].includes(this.filter)
    })
  }

  /**
   *
   * @param event
   */
  onFilter = (event: any) => {
    this.filter = event.target.value;
  }

  /**
   *
   * @param data
   */
  validate = (data) => {
    if (data[0].length === 4
      && (data[0][0] && data[0][0].toLowerCase().includes('tracking number')
        && data[0][1] && data[0][1].toLowerCase().includes('tracking source')
        && data[0][2] && data[0][2].toLowerCase().includes('routing')
        && data[0][3] && data[0][3].toLowerCase().includes('receiving number')
      )) {
      return true

    } else {
      this.showWarn('Please upload valid file!')
      return false
    }
  }

  /**
   * remove header
   */
  removeHeader = () => {
    if (!/\d/g.test(this.data[0][0]) && !/\d/g.test(this.data[0][1])) {
      this.data.shift()
      this.origin.shift()
    }
  }

  /**
   *
   * @param event
   */
  changeListener = async (event: any) => {
    if (event.target.files && event.target.files.length > 0) {
      let file: File = event.target.files.item(0)
      const items = file.name.split('.')
      this.file_extension = items[items.length - 1]
      this.encoded_file = await toBase64(file)
      this.encoded_file = this.encoded_file.split(',')[1]

      const reader: FileReader = new FileReader()
      if (file.type === 'text/csv') {
        reader.readAsText(file)

        reader.onload = (e: any) => {
          const data = e.target.result
          let csvRecordsArray = (<string>data).split('\n')
          this.header = csvRecordsArray[0]
          const total = []
          let item = []
          csvRecordsArray.map(c => {
            item = [...c.split(',')]
            total.push(item)
          })

          const isValid = this.validate(total)
          if (isValid) {
            this.data = total
            this.isOpen = false
            this.removeHeader()
          }
        }

      } else {
        reader.onload = (e: any) => {
          /* read workbook */
          const bstr: string = e.target.result
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'})

          /*grab first sheet*/
          const wsname: string = wb.SheetNames[0]
          const ws: XLSX.WorkSheet = wb.Sheets[wsname]

          /* save data */
          let data = <any[][]>(XLSX.utils.sheet_to_json(ws, {header: 1}))
          this.validate(data)
          const isValid = this.validate(data)
          if (isValid) {
            this.data = data
            this.isOpen = false
            this.removeHeader()
          }
        }
        reader.readAsBinaryString(file)
      }
      this.importPanelOpened = false
    }
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

  getInt = (s) => {
    return parseInt(s);
  }
}
