import PDFDocument from 'pdfkit';

// Converts Serbian diacritics to standard ASCII characters
// to prevent PDFKit standard fonts from throwing encoding errors.
function cleanText(text: any): string {
    if (!text) return '';
    return String(text)
        .replace(/Š/g, 'S').replace(/š/g, 's')
        .replace(/Č/g, 'C').replace(/č/g, 'c')
        .replace(/Ć/g, 'C').replace(/ć/g, 'c')
        .replace(/Đ/g, 'Dj').replace(/đ/g, 'dj')
        .replace(/Ž/g, 'Z').replace(/ž/g, 'z');
}

export function generateInvoicePdf(order: any, customer: any, printer: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });

            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.font('Helvetica-Bold').fontSize(22).text('FAKTURA', { align: 'center' });
            doc.moveDown();

            doc.font('Helvetica').fontSize(11).text(`Broj fakture: ${order.invoiceNumber}`);
            doc.text(`Datum: ${new Date(order.createdAt).toLocaleDateString('sr-RS')}`);
            doc.moveDown();

            // Printer / Issuer
            doc.font('Helvetica-Bold').fontSize(14).text(cleanText('Štamparija'));
            doc.font('Helvetica').fontSize(10);

            if (printer.institution) {
                doc.text(cleanText(printer.institution.name));
                doc.text(cleanText(`${printer.institution.address}, ${printer.institution.city}`));

                if (printer.institution.taxId) {
                    doc.text(`PIB: ${printer.institution.taxId}`);
                }

                if (printer.institution.registrationNumber) {
                    doc.text(cleanText(`Matični broj: ${printer.institution.registrationNumber}`));
                }
            } else {
                doc.text(cleanText(printer.username));
            }

            doc.moveDown();

            // Customer
            doc.font('Helvetica-Bold').fontSize(14).text('Kupac');
            doc.font('Helvetica').fontSize(10).text(cleanText(`${customer.firstname} ${customer.lastname}`));
            doc.text(`Email: ${customer.email}`);

            if (customer.clientType === 'company' && customer.institution) {
                doc.text(cleanText(customer.institution.name));
                doc.text(cleanText(`${customer.institution.address}, ${customer.institution.city}`));

                if (customer.institution.taxId) {
                    doc.text(`PIB: ${customer.institution.taxId}`);
                }

                if (customer.institution.registrationNumber) {
                    doc.text(cleanText(`Matični broj: ${customer.institution.registrationNumber}`));
                }
            }

            doc.moveDown();

            // Items
            doc.font('Helvetica-Bold').fontSize(14).text('Stavke');
            doc.moveDown(0.5);

            for (const item of order.items) {
                doc.font('Helvetica-Bold').fontSize(11).text(cleanText(item.productName));
                doc.font('Helvetica').fontSize(10).text(cleanText(`Količina: ${item.quantity}`));
                doc.text(cleanText(`Boja: ${item.color}`));
                doc.text(`Cena po komadu: ${item.unitPrice} RSD`);

                if (item.selectedPrintService) {
                    doc.text(cleanText(`Tip štampe: ${item.selectedPrintService.type}`));
                    doc.text(`Dodatna cena: ${item.selectedPrintService.additionalPrice} RSD/kom`);
                } else {
                    doc.text('Tip stampe: Bez dodatne stampe');
                }

                doc.text(`Ukupno: ${item.totalPrice} RSD`);
                doc.moveDown();
            }

            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(14).text(`UKUPNO: ${order.totalAmount} RSD`, { align: 'right' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}