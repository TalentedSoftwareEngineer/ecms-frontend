import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';

import { ReportsRouting } from '@app/modules/client/reports/reports.routing';
import { ReportActivityComponent } from './report-activity/report-activity.component';
import { ReportOverviewComponent } from './report-overview/report-overview.component';

import { SharedModule } from '@app/modules/client/shared/shared.module';
import {ChartModule} from "primeng/chart";
import {ToggleButtonModule} from "primeng/togglebutton";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {PanelModule} from "primeng/panel";
import {CalendarModule} from "primeng/calendar";
import {RippleModule} from "primeng/ripple";
import {SelectButtonModule} from "primeng/selectbutton";
import {TableModule} from "primeng/table";
import {DropdownModule} from "primeng/dropdown";

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    RippleModule,
    SelectButtonModule,
    ToolbarModule,
    InputTextModule,
    ChartModule,
    DropdownModule,
    ToggleButtonModule,
    FormsModule,
    ReactiveFormsModule,
    PanelModule,
    CalendarModule,
    TableModule,
    ReportsRouting,
    SharedModule
  ],
  declarations: [
    ReportActivityComponent,
    ReportOverviewComponent
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})

export class ReportsModule {}
