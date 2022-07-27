const https = require("https");
const fs = require("fs");
require("dotenv").config();

let request_async = function(obj,cb=()=>{}){
    return new Promise((resolve,reject)=>{
        const request = https.request(obj, response => {
            //if(response.statusCode !== 200){
            //    reject(new Error(`session status code ${response.statusCode}`));
            //}else{
                resolve(response);
            //}
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


let main = async function(){
    let ip = "0.0.0.0";
    let checkInterval = parseInt(process.env.checkInterval)*1000;
    while(true){
        let ip1;
        try{
            ip1 = await get_async("ifconfig.me","");
        }catch(e){
            await new Promise((res,rej)=>setTimeout(res,checkInterval));
        }
        if(ip === ip1){
            continue;
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
                }
            }
            await new Promise((res,rej)=>setTimeout(res,checkInterval)); 
        }
        await new Promise((res,rej)=>setTimeout(res,checkInterval));
    }
    console.log("terminating the program");
};

main();
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

