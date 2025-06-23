const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");


const MONGo_URL = "mongodb://127.0.0.1:27017/wanderlust";
main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
        
    });

    async function main() {
        await mongoose.connect(MONGo_URL);
    }

    const initDB = async () => {
        await Listing.deleteMany({});
        initData.data = initData.data.map((obj) => ({
            ...obj,
            owner: "67bb77936e59447d163b093f",
        }));
        await Listing.insertMany(initData.data);
        console.log("data was initalized");
    };



    initDB();