import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {
  overviewOptions, getDateByUTC, scrollToTop, overviewHourOption, pieOption1, findDuplicates, getApexPieChartOption,
  colors, weeks,
} from '@app/helper/utils';
import moment from 'moment';
import {Location} from '@angular/common';
import {GetSources} from '@app/models/tracking_numbers';
import {LightLog} from '@app/models/callLog';
import {ApiService} from '@services/api/api.service';
import {Router} from '@angular/router';
import {of, Subscription} from 'rxjs';
import { FilterDate, DateOptions, CMSUserType, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY, NoPermissionAlertInteral } from '../../constant';
import { ReportUnit } from '../enumtypes'
import { AnimationInterval } from '../../constant';

import {catchError, pluck, take, tap} from 'rxjs/operators';
import {StoreService} from '@services/store/store.service';
import { getFilterDateMode, getStartAndEndDate } from '../../utils';
import {MessageService} from "primeng/api";
import {AppConfig, LayoutService} from "@services/app.layout.service";

@Component({
  selector: 'app-report-overview',
  templateUrl: './report-overview.component.html',
  styleUrls: ['./report-overview.component.scss'],
  animations: [
  ]
})
export class ReportOverviewComponent implements OnInit, OnDestroy {

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  reportUnit = ReportUnit
  filter = ReportUnit.day.toString()
  filterValue = ''

  private filterSubscription: Subscription;

  filterPanelOpened = false
  dateOptions = DateOptions
  dateMode = FilterDate.today.toString();
  fromValue = null;
  toValue = null;

  isLoading = false;

  graphTypes = [
      { name: 'Hour', value: 'H' },
      { name: 'Day', value: 'D' },
      { name: 'Week', value: 'W' },
      { name: 'Month', value: 'M' }
    ];
  selectedGraphType = { name: 'Day', value: 'D' }

  top = { total: -1, contact: 0, avgTime: '0', source: '', day: '', hour: '' };

  subscription: Subscription;
  config: AppConfig;

  totalData: any
  totalOptions: any

  totalCallersData: any
  totalCallersOption: any
  totalCallersTable: any[] = []

  averageDurationCallData: any
  averageDurationCallOption: any
  averageDurationCallTable: any[] = []

  constructor(public api: ApiService, private router: Router, private store: StoreService, private messageService: MessageService, private location: Location, private layoutService: LayoutService) {
    this.initilizeData()
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
      let guiVisibility = this.store.getGuiVisibility()


      this.permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "Overview") {
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

    this.isLoading = true
    this.filterSubscription = this.store.filterObservable$.subscribe(() => {
      this.getFilters();
    });

    this.config = this.layoutService.getConfig();
    this.updateChartOptions();

    this.subscription = this.layoutService.configUpdate$.subscribe(config => {
      this.config = config;
      this.updateChartOptions();
    });

  }

  ngOnDestroy() {
    if (this.subscription)
      this.subscription.unsubscribe();

    if (this.filterSubscription)
      this.filterSubscription.unsubscribe();
  }

