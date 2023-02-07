import { NgxStripeModule } from 'ngx-stripe';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { OverlayModule } from '@angular/cdk/overlay';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService } from '@services/api/api.service';
import { StoreService } from '@services/store/store.service';
import { PopupService } from '@services/popup/popup.service';
import { StatusInterceptor, TokenInterceptor } from './services/middlewares';
import { PopupComponent } from '@components/popup/popup.component';
import { ClientComponent } from '@app/modules/client/client.component';
import { LayoutService } from "@services/app.layout.service";
import {ConfirmationService, MessageService} from "primeng/api";
import {MenuService} from "@services/app.menu.service";
import {ToastModule} from "primeng/toast";

import { environment } from '@env/environment';
export const config = Object.freeze(environment);

declare module "@angular/core" {
  interface ModuleWithProviders<T = any> {
    ngModule: Type<T>;
    providers?: Provider[];
  }
}

@NgModule({
  declarations: [
    AppComponent,
    PopupComponent,
    ClientComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    OverlayModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    ToastModule,
    BrowserAnimationsModule,
    NgxStripeModule.forRoot(config.stripe.key)
  ],
  providers: [
		ApiService,
		StoreService,
		PopupService,
    LayoutService,
    MenuService,
    MessageService,
		{
			provide: HTTP_INTERCEPTORS,
			useClass: StatusInterceptor,
			multi: true
		},
		{
			provide: HTTP_INTERCEPTORS,
			useClass: TokenInterceptor,
			multi: true
		},
    /*
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    }
    {
      provide: STRIPE_PUBLISHABLE_KEY,
      useValue: config.stripe.key
    }
    */
	],
	entryComponents: [
		PopupComponent
	],
  bootstrap: [AppComponent]
})

export class AppModule { }
