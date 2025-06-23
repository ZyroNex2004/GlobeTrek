if (process.env.NODE_ENV != "production") {  //agar app production pe nhi h toh env var .env se load krega
  require("dotenv").config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8080;
const path = require('path');
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const wrapAsync = require('./utils/wrapAsync.js');
const ExpressError = require('./utils/ExpressError.js');
const listingRouter = require('./routes/listing.js');
const reviewRouter = require('./routes/review.js');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require('./models/user.js');
const userRouter = require('./routes/user.js');
const Listing = require('./models/listing');


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));//This line tells Express to serve static files (like CSS, JS, images, etc.) from a folder named public.


const MONGO_Url = 'mongodb://127.0.0.1:27017/wanderlust';
const dbUrl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(MONGO_Url);
}
async function main() {
  await mongoose.connect(dbUrl);
}


main().then(() => {
  console.log("connected to DB");
})
  .catch((err) => {
      console.log(err);
  })


const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
      // secret: "mysuperseceretcode",
      secret: process.env.SECRET
  },
  touchAfter: 24 * 3600 //milisec to 24 hr
})

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
})

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  uninitialized: true,
  cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000
  }
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize()); //har req ke liye passport initialize ho jyega
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));  //jitne v user aye wo localstrategy ke thorugh authenticate hone chahiye or 
passport.serializeUser(User.serializeUser());                                                 //unko authenticate krne ke liye authenticate method user krenge
passport.deserializeUser(User.deserializeUser());



//Demo user
app.get("/demouser", async (req, res) => {
  let fakeUser = new User({
      email: "student@gmail.com",
      username: "delta-student", //since mongoose automatically usename pass schema/model me add kr deta
  })
  let registeredUser = await User.register(fakeUser, "helloworld");
  res.send(registeredUser);
})


app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;  //since isko hm navbar.ejs me directly access nhi kr skte but locals variable ko access kr skte dure file me v isliye yaha store krwa diye
  next();
})
// app.use((req, res, next) => {
//     const hour = 3600000;  // 1 hour in ms
//     req.session.cookie.expires = new Date(Date.now() + hour);
//     req.session.cookie.maxAge = hour;
//     next();
// });



app.get("/", async(req, res) => {
   const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
});

//to use listings
app.use('/listings', listingRouter);
app.use('/listings/:id/reviews', reviewRouter);
app.use('/', userRouter);



app.all("/*anyPath", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));  //agar upar se koi path/route match nhi kiya toh baki route
  //ke liye express error thorw kr denge
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  // res.status(statusCode).send(message);
  res.status(statusCode).render("error.ejs", { message });
})

app.listen(port, () => {
  console.log("server is listening to port 8080");
});



// app.get("/testListing", async(req,res)=>{
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description:"By the beach",
//         price: 1200,
//         location: "Calangute , Goa",
//         country:"India",
//     });
//     await sampleListing.save();
//     res.send("successful testing");
// });