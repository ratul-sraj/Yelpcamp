const { campGroundSchema, reviewSchema } = require("./schemas");
const ExpressError = require("./utils/ExpressError");
const Campground = require("./models/campground");
const Review = require("./models/review");


module.exports.isLoggedIn = function (req, res, next) {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash("error", "you must be logged in first");
        return res.redirect("/login");
    }
    next();
};

module.exports.storeReturnTo = function (req, res, next) {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    } next();
};



module.exports.validateCampground = (req, res, next) => {
    const { error } = campGroundSchema.validate(req.body);
    if (error) {
        const message = error.details.map(el => el.message).join(",");
        throw new ExpressError(message, 400);
    } else {
        next();
    }

};
module.exports.validateReviews = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const message = error.details.map(el => el.message).join(",");
        throw new ExpressError(message, 400);
    } else {
        next();
    }

};

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash("error", "you do not have permissions to do that");
        return res.redirect(`/campgrounds/${id}`);
    } else { next(); };
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        console.log(review.author, req.user._id);
        req.flash("error", "you do not have permissions to do that");
        return res.redirect(`/campgrounds/${id}`);
    } else { next(); };
};
