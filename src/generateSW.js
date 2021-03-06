const fs = require('fs');

function generateSW(server_url,userid,swid,target_location){
    const sw = `
function isImage(fetchRequest) {
    console.log(fetchRequest);
    return fetchRequest.method === "GET" && fetchRequest.destination === "image";
}

async function supportsWebp() {
    if (!self.createImageBitmap) return 0;
    
    const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
    const blob = await fetch(webpData).then(r => r.blob());
    return createImageBitmap(blob).then(() => 1, () => 0);
}

var webp = 0;
const staticCacheName = 'processedImgCache';

self.addEventListener('fetch', function(event) {
console.log('Fetch event for ', event.request.url);
event.respondWith(
    //check if request is cached
    caches.match(event.request)
    .then(response => {
    if (response) {
        console.log('Found ', event.request.url, ' in cache');
        return response;
    }
    //if it isnt cached fetch it
    return fetch(event.request)
    .then((response) => {
        if(isImage(event.request)){
            console.log(response.url);
            url ='${server_url}/processImg'
            var body = 'userid=${userid}&swid=${swid}&webp='+webp+'&img='+response.url;
            var img = fetch(url, {  
                method: 'post',  
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    },
                body: body ,
                mode: 'cors',
                }).then((fetch_response) => {
                console.log(fetch_response);
                if (fetch_response.status != 200){
                    return response;
                }else{
                    //add the succesfully fetched request to the cache and return it
                    return caches.open(staticCacheName).then(cache => {
                    cache.put(event.request.url, fetch_response.clone());
                    return fetch_response;
                    });
                }
                }).catch((err) => {console.log(err); return response;
            });
            return img;
        }
            return response;
    })
    }).catch(error => {
    console.log(error);
    })
);
});

// Log SW installation
self.addEventListener('install', function(event) {
    console.log('[SW]: installing....');

    event.waitUntil(async function() {
        webp  = await supportsWebp();
    }());
});

// Log SW activation
self.addEventListener('activate', function activator(event) {
    console.log('[SW]: activate!');
});`

    fs.writeFileSync(target_location,sw);
}

module.exports = {generateSW}