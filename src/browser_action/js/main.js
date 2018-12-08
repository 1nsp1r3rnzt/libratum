var background;
var channelList;


function restore_options(){
    chrome.runtime.getBackgroundPage(function(backgroundPage){
        window.background = backgroundPage;
});
}

 document.addEventListener('DOMContentLoaded', restore_options);



$(document).ready(function() {

    //create decks and models
    //create tabs
    $("#tabs").tabs();
    initApp();
    loadSavedChannels();

    $(document).on('click', '#authorizeYoutube', function () {

        background.requestForAuthentication();


    });


});


function initApp() {
    if (!background.isValidValue(background.channelList)) {


    }

        else
        {
            channelList = background.channelList;
            if(channelList.allItems>1)
            {
                $("#authorizeYoutube").attr('value', 'Re Authorize Youtube'); //versions older than 1.6

            }

        }

}
function parseAndToObject(arr) {
    console.log(arr);
    var finalObj = {};
    var data = [];
    var tempObject = {};
    let counter =0;
    for( let item in arr) {
        if(background.isValidValue(arr[item].channelId)){

            tempObject.thumbnail = arr[item].thumbnail;
            tempObject.channel = arr[item].channelId;
            tempObject.title = arr[item].title;
            data[counter] = tempObject;
            counter++;
            tempObject = {};
        }
    }

    finalObj.data = data;
    finalObj.itemsCount = [counter];
    console.log(finalObj);
    return finalObj;
}
function loadSavedChannels() {

    var MyCustomDirectLoadStrategy = function (grid) {
        jsGrid.loadStrategies.PageLoadingStrategy.call(this, grid);
    };

    MyCustomDirectLoadStrategy.prototype = new jsGrid.loadStrategies.PageLoadingStrategy();

    MyCustomDirectLoadStrategy.prototype.finishDelete = function (deletedItem, deletedItemIndex) {
        var grid = this._grid;
        grid.option("data").splice(deletedItemIndex, 1);
        grid.refresh();
    };
    MyCustomDirectLoadStrategy.prototype.finishInsert = function () {
        var grid = this._grid;

        grid.render();

        var pageSize = $("#jsGrid").jsGrid("option", "pageSize");
        var lastPage = Math.ceil(channelList.allItems / pageSize);
        $("#jsGrid").jsGrid("openPage", lastPage);


    };

    $("#jsGrid").jsGrid({

        width: "640px",

        filtering: false,
        editing: true,
        sorting: true,
        onItemDeleted: function (args) {
            console.log(args);
                let key = args.item.channel;
                delete channelList[key];
            // background.saveChanges("channelList", channelList);

        },
        noDataContent: "No channels are saved",

        onItemUpdated: function (args) {


        },


        loadStrategy: function () {
            return new MyCustomDirectLoadStrategy(this);
        },

        autoload: true,
        paging: true,
        pageLoading: true,
        pageSize: 10,
        pageIndex: 1,

        rowClick: function (args) {


            currentChannelNumber = args.itemIndex;
            editingCard = true;
            console.log(args);
            showDetailsDialog("Edit", args.item);
        },
        rowClass: function (item, itemIndex) {

            return "saveChannelsTable" + itemIndex;
        },


        deleteConfirm: function (item) {
            return "The channel \"" + item.title + "\" will be removed. Are you sure?";
        },
        controller: {
            loadData: function (filter) {
                var returnedData = parseAndToObject(channelList);
                var startIndex = (filter.pageIndex - 1) * filter.pageSize;
                return {
                    data: returnedData.data.slice(startIndex, startIndex + filter.pageSize),
                    itemsCount: returnedData.itemsCount
                };


            },
            insertItem: function (item) {
            },


        },
        fields: [{
            name: "thumbnail",
            type: "text",
            width: 100,
            itemTemplate: function (value) {
                return "<img src="+value+">";
                },

        },

            {
                name: "title",
                type: "text",
                width: 70,


            },
            {
                name: "channel",
                type: "text",
                width: 70
            },

            {
                type: "control",
                modeSwitchButton: false,
                editButton: false,
                headerTemplate: function () {
                    return $("<button>").attr("type", "button").text("Add")
                        .on("click", function () {
                            showDetailsDialog("Add", {});
                        });
                }
            },
            {
                css:"delete-button",
                headerTemplate: function() {
                    return $("<button>").attr("type", "button").text("Delete")
                        .on("click", function () {
                            deleteSelectedItems();
                        });
                },
                itemTemplate: function(_, item) {
                    return $("<input>").attr("type", "checkbox")
                        .prop("checked", $.inArray(item, selectedItems) > -1)
                        .on("change", function () {
                            $("#detailsDialog").dialog("close");

                            $(this).is(":checked") ? selectItem(item) : unselectItem(item);
                        });
                },
                align: "center",
                width: 50
            }

        ]
    });

    var selectedItems = [];

    var selectItem = function(item) {
        selectedItems.push(item);
    };

    var unselectItem = function(item) {
        selectedItems = $.grep(selectedItems, function(i) {
            return i !== item;
        });
    };


    var deleteSelectedItems = function() {
        if(!selectedItems.length || !confirm("Are you sure?"))
            return;

        deleteClientsFromDb(selectedItems);

        var $grid = $("#jsGrid");
        $grid.jsGrid("option", "pageIndex", 1);
        $grid.jsGrid("loadData");

        selectedItems = [];
    };
    var deleteClientsFromDb = function(deletingClients) {
        db.clients = $.map(db.clients, function(client) {
            return ($.inArray(client, deletingClients) > -1) ? null : client;
        });
    };














$("#detailsDialog").dialog({
    autoOpen: false,
    height: 400,
    width: 350,

});
$('#dialogform1').submit(function(event) {
    event.preventDefault();
    formSubmitHandler();
});
var formSubmitHandler = $.noop;

var showDetailsDialog = function(dialogType, editChannel) {
    currentDialogType = dialogType;

    if (dialogType === "Edit") {



    } else if (dialogType === "Add") {


    }

    formSubmitHandler = function() {

        saveClient(editChannel, dialogType === "Add");
    };

    $("#detailsDialog").dialog("option", "title", dialogType + " Channel")
        .dialog("open");
};

var saveClient = function(editChannel, isNew) {
    //get updated fields and insert in list

    //get keys
    var counter = 0;
    var tempFirstField;
    var newDeckList = $("#dialogDeckList").val();
    var newModeList = $("#dialogModelList").val();




        if (isNew === true) {
            //clear savedDialogFields
            savedDialogFields = [];
            allSavedChannels.push(newChannelValue);
            saveChanges("allSavedChannels", allSavedChannels);
        } else {

            allSavedChannels[currentChannelNumber] = newChannelValue;
            saveChanges("allSavedChannels", allSavedChannels);
        }


    $.extend(editChannel, {

        channel: '111',
        title: '11',
        thumbnail: 'tt',


    });

    $("#jsGrid").jsGrid(isNew ? "insertItem" : "updateItem", editChannel);

    $("#detailsDialog").dialog("close");

};

}





debugLog = (function(undefined) {
    var debugLog = Error; 
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


