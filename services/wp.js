const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const ora = require('ora');
const chalk = require('chalk');
const ExcelJs = require('exceljs');
const moment = require('moment');

const SESSION_FILE_PATH = '../session.json'
class Whatsapp {
    constructor(){
        this.client = null;
         this.sessionData = null;
    }

     withOutSession  ()  {
         this.client = new Client();
        this.client.on('qr', (qr) => {
            // Generate and scan this code with your phone
            console.log('QR RECEIVED', qr);
            qrcode.generate(qr, {small: true});
        });
    
        this.client.on('authenticated', (session) => {
           this.sessionData = session;
            fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err)=> { 
                if(err){
                    console.log(err);
                }
            })
        });
       this.client.initialize();
    }

    withSession () {
        console.log("here");
        const spinner = ora(`cargando ${chalk.yellow('validando credenciales')}`);
        this.sessionData = require(SESSION_FILE_PATH);
        spinner.start();
        this.client = new Client({session: this.sessionData})
        this.client.on('ready', () => {
            spinner.stop();
            console.log('Client is ready!');
            this.connectionReady();
        });
        
    
        this.client.on('auth_failure', () => {
            spinner.stop();
            console.log('** Error de autentificacion vuelve a generar el QRCODE (Borrar el archivo session.json) **');
        })
    
    
        this.client.initialize();
    }

     connectionReady  () {
        this.listenMessage();
        // readExcel();
    }
    
    // listen incoming messages
    listenMessage ()  {
        this.client.on('message', async msg => {
            const { from, to, body } = msg;
            console.log(msg.hasMedia);
            if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                console.log("media", media);
            }

            console.log(body);
            switch(body) {
                case 'quiero info':
                    this.sendMessage(from, "hola, i am fullstack developer");
                    break;
                case 'adios': 
                    this.sendMessage(from, 'nos vemos pronto.');
                    break;
                case 'hola':
                    this.sendMessage(from, 'hey, como estas');
                    this.sendMedia(from, 'hola.png');
                    break;
                default: this.sendMessage(from,'no estoy disponible');
                break;
            }
           // this.saveHistorial(from, body);
    
        });
    }
    
    sendMedia (to, file) {
       const mediaFile = MessageMedia.fromFilePath(`../media/${file}`);
       this.client.sendMessage(to, mediaFile)
    }
    
     saveHistorial (from, message)  {
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
           }).catch((e)=> {
               console.log(e);
               console.log("something went wrong");
           })
        }
    }
    
    sendMessage (to, message) {
      this.client.sendMessage(to, message)
    }
}

module.exports = Whatsapp;