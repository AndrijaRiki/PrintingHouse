import {
    Component,
    ElementRef,
    OnInit,
    ViewChild,
    inject
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../services/product-service';
import { ProductDetails } from '../models/product';
import { HeaderComponent } from '../header-component/header-component';
import { CartService } from '../services/cart-service';

@Component({
    selector: 'app-prepare-product-component',
    imports: [HeaderComponent, FormsModule],
    templateUrl: './prepare-product-component.html',
    styleUrl: './prepare-product-component.css'
})
export class PrepareProductComponent implements OnInit {
    @ViewChild('productCanvas')
    canvasRef?: ElementRef<HTMLCanvasElement>;

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private productService = inject(ProductService);
    private cartService = inject(CartService)

    product: ProductDetails | null = null;
    productId = "";

    selectedColor = "";
    selectedPrintServiceType = "";
    selectedImageIndex = 0;

    quantity = 1;
    message = "";

    customText = "";

    baseImage = new Image();
    customImage: HTMLImageElement | null = null;
    selectedImageFile: File | null = null;

    textX = 300;
    textY = 220;

    imageX = 230;
    imageY = 300;

    imageWidth = 140;
    imageHeight = 140;

    dragging: 'text' | 'image' | null = null;

    dragOffsetX = 0;
    dragOffsetY = 0;

    ngOnInit() {
        const productId = this.route.snapshot.paramMap.get("productId");

        if(!productId) {
            this.message = "Proizvod nije pronađen.";
            return;
        }

        this.productId = productId;
        this.selectedColor = this.route.snapshot.queryParamMap.get("color") || "Bela";
        this.selectedPrintServiceType = this.route.snapshot.queryParamMap.get("printService") || "";
        
        const imageIndex = this.route.snapshot.queryParamMap.get("imageIndex");
        this.selectedImageIndex = imageIndex !== null ? Number(imageIndex) : 0;

        this.loadProduct();
    }

    loadProduct() {
        this.productService.getProductDetails(this.productId).subscribe({
            next: (data: any) => {
                this.product = data;

                setTimeout(() => {
                    this.loadBaseImage();
                });
            },

        error: (error: any) => {
            console.log(
                "Greška pri učitavanju proizvoda:",
                error
            );

            this.message =
                "Greška pri učitavanju proizvoda.";
            }
        });
    }

    loadBaseImage() {
        if(!this.product) {
            return;
        }

        this.baseImage = new Image();
        this.baseImage.crossOrigin = "anonymous";

        this.baseImage.onload = () => {
            this.redraw();
        };

        this.baseImage.onerror = () => {
            console.log("Greška pri učitavanju slike proizvoda.");
        };

        if(this.selectedImageIndex === 0) {
            this.baseImage.src = `http://localhost:4000/products/${this.productId}/mainImage`;
        } else {
            const additionalIndex = this.selectedImageIndex - 1;
            this.baseImage.src = `http://localhost:4000/products/${this.productId}/image/${additionalIndex}`;
        }
    }

    redraw() {
        const canvas = this.canvasRef?.nativeElement;

        if(!canvas) {
            return;
        }

        const ctx = canvas.getContext("2d");

        if(!ctx) {
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if(this.baseImage.complete && this.baseImage.naturalWidth > 0) {
            this.drawBaseImage(ctx, canvas);
        }

        this.drawCustomization(ctx);
    }

    drawBaseImage(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        const scale = Math.min(
            canvas.width / this.baseImage.width,
            canvas.height / this.baseImage.height
        );

        const width = this.baseImage.width * scale;
        const height = this.baseImage.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        ctx.drawImage(this.baseImage, x, y, width, height);
    }

    drawCustomization(ctx: CanvasRenderingContext2D) {
        this.drawText(ctx);

        if(this.customImage) {
            ctx.drawImage(
                this.customImage,
                this.imageX,
                this.imageY,
                this.imageWidth,
                this.imageHeight
            );
        }
    }

    selectCustomImage(event: Event) {
        const input = event.target as HTMLInputElement;

        if(!input.files || input.files.length === 0) {
            return;
        }

        const file = input.files[0];

        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

        if(!allowedTypes.includes(file.type)) {
            this.message = "Dozvoljeni formati su JPG, PNG i GIF.";

            input.value = "";
            return;
        }

        this.selectedImageFile = file;

        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                this.customImage = image;
                this.calculateInitialImageSize(image);
                this.redraw();
            };

            image.src = reader.result as string;
        };
        reader.readAsDataURL(file);
        this.message = "";
    }

    calculateInitialImageSize(image: HTMLImageElement) {
        const maxSize = 160;

        const ratio =
            Math.min(
                maxSize / image.width,
                maxSize / image.height,
                1
            );

        this.imageWidth = image.width * ratio;
        this.imageHeight = image.height * ratio;
        this.imageX = 300 - this.imageWidth / 2;
        this.imageY = 300;
    }

    removeCustomImage() {
        this.customImage = null;
        this.selectedImageFile = null;

        this.redraw();
    }

    pointerDown(event: PointerEvent) {
        const position = this.getCanvasPosition(event);

        if(this.isInsideImage(
                position.x,
                position.y
            )) {
            this.dragging = "image";
            this.dragOffsetX = position.x - this.imageX;
            this.dragOffsetY = position.y - this.imageY;
            const canvas = this.canvasRef?.nativeElement;
            canvas?.setPointerCapture(
                event.pointerId
            );

            return;
        }

        if(this.isInsideText(
                position.x,
                position.y
            )) {
            this.dragging = "text";
            this.dragOffsetX = position.x - this.textX;
            this.dragOffsetY = position.y - this.textY;
            const canvas = this.canvasRef?.nativeElement;
            canvas?.setPointerCapture(
                event.pointerId
            );
        }
    }

    pointerMove( event: PointerEvent) {
        if(!this.dragging) {
            return;
        }

        const position = this.getCanvasPosition(event);

        if(this.dragging === "image") {
            this.imageX = position.x - this.dragOffsetX;
            this.imageY = position.y - this.dragOffsetY;
            this.keepImageInsideCanvas();
        }

        if(this.dragging === "text") {
            this.textX = position.x - this.dragOffsetX;
            this.textY = position.y - this.dragOffsetY;
            this.keepTextInsideCanvas();
        }

        this.redraw();
    }

    pointerUp() {
        this.dragging = null;
    }

    getCanvasPosition(event: PointerEvent) {
        const canvas = this.canvasRef!.nativeElement;
        const rect = canvas.getBoundingClientRect();

        return {
            x: (event.clientX - rect.left) * (canvas.width / rect.width),
            y: (event.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    isInsideImage(x: number, y: number) {
        if(!this.customImage) {
            return false;
        }

        return (x >= this.imageX && x <= this.imageX + this.imageWidth && y >= this.imageY &&y <= this.imageY + this.imageHeight);
    }

    isInsideText(x: number, y: number) {
        if(!this.customText.trim()) {
            return false;
        }

        const canvas = this.canvasRef?.nativeElement;
        const ctx = canvas?.getContext("2d");
        if(!ctx) {
            return false;
        }

        ctx.font = "bold 32px Arial";
        const width = ctx.measureText(this.customText).width;
        const height = 40;

        return (x >= this.textX - width / 2 &&
            x <= this.textX + width / 2 &&
            y >= this.textY - height / 2 &&
            y <= this.textY + height / 2
        );
    }

    keepImageInsideCanvas() {
        const canvas = this.canvasRef?.nativeElement;
        if(!canvas) {
            return;
        }
        if(this.imageX < 0) {
            this.imageX = 0;
        }
        if(this.imageY < 0) {
            this.imageY = 0;
        }
        if(this.imageX + this.imageWidth >canvas.width) {
            this.imageX = canvas.width - this.imageWidth;
        }
        if(this.imageY + this.imageHeight > canvas.height) {
            this.imageY = canvas.height - this.imageHeight;
        }
    }

    keepTextInsideCanvas() {
        const canvas = this.canvasRef?.nativeElement;

        if(!canvas) {
            return;
        }
        if(this.textX < 0) {
            this.textX = 0;
        }
        if(this.textX > canvas.width) {
            this.textX = canvas.width;
        }
        if(this.textY < 0) {
            this.textY = 0;
        }
        if(this.textY > canvas.height) {
            this.textY = canvas.height;
        }
    }

    createFinalImage(): Promise<File> {
        return new Promise(
            (resolve, reject) => {
                const canvas = this.canvasRef ?.nativeElement;

                if(!canvas) {
                    reject(new Error("Canvas nije pronađen."));
                    return;
                }
                canvas.toBlob(
                    blob => {
                        if(!blob) {
                            reject(new Error("Slika nije kreirana."));
                            return;
                        }
                        const file = new File([blob],
                            `custom-product-${this.productId}.png`,
                            {
                                type:
                                    "image/png"
                            }
                        );

                        resolve(file);
                    },

                    "image/png"
                );
            }
        );
    }

    createPrintImage(): Promise<File> {
        return new Promise(
            (resolve, reject) => {
                const sourceCanvas = this.canvasRef ?.nativeElement;

                if(!sourceCanvas) {
                    reject(new Error("Canvas nije pronađen."));
                    return;
                }

                const printCanvas = document.createElement("canvas");
                printCanvas.width = sourceCanvas.width;
                printCanvas.height = sourceCanvas.height;

                const ctx = printCanvas.getContext("2d");

                if(!ctx) {
                    reject(new Error("Canvas context nije dostupan."));
                    return;
                }

                // Namerno NE crtamo baseImage.
                // Dobijamo providnu sliku samo
                // sa dizajnom za štampu.

                this.drawCustomization(ctx);

                printCanvas.toBlob(
                    blob => {

                        if(!blob) {
                            reject(new Error("Slika za štampu nije kreirana."));
                            return;
                        }

                        const file = new File(
                            [blob],
                            `print-design-${this.productId}.png`,
                            {
                                type: "image/png"
                            }
                        );

                        resolve(file);
                    },

                    "image/png"
                );
            }
        );
    }

    async addToCart() {
        if(!this.product) {
            return;
        }

        if(this.quantity < 1) {
            this.message = "Količina mora biti najmanje 1.";
            return;
        }

        if(this.quantity > this.product.quantity) {
            this.message = "Nema dovoljno proizvoda na stanju.";
            return;
        }

        const isCustomized = this.customText.trim() !== "" || this.customImage !== null;

        if(!isCustomized) {
            const confirmed = window.confirm(
                "Proizvod nije izmenjen. Da li želite da dodate neizmenjen proizvod u korpu?"
            );

            if(!confirmed) {
                return;
            }
        }

        const loggedUser = localStorage.getItem("loggedUser");

        if(!loggedUser) {
            this.message = "Morate biti prijavljeni.";
            return;
        }

        const user = JSON.parse(loggedUser);

        try {
            const previewImage = await this.createFinalImage();
            const printImage = await this.createPrintImage();
            const formData = new FormData();

            formData.append("userId", user._id);
            formData.append("productId", this.product._id);
            formData.append("quantity", this.quantity.toString());
            formData.append("color", this.selectedColor);
            formData.append("selectedPrintServiceType",this.selectedPrintServiceType);
            formData.append("customText", this.customText);
            formData.append("previewImage", previewImage);
            formData.append("printImage", printImage);

            this.cartService.addCustomizedProduct(formData).subscribe({
                next: data => {
                    this.message =
                        data.message;

                    this.router.navigate([
                        '/ecart'
                    ]);
                },

                error: error => {
                    console.log(error);

                    this.message =
                        error.error?.message ||
                        "Greška pri dodavanju u korpu.";
                }
            });

        } catch(error) {
            console.log(error);

            this.message = "Greška pri kreiranju slike.";
        }
    }

    resetDesign() {
        this.customText = "";

        this.customImage = null;
        this.selectedImageFile = null;

        this.textX = 300;
        this.textY = 220;

        this.imageX = 230;
        this.imageY = 300;

        this.imageWidth = 140;
        this.imageHeight = 140;

        this.quantity = 1;

        this.message = "";

        this.redraw();
    }

    back() {
      this.router.navigate(
        ['/product', this.productId]
      );
    }

    drawText(ctx: CanvasRenderingContext2D) {
        if(!this.customText.trim()) {
            return;
        }

        ctx.font = "bold 32px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const lines = this.customText.split("\n");
        const lineHeight = 40;

        const totalHeight =
            (lines.length - 1) * lineHeight;

        lines.forEach((line, index) => {
            ctx.fillText(
                line,
                this.textX,
                this.textY
                    - totalHeight / 2
                    + index * lineHeight
            );
        });
    }
}