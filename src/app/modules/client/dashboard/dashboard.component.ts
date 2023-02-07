import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { catchError, map, mergeMap, pluck, take, tap } from 'rxjs/operators';
import { StoreService } from '@services/store/store.service';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { AnimationInterval, FilterDate, DateOptions, PERMISSION_TYPE_ALL, PERMISSION_TYPE_READONLY, CMSUserType } from '../constant';
import { getStartAndEndDate, getFilterDateMode } from '../utils';
import { ApiService } from '../../../services/api/api.service';
import { RouteNames } from '../client.routes';
import { ActivityData, CallLog, LightLog } from '../../../models/callLog';
import { ViewItem, ReportUnit } from '../reports/enumtypes';
import { Observable, of, Subscription } from 'rxjs';
import { initOption, USTimeToTime, TimeToUSTime, MonthToUSMonth, USMonthToMonth, DaysOfMonth, colors, getDateByUTC, scrollToTop, CeilWithMinimumPipe, CalcPeriodUniquePercPipe, SecondsToMinutesPipe } from '@app/helper/utils';
import { Router } from '@angular/router';

import { Location } from '@angular/common';
import * as _ from 'lodash';

// @ts-ignore
import moment, { utc } from 'moment';
import {MessageService} from "primeng/api";
import {AppConfig, LayoutService} from "@services/app.layout.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [
  ]
})

export class DashboardComponent implements OnInit, OnDestroy {

  fullname: string;

  logsCounts = {
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
  }

  private filterSubscription: Subscription
  ReportUnit = ReportUnit
  ViewItem = ViewItem

  optionsForSource: any               // options for tracking source
  optionsForHour: any                 // options for hour
  optionsForCompare: any              // options for compare

  filterUnit = ReportUnit.day         // report unit filter
  axisXCategory: string[]             // x-axis categores

  seriesForSource = []                // series for tracking source
  seriesForHour = []                  // series for hour
  seriesForCompare = []               // series for compare
  isLoading = false                   // the flag that presents if the data is loading from backend

  isBar = false                       // the flag tha presents if the chart type is bar, true: bar, false: not bar(line)
  viewItem = ViewItem.trackingSource  // view item(Tracking Source, Hour, Compare)

  startDate_timestamp = null          // time stamp value for start date
  endDate_timestamp = null            // time stamp value for end date
  firstDate = null
  secDate = null

  isHour = false
  isHourDate = null

  options_data: ActivityData = {}      // options data
  isEmptyData = false                  // the flag that checks if the data is empty

  table_contain = []
  timerange_min = [];
  timerange_max = [];

  public table_data = [];               // table data to show on the chart
  public table_data_general = [];       // general table data

  call_max = null
  first = null
  second = null
  overall_period_unique = 0

  // filter params
  dateOptions = DateOptions             // date mode options
  filterValue = ''                      // search value
  dateModeString = ''                   // filter date mode string
  dateMode = FilterDate.today.toString(); // filter date mode like today, yesterady, last 7 days....
  strStartDate: string = null;          // start date string
  strEndDate: string = null;            // end date string
  toggleFilterPanel = false;            // the variable to toggle filter panel

  // router
  routeNames = RouteNames

  selSeriesIndex = -1                   // selected series index
  selCategoryIndex = -1                 // selected x-axis category index

  permission = PERMISSION_TYPE_ALL

  permissionTypeAll = PERMISSION_TYPE_ALL
  permissionTypeReadOnly = PERMISSION_TYPE_READONLY

  chartType = 'bar' // ChartType = 'bar'          // chart type

  ceilWithMinimum = CeilWithMinimumPipe
  calcPeriodUniquePerc = CalcPeriodUniquePercPipe
  secondsToMinutes = SecondsToMinutesPipe

  totalData: any
  totalOptions: any

  subscription: Subscription;
  config: AppConfig;


  constructor(public api: ApiService, private router: Router, private store: StoreService, private messageService: MessageService, private location: Location, private layoutService: LayoutService) {
    this.initilizeData()
  }

