const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', { useNewUrlParser: true, useUnifiedTopology: true });
const cities = require("./cities");
const axios = require("axios");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/campground.js");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });


const sample = (array) => {

    return array[Math.floor(Math.random() * array.length)];
};

async function seedImg() {
    try {
        const res = await axios.get("https://api.unsplash.com/photos/random?client_id=tkkDK8fAqiJHA9B4DJDY63akrZbFNCphu4l8ZopGwhg&query=camping");
        return res.data.urls.small;
    } catch (err) {
        console.log(err);
    }
};



const seedDb = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20 + 10);
        const location = `${cities[random1000].city}, ${cities[random1000].state}`;
        const geoData = await geocoder.forwardGeocode({
            query: location,
            limit: 1
        }).send();
        const camp = new Campground({
            location: location,
            title: `${sample(descriptors)} ${sample(places)}`,
            geometry: geoData.body.features[0].geometry,
            img: [
                {
                    url: 'https://res.cloudinary.com/dxbbbbnev/image/upload/v1682491561/YelpCamp/camp2_whsnoc.png',
                    filename: 'YelpCamp/camp2_whsnoc'
                },
                {
                    url: 'https://res.cloudinary.com/dxbbbbnev/image/upload/v1682491561/YelpCamp/camp1_tjsk2n.png',
                    filename: 'YelpCamp/camp1_tjsk2n'
                },
                {
                    url: 'https://res.cloudinary.com/dxbbbbnev/image/upload/v1682491561/YelpCamp/camp3_dgixxg.png',
                    filename: 'YelpCamp/camp3_dgixxg'
                },
                {
                    url: 'https://res.cloudinary.com/dxbbbbnev/image/upload/v1682491561/YelpCamp/camp4_ixcr4g.png',
                    filename: 'YelpCamp/camp4_ixcr4g'
                }
            ],
            author: "6456fa0a4db2a89e528664b2",
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis dicta ab placeat enim quae asperiores aut itaque tenetur incidunt officiis possimus cum illum iusto maxime fuga, repellat nisi assumenda velit.",
            price: price
        });
        await camp.save();
    }


};


seedDb().then(() => {
    mongoose.connection.close();
});
