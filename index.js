import * as fs from "fs";
import {ArgumentParser} from "argparse";
import {} from 'dotenv/config';
import {HoverClient,FatalError} from "./hover-core.js";

const parser = new ArgumentParser();

parser.add_argument("--verbose",{action:"store_true", help:"Print out responses and internal variables"});
parser.add_argument("--dry-run",{action:"store_true", help:"Don't commit changes to the hover server"});
parser.add_argument("--once",{action:"store_true", help:"Run once and exit"});
parser.add_argument("--renew",{action:"store_true", help:"Always renew even if IP is the same"});

const options = parser.parse_args();


const vlog = function(...args){
    if(!options.verbose)return;
    console.log(...args);
};




let client;
let update = async function(ip){
    client = new HoverClient();
    await client.login();
    let currentDomains = {};
    {
        let domainData = await client.api_request("GET",`/dns`);
        if(!domainData.succeeded)throw new FatalError("/dns fetch data unsuccessful, the Hover API must have changed.");
        vlog("fetched domain data:",domainData);
        domainData.domains.map(domainData=>{
            vlog(`Entries for ${domainData.domain_name}:`,domainData.entries);
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
            if(!(`${type},${host}` in domainMetadata.records)){
                console.log(`Record ${type} ${host} does not exist, creating.`);
                if(options.dry_run)continue;
                vlog("Not a dry run");
                const res = await client.api_request("POST","/control_panel/dns",{
                    dns_record: {
                        name: host,
                        type: type,
                        content: ip,
                        ttl: '900'
                    },
                    id: `domain-${domain}`
                });
                //might handle success in the future
                //but for now it's not a big problem as it can keep trying
                vlog(res);
                continue;
            }
            let recordMetadata = domainMetadata.records[`${type},${host}`];
            console.log(`Updating record under domain ${domain}: ${type}, ${host}, ${recordMetadata.id}`);
            console.log(`from ${recordMetadata.content} to ${ip}`);
            if(options.dry_run)continue;
            vlog("Not a dry run");
            let result = await client.api_request("PUT",`/control_panel/dns`,JSON.stringify({
                "domain":{
                    "id":`domain-${domain}`,
                    "dns_records":[
                        {"id":recordMetadata.id}
                    ]
                },
                "fields":{"content":ip}
            }));
            if(result.succeeded !== true){
                throw new FatalError(`update unsuccessful, the Hover API must have changed.`);
            }
        }
    }
    //await client.getRecords("martian17.com");
};

let isIP = function(str){
    if(typeof str !== "string")return false;
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
                ip1 = (await fetch("https://ifconfig.me/all.json").then(res=>res.json()))?.ip_addr;
                console.log("ip1",ip1);
                if(!isIP(ip1))throw new Error("ifconfig.me not returning an ip, likely a network issue");
                if(ip === ip1 && !options.renew){
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
        if(options.once)return;
        await new Promise((res,rej)=>setTimeout(res,checkInterval));
    }
};

main();
