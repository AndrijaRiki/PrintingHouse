import { Routes } from '@angular/router';
import { LoginComponent } from './login-component/login-component';
import { RegisterComponent } from './register-component/register-component';
import { ForgotPasswordComponent } from './forgot-password-component/forgot-password-component';
import { ResetPasswordComponent } from './reset-password-component/reset-password-component';
import { AdminLogin } from './admin-login/admin-login';
import { UserProfileComponent } from './user-profile-component/user-profile-component';
import { ProductComponent } from './product-component/product-component';
import { HomeComponent } from './home-component/home-component';
import { ECartComponent } from './ecart-component/ecart-component';
import { SearchProductsComponent } from './search-products-component/search-products-component';
import { PrepareProductComponent } from './prepare-product-component/prepare-product-component';
import { ArchiveComponent } from './archive-component/archive-component';
import { PublicProcurementComponent } from './public-procurement-component/public-procurement-component';
import { OpenProcurementsComponent } from './open-procurements-component/open-procurements-component';
import { PaymentResultComponent } from './payment-result-component/payment-result-component';
import { PaymentComponent } from './payment-component/payment-component';
import { ProductAndServicesComponent } from './product-and-services-component/product-and-services-component';
import { AdminComponent } from './admin-component/admin-component';

export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: "login", component: LoginComponent},
    {path: "register", component: RegisterComponent},
    {path: "forgotPassword", component: ForgotPasswordComponent},
    {path: "reset-password/:token", component: ResetPasswordComponent},
    {path: "adminLogin", component: AdminLogin},
    {path: "profile/:username", component: UserProfileComponent},
    {path: "product/:productId", component: ProductComponent},
    {path: "ecart", component: ECartComponent},
    {path: "searchProducts", component: SearchProductsComponent},
    {path: "prepareProduct/:productId", component: PrepareProductComponent},
    {path: "archive", component: ArchiveComponent},
    {path: "publicProcurements", component: PublicProcurementComponent},
    {path: "openProcurements", component: OpenProcurementsComponent},
    {path: "payment-result", component: PaymentResultComponent},
    {path: 'payment/:orderId', component: PaymentComponent},
    {path: "products-services", component: ProductAndServicesComponent},
    {path: 'adminPanel', component: AdminComponent}
];
