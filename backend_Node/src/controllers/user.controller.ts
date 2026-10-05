import express from 'express';
import crypto from 'crypto';
import sharp from 'sharp';
import bcrypt from 'bcrypt';

import UserModel from '../models/user';
import PasswordResetTokenModel from '../models/passwordResetToken';

const SALT_ROUNDS = 10;

export class UserController {
    public login=async(req:express.Request,res:express.Response)=>{
        try{
            const {username,password}=req.body;

            if(!username || !password){
                return res.status(400).json({
                    message:"Korisničko ime i lozinka su obavezni."
                });
            }

            const user=await UserModel.findOne({username});

            if(!user){
                return res.status(401).json({
                    message:"Pogrešno korisničko ime ili lozinka."
                });
            }

            const passwordCorrect=await bcrypt.compare(
                password,
                user.password
            );

            if(!passwordCorrect){
                return res.status(401).json({
                    message:"Pogrešno korisničko ime ili lozinka."
                });
            }

            if(user.status==="pending"){
                return res.status(403).json({
                    message:"Registracija još uvek nije odobrena."
                });
            }

            if(user.status==="rejected"){
                return res.status(403).json({
                    message:"Zahtev za registraciju je odbijen."
                });
            }

            if(user.status==="deleted"){
                return res.status(403).json({
                    message:"Korisnički nalog je obrisan."
                });
            }

            return res.status(200).json(user);
        }catch(error){
            console.log("LOGIN ERROR:",error);

            return res.status(500).json({
                message:"Serverska greška."
            });
        }
    };

    public register = async (req: express.Request, res: express.Response) => {
        try {
            const {
                username, password, firstname, lastname, email, phone,
                role, clientType, institutionName, institutionAddress,
                institutionCity, registrationNumber, taxId
            } = req.body;

            if(!username || !password || !firstname || !lastname || !email || !phone || !role) {
                return res.status(400).json({ message: "Nisu uneti svi obavezni podaci." });
            }

            if(role !== "client" && role !== "printer") {
                return res.status(400).json({ message: "Nevalidan tip korisnika." });
            }

            if(role === "client" && clientType !== "individual" && clientType !== "company") {
                return res.status(400).json({ message: "Nevalidan tip klijenta." });
            }

            const existingUsername = await UserModel.findOne({ username: username });
            if(existingUsername) {
                return res.status(400).json({ message: "Korisnicko ime je vec zauzeto." });
            }

            const existingEmail = await UserModel.findOne({ email: email });
            if(existingEmail) {
                return res.status(400).json({ message: "Email adresa je vec u upotrebi." });
            }

            let institution = null;
            const requiresInstitution = role === "printer" || (role === "client" && clientType === "company");

            if(requiresInstitution) {
                if(!institutionName || !institutionAddress || !institutionCity || !registrationNumber || !taxId) {
                    return res.status(400).json({ message: "Nisu uneti svi podaci o instituciji." });
                }

                const REGISTRATION_NUMBER_REGEX = /^\d{8}$/;
                const TAX_ID_REGEX = /^[1-9]\d{8}$/;

                if(!REGISTRATION_NUMBER_REGEX.test(registrationNumber)) {
                    return res.status(400).json({ message: "Maticni broj mora imati tacno 8 cifara." });
                }

                if(!TAX_ID_REGEX.test(taxId)) {
                    return res.status(400).json({ message: "PIB mora imati tacno 9 cifara i ne sme pocinjati nulom." });
                }

                const existingRegistrationNumber = await UserModel.findOne({
                    "institution.registrationNumber": registrationNumber
                });

                if(existingRegistrationNumber) {
                    return res.status(400).json({ message: "Maticni broj je vec u upotrebi." });
                }

                const existingTaxId = await UserModel.findOne({
                    "institution.taxId": taxId
                });

                if(existingTaxId) {
                    return res.status(400).json({ message: "PIB je vec u upotrebi." });
                }

                institution = {
                    name: institutionName,
                    address: institutionAddress,
                    city: institutionCity,
                    registrationNumber: registrationNumber,
                    taxId: taxId
                };
            }

            let profileImage = null;

            if(req.file) {
                const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

                if(!allowedTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({ message: "Profilna slika mora biti JPG, PNG ili GIF." });
                }

                const metadata = await sharp(req.file.buffer).metadata();
                const width = metadata.width;
                const height = metadata.height;

                if(!width || !height) {
                    return res.status(400).json({ message: "Nevalidna slika." });
                }

                if(width < 100 || width > 250 || height < 100 || height > 250) {
                    return res.status(400).json({
                        message: "Slika mora biti dimenzija od 100x100 do 250x250 piksela."
                    });
                }

                profileImage = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                };
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const newUser = new UserModel({
                username: username,
                password: hashedPassword,
                firstname: firstname,
                lastname: lastname,
                email: email,
                phone: phone,
                role: role,
                clientType: role === "client" ? clientType : null,
                profileImage: profileImage,
                status: "pending",
                institution: institution
            });

            await newUser.save();

            return res.status(201).json({
                message: "Zahtev za registraciju je uspesno kreiran.",
                user: newUser
            });
        } catch(error) {
            console.log("Register error:", error);
            return res.status(500).json({ message: "Serverska greska." });
        }
    };