  initilizeData() {
    this.totalData = {
      labels: [],
      datasets: [
        {
          label: 'Activities',
          data: [],
          fill: false,
          borderColor: '#42A5F5',
          tension: .4
        },
        {
          label: 'Contacts',
          data: [],
          fill: false,
          borderColor: '#FFA726',
          tension: .4
        }
      ]
    };

    this.totalCallersData = {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
          ],
          hoverBackgroundColor: [
          ]
        }
      ]
    };

    this.averageDurationCallData = {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
          ],
          hoverBackgroundColor: [
          ]
        }
      ]
    };
  }

  getFilters = () => {
    this.store.state$.pipe(pluck('filters'), take(1)).subscribe(async filters => {
      if (!!filters) {
        this.dateMode = filters.dateMode;
        this.fromValue = filters.startDate//.replace('T', ' ');
        this.toValue = filters.endDate//.replace('T', ' ');
      }

      if (this.fromValue == null || this.toValue == null) {
        let dates = await getStartAndEndDate(this.dateMode)
        if (dates.strStartDate != '') {
          this.fromValue = dates.strStartDate//.replace("T"," ")
          this.toValue = dates.strEndDate//.replace("T"," ")
        }
      }

      this.getData();
    }, e => {
    });
  }

  getData = async () => {
    let customerId = '';
    // Blinding to 'sadmin' username for now
    // if (this.store.getUserType() != CMSUserType.superAdmin)
    if (this.store.getUser().username != 'sadmin')
      customerId = this.store.getUser().customerId.toString()

    try {
      await this.api.overviewReport(new Date(this.fromValue).getTime() / 1000, new Date(this.toValue).getTime() / 1000, (-new Date().getTimezoneOffset() / 60), this.filter, customerId)
        .pipe(tap(async res => {
          // Debug

          this.store.storeFilters({dateMode: this.dateMode, startDate: this.fromValue, endDate: this.toValue});

          if (Object.keys(res).length === 0) {
            res = {
              'none ~ none': {
                total_calls: 0,
                total_time: 0,
                total_contacts: 0,
                average_time: 0,
                color: '#1416D2',
                timeline_chart: {
                  xAxis: {
                    categories: []
                  },
                  series: {
                    activity_data: [
                      0
                    ],
                    contacts_data: [
                      0
                    ],
                    contacts_step: {}
                  }
                },
                hour_steps: {
                  max: {
                    name: null
                  }
                },
                day_steps: {
                  max: {
                    name: null
                  },
                },
                contacts_global: {},
                tsources: {
                  max: {
                    name: null
                  }
                }
              }
            };
          }

          const day = Object.keys(res)[0].split(' ~ ');
          const data: any = Object.values(res)[0];
          this.top.contact = data['total_contacts'];
          this.top.total = data['total_calls'];
          this.top.avgTime = Math.floor(data['average_time'] / 60) + ':' + Math.round((data['average_time'] / 60 - Math.floor(data['average_time'] / 60)) * 60);
          this.top.source = data['tsources'].max.name;
          this.top.day = data.day_steps.max.name;
          this.top.hour = data.hour_steps.max.name;

          this.totalData.labels = data.timeline_chart.xAxis.categories
          this.totalData.datasets[0].data = data.timeline_chart.series.activity_data
          this.totalData.datasets[1].data = data.timeline_chart.series.contacts_data

          if (((parseInt(day[1]) - parseInt(day[0])) < 3600 * 24) && this.filter === 'D') {
            this.totalData.labels.push(moment(new Date(parseInt(day[0]) * 1000)).format('MM-DD'));

            this.totalData.datasets[0].data.unshift(0)
            this.totalData.datasets[1].data.unshift(0)
          }

          this.totalData = { ...this.totalData }

          delete data.tsources.max;
          this.totalCallersData.labels = []
          this.totalCallersData.datasets[0].data = []
          this.totalCallersData.datasets[0].backgroundColor = []
          this.totalCallersData.datasets[0].hoverBackgroundColor = []
          this.totalCallersTable = []

          this.averageDurationCallData.labels = []
          this.averageDurationCallData.datasets[0].data = []
          this.averageDurationCallData.datasets[0].backgroundColor = []
          this.averageDurationCallData.datasets[0].hoverBackgroundColor = []
          this.averageDurationCallTable = []

          Object.keys(data.tsources).map(k => {
            this.totalCallersData.labels.push(k)
            this.totalCallersData.datasets[0].data.push(data.tsources[k].total_calls)
            this.totalCallersData.datasets[0].backgroundColor.push(data.tsources[k].color)
            this.totalCallersData.datasets[0].hoverBackgroundColor.push(data.tsources[k].color)

            this.totalCallersTable.push({
              color: data.tsources[k].color,
              'source': k,
              'activity': data.tsources[k].total_calls,
              'contact': data.tsources[k].total_contacts,
              'percent': (data.tsources[k].total_calls * 1.0 / data.total_calls * 100).toFixed(2)
            })

            this.averageDurationCallData.labels.push(k)
            this.averageDurationCallData.datasets[0].data.push(data.tsources[k].total_duration)
            this.averageDurationCallData.datasets[0].backgroundColor.push(data.tsources[k].color)
            this.averageDurationCallData.datasets[0].hoverBackgroundColor.push(data.tsources[k].color)

            this.averageDurationCallTable.push({
              color: data.tsources[k].color,
              'source': k,
              'duration': data.tsources[k].total_duration,
              'percent': (data.tsources[k].total_duration * 1.0 / data.total_time * 100).toFixed(2)
            })
          });

          this.totalCallersData = { ...this.totalCallersData }
          this.averageDurationCallData = { ...this.averageDurationCallData }
        }), catchError((_) => {
          return of(0);
        })).toPromise();
    } catch (e) {
    }
  }

  updateChartOptions() {
    if (this.config.colorScheme=='dark')
      this.applyDarkTheme();
    else
      this.applyLightTheme();
  }

  applyDarkTheme() {
    this.totalOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      }
    };

    this.totalCallersOption = {
      plugins: {
        legend: {
          labels: {
            color: '#ebedef'
          }
        }
      }
    };

    this.averageDurationCallOption = {
      plugins: {
        legend: {
          labels: {
            color: '#ebedef'
          }
        }
      }
    };
  }

  applyLightTheme() {
    this.totalOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      }
    };

    this.totalCallersOption = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      }
    };

    this.averageDurationCallOption = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      }
    };
  }

  onSearch(event) {
    this.getData()
  }

  onSetFilter = (event) => {
    this.filter = event.option.value.value;
    this.getData();
  };

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

}

