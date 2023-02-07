import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FixedPipe} from '@pipes/fixed.pipe';
import {FixedTimePipe} from '@pipes/fixed-time.pipe';
import {RoundPipe} from '@pipes/round.pipe';
import {TimePipe} from '@pipes/time.pipe';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import {
  CalcPeriodUniquePercPipe,
  CeilWithMinimumPipe,
  SecondsToMinutesPipe
} from '../../../helper/utils';
import {CalendarModule} from "primeng/calendar";
import {ToolbarModule} from "primeng/toolbar";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    FixedPipe,
    FixedTimePipe,
    RoundPipe,
    TimePipe,
    CalcPeriodUniquePercPipe,
    CeilWithMinimumPipe,
    SecondsToMinutesPipe,
    FilterPanelComponent
  ],
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    RippleModule,
    CalendarModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    FixedPipe,
    FixedTimePipe,
    RoundPipe,
    TimePipe,
    CalcPeriodUniquePercPipe,
    CeilWithMinimumPipe,
    SecondsToMinutesPipe,
    FilterPanelComponent
  ]
})
export class SharedModule { }
