import {Controller, Get, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {AuthService} from "../services/auth.service";
import {Public} from "../decorators/auth.decorators";
import {ServerSettingsService} from "../../settings/services/server-settings.service";

@Controller()
@ApiTags(AuthMvcController.name)
export class AuthMvcController {
    constructor(
        private authService: AuthService,
        private serverSettingsService: ServerSettingsService
    ) {
    }

    // ======= LEGACY MVC ENDPOINTS BELOW - PHASED OUT SOON ======
    // @Public()
    // @Post("register")
    // async registerSubmission(@Req() req, @Res() res) {
    //     const {name, username, password, password2} = req.body;
    //     const errors = [];
    //     let currentUsers = await User.find({});
    //
    //     // Check required fields
    //     if (!name || !username || !password || !password2) {
    //         errors.push({msg: "Please fill in all fields..."});
    //     }
    //
    //     // Check passwords match
    //     if (password !== password2) {
    //         errors.push({msg: "Passwords do not match..."});
    //     }
    //
    //     // Password at least 6 characters
    //     if (password.length < 6) {
    //         errors.push({msg: "Password should be at least 6 characters..."});
    //     }
    //
    //     if (errors.length > 0) {
    //         res.render("register", {
    //             page: "Login",
    //             registration: settings[0].server.registration,
    //             serverSettings: settings,
    //             errors,
    //             name,
    //             username,
    //             password,
    //             password2,
    //             userCount: currentUsers.length,
    //         });
    //     } else {
    //         // Validation Passed
    //         User.findOne({username}).then((user) => {
    //             if (user) {
    //                 // User exists
    //                 errors.push({msg: "Username is already registered"});
    //                 res.render("register", {
    //                     page: "Login",
    //                     registration: settings[0].server.registration,
    //                     serverSettings: settings,
    //                     errors,
    //                     name,
    //                     username,
    //                     password,
    //                     password2,
    //                     userCount: currentUsers.length,
    //                 });
    //             } else {
    //                 // Check if first user that's created.
    //                 User.find({}).then((user) => {
    //                     let userGroup = "";
    //                     if (user.length < 1) {
    //                         userGroup = "Administrator";
    //                     } else {
    //                         userGroup = "User";
    //                     }
    //                     const newUser = new User({
    //                         name,
    //                         username,
    //                         password,
    //                         group: userGroup,
    //                     });
    //                     // Hash Password
    //                     bcrypt.genSalt(10, (error, salt) =>
    //                         bcrypt.hash(newUser.password, salt, (err, hash) => {
    //                             if (err) throw err;
    //                             // Set password to hashed
    //                             newUser.password = hash;
    //                             // Save new User
    //                             newUser
    //                                 .save()
    //                                 .then((user) => {
    //                                     req.flash(
    //                                         "success_msg",
    //                                         "You are now registered and can login"
    //                                     );
    //                                     const page = "login";
    //                                     res.redirect("/users/login");
    //                                 })
    //                                 .catch((err) => console.log(err));
    //                         })
    //                     );
    //                 });
    //             }
    //         });
    //     }
    // }
}