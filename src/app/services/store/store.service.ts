import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IUser, IUserToken } from '@app/models/user';
import { GuiVisibility } from '../../models/gui';
import { CMSUserType } from '../../modules/client/constant';

export const DBKEYS = {THEME: 'tYp95ymECHOESt', TOKEN: 'tYp95ymECHOESk'};

export type IAppTheme = 'theme-light' | 'theme-dark' | 'theme-purple';
export type IAppViewMode = 'vertical' | 'dashboard';
export type IAppListMode = 'table' | 'compact' | 'cards';

export interface IFilter {
  dateMode: string;
  startDate: string;
  endDate: string;
}

export interface AppState {
  user: IUser;
  token: IUserToken;
  theme: IAppTheme;
  password: string;
  viewMode: IAppViewMode;
  listMode: IAppListMode;
  isMobile: boolean;
  userType: CMSUserType;
  filters: IFilter;
  quickPages: any;
  avatar: string;
  isLoginFailed: boolean;
  guiVisibility: GuiVisibility[];
}

@Injectable({
  providedIn: 'root'
})

export class StoreService {

  private localdb: Storage = window.localStorage;

  // Initial state in BehaviorSubject's constructor
  private readonly subject: BehaviorSubject<AppState>;

  // Shared Customer Balance State
  private balance: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // Exposed observable$ store stream
  readonly state$: Observable<AppState>;

  // Getter of the last store value emitted
  private get store(): AppState {
    return this.subject.getValue();
  }

  // Push new state into the observable
  private set store(val: AppState) {
    this.subject.next(val);
  }

  private set themeMode(theme: IAppTheme) {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-purple');
    document.body.classList.add(theme);
  }

  private get themeMode(): IAppTheme {
    if (document.body.classList.contains('theme-dark')) {
      return 'theme-dark';
    } else if (document.body.classList.contains('theme-purple')) {
      return 'theme-purple';
    } else {
      return 'theme-light';
    }
  }

  private filterSubject = new Subject<any>();
  filterObservable$ = this.filterSubject.asObservable();

  constructor(private breakpointsObs: BreakpointObserver) {

    // Initialize the app state
    const token = JSON.parse(this.localdb.getItem(DBKEYS.TOKEN)) as IUserToken || null;
    const theme = (this.localdb.getItem(DBKEYS.THEME) as IAppTheme);

    if (theme) this.themeMode = theme;

    this.subject = new BehaviorSubject<AppState>({
      user: null,
      theme,
      token,
      password: null,
      viewMode: 'dashboard',
      listMode: 'cards',
      isMobile: false,
      userType: CMSUserType.normalUser,
      filters: null,
      quickPages: null,
      avatar: '',
      isLoginFailed: false,
      guiVisibility: null,
    });
    this.state$ = this.subject.asObservable();

    breakpointsObs.observe(Breakpoints.HandsetPortrait).subscribe(result => {
      this.storeIsMobile(result.matches);
    });
  }

  public toggleTheme(theme: IAppTheme): IAppTheme {
    this.themeMode = theme;
    this.localdb.setItem(DBKEYS.THEME, theme);
    this.store = { ...this.store, theme };
    return theme;
  }

  public retrieveTokenId(): string {
    const userToken = JSON.parse(this.localdb.getItem(DBKEYS.TOKEN)) as IUserToken;
    if (userToken == null) {
      return '';
    }
    return userToken.id;
  }

  public storeToken(token: IUserToken) {
    this.localdb.setItem(DBKEYS.TOKEN, JSON.stringify(token));
    this.store = {...this.store, token};
  }

  public removeToken() {
    this.localdb.removeItem(DBKEYS.TOKEN);
    this.store = {...this.store, token: null};
  }

  public removeUser() {
    this.store = {...this.store, user: null, guiVisibility: null, userType: CMSUserType.normalUser};
  }

  public storeUser(user: IUser) {
    this.store = { ...this.store, user };
  }

  public getUser() {
    return this.store.user
  }

  public getPassword() {
    return this.store.password
  }

  public storePassword(password: string) {
    this.store = {...this.store, password};
  }

  public storeIsMobile(isMobile: boolean) {
    this.store = {...this.store, isMobile};
  }

  public storeFilters(filter: IFilter) {
    this.store = {...this.store, filters: filter};
  }

  public setFilter() {
    this.filterSubject.next();
  }

  public setQuickPages(quickPages) {
    this.store = { ...this.store, quickPages: quickPages }
  }

  public getQuickPages() {
    return this.store.quickPages
  }

  public setAvatar(avatar) {
    this.store = { ...this.store, avatar: avatar }
  }

  public getAvatar() {
    return this.store.avatar
  }

  public setGuiVisibility(guiVisibility) {
    this.store = { ...this.store, guiVisibility: guiVisibility }
  }

  public getGuiVisibility() {
    return this.store.guiVisibility
  }

  public setIsLoginFailed(isLoginFailed) {
    this.store = { ...this.store, isLoginFailed: isLoginFailed }
  }

  public getUserType() {
    return this.store.userType
  }

  public setUserType(userType) {
    this.store = {...this.store, userType: userType}
  }

  public getBalance(): Observable<any> {
    return this.balance.asObservable();
  }

  public setBalance(value: any): void {
    this.balance.next(value);
  }

  // added by jett on 22/08/11 for navigate params after number purchased
  public setReservedNumber(numbers) {
    this.localdb.setItem('reserved_number', JSON.stringify(numbers));
  }

  public getReservedNumber() {
    return JSON.parse(this.localdb.getItem('reserved_number'));
  }
  // -----------------------------
}
