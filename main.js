const https = require('https');
require('dotenv').config();

let request_async = function(obj,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        const req = https.request(obj, res => {
            if(response.statusCode !== 200){
                reject(new Error(`session status code ${response.statusCode}`));
            }else{
                resolve(res);
            }
        });
        req.on("error",err=>{
            reject(err);
        });
        cb(req);
        req.end();
    });
};


let main = function(){
    let response;
    response = await request_async({
        hostname:"www.hover.com",
        port:443,
        path:"/signin",
        method:"GET"
    });
    let sessionCookie = response.headers["set-cookie"].split("; ")[0];//.split("=");
    response = await request_async({
        hostname:"www.hover.com",
        port:443,
        path:"/api/login",
        method:"POST",
        headers:{
            "Cookie": sessionCookie,
            "Content-Type": "application/json"
        }
    },(request)=>{
        request.write(JSON.stringify({username:process.env.username,password:process.env.password}));
    });
    
    
    
};


/*
let login = function() {
    let signinURL = "www.hover.com";
    let authURL = "https://www.hover.com/api/login";

    const res = request_async({
        hostname: signinURL,
        port: 443,
        path: '/signin',
        method: 'GET',
    });
};
*/

//login();

