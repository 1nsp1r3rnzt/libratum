let token;
allSettings = {};
allSettings.debugStatus =1;
let channelList =channelList||{};
let redditSavedData = redditSavedData|| [];

function requestForAuthentication(){
    let auth_url = 'https://accounts.google.com/o/oauth2/auth';
    let client_id = '451028549480-q0f6579rekq0p6k1litea2rttgldfh0k.apps.googleusercontent.com';
    let redirect_url = chrome.identity.getRedirectURL("oauth2");
    let auth_params = {
        client_id: client_id,
        redirect_uri: redirect_url,
        response_type: 'token',
        scope: 'profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email'
    };



     let encoded_auth_url = auth_url+'?'+Object.keys(auth_params).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(auth_params[k])).join('&');

    chrome.identity.launchWebAuthFlow({url: encoded_auth_url, interactive: true}, function(responseUrl) {

        //    extract the token
        let matches = [];
        if(typeof responseUrl==="undefined")
        {
            return false;
        }
        if(!responseUrl.includes("error=access_denied"))
        {
            responseUrl.replace(/access_token=(.*?)&token_type=Bearer/gi, function(m, p1){ matches.push(p1); } );
            if(isValidValue(matches[0])) {
                let token = matches[0];
                let init = {
                    method: 'GET',
                    async: true,
                    headers: {
                        Authorization: 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    'contentType': 'json'
                };


                fetch(
                    'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&&access_token=Y' + token,
                    init)
                    .then((response) => response.json())

                    .then(function (data) {

                        let channelId =data.items[0].id;

                        let results= [];
                        async function getDataFromPages(pageToken) {
                            try {

                                if(pageToken)
                                {
                                    pageTokenId = '&pageToken='+pageToken;
                                }
                                else
                                {
                                    pageTokenId='';
                                }

                                let response = await fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&maxResults=50&channelId='+channelId+pageTokenId,
                                    init);
                                let responseData = await response.json();
                                debugLog(responseData);
                                let messages = responseData.items;
                                if (!responseData.nextPageToken) {
                                    results.push.apply(results, messages);
                                    debugLog('Pagination results successfull,  items in the array!', results);
                                    return results;
                                } else {
                                    results.push.apply(results, messages);
                                    await getDataFromPages(responseData.nextPageToken);
                                }
                                return results;
                            } catch (error) {
                                debugLog('Error fetching and parsing data', error);
                            }
                        }

                        async function executeAndParse() {
                            let itemsRetrieved = await getDataFromPages('');
                            channelList ={};
                            //can add to additional
                            for(let i=0;i<itemsRetrieved.length;i++)
                            {

                                let channelId = itemsRetrieved[i].snippet.resourceId.channelId;
                                let thumbnailUrl = itemsRetrieved[i].snippet.thumbnails.default.url;
                                let title = itemsRetrieved[i].snippet.title;
                                let infoObj = {
                                    "channelId":channelId,
                                    "title":title,
                                    "thumbnail":thumbnailUrl

                                };
                                    channelList[channelId] = infoObj;

                                if(i==itemsRetrieved.length-1)
                                {
                                    getImages();
                                    channelList.allItems = i+1;
                                    saveChanges("channelList",channelList);

                                }

                            }
                            return itemsRetrieved;
                        }
                        executeAndParse().then(debugLog('done'));

                    });
            }


        }
        else
        {
            alert("error");
        }



    });
}





chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    debugLog(message);

     if (message.action==="loadedContentScript")
    {

        data = {
            "channelList":channelList,
            "redditSavedData":redditSavedData
        };
        sendResponse(data);
    }
});

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        isInstalledNow();
    } else if (details.reason === "update") {

        isUpdatedNow(0);
    }
});


function getImages()
{
    if(!isValidValue(redditSavedData)||redditSavedData.length<2)
    {
        var request = new XMLHttpRequest();
        request.open('GET', 'https://www.reddit.com/r/MotivationalPics/.json?limit=100&after=t3_10omtd/', true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {

                let redditData = JSON.parse(request.responseText);
                if(redditData.data.children.length>0)
                {

                                for(let i=0;i<redditData.data.children.length;i++)
                                {

                                    let imageUrl = redditData.data.children[i].data.url;
                                    if(imageUrl.includes(".gif")||imageUrl.includes(".png")||imageUrl.includes(".jpg")||imageUrl.includes(".gif"))
                                    {


                                        let imgObj = {
                                            "imageUrl":imageUrl
                                        };

                                        redditSavedData.push(imgObj);
                                    }

                                    if(i==redditData.data.children.length-1){
                                        debugLog(redditData);
                                        saveChanges("redditSavedData",redditSavedData,"local");

                                    }
                                }

                }

            }
        };

        request.onerror = function() {
            // connection error
            debugLog("connection error");
        };

        request.send();

    }



}

function notifyUser(notifyContent, notificationType) {
    var notifyString = JSON.stringify(notifyContent);

    if (notificationType === "notifyalert" || notificationType === "notifyAlert") {


        try {
            createNotification(notifyString);

        } catch (err) {
            alert(notifyString);

        }

    } else if (notificationType === "alert") {
        alert(notifyString);
    } else if (notificationType === "notify") {

        createNotification(notifyString);


    } else {
        return;
    }

}

function createNotification(notificationTitle) {
    var manifestName;

    var manifestVersion;

    if (!isValidValue(manifestName)) {
        manifestName = "Anki Quick Adder";

    } else {
        manifestName = manifest.name;


    }
    if (!isValidValue(manifestVersion)) {
        manifestVersion = manifest.version;
    } else {
        manifestVersion = "1.00";

    }
    chrome.notifications.create(
        'FeedTheFocus', {
            type: 'basic',
            iconUrl: 'icon-64.png',
            title: manifestName + ' ' + manifestVersion,
            message: notificationTitle
        },
        function() {

        }

    );

}

