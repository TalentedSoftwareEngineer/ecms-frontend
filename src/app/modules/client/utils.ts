import { FilterDate } from './constant'
import moment from 'moment'

/**
 * get filter date mode string
 * @returns
 */
export const getFilterDateMode = (dateMode, strStartDate, strEndDate) => {
  switch (dateMode) {
    case FilterDate.today:
      return "Today"

    case FilterDate.yesterday:
      return "Yesterday"

    case FilterDate.thisMonth:
      return "This Month"

    case FilterDate.lastMonth:
      return "Last Month"

    case FilterDate.thisWeek:
      return "This Week"

    case FilterDate.lastWeek:
      return "Last Week"

    case FilterDate.last7:
      return "Last 7 Days"

    case FilterDate.last30:
      return "Last 30 Days"

    case FilterDate.range:
      {
        let fromDate = moment(strStartDate).format('MM/DD/YYYY')
        let toDate = moment(strEndDate).format('MM/DD/YYYY')
        if (fromDate == toDate) {
          return fromDate;
          // fromDate = moment(strStartDate).format('MM/DD/YYYY hh:mm A')
          // toDate = moment(strEndDate).format('MM/DD/YYYY hh:mm A')
        }
        return fromDate + " ~ " + toDate
      }
   }
}

/**
 * Set start and end date from filtering Option
 * @param dateMode filter date mode
 * @param sDate start date
 * @param eDate end date
 * @returns {strStartDate, strEndDate}
 */
export const getStartAndEndDate = (dateMode, sDate = null, eDate = null) => {

  const today = new Date()
  const now = moment(today).format('M/D/YYYY').toString()
  let startDate = sDate, endDate = eDate

  let strStartDate = "", strEndDate = ""
  switch (dateMode) {
    case FilterDate.today:
      {
        strStartDate = now
        strEndDate = now
      }
      break

    case FilterDate.yesterday:
      {
        const yesterday = moment(new Date(today.setDate(today.getDate() - 1))).format('M/D/YYYY').toString()
        strStartDate = yesterday
        strEndDate = yesterday
      }
      break

    case FilterDate.thisMonth:
      {
        strStartDate = moment().startOf('month').format('M/D/YYYY')
        strEndDate = moment().endOf('month').format('M/D/YYYY')
      }
      break

    case FilterDate.lastMonth:
      {
        strStartDate = moment().subtract(1, 'months').startOf('month').format('M/D/YYYY')
        strEndDate = moment().subtract(1, 'months').endOf('month').format('M/D/YYYY')
      }
      break

    case FilterDate.thisWeek:
      {
        strStartDate = moment().startOf('week').format('M/D/YYYY')
        strEndDate = moment().endOf('week').format('M/D/YYYY')
      }
      break

    case FilterDate.lastWeek:
      {
        strStartDate = moment().subtract(1, 'weeks').startOf('week').format('M/D/YYYY')
        strEndDate = moment().subtract(1, 'weeks').endOf('week').format('M/D/YYYY')
      }
      break

    case FilterDate.last7:
      {
        strStartDate = moment(new Date(today.setDate(today.getDate() - 6))).format('M/D/YYYY')
        strEndDate = now
      }
      break

    case FilterDate.last30:
      {
        strStartDate = moment(new Date(today.setDate(today.getDate() - 29))).format('M/D/YYYY')
        strEndDate = now
      }
      break
  }

  if (strStartDate != "") {
    startDate = new Date(strStartDate + ', 12:00 AM')
    endDate = new Date(strEndDate + ', 11:59 PM')
  }

  let strRetureStartDate = "", strReturnEndDate = ""
  if (startDate && endDate) {
    const tzoffset = new Date().getTimezoneOffset() * 60000
    // @ts-ignore
    strRetureStartDate = new Date(new Date(startDate) - tzoffset).toISOString().substring(0, 16)
    // @ts-ignore
    strReturnEndDate = new Date(new Date(endDate) - tzoffset).toISOString().substr(0, 16)
  }

  return {
    strStartDate: strRetureStartDate,
    strEndDate: strReturnEndDate
  }
}

/**
 * close opened panels, is called when the user opens the a panel like menu, filter and then clicks quick page or main contents body
 */
export const closePanels = () => {

  // close filter panel
  if (document.getElementsByClassName('filter_div')[0] != undefined)
    document.getElementsByClassName('filter_div')[0].classList.remove("open")

  // close menu
  if (document.getElementsByTagName('body')[0] && !document.getElementsByTagName('body')[0].classList.contains('offcanvas-active'))
    document.getElementsByTagName('body')[0].classList.add('offcanvas-active')

  if (document.getElementById('page-header-left-part') && !document.getElementById('page-header-left-part').classList.contains('offcanvas-active'))
    document.getElementById('page-header-left-part').classList.add('offcanvas-active')

  if (document.getElementById('page-header-right-part') && !document.getElementById('page-header-right-part').classList.contains('offcanvas-active'))
    document.getElementById('page-header-right-part').classList.add('offcanvas-active')

  // close overlay
  document.getElementsByClassName('overlay')[0].classList.remove("open")

}