    public getProfileImage = async (req: express.Request, res: express.Response) => {
        try {
            const username = req.params.username;
            const user = await UserModel
                .findOne({ username: username })
                .select("profileImage");

            if (!user) {
                return res.status(404).json({
                    message: "Korisnik ne postoji"
                });
            }

            if (!user.profileImage || !user.profileImage.data) {
                return res.status(404).json({
                    message: "Korisnik nema profilnu sliku"
                });
            }

            res.setHeader(
                "Content-Type",
                user.profileImage.contentType
            );

            return res.send(
                user.profileImage.data
            );

        } catch (error) {

            console.log(
                "Get profile image error:",
                error
            );

            return res.status(500).json({
                message: "Serverska greska."
            });
        }
    }

    public getUserById = (req: express.Request, res: express.Response): void => {

        const username = req.body.username;

        UserModel
            .findOne({ username: username })
            .then((user) => {
                res.json(user);
            })
            .catch((err) => {
                console.log("Error: " + err);
                res.json(null);
            });
    }

    public getUserByEmail = (req: express.Request, res: express.Response): void => {
        let e = req.body.email;

        UserModel.findOne({email: e}).then((e) => {
            res.json(e);
        }).catch((err) => {
            console.log("Error: " + err);
            res.json(null);
        })
    }

    public adminLogin=async(req:express.Request, res:express.Response    )=>{
        try{
            const {username,password}=req.body;

            if(!username || !password){
                return res.status(400).json({
                    message:"Korisničko ime i lozinka su obavezni."
                });
            }

            const user=await UserModel.findOne({
                username:username,
                role:"admin",
                status:"active"
            });

            if(!user){
                return res.status(200).json(null);
            }

            const passwordCorrect=
                await bcrypt.compare(
                    password,
                    user.password
                );

            if(!passwordCorrect){
                return res.status(200).json(null);
            }

            return res.status(200).json(user);
        }catch(error){
            console.log(
                "ADMIN LOGIN ERROR:",
                error
            );

            return res.status(500).json({
                message:"Serverska greška."
            });
        }
    };

    public getAllEmails = async (req: express.Request, res: express.Response) => {
        try {
            const users = await UserModel.find({}, { email: 1, _id: 0 });

            const emails = users.map(user => user.email);

            res.json(emails);
        } catch (error) {
            console.log(error);
            res.status(500).json([]);
        }
    }

    public uploadImage = async(req: express.Request, res: express.Response) => {
        try {
            if(!req.file) {
                return res.status(400).json({message: "Slika nije poslata"});
            }

            const metadata = await sharp(req.file.buffer).metadata();
            const width = metadata.width;
            const height = metadata.height;

            if(!width || !height) {
                return res.status(400).json({message: "Nevalidna slika"});
            }

            if(width < 100 || width > 250 || height < 100 || height > 250) {
                return res.json({message: "Slika mora biti izmedju 100x100 i 250x250 slika"});
            }
        } catch(error) {
            console.log(error);

            return res.status(500).json({message: "Server error"});
        }
    }

    forgotPassword = async (req: express.Request, res: express.Response) => {
        try {
            const email = req.body.email;
            const user = await UserModel.findOne({email: email});

            if (!user) {
                return res.status(200).json({
                    message: "Ako korisnik postoji, link je generisan"
                });
            }

            // Ako je ranije trazio reset, obrisi stare tokene
            await PasswordResetTokenModel.deleteMany({
                userId: user._id
            });

            // Generisanje originalnog tokena
            const token = crypto
                .randomBytes(32)
                .toString('hex');

            // Hash tokena koji cuvamo u bazi
            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // Cuvanje tokena
            await PasswordResetTokenModel.create({
                userId: user._id,
                tokenHash: tokenHash,

                expiresAt: new Date(
                    Date.now() + 5 * 60 * 1000
                )
            });

            const resetLink = `http://localhost:4200/reset-password/${token}`;

            console.log("Reset link: " + resetLink);

            return res.json({
                message: "Reset link je generisan",
                resetLink: resetLink
            });

        } catch (error) {

            console.log(error);

            return res.status(500).json({
                message: "Server error"
            });
        }
    }

