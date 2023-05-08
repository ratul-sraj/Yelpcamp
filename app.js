if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}


console.log(process.env.CLOUDINARY_KEY);

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const methodOverride = require("method-override");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");
const db_url = process.env.db_url || "://127.0.0.1:27017/yelp-camp"
mongoose.connect(db_url, { useNewUrlParser: true, useUnifiedTopology: true });
const ExpressError = require("./utils/ExpressError");
const flash = require("connect-flash");
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet")
const MongoDBStore = require("connect-mongo")(session)

//Routes all downhere
const campgroundRoutes = require("./routes/campground");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/user");
const { required } = require("joi");


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});


const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(mongoSanitize());
app.use(
    helmet()
  );



  const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/"
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                 //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://res.cloudinary.com/dxbbbbnev/",
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const secret = process.env.SECRET || "thisshouldbeabettersecret"

const store = new MongoDBStore({
    url:db_url,
    secret:secret,
    touchAfter:24*60*60
})
store.on("error",function(err){
    console.log("Store error",err)
})
const sessionConfig = {
    store,
    name:"session_cookie",
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        // secure:true
    }
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.get("/fakeuser", async (req, res) => {
    const user = new User({
        email: "colt@getMaxListeners.com",
        username: "colttt"
    });
    const regUser = await User.register(user, "monkey");
    res.send(regUser);
});

app.get("/", (req, res) => {
    res.render("home.ejs");
});



app.use(express.static(path.join(__dirname, "public")));


app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/", userRoutes);


app.all("*", (req, res, next) => {
    next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.mesage) err.mesage = "something went wrong";
    console.log(err.mesage);
    res.status(statusCode).render("error", { err });
});

const port = process.env.PORT||3000

app.listen(port, (req, res) => {
    console.log("serving on port ",port);
});