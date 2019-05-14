module.exports={
    ensureAuthenticated: function(req,res,next){
        if(req.isAuthenticated()){
            console.log(req.ensureAuthenticated);
            return next();
        }
        req.flash('error_msg','Please Login to access Admin Page');
        res.redirect('/login');
    }
}