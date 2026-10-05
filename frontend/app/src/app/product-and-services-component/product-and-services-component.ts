import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ProductService} from '../services/product-service';
import {Product, PrintService} from '../models/product';
import {Category, Subcategory} from '../models/category';
import {User} from '../models/user';
import {HeaderComponent} from '../header-component/header-component';
import {FooterComponent} from '../footer-component/footer-component';

interface ImportedProduct {
    _id:string;
    code:string;
    name:string;
}

interface ImportError {
    code:string;
    message:string;
}

@Component({
    selector:'app-product-and-services-component',
    imports:[
        FormsModule,
        HeaderComponent,
        FooterComponent
    ],
    templateUrl:'./product-and-services-component.html',
    styleUrl:'./product-and-services-component.css'
})
export class ProductAndServicesComponent {

    private productService=inject(ProductService);

    /* =====================================================
       PRIJAVLJENI KORISNIK
       ===================================================== */

    user:User|null=null;


    /* =====================================================
       ACCORDION
       ===================================================== */

    productSectionOpen=false;
    importSectionOpen=false;


    /* =====================================================
       PROIZVODI I KATEGORIJE
       ===================================================== */

    products:Product[]=[];
    categories:Category[]=[];
    subcategories:Subcategory[]=[];


    /* =====================================================
       RUČNO DODAVANJE PROIZVODA
       ===================================================== */

    code='';
    name='';
    description='';

    categoryId='';
    subcategoryId='';

    unitPrice:number|null=null;
    quantity:number|null=null;


    /* =====================================================
       BOJE
       ===================================================== */

    colorInput='';
    colors:string[]=[];


    /* =====================================================
       USLUGE ŠTAMPE
       ===================================================== */

    printServices:PrintService[]=[];

    serviceType='';
    serviceAdditionalPrice:number|null=null;
    serviceMaxWidthMm:number|null=null;
    serviceMaxHeightMm:number|null=null;


    /* =====================================================
       SLIKE RUČNOG UNOSA
       ===================================================== */

    selectedImage:File|null=null;
    selectedAdditionalImages:File[]=[];


    /* =====================================================
       PORUKE RUČNOG UNOSA
       ===================================================== */

    productMessage='';
    productError='';


    /* =====================================================
       JSON IMPORT
       ===================================================== */

    selectedJsonFile:File|null=null;

    importedProducts:ImportedProduct[]=[];

    importErrors:ImportError[]=[];

    importMessage='';
    importError='';


    /* =====================================================
       SLIKE UVEZENIH PROIZVODA

       ključ = productId
       ===================================================== */

    importedMainImages:{
        [productId:string]:File|null;
    }={};

    importedAdditionalImages:{
        [productId:string]:File[];
    }={};


    /* =====================================================
       DOPUNA ZALIHA

       ključ = productId
       ===================================================== */

    newAmounts:{
        [productId:string]:number|null;
    }={};


    /* =====================================================
       INIT
       ===================================================== */

    ngOnInit(){
        this.loadLoggedUser();
        this.loadCategories();

        if(this.user?._id){
            this.loadProducts();
        }
    }


    /* =====================================================
       ACCORDION
       ===================================================== */

    toggleProductSection(){
        this.productSectionOpen=
            !this.productSectionOpen;
    }


    /* =====================================================
       PRIJAVLJENI KORISNIK
       ===================================================== */

    loadLoggedUser(){
        const loggedUser=
            localStorage.getItem('loggedUser');

        if(!loggedUser){
            this.user=null;
            return;
        }

        try{
            this.user=
                JSON.parse(loggedUser) as User;
        }catch(error){
            console.log(
                'LOGGED USER ERROR:',
                error
            );

            this.user=null;
        }
    }


    /* =====================================================
       KATEGORIJE
       ===================================================== */

    loadCategories(){
        this.productService
            .getAllCategories()
            .subscribe({
                next:data=>{
                    this.categories=data;

                    if(this.categoryId){
                        this.updateSubcategories();
                    }
                },

                error:error=>{
                    console.log(
                        'CATEGORY ERROR:',
                        error
                    );

                    this.productError=
                        error.error?.message??
                        'Greška pri učitavanju kategorija.';
                }
            });
    }

    categoryChanged(){
        this.subcategoryId='';

        this.updateSubcategories();
    }

    updateSubcategories(){
        const category=
            this.categories.find(
                category=>
                    category._id===
                    this.categoryId
            );

        this.subcategories=
            category?.subcategories??[];
    }


    /* =====================================================
       PROIZVODI ŠTAMPARIJE
       ===================================================== */

