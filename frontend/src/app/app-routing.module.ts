import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { StoresListComponent } from './stores-list/stores-list.component';
import { StoreViewComponent } from './store-view/store-view.component';
import { OwnerComponent } from './owner/owner.component';

const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'negocios', component: StoresListComponent },
  { path: 'negocio/:slug', component: StoreViewComponent },
  { path: 'tu-negocio', component: OwnerComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false, scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
