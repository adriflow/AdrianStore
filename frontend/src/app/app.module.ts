import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { RootComponent } from './root.component';
import { StoresListComponent } from './stores-list/stores-list.component';
import { StoreViewComponent } from './store-view/store-view.component';
import { OwnerComponent } from './owner/owner.component';
import { ProductService } from './product.service';

@NgModule({
  declarations: [RootComponent, AppComponent, StoresListComponent, StoreViewComponent, OwnerComponent],
  imports: [BrowserModule, BrowserAnimationsModule, HttpClientModule, FormsModule, AppRoutingModule],
  providers: [ProductService],
  bootstrap: [RootComponent],
})
export class AppModule {}