    loadProducts(){
        if(!this.user?._id){
            return;
        }

        this.productService
            .getPrinterProducts(
                this.user._id
            )
            .subscribe({
                next:data=>{
                    this.products=data;
                },

                error:error=>{
                    console.log(
                        'PRODUCTS ERROR:',
                        error
                    );

                    this.productError=
                        error.error?.message??
                        'Greška pri učitavanju proizvoda.';
                }
            });
    }


    /* =====================================================
       BOJE
       ===================================================== */

    addColor(){
        this.productError='';

        const color=
            this.colorInput.trim();

        if(!color){
            return;
        }

        const exists=
            this.colors.some(
                existingColor=>
                    existingColor
                        .toLowerCase()===
                    color.toLowerCase()
            );

        if(exists){
            this.productError=
                'Ova boja je već dodata.';

            return;
        }

        this.colors.push(color);

        this.colorInput='';
    }

    removeColor(index:number){
        this.colors.splice(index,1);
    }


    /* =====================================================
       USLUGE ŠTAMPE
       ===================================================== */

    addPrintService(){
        this.productError='';

        if(!this.serviceType.trim()){
            this.productError=
                'Unesite naziv usluge.';

            return;
        }

        if(
            this.serviceAdditionalPrice===null ||
            this.serviceAdditionalPrice<0
        ){
            this.productError=
                'Dodatna cena nije ispravna.';

            return;
        }

        if(
            this.serviceMaxWidthMm===null ||
            this.serviceMaxWidthMm<=0 ||
            this.serviceMaxHeightMm===null ||
            this.serviceMaxHeightMm<=0
        ){
            this.productError=
                'Dimenzije usluge nisu ispravne.';

            return;
        }

        const exists=
            this.printServices.some(
                service=>
                    service.type
                        .toLowerCase()===
                    this.serviceType
                        .trim()
                        .toLowerCase()
            );

        if(exists){
            this.productError=
                'Usluga sa ovim nazivom je već dodata.';

            return;
        }

        this.printServices.push({
            type:this.serviceType.trim(),
            additionalPrice:
                this.serviceAdditionalPrice,
            maxWidthMm:
                this.serviceMaxWidthMm,
            maxHeightMm:
                this.serviceMaxHeightMm
        });

        this.serviceType='';
        this.serviceAdditionalPrice=null;
        this.serviceMaxWidthMm=null;
        this.serviceMaxHeightMm=null;
    }

    removePrintService(index:number){
        this.printServices.splice(index,1);
    }


    /* =====================================================
       GLAVNA SLIKA RUČNOG UNOSA
       ===================================================== */

    selectImage(event:Event){
        this.productError='';

        const input=
            event.target as HTMLInputElement;

        if(
            !input.files ||
            input.files.length===0
        ){
            this.selectedImage=null;
            return;
        }

        const file=input.files[0];

        if(!file.type.startsWith('image/')){
            this.productError=
                'Izabrani fajl mora biti slika.';

            this.selectedImage=null;
            input.value='';

            return;
        }

        this.selectedImage=file;
    }


    /* =====================================================
       DODATNE SLIKE RUČNOG UNOSA
       ===================================================== */

    selectAdditionalImages(event:Event){
        this.productError='';

        const input=
            event.target as HTMLInputElement;

        if(!input.files){
            return;
        }

        const newFiles=
            Array.from(input.files);

        const invalidFile=
            newFiles.find(
                file=>
                    !file.type.startsWith(
                        'image/'
                    )
            );

        if(invalidFile){
            this.productError=
                'Svi izabrani fajlovi moraju biti slike.';

            input.value='';

            return;
        }

        const allFiles=[
            ...this.selectedAdditionalImages,
            ...newFiles
        ];

        if(allFiles.length>3){
            this.productError = 'Možete dodati najviše 3 dodatne slike.';
            input.value='';
            return;
        }

        this.selectedAdditionalImages=
            allFiles;

        /*
         * Omogućava da korisnik ponovo
         * izabere isti fajl ako ga prethodno ukloni.
         */
        input.value='';
    }

    removeAdditionalImage(index:number){
        this.selectedAdditionalImages.splice(
            index,
            1
        );
    }


    /* =====================================================
       RUČNO KREIRANJE PROIZVODA
       ===================================================== */

