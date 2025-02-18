import net from "net";

const host = "10.10.111.87"; // IP сервера
const port = 5400; // Порт TCP-соединения

const soapRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cus="http://nomad.org/CustomUI">
   <soapenv:Header/>
   <soapenv:Body>
      <cus:NomadTerminalBranchList_Input>
         <cus:BranchList>?</cus:BranchList>
      </cus:NomadTerminalBranchList_Input>
   </soapenv:Body>
</soapenv:Envelope>`;

// Создаём TCP-сокет
const client = new net.Socket();

client.connect(port, host, () => {
    console.log(`🔗 Подключено к серверу ${host}:${port}`);
    
    // Отправка SOAP-запроса
    console.log("📨 Отправка SOAP-запроса...");
    client.write(soapRequest + "\n");
});

client.on("data", (data) => {
    console.log("📩 Получен сырой ответ от сервера:", data);
    console.log("📩 Ответ в hex:", data.toString("hex")); // Выведем в hex-формате
    console.log("📩 Ответ в base64:", data.toString("base64")); // Выведем в base64
    client.destroy();
});


client.on("error", (err) => {
    console.error("❌ Ошибка TCP-соединения:", err);
});

client.on("close", () => {
    console.log("🔌 Соединение закрыто.");
});
