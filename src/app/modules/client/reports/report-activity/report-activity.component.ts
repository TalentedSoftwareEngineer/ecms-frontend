import {Component, OnDestroy, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {ApiService} from '@services/api/api.service';
import {
  CMSUserType,
  DateOptions,
  FilterDate, NoPermissionAlertInteral,
  PERMISSION_TYPE_ALL,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_READONLY
} from '../../constant';

// @ts-ignore
import {Router} from '@angular/router';
import {ReportUnit, ViewItem} from '../enumtypes'
import {StoreService} from '@services/store/store.service';
import {MessageService} from "primeng/api";
import {ActivityData} from "@app/models/callLog";
import {catchError, pluck, take, tap} from "rxjs/operators";
import {of, Subscription} from "rxjs";
import {AppConfig, LayoutService} from "@services/app.layout.service";
import {getStartAndEndDate} from "@app/modules/client/utils";
import {MonthToUSMonth, scrollToTop, TimeToUSTime} from "@app/helper/utils";
import moment from "moment";

@Component({
  selector: 'app-report-activity',
  templateUrl: './report-activity.component.html',
  styleUrls: ['./report-activity.component.scss'],
  animations: [
  ]
})

export class ReportActivityComponent implements OnInit, OnDestroy {

  permission = PERMISSION_TYPE_ALL
  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  filterValue = ''
  filterUnit = 'D'
  filterPanelOpened = false
  dateOptions = DateOptions
  dateMode = FilterDate.today.toString();
  fromValue = null;
  toValue = null;

  private filterSubscription: Subscription;


  graphTypes = [
    { name: 'Hour', value: 'H' },
    { name: 'Day', value: 'D' },
    { name: 'Week', value: 'W' },
    { name: 'Month', value: 'M' }
  ];
  selectedGraphType = { name: 'Day', value: 'D' }
  isGraphTypeChanged = false

  types : any[] = [
    { key: ViewItem.hour, value: ViewItem.hour },
    { key: ViewItem.compare, value: ViewItem.compare },
    { key: ViewItem.trackingSource, value: ViewItem.trackingSource },
  ]
  selectedType = ViewItem.hour  // viewItem

  date_1stDay: Date
  date_2ndDay: Date
  date_1stRange: Date[]
  date_2ndRange: Date[]
  date_1stMonth: Date
  date_2ndMonth: Date

  subscription: Subscription;
  config: AppConfig;

  chartData: any
  chartOptions: any
  chartCompareData: any = {}
  chartCompareOptions: any = {}
  tableData: any[] = []
  tableDataGeneral: any[] = []

  overall_period_unique = 0

  constructor(public api: ApiService, private router: Router, private store: StoreService, private messageService: MessageService, private location: Location, private layoutService: LayoutService) {
    this.initilizeData()
  }

  ngOnDestroy(): void {
    if (this.subscription)
      this.subscription.unsubscribe();

    if (this.filterSubscription)
      this.filterSubscription.unsubscribe();
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
        if (v.GuiSection.name == "ActivityReports") {
          this.permission = v.GuiPermission.name
          break
        }
      }

      if (this.permission == PERMISSION_TYPE_DENY) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

    this.filterSubscription = this.store.filterObservable$.subscribe(() => {
      this.getFilters();
    });

    this.config = this.layoutService.getConfig();
    // this.updateChartOptions();

    this.subscription = this.layoutService.configUpdate$.subscribe(config => {
      this.config = config;
      // this.updateChartOptions();
    });
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

      this.activityReportlist();
    }, e => {
    });
  }

  onChangeType = (event) => {
    this.selectedType = event.value.key

    if (this.selectedType==ViewItem.compare) {
      this.graphTypes = [
        { name: 'Hour', value: 'H' },
        { name: 'Day', value: 'D' },
        { name: 'Range', value: 'R' },
        { name: 'Month', value: 'M' }
      ]

      this.isGraphTypeChanged = true
      return
    } else if (this.isGraphTypeChanged) {
      this.graphTypes = [
          { name: 'Hour', value: 'H' },
          { name: 'Day', value: 'D' },
          { name: 'Week', value: 'W' },
          { name: 'Month', value: 'M' }
      ]
      this.isGraphTypeChanged = false
    }

    this.activityReportlist()
  }

  onSetFilter = (event) => {
    this.filterUnit = event.option.value.value;
    this.activityReportlist()
  };

  activityReportlist = async () => {
    if (this.selectedType==ViewItem.compare) {
      return
    }

    try {
      let viewBy = this.selectedType==ViewItem.trackingSource ? 2 : 0  // means tracking source
      let interval = ''  // interval for loading
      switch (this.filterUnit) {
        case ReportUnit.hour:
          interval = 'hour'
          break
        case ReportUnit.day:
          interval = 'day'
          break
        case ReportUnit.week:
          interval = 'week'
          break
        case ReportUnit.month:
          interval = 'month'
          break
      }

      let startDate_timestamp = new Date(this.fromValue).getTime() / 1000;
      let endDate_timestamp = new Date(this.toValue).getTime() / 1000;

      let customerId = '';
      if (this.store.getUser().username != 'sadmin')
        customerId = this.store.getUser().customerId.toString()

      await this.api.activityReport(startDate_timestamp, endDate_timestamp, interval, viewBy, (-new Date().getTimezoneOffset() / 60), customerId)
        .pipe(tap((report_result) => {

          let options_data = report_result

          this.store.storeFilters({dateMode: this.dateMode, startDate: this.fromValue, endDate: this.toValue});

          let entries_data = options_data.series
          let count = 0;

          if (!entries_data || entries_data.length === 0) {
            entries_data = [
              {
                total_calls: 0,
                total_time: 0,
                name: "None",
                period_contacts: {},
                color: "#F4CDB7",
                series_data: [
                  0
                ]
              },
            ];
          } else {
          }

          let seriesForSource = []

          entries_data.forEach(element => {
            count += element.total_calls

            // remove last element
            const temp_entries_data = {}
            temp_entries_data['color'] = element.color
            const colorLength = element.color.length
            if (colorLength < 7) {
              for (let i = 1; i <= 7 - colorLength; i++) {
                temp_entries_data['color'] = temp_entries_data['color'].concat('0')
              }
            }

            let name = element.name
            if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
              name = TimeToUSTime[name]

            temp_entries_data['label'] = name
            temp_entries_data['data'] = element.series_data
            temp_entries_data['total_calls'] = element.total_calls
            temp_entries_data['total_time'] = element.total_time

            temp_entries_data['fill'] = false
            temp_entries_data['borderColor'] = element.color
            temp_entries_data['tension'] = .4

            seriesForSource.push(temp_entries_data);
          });

          seriesForSource.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

          let axisXCategory = []
          // populate axisXCategory
          if (!options_data.xAxis || !options_data.xAxis.categories) {
          } else {
            axisXCategory = options_data.xAxis.categories;
          }

          // convert axisXCategory to US date time format
          for (let i = 0; i < axisXCategory.length; i++) {

            let mark = axisXCategory[i]
            switch (this.filterUnit) {
              case ReportUnit.hour:
                axisXCategory[i] = TimeToUSTime[mark]
                break

              case ReportUnit.day:
              case ReportUnit.week:
                let marks = mark.split("-")

                axisXCategory[i] = MonthToUSMonth[marks[0]] + " " + marks[1]
                break

              case ReportUnit.month:
                axisXCategory[i] = mark.replace("-", " ")
                break
            }
          }

          this.chartData.labels = axisXCategory
          this.chartData.datasets = seriesForSource

          this.chartData = { ...this.chartData }

          this.buildTable(options_data)
      }), catchError((_) => {
        return of(0);
      })).toPromise();
    } catch (e) {

    }
  }

  /**
   * convert the float value with decimal place size as param
   * @param value float value
   * @param dp decimal place size
   * @returns
   */
  decimalFormatted(value, dp) {
    return +parseFloat(value).toFixed(dp)
  }

  getHour = (time, count) => {
    const exact = time / 60 / count;
    const sec = Math.round((exact - Math.floor(exact)) * 60);
    return Math.floor(exact) + ':' + (sec < 10 ? `0${sec}` : sec);
  }

  calcPeriodUnique = (json) => {
    let count = 0

    for (var prop in json) {
      if (json[prop] == 1) {
        count++
      }
    }

    return count
  }

  buildTable(options_data) {
    let overall_period_unique = 0
    this.tableData = [];
    let call_max = 0

    if (!options_data || !options_data.tabular || !options_data.tabular.globals) {
      call_max = 0;
    } else {
      call_max = options_data.tabular.globals.total_calls;


      for (let i = 0; i < options_data.series.length; i++) {
        const int_call_num = options_data.series[i]['total_calls']

        let percent = int_call_num / call_max
        percent = percent * 100
        percent = this.decimalFormatted(percent, 2)

        let period_unique = this.calcPeriodUnique(options_data.series[i]['period_contacts'])
        overall_period_unique += period_unique

        let name = options_data.series[i]['name']
        if (this.selectedType == ViewItem.hour && TimeToUSTime[name] != undefined)
          name = TimeToUSTime[name]

        this.tableData.push({
          'name': name,
          'total_calls': options_data.series[i]['total_calls'],
          'total_time': Math.round(options_data.series[i]['total_time'] / 60),
          'period_unique': period_unique,
          'avg_time': this.getHour(options_data.series[i]['total_time'], options_data.series[i]['total_calls']),
          'color': options_data.series[i]['color'],
          'data': options_data.series[i]['series_data'],
          'percent': percent
        })
      }

      this.tableDataGeneral = [{
        'name': 'Totals',
        'total_calls': options_data.tabular.globals['total_calls'],
        'total_time': Math.round(options_data.tabular.globals['total_time'] / 60),
        'avg_time': this.getHour(options_data.tabular.globals['total_time'], options_data.tabular.globals['total_calls']),
        'color': options_data.tabular.globals['color'],
        'data': options_data.tabular.globals['series_data'],
        'overall_period_unique': overall_period_unique
      }]
    }

    this.tableData.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)
    this.overall_period_unique = overall_period_unique
  }

  onClickData = (name: string) => {
    scrollToTop()

    let searchAttr = "", searchValue = ""

    switch (this.selectedType) {
      case ViewItem.hour:
        searchAttr = "created"
        searchValue = name
        break

      case ViewItem.compare:
        return
        break

      case ViewItem.trackingSource:
        searchAttr = "source"
        searchValue = name
        break
    }

    this.router.navigate(['/service/call-log'], {
      queryParams: {
        dateMode: this.dateMode,
        strStartDate: this.fromValue,
        strEndDate: this.toValue,
        searchAttr: searchAttr,
        searchValue: searchValue,
      }
    })
  };

  onClickCompare = async () => {
    if (this.filterUnit == ReportUnit.hour) {
      this.showWarn("The Comparing chart doesn't support Hour mode.")
      return
    }

    let axisXCategory = []
    let timerange_min = []
    let timerange_max = []

    switch (this.filterUnit) {
      case ReportUnit.day:
        if (this.date_1stDay==null || this.date_2ndDay==null) {
          this.showWarn("Please select date to compare")
          return
        }

        timerange_min[0] = new Date(Date.UTC(this.date_1stDay.getFullYear(), this.date_1stDay.getMonth(), this.date_1stDay.getDate(), 0, 0, 0)).toISOString();
        timerange_max[0] = new Date(Date.UTC(this.date_1stDay.getFullYear(), this.date_1stDay.getMonth(), this.date_1stDay.getDate(), 23, 59, 59)).toISOString();
        axisXCategory.push(moment(timerange_min[0]).format('M/D/YYYY').toString());

        timerange_min[1] = new Date(Date.UTC(this.date_2ndDay.getFullYear(), this.date_2ndDay.getMonth(), this.date_2ndDay.getDate(), 0, 0, 0)).toISOString();
        timerange_max[1] = new Date(Date.UTC(this.date_2ndDay.getFullYear(), this.date_2ndDay.getMonth(), this.date_2ndDay.getDate(), 23, 59, 59)).toISOString();
        axisXCategory.push(moment(timerange_min[1]).format('M/D/YYYY').toString());
        break

      case ReportUnit.range:
        if (this.date_1stRange==null || this.date_2ndRange==null || this.date_1stRange[0]==null || this.date_1stRange[1]==null || this.date_2ndRange[0]==null || this.date_2ndRange[1]==null) {
          this.showWarn("Please select date range to compare")
          return
        }

        timerange_min[0] = new Date(Date.UTC(this.date_1stRange[0].getFullYear(), this.date_1stRange[0].getMonth(), this.date_1stRange[0].getDate(), 0, 0, 0)).toISOString();
        timerange_max[0] = new Date(Date.UTC(this.date_1stRange[1].getFullYear(), this.date_1stRange[1].getMonth(), this.date_1stRange[1].getDate(), 23, 59, 59)).toISOString();
        axisXCategory.push(moment(this.date_1stRange[0]).format('M/D/YYYY').toString() + ' ~ ' + moment(this.date_1stRange[1]).format('M/D/YYYY').toString());

        timerange_min[1] = new Date(Date.UTC(this.date_2ndRange[0].getFullYear(), this.date_2ndRange[0].getMonth(), this.date_2ndRange[0].getDate(), 0, 0, 0)).toISOString();
        timerange_max[1] = new Date(Date.UTC(this.date_2ndRange[1].getFullYear(), this.date_2ndRange[1].getMonth(), this.date_2ndRange[1].getDate(), 23, 59, 59)).toISOString();
        axisXCategory.push(moment(this.date_2ndRange[0]).format('M/D/YYYY').toString() + ' ~ ' + moment(this.date_2ndRange[1]).format('M/D/YYYY').toString());
        break

      case ReportUnit.month:
        if (this.date_1stMonth==null || this.date_2ndMonth==null) {
          this.showWarn("Please select month to compare")
          return
        }

        let first, end
        first = new Date(this.date_1stMonth)
        end = new Date(new Date(this.date_1stMonth).setMonth(new Date(this.date_1stMonth).getMonth() + 1));
        end = new Date(end.setDate(end.getDate() - 1));

        timerange_min[0] = new Date(Date.UTC(first.getFullYear(), first.getMonth(), 1, 0, 0, 0)).toISOString();
        timerange_max[0] = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)).toISOString();
        axisXCategory.push(moment(this.date_1stMonth).format('M/YYYY').toString());

        first = new Date(this.date_2ndMonth)
        end = new Date(new Date(this.date_2ndMonth).setMonth(new Date(this.date_2ndMonth).getMonth() + 1));
        end = new Date(end.setDate(end.getDate() - 1));

        timerange_min[1] = new Date(Date.UTC(first.getFullYear(), first.getMonth(), 1, 0, 0, 0)).toISOString();
        timerange_max[1] = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)).toISOString();
        axisXCategory.push(moment(this.date_2ndMonth).format('M/YYYY').toString());
        break
    }

    var start_min = timerange_min[0];
    var start_max = timerange_max[0];
    var end_min = timerange_min[1];
    var end_max = timerange_max[1];
    var date_start_min = new Date(start_min);
    var date_start_max = new Date(start_max);
    var date_end_min = new Date(end_min);
    var date_end_max = new Date(end_max);
    var timestamp_start_min = date_start_min.getTime();
    var timestamp_start_max = date_start_max.getTime();
    var timestamp_end_min = date_end_min.getTime();
    var timestamp_end_max = date_end_max.getTime();

    var timestamp_norm_start_min = timestamp_start_min / 1000;
    var timestamp_norm_start_max = timestamp_start_max / 1000;
    var timestamp_norm_end_min = timestamp_end_min / 1000;
    var timestamp_norm_end_max = timestamp_end_max / 1000;

    var range1 = timestamp_norm_start_min + '~' + timestamp_norm_start_max;
    var range2 = timestamp_norm_end_min + '~' + timestamp_norm_end_max;

    this.api.compareDatarange(range1, range2)
      .subscribe((options_data: any) => {
        var datacompare = Object.entries(options_data);
        console.log(datacompare)

        this.chartCompareData.labels = axisXCategory
        this.chartCompareData.datasets = []
        this.chartCompareData.datasets.push({
          label: "Total Calls",
          backgroundColor: datacompare[0][1]['color'],
          yAxisID: 'y',
          data: [ datacompare[0][1]['total_calls'], datacompare[1][1]['total_calls'] ]
        })
        this.chartCompareData.datasets.push({
          label: "Total Times",
          backgroundColor: datacompare[1][1]['color'],
          yAxisID: 'y1',
          data: [ datacompare[0][1]['total_time'], datacompare[1][1]['total_time'] ]
        })

        console.log(this.chartCompareData)
        this.chartCompareData = { ...this.chartCompareData }
      }, e => {

      })
  }

  initilizeData() {
    this.chartData = {
      labels: [],
      datasets: [
      ]
    };

    this.chartCompareData = {
      labels: [],
      datasets: [
      ]
    };
  }

  updateChartOptions() {
    if (this.config.colorScheme=='dark')
      this.applyDarkTheme();
    else
      this.applyLightTheme();
  }

  applyDarkTheme() {
    this.chartOptions = {
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

    this.chartCompareOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#ebedef'
          }
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#ebedef'
          },
          grid: {
            color: 'rgba(255,255,255,0.2)'
          }
        },
        yAxes: [
          {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              color: '#ebedef'
            },
            grid: {
              color: 'rgba(255,255,255,0.2)'
            },
            id: 'y',
          },
          {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255,255,255,0.2)'
            },
            ticks: {
              color: '#ebedef'
            },
            id: 'y1'
          }
        ],
      }
    };

  }

  applyLightTheme() {
    this.chartOptions = {
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

    this.chartCompareOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        },
        tooltips: {
          mode: 'index',
          intersect: true
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
        yAxes: [
          {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              min: 0,
              max: 100,
              color: '#495057'
            },
            grid: {
              color: '#ebedef'
            },
            id: 'y'
          },
          {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
              color: '#ebedef'
            },
            ticks: {
              min: 0,
              max: 100,
              color: '#495057'
            },
            id: 'y1'
          }
        ]

      }
    };
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

}