    resetPasswordByToken = async (req: express.Request, res: express.Response) => {
        try {

            const token = req.body.token;
            const password = req.body.password;

            // 1. Provera da li su podaci poslati
            if (!token || !password) {
                return res.status(400).json({
                    message: "Token i nova lozinka su obavezni."
                });
            }

            // 2. Provera formata nove lozinke
            const PASSWORD_REGEX =
                /^(?=.{8,12}$)(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].*$/;

            if (!PASSWORD_REGEX.test(password)) {
                return res.status(400).json({
                    message:
                        "Lozinka mora imati 8-12 karaktera, pocinjati slovom i sadrzati veliko slovo, broj i specijalni karakter."
                });
            }

            // 3. Hash tokena koji je stigao iz URL-a
            const tokenHash = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            // 4. Pronadji token samo ako jos nije istekao
            const resetToken =
                await PasswordResetTokenModel.findOne({
                    tokenHash: tokenHash,
                    expiresAt: {
                        $gt: new Date()
                    }
                });

            if (!resetToken) {
                return res.status(400).json({
                    message: "Token je nevalidan ili je istekao."
                });
            }

            // 5. Pronadji korisnika kome token pripada
            const user = await UserModel.findById(
                resetToken.userId
            );

            if (!user) {
                return res.status(400).json({
                    message: "Korisnik ne postoji."
                });
            }

            // 6. Hashovanje nove lozinke
            const hashedPassword = await bcrypt.hash(
                password,
                10
            );

            // 7. Cuvanje hashovane lozinke
            user.password = hashedPassword;

            await user.save();

            // 8. Token je iskoriscen - obrisi ga
            await PasswordResetTokenModel.deleteOne({
                _id: resetToken._id
            });

            return res.status(200).json({
                message: "Lozinka je uspesno promenjena."
            });

        } catch (error) {

            console.log(
                "Reset password error:",
                error
            );

            return res.status(500).json({
                message: "Server error."
            });
        }
    }

    public getAllPrinters = (req: express.Request, res: express.Response): void => {
        UserModel.find({role: "printer", status: "active"}).select("-password")
            .then((printers) => {
                res.json(printers);
            }).catch((err) => {
                console.log("Error: " + err);

                res.status(500).json([]);
            })
    }

    public updateProfile = async(req: express.Request, res: express.Response) => {
        try {
            console.log("USERNAME:", req.params.username);
            console.log("BODY:", req.body);
            console.log("FILE:", req.file);
            
            const username = req.params.username;

            const user = await UserModel.findOne({username: username});

            if(!user) {
                return res.status(404).json({
                    message: "Korisnik ne postoji."
                });
            }

            const {
                firstname,
                lastname,
                email,
                phone
            } = req.body;

            if(firstname !== undefined) {
                user.firstname = firstname;
            }

            if(lastname !== undefined) {
                user.lastname = lastname;
            }

            if(email !== undefined) {
                const EMAIL_REGEX =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if(!EMAIL_REGEX.test(email)) {
                    return res.status(400).json({
                    message: "Email adresa nije validna."
                    });
                }

                const existingEmail =
                    await UserModel.findOne({
                    email: email,
                    username: {
                        $ne: username
                    }
                    });

                if(existingEmail) {
                    return res.status(400).json({
                    message: "Email adresa je već u upotrebi."
                    });
                }

                user.email = email;
            }

            if(phone !== undefined) {
                const PHONE_REGEX =
                    /^06\d{1}[0-9]{6,7}$/;

                if(!PHONE_REGEX.test(phone)) {
                    return res.status(400).json({
                    message: "Broj telefona nije validan."
                    });
                }

                user.phone = phone;
            }

            if(req.file) {
                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/gif"
                ];

                if(!allowedTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                    message: "Slika mora biti JPG, PNG ili GIF."
                    });
                }

                const metadata =
                    await sharp(req.file.buffer).metadata();

                const width = metadata.width;
                const height = metadata.height;

                if(
                    !width ||
                    !height ||
                    width < 100 ||
                    width > 250 ||
                    height < 100 ||
                    height > 250
                ) {
                    return res.status(400).json({
                    message:
                        "Slika mora biti dimenzija od 100x100 do 250x250 piksela."
                    });
                }

                user.profileImage = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                };
            }

            await user.save();

            return res.status(200).json({
                message: "Profil je uspešno ažuriran.",
                user: {
                    _id: user._id,
                    username: user.username,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    clientType: user.clientType,
                    status: user.status,
                    institution: user.institution
                }
            });

        } catch(error) {
            console.log("Update profile error:", error);

            return res.status(500).json({
            message: "Serverska greška."
            });
        }
    }
}