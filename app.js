const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const exphbs = require('hbs');
const request =require('request');
const multer=require('multer');
var MongoClient=require('mongodb').MongoClient;
var url='mongodb://localhost/AlbumImage';
const fs=require('fs');
const fileUpload = require('express-fileupload');
const bcrypt=require('bcryptjs');
const flash=require('connect-flash');
const {ensureAuthenticated}=require('./auth');


//Hash Password 
var password='admin-page-yoca';
console.log();
bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(password,salt,(err,hash)=>{
  if(err) throw err;

  password=hash;
  console.log('hashed password##############3 : ',password);
}));

var credentials=JSON.parse(fs.readFileSync('credentials.json','utf8'));
//console.log(JSON.parse(albumsString));
        console.log(`The user ID is ${credentials[0].user_id}`);

var nodemailer = require('nodemailer');
var http = require('http');
var url = require('url');

const app = express();

//app.engine('handlebars',exphbs());
//View - Engine
app.set('view engine','hbs');
exphbs.registerPartials(__dirname+'/views/partials')

//Posting data from front-end
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//File Upload

app.use(fileUpload());
app.use(express.static('./multer'));
app.use('/public',express.static(path.join(__dirname,'public')));


//Session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))
//Connect Flash

app.use(flash());

//Global Vars

app.use((req,res,next)=>{
  res.locals.success_msg=req.flash('success_msg');
  res.locals.error_msg=req.flash('error_msg');
  res.locals.error=req.flash('error');
  next();
});
//Passport JS
const passport=require('passport');
require('./passport')(passport);
app.use(passport.initialize());
app.use(passport.session());


// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './multer/uploads/',
    filename: function(req, file, cb){
      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
  
  // Init Upload
  const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
    fileFilter: function(req, file, cb){
      checkFileType(file, cb);
    }
  }).single('myImage');
  
  // Check File Type
  function checkFileType(file, cb){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
  
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb('Error: Images Only!');
    }
  }
  

app.get('/',(req,res)=>{
  //  res.render('home');
    albumArray = albums.getAll();
    console.log("Check");
    console.log(albumArray);
    console.log('Admin--------------------------------------------------------');
    res.render('home',{
        albums : albumArray
    });
});

app.get('/login',(req,res)=>{
  //  res.render('home');
    
    res.render('login');
});

app.get('/users/login',(req,res)=>{
  //  res.render('home');
    
    res.render('login');
});

app.get('/users/logout',(req,res)=>{
  //  res.render('home');
    req.logout();
    req.flash('success_msg','You are Logged Out !');
    res.redirect('/login');
});


app.post('/login',(req,res,next)=>{
  //  res.render('home');
    passport.authenticate('local',{
      successRedirect:'/admin',
      failureRedirect:'/login',
      failureFlash:true
    })(req,res,next);
    //res.render('login');
});
// app.get('/gallery',(req,res)=>{
//   res.render('gallery');
// });

app.get('/contact',(req,res)=>{
  res.render('contact');
});


//const os =require('os');
//const _=require('lodash');
const yargs = require('yargs');

const albums=require('./notes.js');

const argv=yargs.argv;
var command = process.argv[2];
var albumArray=[];
console.log(command);
if (command === 'add') {
  console.log('Adding new album');
  var album=albums.addalbum(argv.title,argv.body);
  //if (typeof(album) !== 'undefined'){
    if(album){
      console.log('album Created');
      console.log('--');
      console.log(`Title: ${album.title} Body: ${album.body}`);
  }
  else{
    console.log('album title taken');
  }
} else if (command === 'list') {
    console.log('Listing all albums');
    albumArray = albums.getAll();
    console.log(JSON.stringify(albumArray,undefined,2));
    //albumArray.forEach((album)=>{albums.logalbum(album)});
} else if (command === 'read') {
  console.log('Reading album');
 var album= albums.getalbum(argv.title);
  if(album){
    console.log('album has been fetched--');
    albums.logalbum(album);
}
else{
  console.log('album not found');
}
} else if (command === 'remove') {
  console.log('Removing album');
  var bool = albums.removealbum(argv.title);
  var message = bool ? 'album was removed':'album not found';
  console.log(message);
} else {
  console.log('Command not recognized');
}

