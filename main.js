const https = require("https");
const fs = require("fs");
require("dotenv").config();

let request_async = function(obj,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        const request = https.request(obj, response => {
            resolve(response);
        });
        request.on("error",err=>{
            reject(err);
        });
        cb(request);
        request.end();
    });
};

let get_async = async function(host,path){
    let response = await request_async({
        hostname:host,
        port:443,
        path:path,
        method:"GET"
    });
    return await new Promise((resolve,reject)=>{
        let result = "";
        response.on("data",(d)=>{
            result += d;
        });
        response.on("end",()=>{
            resolve(result);
        });
        response.on("error",()=>{
            reject(new Error("response error"));
        });
    });
};

class Client{
    async login(){
        let response;
        response = await request_async({
            hostname:"www.hover.com",
            port:443,
            path:"/signin",
            method:"GET"
        });
        if(response.statusCode !== 200){
            throw new FatalError(`Session status code ${response.statusCode} at signin, the API probably changed.`);
        }
        let sessionCookie = response.headers?.["set-cookie"]?.[0];
        if(sessionCookie === undefined || sessionCookie === "")throw new FatalError("Unable to get session cookie, the API must have changed");
        sessionCookie = sessionCookie.split("; ")[0];
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
        if(response.statusCode !== 200){
            throw new FatalError(`Wrong username or password. Session status code ${response.statusCode}`);
        }
        
        let authCookie = response.headers?.["set-cookie"]?.[0];
        if(authCookie === undefined || authCookie === "")throw new FatalError("Unable to get auth cookie, the API must have changed");
        authCookie = authCookie.split("; ")[0];
        this.cookie = sessionCookie + "; " + authCookie;
    }
    api_request(method,url,data){
        let headers = {
            "Cookie": this.cookie
        };
        if(method !== "GET")headers["Content-Type"] = "application/json";
        return new Promise(async (resolve,reject)=>{
            let response = await request_async({
                hostname:"www.hover.com",
                port:443,
                path:`/api${url}`,
                method:method,
                headers
            },method==="GET"?()=>{}:(request)=>{
                //POST or PUT
                request.write(data);
            });
            let result = "";
            response.on("data",(d)=>{
                result += d;
            });
            response.on("end",()=>{
                resolve(result);
            });
            response.on("error",()=>{
                reject(new Error("response error"));
            });
        });
    }
    
    async getRecords(domain){
        console.log(await this.api_request("GET",`/domains/${domain}/dns`));
    }
};

class FatalError extends Error{};

let client;
let update = async function(ip){
    client = new Client();
    await client.login();
    let currentDomains = {};
    {
        let domainData = JSON.parse(await client.api_request("GET",`/dns`));
        if(!domainData.succeeded)throw new FatalError("/dns fetch data unsuccessful, the Hover API must have changed.");
        domainData.domains.map(domainData=>{
            let data = {};
            let dn = domainData.domain_name;
            let id = domainData.id;
            currentDomains[dn] = data;
            data.domainName = dn;
            data.id = id;
            
            let records = {};
            data.records = records;
            domainData.entries.map(entry=>{
                records[`${entry.type},${entry.name}`] = entry;
            });
        });
    }
    //get the json
    let domains = JSON.parse(fs.readFileSync("./ddns.json"));
    for(let domain in domains){
        let records = domains[domain];
        if(!(domain in currentDomains))throw new FatalError(`domain not found: ${domain}`);
        let domainMetadata = currentDomains[domain];
        for(let i = 0; i < records.length; i++){
            let [type,host] = records[i];
            if(!(`${type},${host}` in domainMetadata.records))
                throw new FatalError(`record not found under domain ${domain}: ${type}, ${host}`);
            let recordMetadata = domainMetadata.records[`${type},${host}`];
            let result = JSON.parse(await client.api_request("PUT",`/control_panel/dns`,JSON.stringify({
                "domain":{
                    "id":`domain-${domain}`,
                    "dns_records":[
                        {"id":recordMetadata.id}
                    ]
                },
                "fields":{"content":ip}
            })));
            if(result.succeeded !== true){
                throw new FatalError(`update unsuccessful, the Hover API must have changed.`);
            }
            console.log(`updated record under domain ${domain}: ${type}, ${host}, ${recordMetadata.id}`);
            console.log(`from ${recordMetadata.content} to ${ip}`);
        }
    }
    //await client.getRecords("martian17.com");
};

let isIP = function(str){
    let arr = str.split(".").map(n=>parseInt(n));
    if(arr.length !== 4){
        return false;
    }else if(arr.join(".") !== str){
        return false;
    }
    return true;
};



let main = async function(){
    if(!fs.existsSync("./current_ip")){
        //create current ip file
        fs.writeFileSync("./current_ip","0.0.0.0");
    }
    let stats = fs.lstatSync("current_ip");
    if(!stats.isFile()){
        throw new FatallError("current_ip not a regular text file. remove it and try again.");
    }
    let ip = fs.readFileSync("./current_ip")+"";
    if(!isIP(ip)){
        fs.writeFileSync("./current_ip","0.0.0.0");
        ip = "0.0.0.0";
    }
    
    let checkInterval = process.env.checkInterval*1000;
    let firstLoop = true;
    while(true){
        let ip1;
        try{
            do{
                ip1 = await get_async("ifconfig.me","");
                if(!isIP(ip1))throw new Error("ifconfig.me not returning an ip, likely a network issue");
                if(ip === ip1){
                    break;
                }
                console.log(`ip changed from ${ip} to ${ip1}`);
                ip = ip1;
                
                while(true){
                    try{
                        await update(ip);
                        break;
                    }catch(err){
                        if(err instanceof FatalError){
                            throw err;
                        }else{
                            console.log("probably a network error",err);
                            await new Promise((res,rej)=>setTimeout(res,checkInterval)); 
                        }
                    }
                }
            }while(false);
        }catch(err){
            if(err instanceof FatalError){
                throw err;
            }else{
                console.log("probably a network error",err);
            }
        }
        fs.writeFileSync("./current_ip",ip);
        if(firstLoop){
            firstLoop = false;
            console.log("successfully launched and finished the first loop, ip: "+ip);
        }
        await new Promise((res,rej)=>setTimeout(res,checkInterval));
    }
};

main();