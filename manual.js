import * as fs from "fs";
import {} from 'dotenv/config';
import {HoverClient,FatalError} from "./hover-core.js";


const client = new HoverClient();
await client.login();
const domainData = await client.api_request("GET",`/dns`);

console.log(domainData);
console.log(domainData.domains[0].entries);

//process.exit();

/*
let result = await client.api_request("POST",`/control_panel/dns`,JSON.stringify({
    dns_record: {
        //name: 'asdf',
        //content: '0.0.0.0',
        //type: 'A',

        // ttl: '900',
        // name: "*",
        // type: "NS",
        // content: "ns1.martian17.com"
        name: "_acme-challenge.martian17.com",
        type: "TXT",
        content: "XmIZnoXebjs_QUqymx63Yv5ky02NpD7xORHRMUWZUhc",
        ttl: '900'
    },
    id: 'domain-martian17.com'
}
//"{\"dns_record\":{\"name\":\"test2\",\"content\":\"0.0.0.0\",\"type\":\"A\",\"ttl\":\"900\"},\"id\":\"domain-martian17.com\"}"
));

console.log(result);
*/
const m17s = domainData.domains.filter(v=>v.domain_name === "martian17.com")[0].entries;
console.log(m17s);
const testid = m17s.filter(v=>v.name === "testasdf")[0].id;
console.log(testid);



let result2 = await client.api_request("DELETE",`/control_panel/dns`,JSON.stringify(
{
    "domains":[
        {
            "id":"domain-martian17.com",
            "name":"martian17.com",
            "dns_records":[testid]
        }
    ]
}
));

console.log(result2);


// const res3 = await fetch("https://www.hover.com/api/control_panel/dns", {
//   "headers": {
//     "content-type": "application/json;charset=UTF-8",
//     "cookie": client.cookie
//   },
//   "body": JSON.stringify(
// {
//     "domains":[
//         {
//             "id":"domain-martian17.com",
//             "name":"martian17.com",
//             "dns_records":[testid]
//         }
//     ]
// }
// ),
//   "method": "DELETE"
// }).then(res=>res.json());
// 
// console.log(res3);

// fetch("https://www.hover.com/api/control_panel/dns", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9,ja;q=0.8,zh-TW;q=0.7,zh;q=0.6",
//     "cache-control": "no-cache",
//     "content-type": "application/json;charset=UTF-8",
//     "pragma": "no-cache",
//     "sec-ch-ua": "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Linux\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "cookie": "hover_session=33c32e592483e8f11e8b27f2b6d27f34; _gid=GA1.2.1734406175.1682096160; _gcl_au=1.1.1869398694.1682096160; _fbp=fb.1.1682096160190.1861236523; __zlcmid=1FUllQKF5Z3AKUm; hoverauth=db09edab1ead9a8d71451e41518ee4a1; ln_or=eyI0MDUzMzAwIjoiZCJ9; _ga_Y6KZCNPWB2=GS1.1.1682228511.3.0.1682228511.0.0.0; _ga=GA1.2.844578397.1682096160; _gat=1; _ga_VBPX9XQMKK=GS1.1.1682233272.6.1.1682234147.0.0.0",
//     "Referer": "https://www.hover.com/control_panel/domain/martian17.com/dns",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "{\"dns_record\":{\"name\":\"test\",\"content\":\"0.0.0.0\",\"type\":\"A\",\"ttl\":\"900\"},\"id\":\"domain-martian17.com\"}",
//   "method": "POST"
// });
// 
// fetch("https://www.hover.com/api/control_panel/dns", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9,ja;q=0.8,zh-TW;q=0.7,zh;q=0.6",
//     "cache-control": "no-cache",
//     "content-type": "application/json;charset=UTF-8",
//     "pragma": "no-cache",
//     "sec-ch-ua": "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Linux\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "cookie": "hover_session=33c32e592483e8f11e8b27f2b6d27f34; _gid=GA1.2.1734406175.1682096160; _gcl_au=1.1.1869398694.1682096160; _fbp=fb.1.1682096160190.1861236523; __zlcmid=1FUllQKF5Z3AKUm; hoverauth=db09edab1ead9a8d71451e41518ee4a1; ln_or=eyI0MDUzMzAwIjoiZCJ9; _ga_Y6KZCNPWB2=GS1.1.1682228511.3.0.1682228511.0.0.0; _ga=GA1.2.844578397.1682096160; _gat=1; _ga_VBPX9XQMKK=GS1.1.1682233272.6.1.1682234147.0.0.0",
//     "Referer": "https://www.hover.com/control_panel/domain/martian17.com/dns",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "{\"dns_record\":{\"name\":\"test\",\"content\":\"0.0.0.0\",\"type\":\"A\",\"ttl\":\"900\"},\"id\":\"domain-martian17.com\"}",
//   "method": "POST"
// }); ;
// fetch("https://www.hover.com/api/control_panel/dns", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9,ja;q=0.8,zh-TW;q=0.7,zh;q=0.6",
//     "cache-control": "no-cache",
//     "content-type": "application/json;charset=UTF-8",
//     "pragma": "no-cache",
//     "sec-ch-ua": "\"Chromium\";v=\"112\", \"Google Chrome\";v=\"112\", \"Not:A-Brand\";v=\"99\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Linux\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "cookie": "hover_session=33c32e592483e8f11e8b27f2b6d27f34; _gid=GA1.2.1734406175.1682096160; _gcl_au=1.1.1869398694.1682096160; _fbp=fb.1.1682096160190.1861236523; __zlcmid=1FUllQKF5Z3AKUm; hoverauth=db09edab1ead9a8d71451e41518ee4a1; ln_or=eyI0MDUzMzAwIjoiZCJ9; _ga_Y6KZCNPWB2=GS1.1.1682228511.3.0.1682228511.0.0.0; _ga=GA1.2.844578397.1682096160; _ga_VBPX9XQMKK=GS1.1.1682233272.6.1.1682234147.0.0.0",
//     "Referer": "https://www.hover.com/control_panel/domain/martian17.com/dns",
//     "Referrer-Policy": "strict-origin-when-cross-origin"
//   },
//   "body": "{\"domain\":{\"id\":\"domain-martian17.com\",\"dns_records\":[{\"id\":\"dns28872691\",\"name\":\"test\",\"type\":\"A\",\"content\":\"0.0.0.0\",\"ttl\":\"900\",\"is_default\":false,\"can_revert\":false}]},\"fields\":{\"content\":\"0.0.0.1\",\"ttl\":\"900\"}}",
//   "method": "PUT"
// });


