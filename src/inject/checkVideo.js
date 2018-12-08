let channelId;
setTimeout(function() {
       let pageUrl =  window.location.href;
       if(pageUrl.includes("/user/")||pageUrl.includes("/channel/"))
       {
           // channelId =window.ytInitialData.header.c4TabbedHeaderRenderer.channelId;

       }
       else if(pageUrl.includes("/watch?v="))
       {

            channelId = window.ytInitialData.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.owner.videoOwnerRenderer.navigationEndpoint.browseEndpoint.browseId;

       }

        if(typeof channelId!=="undefined")
        {
            /* Example: Send data from the page to your Chrome extension */
            document.dispatchEvent(new CustomEvent('libratumFocusMessage', {
                detail:channelId  }));
        }

}, 0);






