import soap from 'soap';

export const getSoapClient = (url) => {
    console.log(`[${new Date().toISOString()}] Создаем новый SOAP клиент с URL: ${url}`);

    return new Promise((resolve, reject) => {
        soap.createClient(url, (err, client) => {
            if (err) {
                console.error(`[${new Date().toISOString()}] Ошибка при создании SOAP клиента:`, err);
                return reject(new Error('SOAP client creation failed: ' + err.toString()));
            } // Сохраняем клиента для повторного использования.
            console.log(`[${new Date().toISOString()}] SOAP клиент успешно создан!`);
            resolve(client);
        });
    });
};
