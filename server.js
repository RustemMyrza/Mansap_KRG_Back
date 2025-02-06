import express from 'express';
import soap from 'soap';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());

app.get('/get-soap-data', (req, res) => {
    const url = 'http://10.10.111.167:3857?wsdl'; // URL WSDL для SOAP API
    const requestBody = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cus="http://nomad.org/CustomUI">
        <soapenv:Header/>
        <soapenv:Body>
            <cus:NomadTerminalMenuList_Input>
                <cus:ParentQueueIdTerminal>?</cus:ParentQueueIdTerminal>
                <cus:BranchQueueId>3</cus:BranchQueueId>
            </cus:NomadTerminalMenuList_Input>
        </soapenv:Body>
        </soapenv:Envelope>
    `;
  
    soap.createClient(url, (err, client) => {
        if (err) {
            console.error('SOAP client creation failed:', err);
            return res.status(500).send({ error: 'SOAP client creation failed', message: err });
        }
    
        client.NomadTerminalMenuList({ _xml: requestBody }, (err, result) => {
            if (err) {
                console.error('SOAP request failed:', err);
                return res.status(500).send({ error: 'SOAP request failed', message: err });
            }
    
            res.json(result);
        });
    });
    
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});