  async ngOnInit() {

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    });

    this.store.state$.subscribe(state => {
      if (state.user) {
        this.fullname = (state.user.firstName ? state.user.firstName : '') + ' ' + (state.user.lastName ? state.user.lastName : '');
      }
    });

    // activity report
    this.isLoading = true;
    try {
      this.logsCounts.today = await this.getCallLogsCountOb(FilterDate.today).toPromise();
      this.logsCounts.yesterday = await this.getCallLogsCountOb(FilterDate.yesterday).toPromise();
      this.logsCounts.thisWeek = await this.getCallLogsCountOb(FilterDate.thisWeek).toPromise();
      this.logsCounts.lastWeek = await this.getCallLogsCountOb(FilterDate.lastWeek).toPromise();
      this.logsCounts.thisMonth = await this.getCallLogsCountOb(FilterDate.thisMonth).toPromise();
      this.logsCounts.lastMonth = await this.getCallLogsCountOb(FilterDate.lastMonth).toPromise();

    } catch (err) {
    }

    this.config = this.layoutService.getConfig();
    this.updateChartOptions();

    this.subscription = this.layoutService.configUpdate$.subscribe(config => {
      this.config = config;
      this.updateChartOptions();
    });

    // activity report
    await this.activityReportlist();
  }

  ngOnDestroy() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

  getCallLogsCountOb(dateMode): Observable<number> {
    // get start date and end date according to filter date mode
    const dateRange = getStartAndEndDate(dateMode);
    const timeValueForStartDate = new Date(dateRange.strStartDate + ':00.000Z').getTime() + new Date().getTimezoneOffset() * 60000
    const timeValueForEndDate = new Date(dateRange.strEndDate + ':00.000Z').getTime() + new Date().getTimezoneOffset() * 60000
    const dFrom = new Date(timeValueForStartDate).toISOString()
    const dTo = new Date(timeValueForEndDate).toISOString()

    return this.api.getDashLogsCount(dFrom, dTo).pipe(map(result => {
      return result.total_calls;
    }), catchError((_) => {
      return of(0);
    }));
  }

  activityReportlist = async () => {
    const date = moment("2021-03-28"); // Thursday Feb 2015
    const dow = date.day();


    this.isLoading = true
    if (this.table_data_general.length > 0)
      this.table_data_general[0].total_calls = -1

    try {
      let viewBy = 2  // means tracking source
      let interval = 'day'  // interval for loading

      let subDays = moment().day()
      if (subDays == 0)
        subDays = 6
      else
        subDays--

      let curTmValue = new Date().getTime()
      let startDate_timestamp = new Date(moment().subtract(subDays, 'days').format('YYYY-MM-DD')).getTime() / 1000;
      let endDate_timestamp = Math.floor(curTmValue / 1000);

      let customerId = ''
      // Blinding to 'sadmin' username for now
      // if (this.store.getUserType() != CMSUserType.superAdmin)
      if (this.store.getUser().username != 'sadmin')
        customerId = this.store.getUser().customerId.toString()

      const options_data = await this.api.activityReport(startDate_timestamp, endDate_timestamp, interval, viewBy, (-new Date().getTimezoneOffset() / 60), customerId).toPromise();

      this.store.storeFilters({ dateMode: this.dateMode, startDate: this.strStartDate, endDate: this.strEndDate });
      this.options_data = options_data
      const entries_data = this.options_data.series

      // populate seriesForSource
      this.seriesForSource = []
      // populate table after graphic

      let count = 0
      if(entries_data)
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
          if (this.viewItem == ViewItem.hour && TimeToUSTime[name] != undefined)
            name = TimeToUSTime[name]

          temp_entries_data['label'] = name
          temp_entries_data['data'] = element.series_data
          temp_entries_data['total_calls'] = element.total_calls
          temp_entries_data['total_time'] = element.total_time

          temp_entries_data['fill'] = false
          temp_entries_data['borderColor'] = element.color
          temp_entries_data['tension'] = .4

          this.seriesForSource.push(temp_entries_data)
        })

      this.seriesForSource.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)

      if (this.seriesForSource.length > 0) {
        this.isEmptyData = true
      }

      // populate axisXCategory
      if(this.options_data != null && this.options_data.xAxis != null) {
        this.axisXCategory = this.options_data.xAxis.categories

        // convert axisXCategory to US date time format
        for (let i = 0; i < this.axisXCategory.length; i++) {
          let marks = this.axisXCategory[i].split("-")
          this.axisXCategory[i] = MonthToUSMonth[marks[0]] + " " + marks[1]
        }

        this.totalData.labels = this.axisXCategory
        this.totalData.datasets = this.seriesForSource

        this.totalData = { ...this.totalData }
      }

      this.buildTable()

      //remove loading page
      this.isLoading = false

    } catch (e) {
    }
  }

  getUSDateString = (strDate: string) => {
    return moment(strDate).format('M/D/YYYY').toString()
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

  decimalFormatted(value, dp) {
    return +parseFloat(value).toFixed(dp)
  }

  buildTable() {
    this.call_max = this.options_data.tabular.globals.total_calls;
    this.overall_period_unique = 0
    this.table_data = [];

    for (let i = 0; i < this.options_data.series.length; i++) {
      const int_call_num = this.options_data.series[i]['total_calls']

      let percent = int_call_num / this.call_max
      percent = percent * 100
      percent = this.decimalFormatted(percent, 2)

      let period_unique = this.calcPeriodUnique(this.options_data.series[i]['period_contacts'])
      this.overall_period_unique += period_unique

      let name = this.options_data.series[i]['name']
      if (this.viewItem == ViewItem.hour && TimeToUSTime[name] != undefined)
        name = TimeToUSTime[name]

      this.table_data.push({
        'name': name,
        'total_calls': this.options_data.series[i]['total_calls'],
        'total_time': Math.round(this.options_data.series[i]['total_time'] / 60),
        'period_unique': period_unique,
        'avg_time': this.getHour(this.options_data.series[i]['total_time'], this.options_data.series[i]['total_calls']),
        'color': this.options_data.series[i]['color'],
        'data': this.options_data.series[i]['series_data'],
        'percent': percent
      })
    }

    this.table_data_general = [{
      'name': 'Totals',
      'total_calls': this.options_data.tabular.globals['total_calls'],
      'total_time': Math.round(this.options_data.tabular.globals['total_time'] / 60),
      'avg_time': this.getHour(this.options_data.tabular.globals['total_time'], this.options_data.tabular.globals['total_calls']),
      'color': this.options_data.tabular.globals['color'],
      'data': this.options_data.tabular.globals['series_data'],
      'overall_period_unique': this.overall_period_unique
    }]

    this.table_data.sort((a, b) => a.total_calls > b.total_calls ? -1 : 1)
  }


  initilizeData() {
    this.totalData = {
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
  }

}
