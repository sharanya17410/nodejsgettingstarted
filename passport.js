const LocalStrategy=require('passport-local').Strategy;
const bcrypt=require('bcryptjs');
const fs=require('fs');
var credentials=JSON.parse(fs.readFileSync('credentials.json','utf8'));
module.exports=function(passport){
    passport.use(
        new LocalStrategy({usernameField:'name'},(name,password,done)=>{
        
       
//console.log(JSON.parse(albumsString));
        console.log(`The user ID is ${credentials[0].user_id}`);
        if(name!==credentials[0].user_id){
            console.log('Username mismatch!!');
            return done(null,false,{message:'That Username is not Authorized to Login'});
        }

        if(name===credentials[0].user_id){
            bcrypt.compare(password,credentials[0].password,(err,isMatch)=>{
                    if(err) throw err;
                    if(isMatch){
                        return done(null,credentials);                    
                    }
                    else{
                        return done(null,false,{message:'Incorrect Password'});        
                    }
            });
        }
    })
    );
    passport.serializeUser(function(credentials, done) {
        done(null, credentials[0].user_id);
      });
      
      passport.deserializeUser(function(name, done) {
        //User.findById(id, function(err, user) {
            if(name===credentials[0].user_id){  
          done(null, credentials);}
        
      });
}