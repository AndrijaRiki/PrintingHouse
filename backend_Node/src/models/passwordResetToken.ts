import mongoose from 'mongoose';

const PasswordResetTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    tokenHash: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true
    }
}, {
    versionKey: false
});

// MongoDB će automatski uklanjati istekle dokumente
PasswordResetTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 } //sam odredjuje kad treba da istekne
);

export default mongoose.model(
    'PasswordResetToken',
    PasswordResetTokenSchema
);