const soapMethods = {
    NomadOperatorQueueList: {
        name: 'NomadOperatorQueueList',
        args: {
            "cus:NomadOperatorQueueList_Input": {
                "cus:SessionIdQueueList": "?" // Укажи нужный SessionId
            }
        },
        options: {
            overrideRootElement: {
                namespace: "cus",
                xmlnsAttributes: [{ name: "xmlns:cus", value: "http://nomad.org/CustomUI" }]
            }
        }
    }
};

export default soapMethods;
