const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const port = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/vote', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  phoneNumber : String,
  userName : {type : String,unique : true},
  Email:String,
  password: String,

});

const VoteSchema = new mongoose.Schema({
   user_id :  {
    type : String,
    ref : 'User'
   },
   candidate : {
    type : String
   }
},{timestamps : true});

const User = mongoose.model('User', userSchema);
const Vote = mongoose.model('Vote',VoteSchema);

// Passport configuration
passport.use(new LocalStrategy({ usernameField: 'userName' }, async (userName, password, done) => {

  try {
    const user = await User.findOne({ userName });
   

    if (!user) {
      return done(null, false, { message: 'Incorrect email.' });
    }
    
   // const passwordMatch = await bcrypt.compare(password, user.password);

     console.log(user.password);

    if (password !== user.password) {
      return done(null, false, { message: 'Incorrect password.' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Manually add admin data
const adminUsername = 'Batman';
const adminPassword = 'BruceWayne';

// Check if the admin user already exists
async function callUser(){

    let user = await User.findOne({ username: adminUsername });
    
    if (!user) {
        // Admin user doesn't exist, create it

       try{
        await User.create({
          userName : adminUsername,
          password: adminPassword
        });
       }catch(err){
          //console.log(err);
       }
    
     
    
        console.log('Admin user created successfully.');
      } else {
        console.log('Admin user already exists.');
      }
    
    }
    
    callUser();
app.get('/', (req, res) => {
  
  return res.render('login',{mesage : req.flash('error')});
   
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/logout',(req,res) => {
  req.logout((err) => {
    if (err){
      console.log(err);
      return res.redirect('back');
    }

    return res.redirect('/login');
  })
})

app.post('/register', async (req, res) => {
  const {userName, phoneNumber, Email, password } = req.body;

  // Hash the pass

  // Save the user to the database
  await User.create({
    userName,
    phoneNumber,
    Email,
    password,
  });

  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { message: req.flash('error') });
});

app.post('/login', passport.authenticate('local',{
  failureRedirect: '/login',
  failureFlash: true,
}),async(req,res) => {
  
  if(req.user.userName === adminUsername){

    let vote = await Vote.find({});


    let candidate_1 = 0;
    let candidate_2 = 0;
    let candidate_3 = 0;
    let candidate_4 = 0;

    for(let i = 0; i < vote.length; i++){
      if (vote[i].candidate === "candidate1"){
        candidate_1++;
      }else if(vote[i].candidate === "candidate2"){
          candidate_2++;
      }else if(vote[i].candidate === "candidate3"){
        candidate_3++;
    }else{
      candidate_4++;
    }
    }


    return res.render('votecount',{candidate_1 : candidate_1,candidate_2 : candidate_2,candidate_3: candidate_3,candidate_4 : candidate_4});

  }
  else{
    const alreadyvoted = await Vote.find({user_id:req.user.id});
    // console.log(alreadyvoted[0].candiate);
    if(alreadyvoted.length){
        return res.render('voteCollection',{
          message : "user already voted...",
          candidate:alreadyvoted[0].candidate
        })
    }else{
        return res.render('vote',{
          message:""
        });
    }
  }

});

app.post('/vote', async (req, res) => {
  if (req.isAuthenticated()) {
    const{candidate} = req.body;
    let vote = await Vote.find({});
      let result = vote.filter((item) => req.user.id===item.user_id)
      if (result.length !== 0){
        return res.render('voteCollection',{candidate});
      }else{
        await Vote.create({
          user_id : req.user.id,
          candidate
        })


        return res.render('voteCollection',{candidate});
    } 
  }{
    return  res.redirect('/login');
  }
});

app.get('/votecount', async (req, res) => {
  // Add admin authentication logic here
  if (req.isAuthenticated() && req.user.userName === 'Batman') {
    
    let vote = await Vote.find({});


    let candidate_1 = 0;
    let candidate_2 = 0;
    let candidate_3 = 0;
    let candidate_4 = 0;

    for(let i = 0; i < vote.length; i++){
      if (vote[i].candidate === "candidate1"){
        candidate_1++;
      }else if(vote[i].candidate === "candidate2"){
          candidate_2++;
      }else if(vote[i].candidate === "candidate3"){
        candidate_3++;
    }else{
      candidate_4++;
    }
    }


    return res.render('votecount',{candidate_1 : candidate_1,candidate_2 : candidate_2,candidate_3: candidate_3,candidate_4 : candidate_4});
  } else {
   return  res.redirect('/login');
  }
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