app.get('/admin',ensureAuthenticated,(req,res)=>{
    albumArray = albums.getAll();
  
    res.render('admin',{
        albums : albumArray
    });

 
});
app.get('/addPictures/:id',(req,res)=>{

  albumArray = albums.getAll();

  //Write the album ID of the album to which the picture is to be added into a file
  fs.writeFileSync('albums_id.txt',req.params.id);

  res.render('addPictures');
  

});

app.get('/delAlbum/:id',(req,res)=>{
  //To delete an Album you need Album's deleteHash

  //Get album's delete hash from albums.JSON file


  var album_info=albums.getalbum(req.params.id);
  
  var album_deletehash = album_info[0].deletehash;

  //remove the album from albums.json file

  albums.removealbum(req.params.id);

  //Issue a delete request to be removed from the image-hosting-site

  request.delete({
    headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
    url:     `https://api.imgur.com/3/album/${album_deletehash}`
    
  }, function(err, response, body){
    if(err){
        console.log(err);
    }
  
  
});
albumArray = albums.getAll();
  
  res.render('admin',{
    albums : albumArray
});
res.redirect('/admin');

});


//Delete a Picture from its album
app.get('/deletePicture/:picID/:albumID',(req,res)=>{
  
  //To delete a picture from an Album you need Album's deleteHash and Image's ID

  //Get album's delete hash from albums.JSON file

  var album_info=albums.getalbum(req.params.albumID);
  var album_deletehash=album_info[0].deletehash;

  //Issue a delete request

  request.delete({
    headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
    url:     `https://api.imgur.com/3/album/${album_deletehash}/remove_images?ids=${req.params.picID}`,
    // formData:    { ids:req.params.picID},
  }, function(err, response, body){
    if(err){
        console.log(err);
    }
    console.log(JSON.stringify(body,0,2));
  });
    albumArray = albums.getAll();

}); 


//Add a Picture to an Album

app.post('/upload', function(req, res) {

  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }
  
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file

  let sampleFile = req.files.sampleFile;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('E:/Web Dev/mailernode/public/img/imgur-file-upload/'+sampleFile.name, function(err) {
    if (err)
      return res.status(500).send(err);

    //joining path of directory 
    const directoryPath = path.join(__dirname, '/public/img/imgur-file-upload/');
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
    //listing all files using forEach
    files.forEach(function (file) {

        //For each file upload it to Imgur and get its unique ID (deletehash) back in response 

        //To add an image to an Album you need album's ÍD and image's deletehash

        request.post({
          headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
          url:     'https://api.imgur.com/3/image',
          formData:    { image:  fs.createReadStream(`./public/img/imgur-file-upload/${file}`)},
      }, function(err, response, body){
          if(err){
              console.log(err);
          }
          //Delete the file after uploading to the Image Hosting Site

          fs.unlinkSync(`./public/img/imgur-file-upload/${file}`);

          //Get Images's deletehash from the Post request's response
          
          var image_deletehash= JSON.parse(body).data.deletehash;            

          //Get the Album's ID from a temporary file

          var album_id=fs.readFileSync('./albums_id.txt','utf8');
          
          //Get All the information about the album using the getalbum() function & retrieve album's deletehash (Unique Identifier)

          var album_info=albums.getalbum(album_id)          
          var album_deletehash = album_info[0].deletehash;      

          request.post({
            headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
            url:     `https://api.imgur.com/3/album/${album_deletehash}/add`,
            formData: {'deletehashes[]':image_deletehash},
        }, function(err, response, body){
            if(err){
                console.log(err);
            }
            
          });
        }); 
      
    });
});

   albumArray = albums.getAll();

  res.render('admin',{
    albums : albumArray
});
res.redirect('/admin');
  });
});

app.get('/getAlbum/:id', (req, res) => {
  var id = (req.params.id);
  var title = albums.getalbum(id);  
  var array = [];
  request({
    headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
    url:`https://api.imgur.com/3/account/sharanya17410/album/${id}`,
  },(error,response,body)=>{
     if(!error && response.statusCode=== 200){
        
           var images=JSON.parse(body).data.images;
           for(var i =0;i<images.length;i++){
              array.push({ imagelink : images[i].link,imageid : images[i].id});                      
          }
          array.push({title : title[0].albumtitle});
          array.push({description : title[0].description});
          array.push({id : title[0].id});             
          res.send({album:array});
   
        }else{
            console.log('Unable to fetch album info');
        }
    });

    
});

