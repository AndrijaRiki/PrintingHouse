export class PasswordResetToken {
    userId: string = "";
    tokenHash: string = "";
    expiresAt: Date = new Date();
}