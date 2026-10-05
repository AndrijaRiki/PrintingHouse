import {AfterViewInit,Component,inject,OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import Chart from 'chart.js/auto';
import {
    AdminService,
    AdminUser,
    PrinterRevenue,
    OrderedProductStatistic,
    ProductRatingHistory
} from '../services/admin-service';
import {Category} from '../models/category';
import {HeaderComponent} from '../header-component/header-component';
import {FooterComponent} from '../footer-component/footer-component';
import { Router } from '@angular/router';

@Component({
    selector:'app-admin-component',
    imports:[
        FormsModule,
        HeaderComponent,
        FooterComponent
    ],
    templateUrl:'./admin-component.html',
    styleUrl:'./admin-component.css'
})
export class AdminComponent implements OnInit,AfterViewInit{
    private adminService=inject(AdminService);
    private router = inject(Router);

    adminId='';
    users:AdminUser[]=[];
    pendingUsers:AdminUser[]=[];
    categories:Category[]=[];

    newCategoryName='';
    newSubcategoryName='';
    selectedCategoryId='';

    editUser:AdminUser|null=null;

    revenueData:PrinterRevenue[]=[];
    orderedProductsData:OrderedProductStatistic[]=[];
    ratingData:ProductRatingHistory[]=[];
    selectedRatingProducts:string[]=[];

    message='';
    error='';

    private viewInitialized=false;
    private revenueChart:Chart|null=null;
    private productsChart:Chart|null=null;
    private ratingChart:Chart|null=null;

    ngOnInit(){
        const loggedUser=
            localStorage.getItem(
                'loggedUser'
            );

        if(!loggedUser){
            this.router.navigate([
                '/adminLogin'
            ]);
            return;
        }

        const user=JSON.parse(
            loggedUser
        );

        if(
            user.role!=='admin' ||
            user.status!=='active'
        ){
            localStorage.removeItem(
                'loggedUser'
            );

            this.router.navigate([
                '/adminLogin'
            ]);

            return;
        }

        this.adminId=user._id;

        this.loadUsers();
        this.loadPendingUsers();
        this.loadCategories();
    }

    ngAfterViewInit(){
        this.viewInitialized=true;

        if(this.adminId){
            this.loadStatistics();
        }
    }

    loadUsers(){
        this.adminService.getAllUsers(this.adminId).subscribe({
            next:data=>{
                this.users=data;
            },
            error:error=>{
                this.setError(
                    error,
                    'Greška pri učitavanju korisnika.'
                );
            }
        });
    }

    loadPendingUsers(){
        this.adminService.getPendingUsers(this.adminId).subscribe({
            next:data=>{
                this.pendingUsers=data;
            },
            error:error=>{
                this.setError(
                    error,
                    'Greška pri učitavanju zahteva.'
                );
            }
        });
    }

    approveUser(user:AdminUser){
        this.adminService
            .approveUser(user._id,this.adminId)
            .subscribe({
                next:data=>{
                    this.message=data.message;
                    this.error='';
                    this.loadPendingUsers();
                    this.loadUsers();
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri odobravanju registracije.'
                    );
                }
            });
    }

    rejectUser(user:AdminUser){
        this.adminService
            .rejectUser(user._id,this.adminId)
            .subscribe({
                next:data=>{
                    this.message=data.message;
                    this.error='';
                    this.loadPendingUsers();
                    this.loadUsers();
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri odbijanju registracije.'
                    );
                }
            });
    }

    startEdit(user:AdminUser){
        this.editUser={
            ...user,
            institution:user.institution
                ?{...user.institution}
                :null
        };
    }

    cancelEdit(){
        this.editUser=null;
    }

    saveUser(){
        if(!this.editUser)return;

        this.adminService.updateUser(
            this.editUser._id,
            this.adminId,
            {
                firstname:this.editUser.firstname,
                lastname:this.editUser.lastname,
                email:this.editUser.email,
                phone:this.editUser.phone,
                status:this.editUser.status
            }
        ).subscribe({
            next:data=>{
                this.message=data.message;
                this.error='';
                this.editUser=null;
                this.loadUsers();
                this.loadPendingUsers();
            },
            error:error=>{
                this.setError(
                    error,
                    'Greška pri ažuriranju korisnika.'
                );
            }
        });
    }

    deleteUser(user:AdminUser){
        if(user._id===this.adminId){
            this.error='Ne možete obrisati sopstveni nalog.';
            return;
        }

        const confirmed=confirm(
            `Da li želite da obrišete nalog "${user.username}"?`
        );

        if(!confirmed)return;

        this.adminService
            .deleteUser(user._id,this.adminId)
            .subscribe({
                next:data=>{
                    this.message=data.message;
                    this.error='';
                    this.loadUsers();
                    this.loadPendingUsers();
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri brisanju korisnika.'
                    );
                }
            });
    }

    loadCategories(){
        this.adminService
            .getCategories(this.adminId)
            .subscribe({
                next:data=>{
                    this.categories=data;
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri učitavanju kategorija.'
                    );
                }
            });
    }

    createCategory(){
        const name=this.newCategoryName.trim();

        if(!name){
            this.error='Unesite naziv kategorije.';
            return;
        }

        this.adminService
            .createCategory(this.adminId,name)
            .subscribe({
                next:data=>{
                    this.message=data.message;
                    this.error='';
                    this.newCategoryName='';
                    this.loadCategories();
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri dodavanju kategorije.'
                    );
                }
            });
    }

    createSubcategory(){
        const name=this.newSubcategoryName.trim();

        if(!this.selectedCategoryId){
            this.error='Izaberite kategoriju.';
            return;
        }

        if(!name){
            this.error='Unesite naziv potkategorije.';
            return;
        }

        this.adminService.createSubcategory(
            this.adminId,
            this.selectedCategoryId,
            name
        ).subscribe({
            next:data=>{
                this.message=data.message;
                this.error='';
                this.newSubcategoryName='';
                this.loadCategories();
            },
            error:error=>{
                this.setError(
                    error,
                    'Greška pri dodavanju potkategorije.'
                );
            }
        });
    }

    loadStatistics(){
        this.loadPrinterRevenue();
        this.loadMostOrderedProducts();
        this.loadRatingHistory();
    }

    loadPrinterRevenue(){
        this.adminService
            .getPrinterRevenue(this.adminId)
            .subscribe({
                next:data=>{
                    this.revenueData=data;

                    if(this.viewInitialized){
                        this.drawRevenueChart();
                    }
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri učitavanju prometa.'
                    );
                }
            });
    }

    loadMostOrderedProducts(){
        this.adminService
            .getMostOrderedProducts(this.adminId)
            .subscribe({
                next:data=>{
                    this.orderedProductsData=data;

                    if(this.viewInitialized){
                        this.drawProductsChart();
                    }
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri učitavanju proizvoda.'
                    );
                }
            });
    }

    loadRatingHistory(){
        this.adminService
            .getProductRatingHistory(this.adminId)
            .subscribe({
                next:data=>{
                    this.ratingData=data;

                    this.selectedRatingProducts=
                        data.map(
                            product=>product.productId
                        );

                    if(this.viewInitialized){
                        this.drawRatingChart();
                    }
                },
                error:error=>{
                    this.setError(
                        error,
                        'Greška pri učitavanju ocena.'
                    );
                }
            });
    }

    toggleRatingProduct(
        productId:string,
        event:Event
    ){
        const checked=
            (event.target as HTMLInputElement)
                .checked;

        if(checked){
            if(
                !this.selectedRatingProducts
                    .includes(productId)
            ){
                this.selectedRatingProducts.push(
                    productId
                );
            }
        }else{
            this.selectedRatingProducts=
                this.selectedRatingProducts
                    .filter(
                        id=>id!==productId
                    );
        }

        this.drawRatingChart();
    }

    private drawRevenueChart(){
        this.revenueChart?.destroy();

        this.revenueChart=new Chart(
            'revenueChart',
            {
                type:'bar',
                data:{
                    labels:this.revenueData.map(
                        item=>item.printerName
                    ),
                    datasets:[{
                        label:'Promet (RSD)',
                        data:this.revenueData.map(
                            item=>item.revenue
                        )
                    }]
                },
                options:{
                    responsive:true,
                    maintainAspectRatio:false,
                    scales:{
                        y:{
                            beginAtZero:true
                        }
                    }
                }
            }
        );
    }

    private drawProductsChart(){
        this.productsChart?.destroy();

        this.productsChart=new Chart(
            'productsChart',
            {
                type:'pie',
                data:{
                    labels:this.orderedProductsData.map(
                        item=>
                            `${item.productName} (${item.percentage}%)`
                    ),
                    datasets:[{
                        data:this.orderedProductsData.map(
                            item=>item.quantity
                        )
                    }]
                },
                options:{
                    responsive:true,
                    maintainAspectRatio:false
                }
            }
        );
    }

    private drawRatingChart(){
        this.ratingChart?.destroy();

        const visibleProducts=
            this.ratingData.filter(
                product=>
                    this.selectedRatingProducts
                        .includes(product.productId)
            );

        const allDates=[
            ...new Set(
                visibleProducts.flatMap(
                    product=>
                        product.points.map(
                            point=>
                                new Date(point.date)
                                    .toLocaleDateString('sr-RS')
                        )
                )
            )
        ];

        const datasets=visibleProducts.map(
            product=>({
                label:product.productName,
                data:allDates.map(date=>{
                    const point=product.points.find(
                        point=>
                            new Date(point.date)
                                .toLocaleDateString('sr-RS')===
                            date
                    );

                    return point?.score??null;
                }),
                spanGaps:true
            })
        );

        this.ratingChart=new Chart(
            'ratingChart',
            {
                type:'line',
                data:{
                    labels:allDates,
                    datasets
                },
                options:{
                    responsive:true,
                    maintainAspectRatio:false
                }
            }
        );
    }

    getRoleName(role:string){
        if(role==='admin')return 'Administrator';
        if(role==='printer')return 'Štampar';
        return 'Klijent';
    }

    getStatusName(status:string){
        if(status==='active')return 'Aktivan';
        if(status==='pending')return 'Na čekanju';
        if(status==='rejected')return 'Odbijen';
        return status;
    }

    private setError(error:any,message:string){
        this.message='';
        this.error=
            error.error?.message??
            message;
    }
}