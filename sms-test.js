// sms-test.js
import { request } from 'http';
import { stringify } from 'querystring';
import dotenv from 'dotenv';

dotenv.config();

export default function sendSms({ user, pass, from, text, to }) {
  return new Promise((resolve, reject) => {
    const params = { user, pass, from, text, to };
    const query = stringify(params);

    // const options = {
    //   hostname: process.env.SMS_IP,
    //   port: process.env.SMS_PORT,
    //   path: `${process.env.SMS_PATH}?${query}`,
    //   method: 'GET'
    // };

    const options = {
      hostname: 'httpbin.org',
      port: 80,
      path: `/get?${query}`,
      method: 'GET'
    };

    const req = request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}
