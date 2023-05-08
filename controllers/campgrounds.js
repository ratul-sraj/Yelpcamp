const Campground = require("../models/campground.js");
const { cloudinary } = require("../Cloudinary/index");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geoCoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index.ejs", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
    res.render("campgrounds/new");
};

module.exports.createCampground = async (req, res) => {
    const geoData = await geoCoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send();
    res.send(geoData.body.features[0].geometry.coordinates);
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.img = req.files.map(file => ({ url: file.path, filename: file.filename }));
    campground.author = req.user._id;
    await campground.save();
    req.flash("success", "successfully made a new campground!!");
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res,) => {
    const { id } = req.params;
    const foundCampground = await Campground.findById(id).populate({
        path: "reviews",
        populate: { path: "author" }
    }).populate("author");
    if (!foundCampground) {
        req.flash("error", "campground not found");
        return res.redirect("/campgrounds");
    }
    res.render("campgrounds/show.ejs", { foundCampground });
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash("error", "campground not found");
        return res.redirect("/campgrounds");
    }
    res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { new: true });
    const images = req.files.map(file => ({ url: file.path, filename: file.filename }));
    camp.img.push(...images);
    await camp.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await camp.updateOne({ $pull: { img: { filename: { $in: req.body.deleteImages } } } });
        console.log(camp);
    }
    req.flash("success", "successfully updated a campground!!");
    res.redirect(`/campgrounds/${camp._id}`);
};

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash("success", "successfully deleted your campground!!");
    res.redirect("/campgrounds");
};