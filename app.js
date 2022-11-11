const http = require("http");
const fs = require("fs");
const axios = require("axios");
const nodemailer = require('nodemailer');
const dotenv = require("dotenv").config();
const port = process.env.PORT || "5050";
let token = process.env.Enavto_Token;
let username = process.env.Envato_Username;
let smtp_host = process.env.SMTP_Host;
let smtp_port = process.env.SMTP_Port;
let smtp_user = process.env.SMTP_Username;
let smtp_pass = process.env.SMTP_Password;
let ct = new Date().toLocaleTimeString('en-US', { timeZone: "Asia/Dhaka" });
let status = "";

function sendMail(increasedSale, currentSale, previousSale) {
    var transporter = nodemailer.createTransport({
        host: smtp_host,
        port: smtp_port,
        secure: false,
        auth: {
            user: smtp_user,
            pass: smtp_pass
        }
    });

    var mailOptions = {
        from: 'Themeforest sales-tracker@muhammadsumon.me',
        to: 'muhammadsumon.me@gmail.com',
        subject: 'You got a new sale',
        text: ` Increased - ${increasedSale} | Congratulations! You will be a great author soon.`,
        html: `
        <div>
        <div>
          <p style="font-family: 'roboto';font-size: 22px;text-align: center;text-transform: capitalize;border-bottom: 1px solid #d5d5d5;padding-bottom: 15px;">Someone Purchased your item</p>
        </div>
        <div style="">
          <p style="font-family: 'roboto';margin: auto;font-size: 16px;text-align: center;text-transform: capitalize;outline: 1px solid #d5d5d5;padding: 15px;width: fit-content;">Sales Increased</p>
          <p style="font-family: 'roboto';font-size: 16px;margin:20px auto;text-align: center;text-transform: capitalize;outline: 1px solid #d5d5d5;padding: 15px;width: fit-content;">${increasedSale}</p>
        </div>
        <div style="">
          <p style="font-family: 'roboto';margin: auto;font-size: 16px;text-align: center;text-transform: capitalize;outline: 1px solid #d5d5d5;padding: 15px;width: fit-content;">Current Sale</p>
          <p style="font-family: 'roboto';font-size: 16px;margin:20px auto;text-align: center;text-transform: capitalize;outline: 1px solid #d5d5d5;padding: 15px;width: fit-content;">${currentSale}</p>
        </div>
         <div style="">
          <p style="font-family: 'roboto';margin: auto;font-size: 16px;text-align: center;text-transform: capitalize;outline: 1px solid #d5d5d5;padding: 15px;width: fit-content;">Previous Sale</p>
          <p style="font-family: 'roboto';font-size: 16px;margin:20px auto;text-align: center;text-transform: capitalize;outline: 1px solid #d5d5d5;padding: 15px;width: fit-content;">${previousSale}</p>
        </div>
      </div>
        `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            status = `${error}`;
            updateLog(status);
        } else {
            status = 'Email sent: ' + info.response;
            updateLog(status);
        }
    });
}

function getTotalSale() {
    axios.get(`https://api.envato.com/v1/market/user:${username}.json`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then((res) => {
        if (typeof Number(res.data?.user.sales) === "number") {
            let previousSale = Number(fs.readFileSync("./previousSale.txt").toString());

            let currentSale = Number(res.data.user.sales);
            let saleIncreased = currentSale - previousSale;
            let isSaleIncreased = saleIncreased <= 0 ? false : true;

            if (isSaleIncreased) {
                sendMail(saleIncreased, currentSale, previousSale);
                updateLog("increased");
                fs.writeFile("./previousSale.txt", `${currentSale}`, (errors, data) => {
                    errors ? status = "failed to write data" : null;
                });
            } else {
                status = `No Sale Increased`;
                updateLog(status);
            }
        } else {
            status = `${res.data}`;
            updateLog(status);
        }
    }).catch(err => {
        if (err) {
            fs.appendFile("./log.txt", `Error - ${err}`, (errors, data) => {
                errors ? status = "failed to write data" : null;
            });
        }
    });
}

function updateLog(status) {
    let currentDate = new Date().toLocaleString('en-US', { timeZone: "Asia/Dhaka", month: "long", day: "2-digit", year: "numeric" });

    fs.appendFile("./log.txt", `\n ${currentDate} - ${status}`, (errors, data) => {
        errors ? status = "failed to write data" : null;
    });
}
setInterval(() => {
    let currentTime = new Date().toLocaleTimeString('en-US', { timeZone: "Asia/Dhaka" });
    let NightTime = "12:00:00 AM";
    let DayTime = "12:00:00 PM";
    ct = currentTime;

    if (ct === NightTime) {
        getTotalSale();
        status = "Fired Night Time";
        updateLog(status);
    } else if (ct === DayTime) {
        getTotalSale();
        status = "Fired Day Time";
        updateLog(status);
    }

    fs.writeFile("./status.txt", `\n ${ct} - ${"Last Run"}`, (errors, data) => {
        errors ? status = "failed to write data" : null;
    });
}, 1000);

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(ct);
    res.end();
}).listen(port, () => {
    console.log("server started successfully");
});