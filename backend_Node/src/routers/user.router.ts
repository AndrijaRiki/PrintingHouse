import express from 'express';
import multer from 'multer';

import { UserController } from "../controllers/user.controller";

const userRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

userRouter.route('/login').post(
    (req, res) => new UserController().login(req, res)
);

userRouter.route('/getUserById').post(
    (req, res) => new UserController().getUserById(req, res)
);

userRouter.route('/getUserByEmail').post(
    (req, res) => new UserController().getUserByEmail(req, res)
);

userRouter.route('/forgotPassword').post(
    (req, res) => new UserController().forgotPassword(req, res)
);

userRouter.route('/resetPasswordByToken').post(
    (req, res) => new UserController().resetPasswordByToken(req, res)
);

userRouter.route('/adminLogin').post(
    (req, res) => new UserController().adminLogin(req, res)
);

userRouter.route('/getAllEmails').get(
    (req, res) => new UserController().getAllEmails(req, res)
);

userRouter.post('/uploadImage', upload.single('profileImage'),
    (req, res) => new UserController().uploadImage(req, res)
)

userRouter.post('/register', upload.single('profileImage'),
    (req, res) => new UserController().register(req, res)
);

userRouter.get('/profileImage/:username', 
    (req, res) => new UserController().getProfileImage(req, res)
);

userRouter.get('/getAllPrinters',
    (req, res) => new UserController().getAllPrinters(req, res)
);

userRouter.patch('/updateProfile/:username', upload.single('profileImage'),
    (req, res) => {
        new UserController().updateProfile(req, res);
    }
);

export default userRouter;