function findRegex(findWhat, errorz) {

    let attributes = "gi";
    var txtToFind = new RegExp(findWhat, attributes);

    if (!findWhat) {
        return false;
    } else if (typeof errorz === "undefined" || errorz === null) {
        return false;

    } else {


        if (errorz.match) {

            if (errorz.match(txtToFind)) {
                return true;

            }
        } else {
            return false;
        }
    }


}


document.addEventListener('DOMContentLoaded', restore_options);

//updated
function isUpdatedNow(openUrl=0) {

    // if(openUrl===1)
    // {
    //     chrome.tabs.create({
    //         url: "https://codehealthy.com/feed-the-focus/#latest-update"
    //     }, function(tab) {
    //         debugLog("update tab launched");
    //     });
    // }

}
//installed defaults
function isInstalledNow() {

    //
    //
    // chrome.tabs.create({
    //     url: "https://codehealthy.com/feed-the-focus/#getting-started"
    // }, function(tab) {
    //     debugLog("install tab launched");
    // });
}



function restore_options() {
getChanges("channelList");
    getChanges("redditSavedData","local");


}



function isValidValue(value)
{
    if(value===null||typeof value ==="undefined")
    {
        return false;

    }
    else
    {
        return true;

    }

}



// chrome.storage.onChanged.addListener(function(changes, namespace) {
//
//     for (var key in changes) {
//
//     }
//
// });


function saveChanges(key, value, type = "sync") {
    // Check that there's some code there.
    if (!value) {

        debugLog('Error: No value specified for' + key);
        return;
    }
    if(typeof key!=="string")
    {
        debugLog("you forget to put setting name in quotes");
        return false;
    }

    if (type === "sync") {

        // Save it using the Chrome extension storage API.
        chrome.storage.sync.set({
            [key]: value
        }, function() {

            var error = chrome.runtime.lastError;
            if (error) {
                if (allSettings.debugStatus === 1) {
                    notifyUser("Can't save" + key + JSON.stringify(error), "notifyAlert");

                }
            }
            //TODO: show to use for saved settings..
            debugLog('Settings saved for' + key + " and val below");
            debugLog(value);
        });
    } else if (type === "local") {

        // Save it using the Chrome extension storage API.
        chrome.storage.local.set({
            [key]: value
        }, function() {

            var error = chrome.runtime.lastError;
            if (error) {
                if (allSettings.debugStatus === 1) {
                    notifyUser("Can't save" + key + JSON.stringify(error), "notifyAlert");

                }
            }
            //TODO: show to use for saved settings..
            debugLog('Settings saved for' + key + " and val below");
            debugLog(value);
        });
    }
}

function getChanges(key, type = "sync") {
    if(typeof key !=="string")
    {
        debugLog('you forget to define key');
        return false;
    }

    var valueReturn;

    if (type == "sync") {
        chrome.storage.sync.get([key], function(result) {
            // debugLog('Value currently is ' + result[key]');
            valueReturn = result[key];
            if (typeof valueReturn != "undefined") {
                setValue(key, valueReturn);

            } else {
                debugLog(key + " is undefined or" + valueReturn);
            }

        });
    } else if (type == "local") {
        chrome.storage.local.get([key], function(result) {
            // debugLog('Value currently is ' + result[key]');
            valueReturn = result[key];
            if (typeof valueReturn != "undefined") {
                setValue(key, valueReturn);

            } else {
                debugLog(key + " is undefined or" + valueReturn);
            }

        });
    }
    // chrome.storage.sync.get(null, function (data) { console.info(data) });
}

function setValue(key, valueReturn) {
    //cases for old settings
    if (valueReturn === "true") window[key] = true;

    else if (valueReturn === "false") window[key] = false;

    else if (valueReturn === "0") window[key] = 0;

    else if (valueReturn === "1") window[key] = 1;
    else window[key] = valueReturn;


    debugLog(key + " and value below");
    debugLog(valueReturn);
    debugLog("----------");

}

var debugLog = (function(undefined) {
    var debugLog = Error; // does this do anything?  proper inheritance...?
    debugLog.prototype.write = function(args) {

        /// * https://stackoverflow.com/a/3806596/1037948

        var suffix = {
            "@": (this.lineNumber ?
                    this.fileName + ':' + this.lineNumber + ":1" // add arbitrary column value for chrome linking
                    :
                    extractLineNumberFromStack(this.stack)
            )
        };

        args = args.concat([suffix]);
        // via @paulirish console wrapper
        if (console && console.log) {
            if (console.log.apply) {
                console.log.apply(console, args);
            } else {
                console.log(args);
            } // nicer display in some browsers
        }
    };
    var extractLineNumberFromStack = function(stack) {


        if (!stack) return '?'; // fix undefined issue reported by @sigod

        // correct line number according to how Log().write implemented
        var line = stack.split('\n')[2];
        // fix for various display text
        line = (line.indexOf(' (') >= 0 ?
                line.split(' (')[1].substring(0, line.length - 1) :
                line.split('at ')[1]
        );
        return line;
    };

    return function(params) {
        // only if explicitly true somewhere
        if (typeof allSettings.debugStatus === typeof undefined || allSettings.debugStatus === 0) return;

        // call handler extension which provides stack trace
        debugLog().write(Array.prototype.slice.call(arguments, 0)); // turn into proper array
    }; //--  fn  returned

})(); //--- _debugLog