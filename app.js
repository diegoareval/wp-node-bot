const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Whatsapp = require('./services/wp');
const SESSION_FILE_PATH = './session.json'
let wp = new Whatsapp();
const app = express();
app.use(express.json());
app.use(cors());
const sendMessagePost = (req, res) => {
    const { message, number } = req.body;
    const newNumber = `${number}@c.us`
    console.log(message, number);
    wp.sendMessage(newNumber, message);
    res.send({ status: 'Enviado!' })
}
app.post('/send', sendMessagePost);



(fs.existsSync(SESSION_FILE_PATH))?wp.withSession(): wp.withOutSession()

app.listen(9000, ()=> {
    console.log('Api esta arriba');
})