    createProduct(){
        this.productMessage='';
        this.productError='';

        if(!this.user?._id){
            this.productError=
                'Korisnik nije prijavljen.';

            return;
        }

        if(this.user.role!=='printer'){
            this.productError=
                'Samo štampar može dodavati proizvode.';

            return;
        }

        if(!this.code.trim() || !this.name.trim() || !this.categoryId || !this.subcategoryId || this.unitPrice===null || this.unitPrice<=0 || this.quantity===null ||
            !Number.isInteger(this.quantity) || this.quantity<0){
            this.productError = 'Popunite sva obavezna polja ispravnim podacima.';

            return;
        }

        const formData = new FormData();

        formData.append('code', this.code.trim());
        formData.append('name', this.name.trim());
        formData.append('description', this.description.trim());
        formData.append('printerId', this.user._id);
        formData.append('categoryId', this.categoryId);
        formData.append('subcategoryId', this.subcategoryId);
        formData.append('unitPrice', this.unitPrice.toString());
        formData.append('quantity', this.quantity.toString());
        formData.append('colors', JSON.stringify(this.colors));
        formData.append('printServices', JSON.stringify(this.printServices));

        if(this.selectedImage){
            formData.append('mainImage', this.selectedImage);
        }

        for(const image of this.selectedAdditionalImages){
            formData.append('additionalImages', image);
        }

        this.productService.createProduct(formData).subscribe({
            next:data=>{
                this.productMessage = data.message ?? 'Proizvod je uspešno dodat.';
                this.resetProductForm();
                this.loadProducts();
            },

            error:error=>{
                console.log('CREATE PRODUCT ERROR:', error);
                this.productError = error.error?.message ?? 'Greška pri dodavanju proizvoda.';
            }
        });
    }

    /* =====================================================
       RESET RUČNOG UNOSA
       ===================================================== */
    resetProductForm(){
        this.code='';
        this.name='';
        this.description='';

        this.categoryId='';
        this.subcategoryId='';
        this.subcategories=[];

        this.unitPrice=null;
        this.quantity=null;

        this.colorInput='';
        this.colors=[];

        this.printServices=[];

        this.serviceType='';
        this.serviceAdditionalPrice=null;
        this.serviceMaxWidthMm=null;
        this.serviceMaxHeightMm=null;

        this.selectedImage=null;
        this.selectedAdditionalImages=[];

        const mainImageInput = document.getElementById('productImage') as HTMLInputElement|null;

        if(mainImageInput){
            mainImageInput.value='';
        }

        const additionalInput=
            document.getElementById(
                'additionalProductImages'
            ) as HTMLInputElement|null;

        if(additionalInput){
            additionalInput.value='';
        }
    }

    /* =====================================================
       JSON FAJL
       ===================================================== */
    selectJsonFile(event:Event){
        this.importError='';
        this.importMessage='';
        this.importErrors=[];

        const input = event.target as HTMLInputElement;

        if(!input.files || input.files.length===0){
            this.selectedJsonFile=null;

            return;
        }

        const file = input.files[0];

        if(!file.name.toLowerCase().endsWith('.json')){
            this.importError = 'Izaberite JSON fajl.';

            this.selectedJsonFile=null;
            input.value='';

            return;
        }

        this.selectedJsonFile=file;
    }

    /* =====================================================
       UVOZ PROIZVODA IZ JSON-A
       ===================================================== */
    importJson(){
        this.importError='';
        this.importMessage='';
        this.importErrors=[];
        this.importedProducts=[];

        this.importedMainImages={};
        this.importedAdditionalImages={};

        if(!this.user?._id){
            this.importError = 'Korisnik nije prijavljen.';

            return;
        }

        if(this.user.role!=='printer'){
            this.importError = 'Samo štampar može uvoziti proizvode.';

            return;
        }

        if(!this.selectedJsonFile){
            this.importError = 'Izaberite JSON fajl.';

            return;
        }

        this.productService.importProductsFromJson(this.selectedJsonFile, this.user._id).subscribe({
                next:data=>{
                    this.importMessage = data.message;
                    this.importedProducts = data.products??[];
                    this.importErrors = data.errors??[];
                    this.loadProducts();
                },

                error:error=>{
                    console.log('IMPORT JSON ERROR:', error);

                    this.importError = error.error?.message ?? 'Greška pri uvozu JSON fajla.';
                }
            });
    }

    /*  =====================================================
        GLAVNA SLIKA UVEZENOG PROIZVODA
        ===================================================== */
    selectImportedMainImage(productId:string, event:Event){
        this.importError='';

        const input = event.target as HTMLInputElement;

        if(!input.files || input.files.length===0){
            this.importedMainImages[productId] = null;
            return;
        }

        const file = input.files[0];

        if(!file.type.startsWith('image/')){
            this.importError = 'Glavni fajl mora biti slika.';
            this.importedMainImages[productId] = null;
            input.value='';
            return;
        }

        this.importedMainImages[productId] = file;
    }

