import { GuiPermission } from './../../../models/gui';
import {Component, OnInit, Inject, ElementRef} from "@angular/core";
import { NavigationStart, Router } from "@angular/router";
import { AppComponent } from "src/app/app.component";
import { RouteNames } from "@app/modules/client/client.routes";
import { ApiService } from "@services/api/api.service";
import { StoreService } from "@services/store/store.service";
import {
  GUI_VISIBILITY_MATCH,
  CMSUserType,
  PERMISSION_TYPE_DENY,
} from "../constant";
import {LayoutService} from "@services/app.layout.service";
@Component({
  selector: "app-leftmenu",
  templateUrl: "./leftmenu.component.html",
  styleUrls: ["./leftmenu.component.scss"],
})

export class LeftmenuComponent implements OnInit {

  url: string;
  user: any = {};

  menu = [
    {
      label: 'Activities',
      hidden: false,
      items: [
        { hidden: false, label: 'Dashboard', icon: 'pi pi-fw pi-home', link: RouteNames.dashboard },
        { hidden: false, label: 'Call Logs', icon: 'pi pi-fw pi-phone', link: RouteNames.callLogs }
      ]
    },
    {
      label: 'Number Management',
      hidden: false,
      items: [
        { hidden: false, label: 'Buy Numbers', icon: 'pi pi-fw pi-shopping-cart', link: RouteNames.numberman.management },
        { hidden: false, label: 'Tracking Numbers', icon: 'pi pi-fw pi-sync', link: RouteNames.tracking_number.numbers },
        { hidden: false, label: 'Receiving Numbers', icon: 'pi pi-fw pi-sliders-h', link: RouteNames.receiving.numbers },
      ]
    },
    {
      label: 'Call Source',
      hidden: false,
      items: [
        { hidden: false, label: 'Tracking Sources', icon: 'pi pi-fw pi-sync', link: RouteNames.tracking_source.sources },
      ]
    },
    {
      label: 'Routing',
      hidden: false,
      items: [
        { hidden: false, label: 'SIP Gateways', icon: 'pi pi-fw pi-sliders-v', link: RouteNames.receiving.sipgateways },
      ]
    },
    {
      label: 'Reporting',
      hidden: false,
      items: [
        { hidden: false, label: 'Activity Reports', icon: 'pi pi-fw pi-chart-bar', link: RouteNames.reports.activity_reports },
        { hidden: false, label: 'Overview', icon: 'pi pi-fw pi-desktop', link: RouteNames.reports.overview },
      ]
    },
    {
      label: 'Settings',
      hidden: false,
      items: [
        { hidden: false, label: 'Manage Customers', icon: 'pi pi-fw pi-users', link: RouteNames.customer.customers },
        { hidden: false, label: 'Manage Roles', icon: 'pi pi-fw pi-user-edit', link: RouteNames.role.roles },
        { hidden: false, label: 'Manage Users', icon: 'pi pi-fw pi-user', link: RouteNames.user.users },
        { hidden: false, label: 'Manage Billings', icon: 'pi pi-fw pi-credit-card', link: RouteNames.billing },
      ]
    },
  ];

  isMenuLoaded = false

  constructor(
    private router: Router,
    private store: StoreService,
    private api: ApiService,
    public layoutService: LayoutService, public el: ElementRef
  ) {
    this.url = this.router.url;
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Navigation started.
        this.url = event.url;
      }
    });
  }

  async ngOnInit() {
    await new Promise<void>((resolve) => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);

          resolve();
        }
      }, 100);
    });

    this.store.state$.subscribe(async (state) => {
      if (state.token && state.user && state.guiVisibility) {
        this.user = this.store.getUser();
        this.setMenuHidden(state.guiVisibility);
      }
    });
  }

  setMenuHidden = (guiVisibility) => {
    if (this.store.getUserType() == CMSUserType.superAdmin ) {
      let sbp =  this.menu[this.menu.length-1].items;
      this.menu[this.menu.length-1].items[sbp.length-1].label = "Manage Products"
    }

    for (let subMenuLvl1 of this.menu) {
      subMenuLvl1.hidden = true;
      let bAllLvl2Hidden = true;

      for (let subMenuLvl2 of subMenuLvl1.items) {
        subMenuLvl2.hidden = true;

        if (
          this.store.getUserType() == CMSUserType.superAdmin ||
          this.store.getUserType() == CMSUserType.primaryAdmin
        ) {
          subMenuLvl2.hidden = false;
          bAllLvl2Hidden = false;
          continue;
        }

        guiVisibility.map((v) => {
          if (GUI_VISIBILITY_MATCH[v.GuiSection.name] == subMenuLvl2.label) {
            if (v.GuiPermission.name == PERMISSION_TYPE_DENY) {
            } else {
              subMenuLvl2.hidden = false;
              bAllLvl2Hidden = false
            }
          }
        });
      }

      if (!bAllLvl2Hidden)
        subMenuLvl1.hidden = false;
    }

    this.isMenuLoaded = true
  };

  ngAfterViewInit() {
  }

}
