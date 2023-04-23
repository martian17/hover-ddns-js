import https from "https";


export class FatalError extends Error{};

const fetch_json = function(...args){
    return fetch(...args).then(res=>res.json());
};

export class HoverClient{
    async login(){
        let response;
        response = await fetch("https://www.hover.com/signin",{
            method:"GET"
        });
        if(response.status !== 200){
            throw new FatalError(`Session status code ${response.status} at signin, the API probably changed.`);
        }
        let sessionCookie = response.headers.get("set-cookie");
        if(sessionCookie === undefined || sessionCookie === "")throw new FatalError("Unable to get session cookie, the API must have changed");
        sessionCookie = sessionCookie.split("; ")[0];
        response = await fetch("https://www.hover.com/api/login",{
            method:"POST",
            headers:{
                "Cookie": sessionCookie,
                "Content-Type": "application/json"
            },
            body:JSON.stringify({username:process.env.username,password:process.env.password})
        });
        if(response.status !== 200){
            throw new FatalError(`Wrong username or password. Session status code ${response.status}`);
        }
        
        let authCookie = response.headers.get("set-cookie");
        if(authCookie === undefined || authCookie === "")throw new FatalError("Unable to get auth cookie, the API must have changed");
        authCookie = authCookie.split("; ")[0];
        this.cookie = sessionCookie + "; " + authCookie;
    }
    async api_request(method,url,data){
        if(typeof data === "object"){
            data = JSON.stringify(data);
        }
        let headers = {
            "Cookie": this.cookie
        };
        if(method !== "GET")headers["Content-Type"] = "application/json;charset=UTF-8";
        let response = await fetch_json(`https://www.hover.com/api${url}`,{
            method:method,
            headers,
            body:data
        });
        return response;
    }
    
    async getRecords(domain){
        console.log(await this.api_request("GET",`/domains/${domain}/dns`));
    }
};
