const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk');
const ExcelJs = require('exceljs');
const moment = require('moment');
const express = require('express');
const cors = require('cors');
const SESSION_FILE_PATH = './session.json'
let client;
let sessionData;
const app = express();



app.use(express.json());
app.use(cors());
const sendMessagePost = (req, res) => {
    const { message, number } = req.body;
    const newNumber = `${number}@c.us`
    console.log(message, number);
    sendMessage(newNumber, message);
    res.send({ status: 'Enviado!' })
}
app.post('/send', sendMessagePost);
const withSession = () => {
    console.log("here");
    const spinner = ora(`cargando ${chalk.yellow('validando credenciales')}`);
    sessionData = require(SESSION_FILE_PATH);
    spinner.start();
    client = new Client({session: sessionData})
    client.on('ready', () => {
        spinner.stop();
        console.log('Client is ready!');
        connectionReady();
    });
    

    client.on('auth_failure', () => {
        spinner.stop();
        console.log('** Error de autentificacion vuelve a generar el QRCODE (Borrar el archivo session.json) **');
    })


    client.initialize();
}

const withOutSession = () => {
    const client = new Client();
    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        qrcode.generate(qr, {small: true});
    });

    client.on('authenticated', (session) => {
       sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err)=> { 
            if(err){
                console.log(err);
            }
        })
    });
   client.initialize();
}

const connectionReady = () => {
    listenMessage();
    // readExcel();
}

// listen incoming messages
const listenMessage = () => {
    client.on('message', async msg => {
        const { from, to, body } = msg;
        //34691015468@c.us
        console.log(msg.hasMedia);
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            console.log("media", media);
            // saveMedia(media);
            // do something with the media data here
        }

      //  await greetCustomer(from);

        console.log(body);
        switch(body) {
            case 'quiero info':
                sendMessage(from, "hola, i am fullstack developer");
                break;
            case 'adios': 
                sendMessage(from, 'nos vemos pronto.');
                break;
            case 'hola':
                sendMessage(from, 'hey, como estas');
                sendMedia(from, 'hola.png');
                break;
            // default: sendMessage(from,'no estoy disponible');
            // break;
        }
        saveHistorial(from, body);

      //  await replyAsk(from, body);

        // await readChat(from, body)
        // console.log(`${chalk.red('⚡⚡⚡ Enviando mensajes....')}`);
        // console.log('Guardar este número en tu Base de Datos:', from);

    });
}

const sendMedia = (to, file) => {
   const mediaFile = MessageMedia.fromFilePath(`./media/${file}`);
   client.sendMessage(to, mediaFile)
}

const saveHistorial = (from, message) => {
    const pathChat = `./chats/${from}.xlsx`;
    const workbook = new ExcelJs.Workbook();
    const today = moment().format('DD.MM.YYYY HH:mm');
    if(fs.existsSync(pathChat)){
      workbook.xlsx.readFile(pathChat).then(()=> {
        const worksheet = workbook.getWorksheet(1);
        const lastRow = worksheet.lastRow;
        let getRowInsert = worksheet.getRow(++(lastRow.number));
        getRowInsert.getCell('A').value = today;
        getRowInsert.getCell('B').value = message;
        getRowInsert.commit();
        workbook.xlsx.writeFile(pathChat).then(()=> {
            console.log("se agrego chat");
        }).catch(()=> {console.log("operation failed");})
      })
    }else {
       const worksheet = workbook.addWorksheet('chats');
       worksheet.columns = [
           {header: 'Fecha', key: 'date'}, {header: 'Mensaje', key: 'message'}
       ]
       worksheet.addRow([today, message]);
       workbook.xlsx.writeFile(pathChat).then(()=>{
          console.log("created");
       }).catch(()=> {
           console.log("something went wrong");
       })
    }
}

const sendMessage = (to, message) => {
  client.sendMessage(to, message)
}


(fs.existsSync(SESSION_FILE_PATH))?withSession(): withOutSession()

app.listen(9000, ()=> {
    console.log('Api esta arriba');
})