// app.get('/view-albums', (req, res) => {
//   res.render('admin',{
//     albums : albumArray
// });
// res.redirect('/admin');
// });

//Create album with album cover
app.post('/test/upload', (req, res) => {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }
  
  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  console.log(req.files);
  let sampleFile = req.files.myImage;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv('E:/Web Dev/mailernode/public/img/imgur-file-upload/'+sampleFile.name, function(err) {
    if (err)
      return res.status(500).send(err);

    //joining path of directory 
const directoryPath = path.join(__dirname, '/public/img/imgur-file-upload/');
//passsing directoryPath and callback function
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        request.post({
          headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
          url:     'https://api.imgur.com/3/image',
          formData:    { image:  fs.createReadStream(`./public/img/imgur-file-upload/${file}`)},
      }, function(err, response, body){
          if(err){
              console.log(err);
          }
          var imageLink=JSON.parse(body).data.link;
          var image_deletehash= JSON.parse(body).data.deletehash;
          var image_id= JSON.parse(body).data.id;
  
        request.post({
              headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
              url:     'https://api.imgur.com/3/album',
              form:    { title: req.body.name, description:req.body.desc,cover:image_id},
            }, function(err, response, body){
              if(err){
                  console.log(err);
              }

             var responses=JSON.parse(body);

              albums.addalbum(responses.data.id,responses.data.deletehash,req.body.name,req.body.desc,imageLink);
          
          });
          
        }); 
   
    });
});    
     albumArray = albums.getAll();

          res.render('admin', {
            albums : albumArray
          });
          res.redirect('/admin');
  });
  });  

app.post('/send',(req,res)=>{
    console.log(req.body);
    const output = `
    <p> You have a new contact request</p>
    <h3>Contact Details</h3>
    <ul>
        <li>First Name : ${req.body.name}</li>
        <li>Last name : ${req.body.surname}</li>
        <li>Email : ${req.body.email}</li>
        <li>Phone Number: ${req.body.phone}</li>
        <li>Event Date: ${req.body.date}</li> 
        <li>Address Line 1:${req.body.addrline1}</li>
        <li>Address Line 2:${req.body.addrline2}</li>
        <li>City : ${req.body.city}</li>
        <li>State : ${req.body.state}</li>
        <li>Zip Code: ${req.body.zip}</li>
        <li>Country: ${req.body.country}</li>
    </ul>
    <h3>Message</h3>
    <p> ${req.body.message}</p>
    `;
    console.log("Creating Transport")
var transporter = nodemailer.createTransport( {
    service: "hotmail",
    //host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    auth: {
        user: "sharanya.siddharth@outlook.com",
        pass: "Tout536.."
    },
    tls: {
        ciphers:'SSLv3'
    },
    tls: { rejectUnauthorized: false }
});
var mailOptions = {
    from:'Node mailer Contact <sharanya.siddharth@outlook.com>',
    to: 'sharanya.siddharth@gmail.com',
    subject: 'Node contact request',
    text:'TgK',
    html : output

}
console.log("Sending mail")
transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
        //res.render('/',{msg:'Email has been sent'});
        res.render('home',{
          albums : albumArray,
          msg:'Email has been sent'
      });
      res.redirect('/');
    }
});

});



app.post('/create',(req,res)=>{    
    request.post({
      headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
      url:     'https://api.imgur.com/3/album',
      form:    { title: req.body.name, description:req.body.desc},
    }, function(err, response, body){
      if(err){
          console.log(err);
      }
    
    });
   res.send(file)
    request.post({
        headers: { 'Authorization': 'Client-ID ' + 'c2049e40de14fa8'},
        url:     'https://api.imgur.com/3/image',
        form:    { image: UPLOADDIR+file},
      }, function(err, response, body){
        if(err){
            console.log(err);
        }      
        var album=albums.addalbum(response.data.id,response.data.deletehash,req.body.name,req.body.desc);
        
     });
    });
    
    


app.listen(3000,()=>{
    console.log('Server is up and running on port 3000');
});

