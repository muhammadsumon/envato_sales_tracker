const http = require("http");
const fs = require("fs");
const axios = require("axios");
var nodemailer = require('nodemailer');
const dotenv = require("dotenv").config();
let token = process.env.Enavto_Token;
let username = process.env.Envato_Username;
let smtp_host = process.env.SMTP_Host;
let smtp_port = process.env.SMTP_Port;
let smtp_user = process.env.SMTP_Username;
let smtp_pass = process.env.SMTP_Password;
let status = "";

function sendMail(increasedSale, currentSale, previousSale) {
    var transporter = nodemailer.createTransport({
        host: smtp_host,
        port: smtp_port,
        auth: {
            user: smtp_user,
            pass: smtp_pass
        }
    });

    var mailOptions = {
        from: 'Themeforest sales.themeforest@gmail.com',
        to: 'muhammadsumon.me@gmail.com',
        subject: 'You got a new sale',
        text: `Congratulations! You will be a great author soon. Sales Increased - ${increasedSale}`,
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
            status = `\n ${error}`
            updateLog(status);
        } else {
            status = '\n Email sent: ' + info.response;
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

                fs.writeFile("./previousSale.txt", `${currentSale}`, (errors, data) => {
                    errors ? status = "failed to write data" : null;
                });
            } else {
                status = `\n No Sale Increased`;
                updateLog(status);
            }
        } else {
            status = `\n ${res.data}`;
        }
    }).catch(err => {
        if (err) {
            fs.appendFile("./log.txt", `\n Error - ${err}`, (errors, data) => {
                errors ? status = "failed to write data" : null;
            });
        }
    });
}

function updateLog(status) {
    fs.appendFile("./log.txt", status, (errors, data) => {
        errors ? status = "failed to write data" : null;
    });
}

setInterval(() => {
    const currentTime = new Date().toLocaleTimeString();
    const NightTime = "12:00:00 AM";
    const DayTime = "12:00:00 PM";

    if (currentTime === NightTime) {
        getTotalSale();
        status = "\n Fired Night Time";
        updateLog(status);
    } else if (currentTime === DayTime) {
        getTotalSale();
        status = "\n Fired Day Time";
        updateLog(status);
    } else {
        status = "\n Failed to Check";
    }

    console.log(currentTime)
}, 1000);


http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write(status);
    res.end();
}).listen(8080, () => {
    console.log("server started successfully")
});