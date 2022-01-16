const webpush = require("web-push");
const config = require("config");
const storage = require('node-persist');
const {addComma} = require("./number_utils");

let Subscriptions;
let fakeSubs = [];

const PUBLIC_VAPID = config.get("publicVAPID");
const PRIVATE_VAPID = config.get("privateVAPID");
const prod = config.get("prod");

webpush.setVapidDetails(
    "https://www.coronalivedata.com/",
    PUBLIC_VAPID,
    PRIVATE_VAPID
);

function init(sub){
    Subscriptions = sub;
}

function add(subscription) {
    return new Promise((resolve, reject) => {
        let sub = new Subscriptions(subscription);
        sub.save(err => reject(err));
        if(!prod) fakeSubs.push(subscription)
        resolve();
    });
}

function send() {
    let notificationPayload = {
        notification: {
            title: "Corona Tracker App",
            body: "",
            icon: "assets/icons/icon-512x512.png"
        }
    };

    let promises = [];
    Subscriptions.find(async (err, subs) => {
        if (err) return console.log(err);
        for(subscription of subs){
            if(!subscription.object){
                subscription={object:subscription,subjectId:0};
            }
            let id = Number(subscription.subjectId);
            if(id === 0){
                global = await storage.get("global");
                notificationPayload.notification.body =`Number of confirmed global cases: ${addComma(global.today.toll)}`
            }else{
              countries = await storage.get("countries");
              notificationPayload.notification.body = `Number of new cases in ${countries[id].name}: ${addComma(countries[id].today.new)}`
            console.log(notificationPayload.notification.body);
            }
            let sub = subscription.object;
            //console.log(sub)
            promises.push(
                webpush.sendNotification(
                    sub,
                    JSON.stringify(notificationPayload)
                ).catch(err=>console.log(err))
            );
        }
    });
    
    return Promise.all(promises);
}

exports.init = init;
exports.add = add;
exports.send = send;
