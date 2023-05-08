const User = require("../models/user");
const passport = require("passport");


module.exports.renderRegister = (req, res) => {
    res.render("users/register");
};

module.exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, function (err) {
            if (err) return next(err);
            req.flash("success", "Welcome to yelpcamp");
            res.redirect("/campgrounds");
        });

    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/register");
    }

};

module.exports.renderLogin = (req, res) => {
    res.render("users/login");
};

module.exports.login = (req, res) => {
    req.flash("success", "Welcome Back");
    const redirectUrl = res.locals.returnTo || "/campgrounds";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logout = async (req, res) => {
    req.logOut((err) => {
        if (err) return next(err);
        req.flash("success", "Logged you out");
        res.redirect("/campgrounds");
    });

};