    /*  =====================================================
        DODATNE SLIKE UVEZENOG PROIZVODA
        ===================================================== */
    selectImportedAdditionalImages(productId:string, event:Event){
        this.importError='';

        const input = event.target as HTMLInputElement;

        if(!input.files){
            return;
        }

        const files = Array.from(input.files);

        const invalidFile = files.find(file => 
            !file.type.startsWith('image/')
        );

        if(invalidFile){
            this.importError = 'Sve dodatne slike moraju biti slike.';
            input.value='';
            return;
        }

        if(files.length>3){
            this.importError = 'Možete dodati najviše 3 dodatne slike po proizvodu.';
            input.value='';
            return;
        }

        this.importedAdditionalImages[productId] = files;
    }


    /*  =====================================================
        ČUVANJE SLIKA UVEZENOG PROIZVODA
        ===================================================== */
    uploadImportedProductImages(productId:string){
        this.importError='';
        this.importMessage='';

        if(!this.user?._id){
            this.importError = 'Korisnik nije prijavljen.';

            return;
        }

        const mainImage = this.importedMainImages[productId];
        const additionalImages = this.importedAdditionalImages[productId] ?? [];

        if(!mainImage && additionalImages.length===0){
            this.importError = 'Izaberite najmanje jednu sliku.';

            return;
        }

        if(additionalImages.length>3){
            this.importError = 'Možete dodati najviše 3 dodatne slike.';
            return;
        }

        const formData = new FormData();

        formData.append('printerId', this.user._id);

        if(mainImage){
            formData.append('mainImage', mainImage);
        }

        for(const image of additionalImages){
            formData.append('additionalImages', image);
        }

        this.productService.uploadImportedProductImages(productId, formData)
            .subscribe({
                next:data=>{
                    this.importMessage = data.message ?? 'Slike su uspešno sačuvane.';
                    this.importedMainImages[productId]=null;
                    this.importedAdditionalImages[productId]=[];
                    this.loadProducts();
                },

                error:error=>{
                    console.log('UPLOAD IMPORTED IMAGES ERROR:', error);

                    this.importError = error.error?.message ?? 'Greška pri čuvanju slika.';
                }
            });
    }


    /* =====================================================
       DOPUNA ZALIHA
       ===================================================== */
    addQuantity(product:Product){
        this.productError='';
        this.productMessage='';

        if(!this.user?._id){
            this.productError=
                'Korisnik nije prijavljen.';

            return;
        }

        const amount=
            this.newAmounts[
                product._id
            ];

        if(
            amount===null ||
            amount===undefined ||
            !Number.isInteger(amount) ||
            amount<=0
        ){
            this.productError=
                'Unesite pozitivnu celobrojnu količinu.';

            return;
        }

        this.productService
            .addProductQuantity(
                product._id,
                this.user._id,
                amount
            )
            .subscribe({
                next:data=>{
                    product.quantity=
                        data.quantity;

                    this.newAmounts[
                        product._id
                    ]=null;

                    this.productMessage=
                        data.message??
                        'Količina je uspešno ažurirana.';
                },

                error:error=>{
                    console.log(
                        'ADD QUANTITY ERROR:',
                        error
                    );

                    this.productError=
                        error.error?.message??
                        'Greška pri ažuriranju količine.';
                }
            });
    }


    /* =====================================================
       NAZIV KATEGORIJE
       ===================================================== */
    getCategoryName(
        categoryId:string
    ){
        return this.categories.find(
            category=>
                category._id===
                categoryId
        )?.name??'-';
    }


    /* =====================================================
       NAZIV POTKATEGORIJE
       ===================================================== */
    getSubcategoryName(
        categoryId:string,
        subcategoryId:string
    ){
        const category=
            this.categories.find(
                category=>
                    category._id===
                    categoryId
            );

        return category
            ?.subcategories
            .find(
                subcategory=>
                    subcategory._id===
                    subcategoryId
            )
            ?.name??'-';
    }

    statusMessage='';
    statusError='';

    get activeProducts():Product[]{
        return this.products.filter(product=>product.active);
    }

    get inactiveProducts():Product[]{
        return this.products.filter(product=>!product.active);
    }

    deactivateProduct(product:Product){
        if(!this.user?._id)return;
        this.statusMessage='';
        this.statusError='';
        this.productService.deactivateProduct(product._id,this.user._id).subscribe({
            next:data=>{
                product.active=data.active;
                this.statusMessage=data.message;
            },
            error:error=>{
                this.statusError=error.error?.message??'Greška pri deaktiviranju proizvoda.';
            }
        });
    }

    activateProduct(product:Product){
        if(!this.user?._id)return;
        this.statusMessage='';
        this.statusError='';
        this.productService.activateProduct(product._id,this.user._id).subscribe({
            next:data=>{
                product.active=data.active;
                this.statusMessage=data.message;
            },
            error:error=>{
                this.statusError=error.error?.message??'Greška pri aktiviranju proizvoda.';
            }
        });
    }
}