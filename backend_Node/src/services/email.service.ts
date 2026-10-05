import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import UserModel from "../models/user";

dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
    quiet: true
});

interface InvoiceAttachment {
    invoiceNumber: string;
    pdf: Buffer;
}

export async function sendInvoicesEmail(email: string, invoices: InvoiceAttachment[]) {
    try {
        const emailUser = process.env.EMAIL_USER?.trim();
        const emailPassword = process.env.EMAIL_PASSWORD?.trim();

        console.log("EMAIL_USER:", emailUser);
        console.log("EMAIL_PASSWORD EXISTS:", !!emailPassword);

        if(!emailUser || !emailPassword) {
            throw new Error("Email kredencijali nisu podešeni.");
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPassword
            }
        });

        // Provera Gmail autentikacije
        await transporter.verify();
        console.log("GMAIL AUTH SUCCESS");

        const attachments = invoices.map(invoice => ({
            filename: `${invoice.invoiceNumber}.pdf`,
            content: invoice.pdf,
            contentType: "application/pdf"
        }));

        const info = await transporter.sendMail({
            from: `"Printing House" <${emailUser}>`,
            to: email,
            subject: "Fakture - Printing House",
            text:
                "Poštovani,\n\n" +
                "U prilogu se nalaze fakture za Vašu narudžbinu.\n\n" +
                "Srdačan pozdrav,\n" +
                "Printing House",
            attachments: attachments
        });

        console.log("EMAIL SENT TO:", email);
        console.log("MESSAGE ID:", info.messageId);

        return info;
    } catch(error) {
        console.log("INVOICE EMAIL ERROR:", error);
        throw error;
    }
}

export async function sendProcurementEmails(procurement: any) {
    const printers = await UserModel.find({
        role: 'printer',
        status: 'active'
    });

    if(printers.length === 0) return;

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if(!emailUser || !emailPassword) {
        throw new Error("Email konfiguracija nije podešena.");
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPassword
        }
    });

    const productsHtml = procurement.items.map((item: any) => `
        <li>
            <b>${item.productName}</b>
            - količina: ${item.quantity}
            ${item.color ? `, boja: ${item.color}` : ''}
            ${item.printService ? `, štampa: ${item.printService}` : ''}
        </li>
    `).join('');

    const expiresAt = new Date(procurement.expiresAt).toLocaleString('sr-RS');

    for(const printer of printers) {
        if(!printer.email) continue;

        await transporter.sendMail({
            from: `"Printing House" <${emailUser}>`,
            to: printer.email,
            subject: "Otvorena nova javna nabavka",
            html: `
                <h2>Nova javna nabavka</h2>
                <p>Poštovani,</p>
                <p>Otvorena je nova licitacija za javnu nabavku.</p>
                <h3>Potrebni proizvodi:</h3>
                <ul>${productsHtml}</ul>
                <p>Licitacija traje do: <b>${expiresAt}</b></p>
                <p>Ponudu možete podneti putem aplikacije Printing House.</p>
            `
        });

        console.log("PROCUREMENT EMAIL POSLAT:", printer.username, printer.email);
    }
}