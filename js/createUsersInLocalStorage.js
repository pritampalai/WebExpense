/* 
 * Creates default users in the browser's localStorage so the demo doesn't look like shit
*/

var defaultUsers = {
    "App.User":{
        "records":{
            "1":{
                "id":1,
                "name":"Pritam Palai",
                "dname":"Raven aka JoY",
                "desc":"Cap S.E",                
                "creationDate":"Sat, 21 June 2014 20:23:43 GMT"
            },
            "2":{
                "id":2,
                "name":"Punam Punyatoya",
                "dname":"Toyi aka Baya",
                "desc":"Ibexi A.C",                
                "creationDate":"Mon, 11 Jan 2014 20:23:43 GMT"
            }
        }
    }
};

if (localStorage) {
    if ( !localStorage.getItem('DS.LSAdapter') )
        localStorage.setItem( 'DS.LSAdapter', JSON.stringify(defaultUsers) );
} else {
    throw new Error("Your browser doesn't seem to support localStorage, which is annoying for the purpose of this demo :P");
}
